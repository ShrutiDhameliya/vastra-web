import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { computeDiscountPercent, isAdminRequest } from "@/lib/admin";

const variantSchema = z.object({
  id: z.string().optional(),
  color: z.string().trim().max(40).default(""),
  size: z.string().trim().max(20).default(""),
  sku: z.string().trim().min(1).max(60),
  stock: z.number().int().min(0).max(100_000),
  price: z.number().int().min(0).nullable(),
});

const productSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "lowercase letters, numbers and hyphens only"),
  description: z.string().trim().min(10).max(4000),
  brand: z.string().trim().max(60),
  categoryId: z.string().min(1),
  price: z.number().int().min(100), // ₹1 minimum
  mrp: z.number().int().min(0).nullable(),
  isFeatured: z.boolean(),
  isArchived: z.boolean(),
  images: z.array(z.object({
    id: z.string().optional(),
    url: z.string().trim().min(1).max(500),
    alt: z.string().trim().max(200).default(""),
  })).min(1).max(8),
  variants: z.array(variantSchema).min(1).max(50),
});

export async function POST(req: Request) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const parsed = productSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ problems: parsed.error.issues.map((i) => i.message) }, { status: 400 });
  }
  const d = parsed.data;

  const category = await prisma.category.findUnique({ where: { id: d.categoryId }, select: { id: true } });
  if (!category) return NextResponse.json({ problems: ["Pick a valid category"] }, { status: 400 });

  try {
    const product = await prisma.product.create({
      data: {
        name: d.name, slug: d.slug, description: d.description,
        brand: d.brand || null, categoryId: d.categoryId,
        price: d.price, mrp: d.mrp,
        discountPercent: computeDiscountPercent(d.price, d.mrp),
        isFeatured: d.isFeatured, isArchived: d.isArchived,
        images: {
          create: d.images.map((i, position) => ({ url: i.url, altText: i.alt || null, position })),
        },
        variants: {
          create: d.variants.map((v) => ({
            color: v.color, size: v.size, sku: v.sku, stock: v.stock, price: v.price,
          })),
        },
      },
    });
    revalidatePath("/");
    revalidatePath("/shop");
    revalidatePath(`/products/${product.slug}`);
    return NextResponse.json({ ok: true, id: product.id }, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ problems: ["That slug (or a variant SKU) is already in use"] }, { status: 409 });
    }
    throw e;
  }
}