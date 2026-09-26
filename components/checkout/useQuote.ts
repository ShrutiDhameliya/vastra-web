"use client";

import { useEffect, useMemo, useState } from "react";
import { useCartStore } from "@/lib/cart-store";
import type { QuoteResponse } from "@/types";

/** Server-verified totals for the current cart. Re-fetches on any cart,
 *  coupon, or delivery change. */
export function useQuote(deliveryMethod: "standard" | "express" = "standard") {
  const items = useCartStore((s) => s.items);
  const coupon = useCartStore((s) => s.coupon);
  const setCoupon = useCartStore((s) => s.setCoupon);
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const key = useMemo(
    () =>
      items.map((i) => `${i.variantId}:${i.quantity}`).join("|") +
      `#${coupon ?? ""}#${deliveryMethod}`,
    [items, coupon, deliveryMethod]
  );

  useEffect(() => {
    if (items.length === 0) {
      setQuote(null);
      setLoading(false);
      return;
    }
    let live = true;
    setLoading(true);
    fetch("/api/checkout/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
        couponCode: coupon,
        deliveryMethod,
      }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((q: QuoteResponse | null) => {
        if (!live || !q) return;
        setQuote(q);
        // Strip an invalid coupon from the store so checkout never sends
        // it (place would reject the whole order otherwise).
        if (q.coupon && !q.coupon.applied) setCoupon(null);
      })
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  return { quote, loading };
}