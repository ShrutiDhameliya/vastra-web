import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const wishlist = await prisma.wishlist.findUnique({
    where: { userId: session.user.id },
    select: { items: { select: { productId: true } } },
  });
  return NextResponse.json({ ids: wishlist?.items.map((i) => i.productId) ?? [] });
}