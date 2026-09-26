"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Star } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export function ReviewForm({ productId, slug, canReview, initial }: {
    productId: string;
    slug: string;
    canReview: boolean;
    initial: { rating: number; title: string | null; comment: string } | null;
}) {
    const router = useRouter();
    const { data: session, isPending } = authClient.useSession();

    const [rating, setRating] = useState(initial?.rating ?? 0);
    const [hover, setHover] = useState(0);
    const [title, setTitle] = useState(initial?.title ?? "");
    const [comment, setComment] = useState(initial?.comment ?? "");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [done, setDone] = useState(false);

    if (isPending) return null;

    if (!session) {
        return (
            <p className="mt-8 text-sm text-stone-500">
                <Link href={`/login?next=/products/${slug}`} className="font-medium text-ink underline-offset-2 hover:underline">
                    Sign in
                </Link>{" "}
                to review this product.
            </p>
        );
    }

    if (!canReview && !initial) {
        return (
            <p className="mt-8 text-sm text-stone-500">
                Only customers who have bought this product can write a review.
            </p>
        );
    }

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        if (rating < 1) return setError("Pick a star rating");
        setBusy(true);
        try {
            const res = await fetch("/api/reviews", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productId, rating, title, comment }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.problems?.[0] ?? data.error ?? "Couldn't submit your review");
                return;
            }
            setDone(true);
            router.refresh(); // PDP re-renders with the new rating + review
        } finally {
            setBusy(false);
        }
    }

    return (
        <form onSubmit={submit} className="mt-8 rounded-xl border border-stone-200 bg-white p-6">
            <h3 className="font-display text-lg font-semibold">
                {initial ? "Update your review" : "Write a review"}
            </h3>

            <div className="mt-4 flex gap-1" role="radiogroup" aria-label="Your rating">
                {[1, 2, 3, 4, 5].map((n) => (
                    <button
                        key={n} type="button" role="radio" aria-checked={rating === n}
                        aria-label={`${n} star${n > 1 ? "s" : ""}`}
                        onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}
                        onClick={() => { setRating(n); setDone(false); }}
                        className="rounded p-0.5"
                    >
                        <Star className={`size-6 transition ${(hover || rating) >= n ? "fill-amber-400 text-amber-400" : "fill-stone-200 text-stone-200"}`} />
                    </button>
                ))}
            </div>

            <label className="mt-4 block">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">Title (optional)</span>
                <input value={title} onChange={(e) => { setTitle(e.target.value); setDone(false); }} maxLength={120}
                    className="mt-1.5 w-full rounded-lg border border-stone-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-ink" />
            </label>

            <label className="mt-4 block">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">Your review</span>
                <textarea required rows={4} minLength={10} maxLength={2000} value={comment}
                    onChange={(e) => { setComment(e.target.value); setDone(false); }}
                    className="mt-1.5 w-full rounded-lg border border-stone-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-ink" />
            </label>

            {error && <p className="mt-3 text-sm text-sale" role="alert">{error}</p>}
            {done && <p className="mt-3 text-sm text-green-700">Thanks — your review is live.</p>}

            <button type="submit" disabled={busy}
                className="mt-4 rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-paper transition hover:bg-stone-800 disabled:opacity-40">
                {busy ? "Submitting…" : initial ? "Update review" : "Submit review"}
            </button>
        </form>
    );
}