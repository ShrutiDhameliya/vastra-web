"use client";

import { useTourStore } from "@/lib/tour-store";
import type { TourId } from "@/lib/tour-steps";

export function StartTourButton({
    tour = "customer",
    label = "Take a Tour",
    className = "",
}: {
    tour?: TourId;
    label?: string;
    className?: string;
}) {
    const start = useTourStore((s) => s.start);
    return (
        <button type="button" onClick={() => start(tour)} className={className}>
            {label}
        </button>
    );
}