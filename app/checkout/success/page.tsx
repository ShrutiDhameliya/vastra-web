import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatPaise } from "@/lib/money";
import { getSessionUser, canViewOrder } from "@/lib/session";

export const metadata: Metadata = { title: "Order Confirmed", robots: { index: false } };

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string | string[] }>;
}) {

  const sp = await searchParams;
  const orderNumber = Array.isArray(sp.order) ? sp.order[0] : sp.order;
  if (!orderNumber) notFound();

  const order = await prisma.order.findUnique({ where: { orderNumber }, include: { items: true } });
  if (!order) notFound();

  const user = await getSessionUser();
  if (!canViewOrder(order, user)) notFound();

  const eta = new Date(order.createdAt);
  eta.setDate(eta.getDate() + (order.deliveryMethod === "express" ? 2 : 4));

  const Row = ({ label, value }: { label: string; value: string }) => (
    <div className="flex justify-between px-6 py-4 text-sm">
      <dt className="text-stone-500">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <CheckCircle2 className="mx-auto size-14 text-green-600" />
        <h1 className="mt-4 font-display text-3xl font-semibold">Order placed — thank you!</h1>
        <p className="mt-2 text-sm text-stone-600">Confirmation recorded for {order.email}.</p>
      </div>

      <dl className="mt-10 divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white">
        <Row label="Order ID" value={order.orderNumber} />
        <Row
          label="Payment"
          value={
            order.paymentMethod === "COD"
              ? `Cash on Delivery${order.paymentStatus === "PAID" ? " (paid)" : ""}`
              : order.paymentStatus === "PAID"
                ? "Paid online"
                : "Pending"
          }
        />
        <Row label="Items" value={String(order.items.length)} />
        <Row label="Total" value={formatPaise(order.total)} />
        <Row label="Estimated delivery" value={eta.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })} />
      </dl>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href={`/orders/${order.orderNumber}`}
          className="flex-1 rounded-full bg-ink px-6 py-3 text-center text-sm font-medium text-paper transition hover:bg-stone-800"
        >
          Track Order
        </Link>
        <Link
          href="/shop"
          className="flex-1 rounded-full border border-ink px-6 py-3 text-center text-sm font-medium transition hover:bg-ink hover:text-paper"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}