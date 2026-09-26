import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin";
import { ORDER_TRANSITIONS } from "@/lib/order-status";
import { OrderStatus } from "@prisma/client";

const schema = z.object({ status: z.nativeEnum(OrderStatus) });

export async function PUT(req: Request, { params }: { params: Promise<{ orderNumber: string }> }) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { orderNumber } = await params;
  const next = parsed.data.status;

  try {
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { orderNumber }, include: { items: true } });
      if (!order) throw new Error("not-found");
      if (!ORDER_TRANSITIONS[order.status].includes(next)) throw new Error("invalid");

      await tx.order.update({ where: { id: order.id }, data: { status: next } });
      await tx.orderEvent.create({
        data: { orderId: order.id, status: next, note: "Updated by admin" },
      });

      // Cancelling releases exactly what placement reserved — safe to run
      // once because CANCELLED is terminal in the transition table.
      if (next === "CANCELLED") {
        for (const item of order.items) {
          if (item.variantId) {
            await tx.productVariant.updateMany({
              where: { id: item.variantId },
              data: { stock: { increment: item.quantity } },
            });
          }
        }
      }

      // COD money is realized on delivery
      if (next === "DELIVERED" && order.paymentMethod === "COD") {
        await tx.order.update({ where: { id: order.id }, data: { paymentStatus: "PAID" } });
        await tx.payment.updateMany({ where: { orderId: order.id }, data: { status: "PAID" } });
      }
      if (next === "REFUNDED") {
        await tx.order.update({ where: { id: order.id }, data: { paymentStatus: "REFUNDED" } });
        await tx.payment.updateMany({ where: { orderId: order.id }, data: { status: "REFUNDED" } });
      }
    });
  } catch (e) {
    if (e instanceof Error && e.message === "not-found") {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (e instanceof Error && e.message === "invalid") {
      return NextResponse.json({ error: "That transition isn't allowed from the current status" }, { status: 409 });
    }
    throw e;
  }

  revalidatePath(`/orders/${orderNumber}`); // customer tracking updates instantly
  return NextResponse.json({ ok: true });
}