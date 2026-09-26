import type { Metadata } from "next";
import Link from "next/link";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { formatPaise } from "@/lib/money";

export const metadata: Metadata = { title: "Overview" };

export default async function AccountOverview() {
  const user = await getSessionUser();
  if (!user) return null;

  const [orderCount, addressCount, latest] = await Promise.all([
    prisma.order.count({ where: { userId: user.id } }),
    prisma.address.count({ where: { userId: user.id } }),
    prisma.order.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: { orderNumber: true, total: true, status: true, createdAt: true },
    }),
  ]);

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Hello, {user.name.split(" ")[0]}</h1>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link href="/account/orders" className="rounded-xl border border-stone-200 bg-white p-6 transition hover:border-ink">
          <p className="font-display text-3xl font-semibold">{orderCount}</p>
          <p className="mt-1 text-sm text-stone-500">{orderCount === 1 ? "order" : "orders"} placed</p>
        </Link>
        <Link href="/account/addresses" className="rounded-xl border border-stone-200 bg-white p-6 transition hover:border-ink">
          <p className="font-display text-3xl font-semibold">{addressCount}</p>
          <p className="mt-1 text-sm text-stone-500">saved {addressCount === 1 ? "address" : "addresses"}</p>
        </Link>
      </div>

      {latest && (
        <div className="mt-8 rounded-xl border border-stone-200 bg-white p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Latest order</p>
          <div className="mt-2 flex items-center justify-between gap-4">
            <div>
              <p className="font-medium">{latest.orderNumber}</p>
              <p className="text-xs text-stone-500">
                {latest.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · {formatPaise(latest.total)}
              </p>
            </div>
            <Link href={`/orders/${latest.orderNumber}`} className="text-sm font-medium underline-offset-2 hover:underline">
              Track →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}