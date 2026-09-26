import { NextResponse } from "next/server";
import { releaseStaleOrders } from "@/lib/order";

// Schedule in production (e.g. Vercel Cron every 15 min):
//   GET /api/cron/release-stale  with  Authorization: Bearer <CRON_SECRET>
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  const released = await releaseStaleOrders(30);
  return NextResponse.json({ released });
}