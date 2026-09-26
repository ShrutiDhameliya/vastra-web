import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  resolveLines, computeTotals, validateCoupon,
  FREE_SHIPPING_THRESHOLD, type DeliveryMethod,
} from "@/lib/pricing";
import type { QuoteResponse } from "@/types";
import { clientIp, rateLimit, tooMany } from "@/lib/rate-limit";

const bodySchema = z.object({
  items: z.array(z.object({ variantId: z.string().min(1), quantity: z.number().int().min(1).max(20) })).max(50),
  couponCode: z.string().trim().max(30).nullable().optional(),
  deliveryMethod: z.enum(["standard", "express"]).optional(),
});

export async function POST(req: Request) {
  const rl = rateLimit(`quote:${clientIp(req)}`, 30, 60_000);
  if (!rl.ok) return tooMany(rl.retryAfter);
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { items, couponCode, deliveryMethod = "standard" as DeliveryMethod } = parsed.data;

  if (items.length === 0) {
    const empty: QuoteResponse = {
      lines: [], itemCount: 0, subtotal: 0, discount: 0, shippingFee: 0, total: 0,
      coupon: null, problems: [], freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
    };
    return NextResponse.json(empty);
  }

  const { lines, problems } = await resolveLines(prisma, items);
  const available = lines.filter((l) => l.stock >= l.quantity);

  let coupon: QuoteResponse["coupon"] = null;
  let discount = 0;
  if (couponCode) {
    // Preview only — email-based per-user usage is enforced at place time
    const pre = available.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
    const check = await validateCoupon(prisma, couponCode, pre, "");
    coupon = check.ok
      ? { code: check.code, applied: true, discount: check.discount, reason: null }
      : { code: check.code, applied: false, discount: 0, reason: check.reason };
    if (check.ok) discount = check.discount;
  }

  const totals = computeTotals(available, discount, deliveryMethod);

  return NextResponse.json({
    lines: lines.map((l) => ({
      variantId: l.variantId, name: l.name, imageUrl: l.imageUrl,
      color: l.color, size: l.size, unitPrice: l.unitPrice,
      quantity: l.quantity, lineTotal: l.unitPrice * l.quantity,
      stock: l.stock, available: l.stock >= l.quantity,
    })),
    itemCount: lines.reduce((n, l) => n + l.quantity, 0),
    ...totals,
    coupon,
    problems,
    freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
  } satisfies QuoteResponse);
}