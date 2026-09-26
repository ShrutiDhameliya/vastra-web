"use client";

import { useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { useWishlistStore, setWishlistSync } from "@/lib/wishlist-store";

const LAST_USER_KEY = "vastra-wishlist-user";

export function WishlistSync() {
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id ?? null;

  useEffect(() => {
    const push = (productId: string, added: boolean) => {
      fetch(`/api/wishlist/${encodeURIComponent(productId)}`, {
        method: added ? "PUT" : "DELETE",
      }).catch(() => {}); // fire-and-forget; failures self-heal on next merge
    };

    if (!userId) {
      setWishlistSync(null);
      const last = localStorage.getItem(LAST_USER_KEY);
      if (last) {
        // A user just signed out on this browser — clear their items so a
        // different account logging in next can't inherit them.
        localStorage.removeItem(LAST_USER_KEY);
        useWishlistStore.setState({ productIds: [] });
      }
      return;
    }

    if (localStorage.getItem(LAST_USER_KEY) === userId) {
      setWishlistSync(push); // already merged for this user — pushes only
      return;
    }

    // Fresh login (or first load while signed in): merge local + server.
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/wishlist").catch(() => null);
      if (!res || !res.ok || cancelled) return;
      const { ids: serverIds }: { ids: string[] } = await res.json();
      if (cancelled) return;

      // Read local AFTER the fetch — a heart toggled mid-merge must survive.
      const server = new Set(serverIds);
      const local = useWishlistStore.getState().productIds;
      await Promise.all(local.filter((id) => !server.has(id)).map((id) => push(id, true)));
      if (cancelled) return;

      localStorage.setItem(LAST_USER_KEY, userId);
      const localNow = useWishlistStore.getState().productIds;
      useWishlistStore.setState({ productIds: [...new Set([...localNow, ...serverIds])] });
      setWishlistSync(push);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return null;
}