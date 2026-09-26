import { NextResponse } from "next/server";
import { z } from "zod";
import { Order, Payment, Prisma } from "@prisma/client";
import Razorpay from "razorpay";
import { prisma } from "@/lib/db";
import { computeTotals, resolveLines, validateCoupon } from "@/lib/pricing";
import { newOrderNumber } from "@/lib/order";
import type { PlaceOrderResponse } from "@/types";
import { auth } from "@/lib/auth";
import { addressInput } from "@/lib/validation";
import { sendOrderConfirmation } from "@/lib/email";
import { clientIp, rateLimit, tooMany } from "@/lib/rate-limit";

class CheckoutError extends Error {
  constructor(
    public status: number,
    public kind: string,
    public problems: string[]
  ) {
    super(kind);
  }
}

const bodySchema = z.object({
  idempotencyKey: z.string().uuid(),
  paymentMethod: z.enum(["RAZORPAY", "COD"]),
  deliveryMethod: z.enum(["standard", "express"]),
  couponCode: z.string().trim().max(30).nullable().optional(),

  address: addressInput,

  items: z
    .array(
      z.object({
        variantId: z.string().min(1),
        quantity: z.number().int().min(1).max(20),
      })
    )
    .min(1)
    .max(50),
});

function razorpayClient(): Razorpay {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    throw new CheckoutError(503, "gateway", [
      "Payments aren't configured on this server — please choose Cash on Delivery.",
    ]);
  }

  return new Razorpay({ key_id, key_secret });
}

function serialize(
  order: Pick<Order, "orderNumber" | "total" | "paymentMethod">,
  payment: Pick<Payment, "razorpayOrderId"> | null
): PlaceOrderResponse {
  return {
    ok: true,
    orderNumber: order.orderNumber,
    total: order.total,
    paymentMethod: order.paymentMethod,
    razorpay: payment?.razorpayOrderId
      ? {
        keyId: process.env.RAZORPAY_KEY_ID!,
        razorpayOrderId: payment.razorpayOrderId,
        amount: order.total,
      }
      : null,
  };
}

