import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { addressInput } from "@/lib/validation";

const createSchema = addressInput.omit({ email: true }).extend({ isDefault: z.boolean().optional() });

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const addresses = await prisma.address.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });
  return NextResponse.json(addresses);
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ problems: parsed.error.issues.map((i) => i.message) }, { status: 400 });
  }
  const d = parsed.data;
  const userId = session.user.id;

  try {
    const address = await prisma.$transaction(async (tx) => {
      const count = await tx.address.count({ where: { userId } });
      if (count >= 5) throw new Error("limit");
      const makeDefault = d.isDefault || count === 0; // first address is automatically the default
      if (makeDefault) {
        await tx.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
      }
      return tx.address.create({
        data: {
          userId, fullName: d.fullName, phone: d.phone, line1: d.line1,
          line2: d.line2 || null, city: d.city, state: d.state, pincode: d.pincode,
          isDefault: makeDefault,
        },
      });
    });
    return NextResponse.json({ address }, { status: 201 });
  } catch (e) {
    if (e instanceof Error && e.message === "limit") {
      return NextResponse.json({ problems: ["You can save up to 5 addresses"] }, { status: 400 });
    }
    throw e;
  }
}