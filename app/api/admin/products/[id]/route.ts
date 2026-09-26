import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { Prisma } from "@/src/generated/prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { computeDiscountPercent, isAdminRequest } from "@/lib/admin";

// Same body shape as POST — reuse by importing? Route files can't easily share
// without a lib module; keep it local and identical to create's schema.
const productSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "lowercase letters, numbers and hyphens only"),
  description: z.string().trim().min(10).max(4000),
  brand: z.string().trim().max(60),
  categoryId: z.string().min(1),
  price: z.number().int().min(100),
  mrp: z.number().int().min(0).nullable(),
  isFeatured: z.boolean(),
  isArchived: z.boolean(),
  images: z.array(z.object({
    id: z.string().optional(),
    url: z.string().trim().min(1).max(500),
    alt: z.string().trim().max(200).default(""),
  })).min(1).max(8),
  variants: z.array(z.object({
    id: z.string().optional(),
    color: z.string().trim().max(40).default(""),
    size: z.string().trim().max(20).default(""),
    sku: z.string().trim().min(1).max(60),
    stock: z.number().int().min(0).max(100_000),
    price: z.number().int().min(0).nullable(),
  })).min(1).max(50),
});

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const parsed = productSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ problems: parsed.error.issues.map((i) => i.message) }, { status: 400 });
  }
  const d = parsed.data;
  const { id } = await params;

  const existing = await prisma.product.findUnique({ where: { id }, select: { id: true, slug: true } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const category = await prisma.category.findUnique({ where: { id: d.categoryId }, select: { id: true } });
  if (!category) return NextResponse.json({ problems: ["Pick a valid category"] }, { status: 400 });

  try {
    const product = await prisma.$transaction(async (tx) => {
      // Diff images: keep-by-id, update kept, create new, delete dropped
      const keepImageIds = d.images.filter((i) => i.id).map((i) => i.id!);
      await tx.productImage.deleteMany({ where: { productId: id, id: { notIn: keepImageIds } } });
      for (const [position, img] of d.images.entries()) {
        const data = { url: img.url, altText: img.alt || null, position };
        if (img.id) await tx.productImage.update({ where: { id: img.id }, data });
        else await tx.productImage.create({ data: { productId: id, ...data } });
      }

      // Diff variants the same way — keeping ids keeps live carts working
      const keepVariantIds = d.variants.filter((v) => v.id).map((v) => v.id!);
      await tx.productVariant.deleteMany({ where: { productId: id, id: { notIn: keepVariantIds } } });
      for (const v of d.variants) {
        const data = { color: v.color, size: v.size, sku: v.sku, stock: v.stock, price: v.price };
        if (v.id) await tx.productVariant.update({ where: { id: v.id }, data });
        else await tx.productVariant.create({ data: { productId: id, ...data } });
      }

      return tx.product.update({
        where: { id },
        data: {
          name: d.name, slug: d.slug, description: d.description,
          brand: d.brand || null, categoryId: d.categoryId,
          price: d.price, mrp: d.mrp,
          discountPercent: computeDiscountPercent(d.price, d.mrp),
          isFeatured: d.isFeatured, isArchived: d.isArchived,
        },
      });
    });

    revalidatePath("/");
    revalidatePath("/shop");
    revalidatePath(`/products/${existing.slug}`); // old slug, if it changed
    revalidatePath(`/products/${product.slug}`);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ problems: ["That slug (or a variant SKU) is already in use"] }, { status: 409 });
    }
    throw e;
  }
}