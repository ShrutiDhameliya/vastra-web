"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type WishlistState = {
  productIds: string[];
  add: (productId: string) => void;
  remove: (productId: string) => void;
  toggle: (productId: string) => void;
  setAll: (productIds: string[]) => void;
};

// Module-level hook, registered by <WishlistSync> when a user is signed in.
// This keeps auth (and its fetch calls) out of the store itself — the store
// stays importable by server-rendered pages via ProductCard.
let pushToServer: ((productId: string, added: boolean) => void) | null = null;
export function setWishlistSync(fn: typeof pushToServer) {
  pushToServer = fn;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      productIds: [],
      add: (id) => {
        if (get().productIds.includes(id)) return;
        pushToServer?.(id, true);
        set((s) => ({ productIds: [...s.productIds, id] }));
      },
      remove: (id) => {
        pushToServer?.(id, false);
        set((s) => ({ productIds: s.productIds.filter((x) => x !== id) }));
      },
      toggle: (id) => (get().productIds.includes(id) ? get().remove(id) : get().add(id)),
      setAll: (ids) => set({ productIds: [...new Set(ids)] }),
    }),
    { name: "vastra-wishlist" }
  )
);