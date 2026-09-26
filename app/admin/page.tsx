import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { formatPaise } from "@/lib/money";
import { STATUS_BADGE, STATUS_LABEL } from "@/lib/order-status";

export const metadata = { title: "Dashboard" };

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
    return (
        <div className="rounded-xl border border-stone-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">{label}</p>
            <p className="mt-2 font-display text-3xl font-semibold">{value}</p>
            {sub && <p className="mt-1 text-xs text-stone-500">{sub}</p>}
        </div>
    );
}

function SalesChart({ days }: { days: { date: Date; revenue: number }[] }) {
    const max = Math.max(...days.map((d) => d.revenue), 1);
    const bw = 750 / days.length;
    return (
        <svg viewBox="0 0 750 170" className="mt-4 h-44 w-full" role="img" aria-label="Daily sales, last 30 days">
            {days.map((d, i) => {
                const h = Math.max(2, (d.revenue / max) * 140);
                return (
                    <rect key={i} x={i * bw + 1.5} y={150 - h} width={bw - 3} height={h} rx="2"
                        className={d.revenue > 0 ? "fill-stone-800" : "fill-stone-300"}>
                        <title>
                            {`${d.date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} — ${formatPaise(d.revenue)}`}
                        </title>
                    </rect>
                );
            })}
        </svg>
    );
}

export default async function AdminDashboard() {
    await requireAdmin();

    const since30 = new Date();
    since30.setHours(0, 0, 0, 0);
    since30.setDate(since30.getDate() - 29);

    const [revenue, orderCount, pendingCount, customerCount, productCount, recent, salesRows, lowStock, topRows] =
        await Promise.all([
            prisma.order.aggregate({ _sum: { total: true }, where: { paymentStatus: "PAID" } }),
            prisma.order.count(),
            prisma.order.count({ where: { status: "PENDING" } }),
            prisma.user.count(),
            prisma.product.count({ where: { isArchived: false } }),
            prisma.order.findMany({
                orderBy: { createdAt: "desc" }, take: 8,
                select: { orderNumber: true, createdAt: true, total: true, status: true, shippingName: true },
            }),
            prisma.order.findMany({
                where: { createdAt: { gte: since30 }, status: { not: "CANCELLED" } },
                select: { createdAt: true, total: true },
            }),
            prisma.productVariant.findMany({
                where: { stock: { lte: 3 } }, orderBy: { stock: "asc" }, take: 6,
                include: { product: { select: { name: true } } },
            }),
            prisma.orderItem.groupBy({
                by: ["productId"], _sum: { quantity: true },
                orderBy: { _sum: { quantity: "desc" } }, take: 5,
            }),
        ]);

    // Bucket the last 30 days (gross sales — all non-cancelled orders)
    const days = Array.from({ length: 30 }, (_, i) => {
        const d = new Date(since30);
        d.setDate(d.getDate() + i);
        return { date: d, revenue: 0 };
    });
    const byDay = new Map(days.map((d) => [d.date.toDateString(), d]));
    for (const o of salesRows) {
        const day = byDay.get(new Date(o.createdAt).toDateString());
        if (day) day.revenue += o.total;
    }

    const topProducts = topRows.length
        ? await prisma.product.findMany({
            where: { id: { in: topRows.map((r) => r.productId).filter((x): x is string => !!x) } },
            select: { id: true, name: true },
        })
        : [];
    const nameById = new Map(topProducts.map((p) => [p.id, p.name]));

    return (
        <div>
            <h1 className="font-display text-3xl font-semibold">Dashboard</h1>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Stat label="Total Revenue" value={formatPaise(revenue._sum.total ?? 0)} sub="Online paid + delivered COD" />
                <Stat label="Orders" value={String(orderCount)} sub={pendingCount ? `${pendingCount} pending` : "none pending"} />
                <Stat label="Customers" value={String(customerCount)} />
                <Stat label="Products" value={String(productCount)} sub="live (unarchived)" />
            </div>

            <section className="mt-6 rounded-xl border border-stone-200 bg-white p-6">
                <h2 className="font-display text-lg font-semibold">Sales — last 30 days</h2>
                <p className="text-xs text-stone-500">Gross, excluding cancelled · hover a bar for the day&apos;s total</p>
                <SalesChart days={days} />
            </section>

            <div className="mt-6 grid gap-6 xl:grid-cols-2">
                <section className="rounded-xl border border-stone-200 bg-white p-6">
                    <h2 className="font-display text-lg font-semibold">Recent orders</h2>
                    <ul className="mt-4 divide-y divide-stone-100 text-sm">
                        {recent.length === 0 && <li className="py-3 text-stone-500">No orders yet.</li>}
                        {recent.map((o) => (
                            <li key={o.orderNumber}>
                                <Link href={`/admin/orders/${o.orderNumber}`} className="flex items-center gap-3 py-2.5 hover:underline">
                                    <span className="font-medium">{o.orderNumber}</span>
                                    <span className="truncate text-stone-500">{o.shippingName}</span>
                                    <span className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[o.status]}`}>
                                        {STATUS_LABEL[o.status]}
                                    </span>
                                    <span className="shrink-0 font-semibold">{formatPaise(o.total)}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>

                <div className="space-y-6">
                    <section className="rounded-xl border border-stone-200 bg-white p-6">
                        <h2 className="font-display text-lg font-semibold">Low stock</h2>
                        <ul className="mt-4 space-y-2 text-sm">
                            {lowStock.length === 0 && <li className="text-stone-500">Nothing at 3 units or below.</li>}
                            {lowStock.map((v) => (
                                <li key={v.id} className="flex items-center gap-2">
                                    <span className="truncate">{v.product.name}</span>
                                    <span className="shrink-0 text-stone-500">{[v.color, v.size].filter(Boolean).join(" · ")}</span>
                                    <span className={`ml-auto shrink-0 font-semibold ${v.stock === 0 ? "text-sale" : ""}`}>{v.stock} left</span>
                                </li>
                            ))}
                        </ul>
                    </section>

                    <section className="rounded-xl border border-stone-200 bg-white p-6">
                        <h2 className="font-display text-lg font-semibold">Top sellers</h2>
                        <ul className="mt-4 space-y-2 text-sm">
                            {topRows.length === 0 && <li className="text-stone-500">No sales yet.</li>}
                            {topRows.map((r) => (
                                <li key={r.productId ?? "?"} className="flex items-center gap-2">
                                    <span className="truncate">{nameById.get(r.productId ?? "") ?? "(deleted product)"}</span>
                                    <span className="ml-auto shrink-0 font-semibold">{r._sum.quantity} sold</span>
                                </li>
                            ))}
                        </ul>
                    </section>
                </div>
            </div>
        </div>
    );
}