async function place(
  input: z.infer<typeof bodySchema>,
  userId: string | null
): Promise<PlaceOrderResponse> {
  // Idempotency fast path — a double-clicked button or a retry after the
  // payment window was closed resolves to the SAME order, not a new one.
  const existing = await prisma.order.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
    include: { payment: true },
  });

  if (existing) {
    return serialize(existing, existing.payment);
  }

  const result = await prisma.$transaction(
    async (tx) => {
      // 1. Prices come from the DB — never from the client.
      const { lines, problems } = await resolveLines(tx, input.items);

      if (problems.length) {
        throw new CheckoutError(409, "stock", problems);
      }

      // 2. Coupon re-validated inside the transaction.
      let discount = 0;
      let couponCode: string | null = null;

      if (input.couponCode) {
        const pre = lines.reduce(
          (s, l) => s + l.unitPrice * l.quantity,
          0
        );

        const check = await validateCoupon(
          tx,
          input.couponCode,
          pre,
          input.address.email
        );

        if (!check.ok) {
          throw new CheckoutError(409, "coupon", [check.reason]);
        }

        discount = check.discount;
        couponCode = check.code;
      }

      // 3. Totals.
      const totals = computeTotals(
        lines,
        discount,
        input.deliveryMethod
      );

      // 4. Order + snapshots + event + payment row.
      const isCod = input.paymentMethod === "COD";

      const created = await tx.order.create({
        data: {
          orderNumber: newOrderNumber(),
          email: input.address.email,

          // Logged-in user ID; null for guests.
          userId: userId ?? null,

          shippingName: input.address.fullName,
          shippingPhone: input.address.phone,
          shippingLine1: input.address.line1,
          shippingLine2: input.address.line2 || null,
          shippingCity: input.address.city,
          shippingState: input.address.state,
          shippingPincode: input.address.pincode,

          subtotal: totals.subtotal,
          shippingFee: totals.shippingFee,
          discount: totals.discount,
          total: totals.total,
          couponCode,

          status: isCod ? "CONFIRMED" : "PENDING",
          paymentStatus: "PENDING",
          paymentMethod: input.paymentMethod,
          deliveryMethod: input.deliveryMethod,
          idempotencyKey: input.idempotencyKey,

          events: {
            create: [
              {
                status: isCod ? "CONFIRMED" : "PENDING",
                note: isCod
                  ? "Order placed — cash on delivery"
                  : "Order placed — awaiting payment",
              },
            ],
          },

          items: {
            create: lines.map((l) => ({
              productId: l.productId,
              variantId: l.variantId,
              productName: l.name,
              imageUrl: l.imageUrl,
              color: l.color,
              size: l.size,
              unitPrice: l.unitPrice,
              quantity: l.quantity,
            })),
          },

          payment: {
            create: {
              provider: isCod ? "cod" : "razorpay",
              amount: totals.total,
            },
          },
        },
      });

      // 5. Gateway order — BEFORE taking stock locks.
      if (!isCod) {
        const rzp = await razorpayClient().orders.create({
          amount: totals.total,
          currency: "INR",
          receipt: created.orderNumber,
        });

        await tx.payment.update({
          where: { orderId: created.id },
          data: {
            razorpayOrderId: rzp.id,
          },
        });
      }

      // 6. Reserve stock — atomic check-and-decrement.
      for (const line of [...lines].sort((a, b) =>
        a.variantId.localeCompare(b.variantId)
      )) {
        const res = await tx.productVariant.updateMany({
          where: {
            id: line.variantId,
            stock: { gte: line.quantity },
          },
          data: {
            stock: { decrement: line.quantity },
          },
        });

        if (res.count !== 1) {
          throw new CheckoutError(409, "stock", [
            `${line.name} just sold out`,
          ]);
        }
      }

      return created;
    },
    { timeout: 15_000 }
  );

  if (result.paymentMethod === "COD") {
    sendOrderConfirmation(result.orderNumber).catch((e) => console.error("Confirmation email failed:", e));
  }

  const payment = await prisma.payment.findUnique({
    where: { orderId: result.id },
  });

  return serialize(result, payment);
}
export const maxDuration = 30;
export async function POST(req: Request) {
  const rl = rateLimit(`place:${clientIp(req)}`, 5, 60_000);
  if (!rl.ok) return tooMany(rl.retryAfter);

  const parsed = bodySchema.safeParse(
    await req.json().catch(() => null)
  );

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid checkout data",
        problems: parsed.error.issues.map((i) => i.message),
      },
      { status: 400 }
    );
  }

  // Get the currently logged-in Better Auth user.
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  try {
    return NextResponse.json(
      await place(parsed.data, session?.user.id ?? null)
    );
  } catch (e) {
    if (e instanceof CheckoutError) {
      return NextResponse.json(
        {
          error: e.kind,
          problems: e.problems,
        },
        { status: e.status }
      );
    }

    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      // Unique violation: a concurrent duplicate submit with the same
      // idempotency key, or an order-number collision. Re-read to resolve.
      const dupe = await prisma.order.findUnique({
        where: {
          idempotencyKey: parsed.data.idempotencyKey,
        },
        include: {
          payment: true,
        },
      });

      if (dupe) {
        return NextResponse.json(
          serialize(dupe, dupe.payment)
        );
      }

      return NextResponse.json(
        {
          error: "retry",
          problems: [
            "Something went wrong — please try again",
          ],
        },
        { status: 503 }
      );
    }

    console.error("placeOrder failed:", e);

    return NextResponse.json(
      {
        error: "server",
        problems: [
          "Something went wrong on our side — your payment was NOT charged.",
        ],
      },
      { status: 500 }
    );
  }
}