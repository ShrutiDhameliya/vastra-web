import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { formatPaise } from "@/lib/money";
import { STATUS_BADGE, STATUS_LABEL } from "@/lib/order-status";
import type { OrderStatus } from "@/src/generated/prisma/enums";

export const metadata = { title: "Orders" };

const PAGE_SIZE = 20;
const STATUSES = Object.keys(STATUS_LABEL) as OrderStatus[];

export default async function AdminOrders({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    await requireAdmin();
    const sp = await searchParams;
    const get = (k: string) => (Array.isArray(sp[k]) ? sp[k][0] : sp[k]) ?? "";
    const q = get("q").trim();
    const status = STATUSES.find((s) => s === get("status"));
    const page = Math.max(1, Number(get("page")) || 1);

    const where = {
        ...(status ? { status } : {}),
        ...(q
            ? {
                OR: [
                    { orderNumber: { contains: q, mode: "insensitive" as const } },
                    { email: { contains: q, mode: "insensitive" as const } },
                    { shippingName: { contains: q, mode: "insensitive" as const } },
                ],
            }
            : {}),
    };

    const [total, orders] = await Promise.all([
        prisma.order.count({ where }),
        prisma.order.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * PAGE_SIZE,
            take: PAGE_SIZE,
            select: {
                orderNumber: true, createdAt: true, shippingName: true, email: true,
                total: true, paymentMethod: true, paymentStatus: true, status: true,
                _count: { select: { items: true } },
            },
        }),
    ]);
    const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

    const href = (p: number, st?: string | null) => {
        const sp2 = new URLSearchParams();
        if (q) sp2.set("q", q);
        const target = st === undefined ? status : st;
        if (target) sp2.set("status", target);
        if (p > 1) sp2.set("page", String(p));
        const s = sp2.toString();
        return `/admin/orders${s ? `?${s}` : ""}`;
    };

    const th = "px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-stone-500";

    return (
        <div>
            <h1 className="font-display text-3xl font-semibold">Orders</h1>

            <form action="/admin/orders" className="mt-6 flex max-w-md gap-2">
                <input
                    name="q" defaultValue={q} placeholder="Order number, email or name"
                    className="w-full rounded-full border border-stone-300 px-4 py-2 text-sm outline-none focus:border-ink"
                />
                <button type="submit" className="shrink-0 rounded-full border border-stone-300 px-5 text-sm font-medium transition hover:border-ink">
                    Search
                </button>
            </form>

            <div className="mt-4 flex flex-wrap gap-1.5">
                <Link href={href(1, null)} className={`rounded-full border px-3 py-1 text-xs font-medium transition ${!status ? "border-ink bg-ink text-paper" : "border-stone-300 hover:border-ink"
                    }`}>All</Link>
                {STATUSES.map((s) => (
                    <Link key={s} href={href(1, s)} className={`rounded-full border px-3 py-1 text-xs font-medium transition ${status === s ? "border-ink bg-ink text-paper" : "border-stone-300 hover:border-ink"
                        }`}>{STATUS_LABEL[s]}</Link>
                ))}
            </div>

            <div className="mt-4 overflow-x-auto rounded-xl border border-stone-200 bg-white">
                <table className="w-full min-w-[720px] text-sm">
                    <thead className="border-b border-stone-200">
                        <tr>
                            <th className={th}>Order</th><th className={th}>Date</th><th className={th}>Customer</th>
                            <th className={th}>Payment</th><th className={th}>Total</th><th className={th}>Status</th><th className={th} />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                        {orders.length === 0 && (
                            <tr><td colSpan={7} className="px-3 py-8 text-center text-stone-500">No orders match.</td></tr>
                        )}
                        {orders.map((o) => (
                            <tr key={o.orderNumber} className="hover:bg-stone-50">
                                <td className="px-3 py-2.5 font-medium">{o.orderNumber}</td>
                                <td className="px-3 py-2.5 text-stone-500">
                                    {o.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                </td>
                                <td className="px-3 py-2.5">
                                    <p className="truncate">{o.shippingName}</p>
                                    <p className="truncate text-xs text-stone-500">{o.email}</p>
                                </td>
                                <td className="px-3 py-2.5 text-xs">
                                    {o.paymentMethod === "COD" ? "COD" : "Online"} · {o.paymentStatus.toLowerCase()}
                                </td>
                                <td className="px-3 py-2.5 font-semibold">{formatPaise(o.total)}</td>
                                <td className="px-3 py-2.5">
                                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[o.status]}`}>
                                        {STATUS_LABEL[o.status]}
                                    </span>
                                </td>
                                <td className="px-3 py-2.5 text-right">
                                    <Link href={`/admin/orders/${o.orderNumber}`} className="text-xs font-medium text-stone-600 hover:text-ink">
                                        View →
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-stone-500">{total} orders · page {page} / {pageCount}</span>
                <div className="flex gap-2">
                    {page > 1 ? (
                        <Link href={href(page - 1)} className="rounded-full border border-stone-300 px-4 py-1.5 hover:border-ink">← Prev</Link>
                    ) : (
                        <span className="rounded-full border border-stone-200 px-4 py-1.5 text-stone-300">← Prev</span>
                    )}
                    {page < pageCount ? (
                        <Link href={href(page + 1)} className="rounded-full border border-stone-300 px-4 py-1.5 hover:border-ink">Next →</Link>
                    ) : (
                        <span className="rounded-full border border-stone-200 px-4 py-1.5 text-stone-300">Next →</span>
                    )}
                </div>
            </div>
        </div>
    );
}