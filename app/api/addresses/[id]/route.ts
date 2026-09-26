import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { addressInput } from "@/lib/validation";

const updateSchema = addressInput.omit({ email: true }).partial().extend({ isDefault: z.boolean().optional() });

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = updateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ problems: parsed.error.issues.map((i) => i.message) }, { status: 400 });
  }
  const d = parsed.data;
  const { id } = await params;
  const userId = session.user.id;

  const existing = await prisma.address.findFirst({ where: { id, userId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const address = await prisma.$transaction(async (tx) => {
    if (d.isDefault) {
      await tx.address.updateMany({
        where: { userId, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }
    return tx.address.update({
      where: { id },
      data: {
        fullName: d.fullName, phone: d.phone, line1: d.line1,
        line2: d.line2 === undefined ? undefined : d.line2 || null,
        city: d.city, state: d.state, pincode: d.pincode, isDefault: d.isDefault,
      },
    });
  });
  return NextResponse.json({ address });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const userId = session.user.id;
  const existing = await prisma.address.findFirst({ where: { id, userId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.address.delete({ where: { id } });

  // Deleting the default promotes the oldest remaining address
  let newDefaultId: string | null = null;
  if (existing.isDefault) {
    const next = await prisma.address.findFirst({ where: { userId }, orderBy: { id: "asc" } });
    if (next) {
      await prisma.address.update({ where: { id: next.id }, data: { isDefault: true } });
      newDefaultId = next.id;
    }
  }
  return NextResponse.json({ ok: true, newDefaultId });
}