import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasPurchasedProduct, recalcProductRating } from "@/lib/reviews";
import { clientIp, rateLimit, tooMany } from "@/lib/rate-limit";

const schema = z.object({
  productId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional().or(z.literal("")),
  comment: z.string().trim().min(10, "Reviews need at least 10 characters").max(2000),
});

export async function POST(req: Request) {
  const rl = rateLimit(`review:${clientIp(req)}`, 5, 60_000);
  if (!rl.ok) return tooMany(rl.retryAfter);

  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Sign in to write a review" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ problems: parsed.error.issues.map((i) => i.message) }, { status: 400 });
  }
  const { productId, rating, title, comment } = parsed.data;
  const userId = session.user.id;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, slug: true, isArchived: true },
  });
  if (!product || product.isArchived) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  if (!(await hasPurchasedProduct(userId, productId))) {
    return NextResponse.json(
      { error: "Only customers who have bought this product can review it" },
      { status: 403 }
    );
  }

  // One review per product per user (the unique constraint) — upsert = edit
  await prisma.review.upsert({
    where: { productId_userId: { productId, userId } },
    create: { productId, userId, rating, title: title || null, comment, isApproved: true, verifiedPurchase: true },
    update: { rating, title: title || null, comment },
  });

  await recalcProductRating(productId);
  revalidatePath(`/products/${product.slug}`); // PDP is ISR (revalidate = 60)
  revalidatePath("/");                          // cards show the new rating
  return NextResponse.json({ ok: true });
}