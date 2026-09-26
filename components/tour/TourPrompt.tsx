"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTourStore } from "@/lib/tour-store";
import { isTourDismissed, markTourDismissed } from "@/lib/tour-storage";

export function TourPrompt() {
    const start = useTourStore((s) => s.start);
    const activeTour = useTourStore((s) => s.activeTour);
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);
    const [show, setShow] = useState(false);

    useEffect(() => setMounted(true), []);

    useEffect(() => {
        if (!mounted || isTourDismissed("customer")) return;
        // let the page settle a beat before inviting
        const t = window.setTimeout(() => setShow(true), 1200);
        return () => window.clearTimeout(t);
    }, [mounted]);

    if (!mounted || !show || activeTour || pathname.startsWith("/admin")) return null;

    return (
        <div className="pointer-events-none fixed inset-x-3 bottom-3 z-40 flex justify-end sm:inset-x-auto sm:bottom-5 sm:right-5">
            <div
                role="region"
                aria-label="Tour invitation"
                className="pointer-events-auto w-full max-w-sm rounded-xl border border-stone-200 bg-paper p-5 shadow-2xl"
            >
                <p className="font-display text-lg font-semibold">New to Vastra?</p>
                <p className="mt-1 text-sm text-stone-600">
                    Take a two-minute tour of the shop — search, filters, cart, checkout, and your account.
                </p>
                <div className="mt-4 flex items-center justify-end gap-2">
                    <button
                        type="button"
                        onClick={() => {
                            setShow(false);
                            markTourDismissed("customer"); // "later" = never auto-nag again; restart via footer
                        }}
                        className="rounded-full px-4 py-2 text-sm font-medium text-stone-500 transition hover:text-ink"
                    >
                        Maybe later
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setShow(false);
                            start("customer");
                        }}
                        className="rounded-full bg-ink px-5 py-2 text-sm font-medium text-paper transition hover:bg-stone-800"
                    >
                        Start the tour
                    </button>
                </div>
            </div>
        </div>
    );
}