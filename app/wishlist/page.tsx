"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useWishlistStore } from "@/lib/wishlist-store";
import { ProductGrid } from "@/components/ProductGrid";
import type { CardProduct } from "@/types";

export default function WishlistPage() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const ids = useWishlistStore((s) => s.productIds);
    const { data: session } = authClient.useSession();
    const [cards, setCards] = useState<CardProduct[] | null>(null);

    // Signed in → pull the account wishlist into local.
    // Pulling only, so removing an item on another device
    // won't be undone by stale local state.
    useEffect(() => {
        if (!session?.user) return;

        fetch("/api/wishlist")
            .then((r) => (r.ok ? r.json() : null))
            .then((d: { ids: string[] } | null) => {
                if (!d) return;

                const local = useWishlistStore.getState().productIds;
                const merged = [...new Set([...local, ...d.ids])];

                if (merged.length !== local.length) {
                    useWishlistStore.setState({
                        productIds: merged,
                    });
                }
            })
            .catch(() => { });
    }, [session?.user?.id]);

    // Fetch card data for whatever the wishlist store currently holds.
    // Works for both guests and signed-in users.
    const idsKey = ids.join(",");

    useEffect(() => {
        if (!mounted) return;

        if (ids.length === 0) {
            setCards([]);
            return;
        }

        let live = true;

        setCards(null);

        fetch("/api/products/cards", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                ids: ids.slice(0, 50),
            }),
        })
            .then((r) => (r.ok ? r.json() : []))
            .then((list: CardProduct[]) => {
                if (live) {
                    setCards(list);
                }
            })
            .catch(() => {
                if (live) {
                    setCards([]);
                }
            });

        return () => {
            live = false;
        };
    }, [mounted, idsKey]);

    if (!mounted) {
        return (
            <div className="py-24 text-center text-sm text-stone-400">
                Loading wishlist…
            </div>
        );
    }

    return (
        <div data-tour="wishlist-page" className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
            <h1 className="font-display text-3xl font-semibold">
                My Wishlist
            </h1>

            <p className="mt-1 text-sm text-stone-500">
                {ids.length} {ids.length === 1 ? "item" : "items"} saved — tap
                the heart on any product to remove it.
            </p>

            {cards === null ? (
                <p className="mt-10 text-sm text-stone-400">
                    Loading…
                </p>
            ) : cards.length === 0 ? (
                <div className="flex flex-col items-center py-24 text-center">
                    <Heart className="size-10 text-stone-400" />

                    <h2 className="mt-4 font-display text-2xl font-semibold">
                        Nothing saved yet
                    </h2>

                    <p className="mt-2 text-sm text-stone-500">
                        Tap the heart on any product to save it for later.
                    </p>

                    <Link
                        href="/shop"
                        className="mt-6 rounded-full bg-ink px-7 py-3 text-sm font-medium text-paper transition hover:bg-stone-800"
                    >
                        Browse the Shop
                    </Link>
                </div>
            ) : (
                <div className="mt-8">
                    <ProductGrid products={cards} />
                </div>
            )}
        </div>
    );
}