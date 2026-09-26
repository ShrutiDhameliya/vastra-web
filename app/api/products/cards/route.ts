import { NextResponse } from "next/server";
import { z } from "zod";
import { getCardProducts } from "@/lib/queries";

const schema = z.object({ ids: z.array(z.string().min(1)).min(1).max(50) });

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  return NextResponse.json(await getCardProducts(parsed.data.ids));
}