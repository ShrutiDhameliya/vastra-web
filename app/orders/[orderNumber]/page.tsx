import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatPaise } from "@/lib/money";
import { canViewOrder, getSessionUser } from "@/lib/session";

export const metadata: Metadata = { title: "Track Order", robots: { index: false } };

const LADDER = [
  { status: "PENDING", label: "Order Placed" },
  { status: "CONFIRMED", label: "Confirmed" },
  { status: "PROCESSING", label: "Processing" },
  { status: "PACKED", label: "Packed" },
  { status: "SHIPPED", label: "Shipped" },
  { status: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
  { status: "DELIVERED", label: "Delivered" },
] as const;

export default async function TrackPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: true, events: { orderBy: { createdAt: "asc" } } },
  });
  if (!order) notFound();

  const user = await getSessionUser();
  if (!canViewOrder(order, user)) notFound();

  const cancelled = order.status === "CANCELLED" || order.status === "REFUNDED";
  const reached = LADDER.findIndex((l) => l.status === order.status);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">{order.orderNumber}</h1>
          <p className="mt-1 text-sm text-stone-500">
            Placed{" "}
            {order.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="text-right">
          <p className="font-semibold">{formatPaise(order.total)}</p>
          <p className="text-xs text-stone-500">
            {order.paymentMethod === "COD" ? "Cash on Delivery" : "Paid Online"} · {order.paymentStatus.toLowerCase()}
          </p>
        </div>
      </header>

      {cancelled ? (
        <div className="mt-8 rounded-xl border border-sale/30 bg-sale/5 p-6 text-sm text-sale">
          This order was {order.status.toLowerCase()}.
          {order.status === "REFUNDED" && " Your refund is on its way to the original payment method."}
        </div>
      ) : (
        <ol className="mt-10">
          {LADDER.map((step, i) => {
            const done = reached !== -1 && i < reached;
            const current = i === reached;
            const ev = order.events.find((e) => e.status === step.status);
            return (
              <li key={step.status} className="relative flex gap-4 pb-8 last:pb-0">
                {i < LADDER.length - 1 && (
                  <span
                    aria-hidden
                    className={`absolute left-[11px] top-6 h-full w-0.5 ${done || current ? "bg-ink" : "bg-stone-200"}`}
                  />
                )}
                <span
                  className={`relative z-10 grid size-6 shrink-0 place-items-center rounded-full border-2 ${
                    done || current ? "border-ink bg-ink" : "border-stone-300 bg-paper"
                  }`}
                >
                  {done ? (
                    <Check className="size-3.5 text-paper" />
                  ) : (
                    <span className={`size-2 rounded-full ${current ? "bg-paper" : "bg-stone-300"}`} />
                  )}
                </span>
                <div className="pt-0.5">
                  <p className={`text-sm font-medium ${done || current ? "" : "text-stone-400"}`}>{step.label}</p>
                  {ev && (
                    <p className="text-xs text-stone-500">
                      {ev.createdAt.toLocaleString("en-IN", {
                        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <section className="mt-12 border-t border-stone-200 pt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-500">Items</h2>
        <ul className="mt-3 divide-y divide-stone-100">
          {order.items.map((it) => (
            <li key={it.id} className="flex items-center gap-3 py-3">
              <div className="relative h-14 w-11 shrink-0 overflow-hidden rounded bg-stone-100">
                {it.imageUrl && <Image src={it.imageUrl} alt="" fill sizes="44px" className="object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{it.productName}</p>
                <p className="text-xs text-stone-500">
                  {[it.color, it.size, `Qty ${it.quantity}`].filter(Boolean).join(" · ")}
                </p>
              </div>
              <span className="text-sm">{formatPaise(it.unitPrice * it.quantity)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8 border-t border-stone-200 pt-6 text-sm text-stone-600">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-500">Delivering to</h2>
        <p className="mt-2 leading-relaxed">
          {order.shippingName} · {order.shippingPhone}
          <br />
          {order.shippingLine1}
          {order.shippingLine2 ? `, ${order.shippingLine2}` : ""}
          <br />
          {order.shippingCity}, {order.shippingState} — {order.shippingPincode}
        </p>
      </section>

      <div className="mt-10">
        <Link href="/shop" className="text-sm font-medium text-stone-600 hover:text-ink">
          ← Continue shopping
        </Link>
      </div>
    </div>
  );
}