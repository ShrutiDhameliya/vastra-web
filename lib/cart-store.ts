"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  productId: string;
  variantId: string;
  slug: string;
  name: string;
  variantLabel: string | null; // "Black · M" — display only
  imageUrl: string;
  unitPrice: number;           // paise — display only, server recomputes at checkout
  quantity: number;
  maxQty?: number;
};

type CartState = {
  items: CartItem[];
  coupon: string | null;            // ← add
  add: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  remove: (variantId: string) => void;
  setQty: (variantId: string, qty: number) => void;
  setCoupon: (code: string | null) => void;  // ← add
  clear: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      coupon: null,    
      add: (item, qty = 1) =>
        set((state) => {
          const existing = state.items.find((i) => i.variantId === item.variantId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.variantId === item.variantId
                  ? { ...i, quantity: Math.min(i.quantity + qty, i.maxQty ?? 99) }
                  : i
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity: qty }] };
        }),
      remove: (variantId) =>
        set((s) => ({ items: s.items.filter((i) => i.variantId !== variantId) })),
      setQty: (variantId, qty) =>
        set((s) => ({
          items:
            qty <= 0
              ? s.items.filter((i) => i.variantId !== variantId)
              : s.items.map((i) =>
                  i.variantId === variantId
                    ? { ...i, quantity: Math.min(qty, i.maxQty ?? 99) }
                    : i
                ),
        })),
      setCoupon: (code) => set({ coupon: code }), 
      clear: () => set({ items: [] }),
    }),
    { name: "vastra-cart" }
  )
);

export const selectCartCount = (s: CartState) =>
  s.items.reduce((n, i) => n + i.quantity, 0);