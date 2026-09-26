"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Minus, Plus, ShoppingBag, Tag, Trash2, X } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { useQuote } from "@/components/checkout/useQuote";
import { formatPaise } from "@/lib/money";

export default function CartPage() {
  // Persisted store isn't available during SSR — gate the first paint
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const items = useCartStore((s) => s.items);

  const setQty = useCartStore((s) => s.setQty);
  const remove = useCartStore((s) => s.remove);
  const coupon = useCartStore((s) => s.coupon);
  const setCoupon = useCartStore((s) => s.setCoupon);
  const { quote, loading } = useQuote("standard");
  const [code, setCode] = useState("");

  if (!mounted) {
    return <div className="mx-auto max-w-7xl px-4 py-24 text-center text-sm text-stone-400">Loading cart…</div>;
  }

  if (items.length === 0) {
    return (
      <div data-tour="cart-page" className="mx-auto flex max-w-7xl flex-col items-center px-4 py-24 text-center">
        <ShoppingBag className="size-10 text-stone-400" />
        <h1 className="mt-4 font-display text-2xl font-semibold">Your cart is empty</h1>
        <p className="mt-2 text-sm text-stone-500">Looks like you haven&apos;t added anything yet.</p>
        <Link href="/shop" className="mt-6 rounded-full bg-ink px-7 py-3 text-sm font-medium text-paper transition hover:bg-stone-800">
          Continue Shopping
        </Link>
      </div>
    );
  }

  const lineUnavailable = (variantId: string) => {
    if (!quote) return false; // still quoting — don't flash false warnings
    const l = quote.lines.find((x) => x.variantId === variantId);
    return !l || !l.available;
  };
  const hasUnavailable = items.some((i) => lineUnavailable(i.variantId));

  console.log("Cart items:", items); // Debugging line to check the cart items
  return (
    <div data-tour="cart-page" className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-semibold">Your Cart</h1>

      <div className="mt-8 grid gap-12 lg:grid-cols-[1fr_22rem]">
        <div className="min-w-0">
          {quote && quote.problems.length > 0 && (
            <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {quote.problems.map((p, index) => (
                <p key={`${p}-${index}`}>{p}</p>
              ))}
            </div>
          )}

          <ul className="divide-y divide-stone-200">
            {items.map((item) => {
              const line = quote?.lines.find((l) => l.variantId === item.variantId);
              const unitPrice = line?.unitPrice ?? item.unitPrice;
              const stock = line?.stock ?? item.maxQty ?? 99;
              const unavailable = lineUnavailable(item.variantId);
              return (
                <li key={item.variantId} className="flex gap-4 py-6">
                  <Link
                    href={`/products/${item.slug}`}
                    className="relative aspect-[3/4] w-20 shrink-0 overflow-hidden rounded-lg bg-stone-100"
                  >
                    {item.imageUrl && (
                      <Image src={item.imageUrl} alt={item.name} fill sizes="80px" className="object-cover" />
                    )}
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link href={`/products/${item.slug}`} className="truncate text-sm font-medium hover:underline">
                          {item.name}
                        </Link>
                        {item.variantLabel && (
                          <p className="mt-0.5 text-xs text-stone-500">{item.variantLabel}</p>
                        )}
                        {line && line.unitPrice !== item.unitPrice && (
                          <p className="mt-1 text-xs text-amber-700">
                            Price updated to {formatPaise(line.unitPrice)}
                          </p>
                        )}
                        {unavailable && (
                          <p className="mt-1 text-xs font-medium text-sale">
                            Not enough stock — reduce quantity or remove
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => remove(item.variantId)}
                        aria-label={`Remove ${item.name}`}
                        className="p-1 text-stone-400 transition hover:text-sale"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <div className="inline-flex items-center rounded-full border border-stone-300">
                        <button
                          onClick={() => setQty(item.variantId, item.quantity - 1)}
                          aria-label="Decrease quantity"
                          className="grid size-8 place-items-center rounded-full hover:bg-stone-100"
                        >
                          <Minus className="size-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium tabular-nums">{item.quantity}</span>
                        <button
                          onClick={() => setQty(item.variantId, item.quantity + 1)}
                          aria-label="Increase quantity"
                          disabled={item.quantity >= stock}
                          className="grid size-8 place-items-center rounded-full hover:bg-stone-100 disabled:opacity-30"
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                      <p className="text-sm font-semibold">{formatPaise(unitPrice * item.quantity)}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-xl border border-stone-200 bg-white p-6">
            <h2 className="font-display text-lg font-semibold">Summary</h2>

            {quote?.coupon?.applied ? (
              <div className="mt-4 flex items-center justify-between rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
                <span className="flex items-center gap-1.5">
                  <Tag className="size-3.5" /> {quote.coupon.code} applied
                </span>
                <button onClick={() => setCoupon(null)} aria-label="Remove coupon">
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <form
                className="mt-4 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (code.trim()) setCoupon(code.trim().toUpperCase());
                }}
              >
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Coupon code"
                  aria-label="Coupon code"
                  className="w-full min-w-0 rounded-lg border border-stone-300 px-3 py-2 text-sm uppercase"
                />
                <button type="submit" className="shrink-0 rounded-lg border border-stone-300 px-4 text-sm font-medium hover:border-ink">
                  Apply
                </button>
              </form>
            )}
            {quote?.coupon && !quote.coupon.applied && (
              <p className="mt-2 text-xs text-sale">{quote.coupon.reason}</p>
            )}

            <dl className="mt-5 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-stone-500">Subtotal</dt>
                <dd>{loading ? "…" : formatPaise(quote?.subtotal ?? 0)}</dd>
              </div>
              {quote?.discount ? (
                <div className="flex justify-between text-green-700">
                  <dt>Coupon</dt>
                  <dd>−{formatPaise(quote.discount)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between">
                <dt className="text-stone-500">Shipping</dt>
                <dd>{quote?.shippingFee ? formatPaise(quote.shippingFee) : "Free"}</dd>
              </div>
              <div className="flex justify-between border-t border-stone-200 pt-3 text-base font-semibold">
                <dt>Total</dt>
                <dd>{loading ? "…" : formatPaise(quote?.total ?? 0)}</dd>
              </div>
            </dl>
            <p className="mt-2 text-xs text-stone-500">
              {quote && quote.subtotal < quote.freeShippingThreshold
                ? `Add ${formatPaise(quote.freeShippingThreshold - quote.subtotal)} more for free shipping`
                : "Free shipping applied"}
            </p>

            <Link
              data-tour="checkout-btn"
              href="/checkout"
              aria-disabled={hasUnavailable}
              className={`mt-6 flex items-center justify-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-paper transition hover:bg-stone-800 ${hasUnavailable ? "pointer-events-none opacity-40" : ""
                }`}
            >
              Proceed to Checkout <ArrowRight className="size-4" />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}