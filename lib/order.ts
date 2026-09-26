import crypto from "node:crypto";
import { prisma } from "./db";
import { sendOrderConfirmation } from "./email";

// No 0/O/1/I — order numbers get read aloud over the phone
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function newOrderNumber(): string {
  const bytes = crypto.randomBytes(6);
  let s = "";
  for (let i = 0; i < 6; i++) s += ALPHABET[bytes[i] % ALPHABET.length];
  return `ORD-${s}`; // ~2 billion combos; the unique index is the backstop
}

export function safeEqualHex(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

/** Mark an order paid — called by BOTH the verify endpoint and the webhook.
 *  Idempotent, so double-delivery of either is harmless. */

export async function markOrderPaid(
  razorpayOrderId: string,
  razorpayPaymentId: string
) {
  let transitioned = false;

  const order = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { razorpayOrderId },
      include: { order: true },
    });

    if (!payment) return null;

    // Already paid — don't send confirmation email again
    if (payment.status === "PAID") {
      return payment.order;
    }

    if (payment.order.status === "CANCELLED") {
      // Paid after our stale-order sweep cancelled it. Rare — production
      // would trigger an auto-refund here. For now: log for manual refund.
      console.error(
        `Late capture on cancelled order ${payment.order.orderNumber} — needs refund`
      );

      return null;
    }

    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: "PAID",
        razorpayPaymentId,
      },
    });

    const order = await tx.order.update({
      where: { id: payment.orderId },
      data: {
        status: "CONFIRMED",
        paymentStatus: "PAID",
      },
    });

    await tx.orderEvent.create({
      data: {
        orderId: payment.orderId,
        status: "CONFIRMED",
        note: "Payment received",
      },
    });

    // Payment successfully transitioned from non-PAID → PAID
    transitioned = true;

    return order;
  });

  // Transaction has committed at this point.
  // Send confirmation only for the first successful transition.
  if (transitioned && order) {
    sendOrderConfirmation(order.orderNumber).catch((e) => console.error("Confirmation email failed:", e));
  }

  return order;
}


/** Release stock for unpaid RAZORPAY orders older than `minutes`.
 *  COD orders never sit in PENDING-payment limbo, so they're excluded.
 *  Wire to a cron (Vercel Cron, GitHub Action…) hitting the route below. */
export async function releaseStaleOrders(minutes = 30): Promise<number> {
  const cutoff = new Date(Date.now() - minutes * 60_000);
  const stale = await prisma.order.findMany({
    where: { status: "PENDING", paymentMethod: "RAZORPAY", createdAt: { lt: cutoff } },
    include: { items: true },
  });

  for (const order of stale) {
    await prisma.$transaction(async (tx) => {
      // Re-check inside the transaction — a payment may have landed
      // between the findMany above and now.
      const fresh = await tx.order.findUnique({ where: { id: order.id }, select: { status: true } });
      if (!fresh || fresh.status !== "PENDING") return;

      for (const item of order.items) {
        if (item.variantId) {
          await tx.productVariant.updateMany({
            where: { id: item.variantId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }
      await tx.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } });
      await tx.orderEvent.create({
        data: { orderId: order.id, status: "CANCELLED", note: "Payment not completed in time" },
      });
    });
  }
  return stale.length;
}