import type { TourId } from "./tour-steps";

type StoredState = { at: number; completed: boolean };

const key = (tour: TourId) => `vastra-tour-${tour}`;

/** Records that this browser has seen `tour` — either finished or skipped. */
export function markTourDismissed(tour: TourId, completed = false): void {
    try {
        localStorage.setItem(key(tour), JSON.stringify({ at: Date.now(), completed } satisfies StoredState));
    } catch {
        // storage unavailable (private mode etc.) — the tour still works, it just may re-offer
    }
}

export function isTourDismissed(tour: TourId): boolean {
    try {
        return localStorage.getItem(key(tour)) !== null;
    } catch {
        return true; // can't persist → never nag
    }
}