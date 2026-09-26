// app/api/admin/categories/route.ts
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { Prisma } from "@/src/generated/prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin";

const schema = z.object({
  name: z.string().trim().min(2).max(60),
  slug: z.string().trim().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "lowercase letters, numbers and hyphens only"),
  parentId: z.string().nullable(),
  imageUrl: z.string().trim().max(500),
});

export async function POST(req: Request) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ problems: parsed.error.issues.map((i) => i.message) }, { status: 400 });
  }
  const d = parsed.data;

  if (d.parentId) {
    const parent = await prisma.category.findUnique({ where: { id: d.parentId }, select: { id: true } });
    if (!parent) return NextResponse.json({ problems: ["Parent category doesn't exist"] }, { status: 400 });
  }

  try {
    const category = await prisma.category.create({
      data: {
        name: d.name, slug: d.slug,
        parentId: d.parentId || null,
        imageUrl: d.imageUrl || null,
      },
    });
    revalidatePath("/");
    revalidatePath("/shop");
    return NextResponse.json({ category }, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ problems: ["That slug is already in use"] }, { status: 409 });
    }
    throw e;
  }
}