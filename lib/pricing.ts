import { Prisma } from "@/src/generated/prisma/client";
import { formatPaise } from "./money";

export const FREE_SHIPPING_THRESHOLD = 199_900; // ₹1,999
export const SHIPPING_STANDARD_FEE = 10_000;   // ₹100
export const SHIPPING_EXPRESS_FEE = 19_900;    // ₹199

export type DeliveryMethod = "standard" | "express";

export type ResolvedLine = {
  variantId: string;
  productId: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  color: string | null;
  size: string | null;
  unitPrice: number; // paise
  quantity: number;
  stock: number;
};

/** Both prisma and a transaction client satisfy this shape. */
type Querier = Pick<Prisma.TransactionClient, "productVariant" | "coupon" | "order">;

/** Collapse duplicate variantIds defensively, then hydrate from the DB.
 *  The cart's stored unitPrice is display-only — this is the source of truth. */
export async function resolveLines(
  db: Querier,
  rawItems: { variantId: string; quantity: number }[]
): Promise<{ lines: ResolvedLine[]; problems: string[] }> {
  const qtyByVariant = new Map<string, number>();
  for (const { variantId, quantity } of rawItems) {
    qtyByVariant.set(variantId, Math.min(20, (qtyByVariant.get(variantId) ?? 0) + quantity));
  }

  const variants = await db.productVariant.findMany({
    where: { id: { in: [...qtyByVariant.keys()] } },
    include: { product: { include: { images: { orderBy: { position: "asc" }, take: 1 } } } },
  });
  const byId = new Map(variants.map((v) => [v.id, v]));

  const lines: ResolvedLine[] = [];
  const problems: string[] = [];
  for (const [variantId, quantity] of qtyByVariant) {
    const v = byId.get(variantId);
    if (!v || v.product.isArchived) {
      problems.push("An item in your cart is no longer available");
      continue;
    }
    const label = [v.color, v.size].filter(Boolean).join(" · ");
    if (v.stock < quantity) {
      problems.push(`${v.product.name}${label ? ` (${label})` : ""} — only ${v.stock} left`);
    }
    lines.push({
      variantId, productId: v.productId, name: v.product.name, slug: v.product.slug,
      imageUrl: v.product.images[0]?.url ?? null,
      color: v.color || null, size: v.size || null,
      unitPrice: v.price ?? v.product.price,
      quantity, stock: v.stock,
    });
  }
  return { lines, problems };
}

export function computeTotals(lines: ResolvedLine[], discount: number, delivery: DeliveryMethod) {
  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  const capped = Math.min(discount, subtotal);
  const shippingFee =
    delivery === "express"
      ? SHIPPING_EXPRESS_FEE
      : subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_STANDARD_FEE;
  return { subtotal, discount: capped, shippingFee, total: subtotal - capped + shippingFee };
}

export type CouponCheck =
  | { ok: true; code: string; discount: number }
  | { ok: false; code: string; reason: string };

/** Full validation — runs again inside the place-order transaction, so a
 *  stale quote can never secure a discount. */
export async function validateCoupon(
  db: Querier, code: string, subtotal: number, email: string
): Promise<CouponCheck> {
  const coupon = await db.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });
  const now = new Date();
  if (!coupon || !coupon.isActive) return { ok: false, code, reason: "Invalid coupon code" };
  if (coupon.startsAt > now) return { ok: false, code, reason: "This coupon isn't active yet" };
  if (coupon.expiresAt <= now) return { ok: false, code, reason: "This coupon has expired" };
  if (subtotal < coupon.minOrderAmount)
    return { ok: false, code, reason: `Minimum order of ${formatPaise(coupon.minOrderAmount)} required` };

  const where: Prisma.OrderWhereInput = {
    couponCode: coupon.code,
    status: {
      not: "CANCELLED",
    },
  };

  const [totalUsed, usedByEmail] = await Promise.all([
    db.order.count({ where }),
    db.order.count({ where: { ...where, email } }),
  ]);
  if (coupon.usageLimit != null && totalUsed >= coupon.usageLimit)
    return { ok: false, code, reason: "This coupon has been fully redeemed" };
  if (usedByEmail >= coupon.perUserLimit)
    return { ok: false, code, reason: "You've already used this coupon" };

  const raw = coupon.type === "PERCENT" ? Math.round((subtotal * coupon.value) / 100) : coupon.value;
  return {
    ok: true, code: coupon.code,
    discount: coupon.maxDiscount != null ? Math.min(raw, coupon.maxDiscount) : raw,
  };
}