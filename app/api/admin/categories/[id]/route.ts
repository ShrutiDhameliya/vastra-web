// app/api/admin/categories/[id]/route.ts
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin";

const schema = z.object({
  name: z.string().trim().min(2).max(60),
  slug: z.string().trim().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "lowercase letters, numbers and hyphens only"),
  parentId: z.string().nullable(),
  imageUrl: z.string().trim().max(500),
});

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ problems: parsed.error.issues.map((i) => i.message) }, { status: 400 });
  }
  const d = parsed.data;
  const { id } = await params;

  const existing = await prisma.category.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (d.parentId === id) {
    return NextResponse.json({ problems: ["A category can't be its own parent"] }, { status: 400 });
  }

  try {
    const category = await prisma.category.update({
      where: { id },
      data: {
        name: d.name, slug: d.slug,
        parentId: d.parentId || null,
        imageUrl: d.imageUrl || null,
      },
    });
    revalidatePath("/");
    revalidatePath("/shop");
    return NextResponse.json({ category });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ problems: ["That slug is already in use"] }, { status: 409 });
    }
    throw e;
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;

  const existing = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing._count.products > 0) {
    return NextResponse.json(
      { error: `Move or reassign the ${existing._count.products} product(s) in this category first` },
      { status: 400 }
    );
  }

  // Children detach to top level via the schema's onDelete: SetNull
  await prisma.category.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/shop");
  return NextResponse.json({ ok: true });
}