import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { formatPaise } from "@/lib/money";
import { nextStatuses, ORDER_TRANSITIONS, STATUS_BADGE, STATUS_LABEL } from "@/lib/order-status";
import { StatusUpdater } from "@/components/admin/StatusUpdater";

export const metadata = { title: "Order Detail" };

export default async function AdminOrderDetail({
    params,
}: {
    params: Promise<{ orderNumber: string }>;
}) {
    await requireAdmin();
    const { orderNumber } = await params;

    const order = await prisma.order.findUnique({
        where: { orderNumber },
        include: {
            items: true,
            events: { orderBy: { createdAt: "asc" } },
            payment: true,
            user: { select: { name: true, email: true } },
        },
    });
    if (!order) notFound();

    const th = "px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-stone-500";

    return (
        <div>
            <header className="flex flex-wrap items-center gap-3">
                <Link href="/admin/orders" className="text-sm text-stone-500 hover:text-ink">← Orders</Link>
                <h1 className="font-display text-3xl font-semibold">{order.orderNumber}</h1>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[order.status]}`}>
                    {STATUS_LABEL[order.status]}
                </span>
                <span className="ml-auto font-display text-2xl font-semibold">{formatPaise(order.total)}</span>
            </header>
            <p className="mt-1 text-sm text-stone-500">
                Placed {order.createdAt.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>

            <section className="mt-6 rounded-xl border border-stone-200 bg-white p-5">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-500">Advance status</h2>
                <p className="mt-1 text-xs text-stone-400">
                    Allowed from {STATUS_LABEL[order.status]}: {ORDER_TRANSITIONS[order.status].map((s) => STATUS_LABEL[s]).join(", ") || "—"}
                </p>
                <div className="mt-3">
                    <StatusUpdater orderNumber={order.orderNumber} next={nextStatuses(order.status)} />
                </div>
            </section>

            <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <section className="rounded-xl border border-stone-200 bg-white p-5 text-sm">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-500">Payment</h2>
                    <dl className="mt-3 space-y-1.5">
                        <div className="flex justify-between"><dt className="text-stone-500">Method</dt><dd>{order.paymentMethod === "COD" ? "Cash on Delivery" : "Razorpay"}</dd></div>
                        <div className="flex justify-between"><dt className="text-stone-500">Status</dt><dd>{order.paymentStatus}</dd></div>
                        {order.payment?.razorpayOrderId && (
                            <div className="flex justify-between gap-3"><dt className="shrink-0 text-stone-500">RZP order</dt><dd className="truncate font-mono text-xs">{order.payment.razorpayOrderId}</dd></div>
                        )}
                        {order.payment?.razorpayPaymentId && (
                            <div className="flex justify-between gap-3"><dt className="shrink-0 text-stone-500">RZP payment</dt><dd className="truncate font-mono text-xs">{order.payment.razorpayPaymentId}</dd></div>
                        )}
                        {order.couponCode && (
                            <div className="flex justify-between"><dt className="text-stone-500">Coupon</dt><dd>{order.couponCode} (−{formatPaise(order.discount)})</dd></div>
                        )}
                    </dl>
                </section>
                <section className="rounded-xl border border-stone-200 bg-white p-5 text-sm">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-500">Customer</h2>
                    <div className="mt-3 space-y-1.5">
                        <p className="font-medium">{order.shippingName}</p>
                        <p className="text-stone-500">{order.email} · {order.shippingPhone}</p>
                        <p className="pt-1.5 leading-relaxed text-stone-600">
                            {order.shippingLine1}{order.shippingLine2 ? `, ${order.shippingLine2}` : ""}<br />
                            {order.shippingCity}, {order.shippingState} — {order.shippingPincode}
                        </p>
                        <p className="text-xs text-stone-400">{order.user ? "Registered customer" : "Guest checkout"} · {order.deliveryMethod} delivery</p>
                    </div>
                </section>
            </div>

            <section className="mt-6 overflow-x-auto rounded-xl border border-stone-200 bg-white">
                <table className="w-full min-w-[560px] text-sm">
                    <thead className="border-b border-stone-200">
                        <tr>
                            <th className={th}>Item</th><th className={th}>Variant</th><th className={th}>Unit</th>
                            <th className={th}>Qty</th><th className={th}>Line total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                        {order.items.map((it) => (
                            <tr key={it.id}>
                                <td className="px-3 py-2.5">
                                    <div className="flex items-center gap-2.5">
                                        <div className="relative h-10 w-8 shrink-0 overflow-hidden rounded bg-stone-100">
                                            {it.imageUrl && <Image src={it.imageUrl} alt="" fill sizes="32px" className="object-cover" />}
                                        </div>
                                        <span className="font-medium">{it.productName}</span>
                                    </div>
                                </td>
                                <td className="px-3 py-2.5 text-stone-500">{[it.color, it.size].filter(Boolean).join(" · ") || "—"}</td>
                                <td className="px-3 py-2.5">{formatPaise(it.unitPrice)}</td>
                                <td className="px-3 py-2.5">{it.quantity}</td>
                                <td className="px-3 py-2.5 font-semibold">{formatPaise(it.unitPrice * it.quantity)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>

            <section className="mt-6 rounded-xl border border-stone-200 bg-white p-5">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-500">History</h2>
                <ol className="mt-3 space-y-2 text-sm">
                    {order.events.map((ev) => (
                        <li key={ev.id} className="flex flex-wrap items-baseline gap-x-3">
                            <span className="font-medium">{STATUS_LABEL[ev.status]}</span>
                            <span className="text-stone-500">
                                {ev.createdAt.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                            </span>
                            {ev.note && <span className="text-xs text-stone-400">{ev.note}</span>}
                        </li>
                    ))}
                </ol>
            </section>
        </div>
    );
}