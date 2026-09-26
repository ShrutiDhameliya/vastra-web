import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { markOrderPaid, safeEqualHex } from "@/lib/order";

// The webhook is the source of truth — it fires even if the user closes
// the tab mid-payment. Signature is computed over the RAW body.
export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature");
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!signature || !secret) return new NextResponse("Forbidden", { status: 403 });
  const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");
  if (!safeEqualHex(expected, signature)) return new NextResponse("Forbidden", { status: 403 });

  let event: { event?: string; payload?: { payment?: { entity?: { id?: string; order_id?: string } } } };
  try {
    event = JSON.parse(raw);
  } catch {
    return new NextResponse("Bad payload", { status: 400 });
  }

  const entity = event.payload?.payment?.entity;

  switch (event.event) {
    case "payment.captured":
    case "order.paid":
      if (entity?.order_id && entity.id) {
        await markOrderPaid(entity.order_id, entity.id); // idempotent
      }
      break;
    case "payment.failed":
      // Record only — the user can retry INSIDE the Razorpay modal, so we
      // must NOT release stock here. That's the stale-order sweep's job.
      console.warn(`Payment failed for razorpay order ${entity?.order_id ?? "?"}`);
      break;
  }

  // Always 200 so Razorpay doesn't retry forever on events we ignore
  return NextResponse.json({ received: true });
}