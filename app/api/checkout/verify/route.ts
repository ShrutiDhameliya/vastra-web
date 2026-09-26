import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { z } from "zod";
import { markOrderPaid, safeEqualHex } from "@/lib/order";

const bodySchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;

  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return NextResponse.json({ error: "Gateway not configured" }, { status: 503 });

  // The signature cryptographically binds this payment to the order WE
  // created, with the amount WE set server-side. Never take the client's
  // word that payment succeeded.
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");
  if (!safeEqualHex(expected, razorpay_signature)) {
    return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
  }

  const order = await markOrderPaid(razorpay_order_id, razorpay_payment_id);
  if (!order) return NextResponse.json({ error: "Order not found for this payment" }, { status: 404 });

  return NextResponse.json({ ok: true, orderNumber: order.orderNumber });
}