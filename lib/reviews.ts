import { prisma } from "./db";

/** A verified purchase = this user's order, in a state that means money
 *  moved or is committed (not pending, cancelled, or refunded),
 *  containing this product. Guest orders have no userId — never match. */
export async function hasPurchasedProduct(userId: string, productId: string): Promise<boolean> {
  const order = await prisma.order.findFirst({
    where: {
      userId,
      status: { notIn: ["PENDING", "CANCELLED", "REFUNDED"] },
      items: { some: { productId } },
    },
    select: { id: true },
  });
  return !!order;
}

/** The invariant the admin will also maintain: denormalized rating fields
 *  always recomputed from approved reviews. */
export async function recalcProductRating(productId: string) {
  const agg = await prisma.review.aggregate({
    where: { productId, isApproved: true },
    _avg: { rating: true },
    _count: { _all: true },
  });
  await prisma.product.update({
    where: { id: productId },
    data: {
      ratingAvg: agg._avg.rating == null ? null : Math.round(agg._avg.rating * 10) / 10,
      reviewCount: agg._count._all,
    },
  });
}