import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { formatPaise } from "@/lib/money";

export const metadata: Metadata = { title: "My Orders" };

const BADGE: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-800",
    CONFIRMED: "bg-stone-200 text-stone-700",
    PROCESSING: "bg-blue-100 text-blue-800",
    PACKED: "bg-indigo-100 text-indigo-800",
    SHIPPED: "bg-violet-100 text-violet-800",
    OUT_FOR_DELIVERY: "bg-cyan-100 text-cyan-800",
    DELIVERED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-700",
    REFUNDED: "bg-red-100 text-red-700",
};

export default async function OrdersPage() {
    const user = await getSessionUser();
    if (!user) return null;

    const orders = await prisma.order.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        include: { items: { take: 3 } },
    });

    if (orders.length === 0) {
        return (
            <div className="flex flex-col items-center py-16 text-center">
                <ShoppingBag className="size-10 text-stone-400" />
                <h1 className="mt-4 font-display text-2xl font-semibold">No orders yet</h1>
                <p className="mt-2 text-sm text-stone-500">When you place an order, it&apos;ll show up here.</p>
                <Link href="/shop" className="mt-6 rounded-full bg-ink px-7 py-3 text-sm font-medium text-paper transition hover:bg-stone-800">
                    Start Shopping
                </Link>
            </div>
        );
    }

    return (
        <div>
            <h1 className="font-display text-3xl font-semibold">My Orders</h1>
            <ul className="mt-6 space-y-4">
                {orders.map((o) => (
                    <li key={o.id}>
                        <Link href={`/orders/${o.orderNumber}`}
                            className="block rounded-xl border border-stone-200 bg-white p-5 transition hover:border-ink">
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                                <span className="font-medium">{o.orderNumber}</span>
                                <span className="text-xs text-stone-500">
                                    {o.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                </span>
                                <span className={`ml-auto rounded-full px-2.5 py-0.5 text-xs font-medium ${BADGE[o.status] ?? "bg-stone-200 text-stone-700"}`}>
                                    {o.status.replaceAll("_", " ").toLowerCase()}
                                </span>
                            </div>
                            <div className="mt-4 flex items-center justify-between gap-4">
                                <div className="flex -space-x-3">
                                    {o.items.map((it) =>
                                        it.imageUrl ? (
                                            <span key={it.id} className="relative h-12 w-9 overflow-hidden rounded-md border-2 border-white bg-stone-100">
                                                <Image src={it.imageUrl} alt="" fill sizes="36px" className="object-cover" />
                                            </span>
                                        ) : null
                                    )}
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold">{formatPaise(o.total)}</p>
                                    <p className="text-xs text-stone-500">
                                        {o.paymentMethod === "COD" ? "Cash on delivery" : "Paid online"} · view details →
                                    </p>
                                </div>
                            </div>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}