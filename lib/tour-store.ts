"use client";

import { create } from "zustand";
import { markTourDismissed, type TourId } from "./tour-storage";

type TourState = {
    activeTour: TourId | null;
    stepIndex: number;
    start: (tour: TourId) => void;
    next: () => void;
    back: () => void;
    /** Ends the tour instantly. completed=true when the last step was reached. */
    stop: (completed?: boolean) => void;
};

export const useTourStore = create<TourState>((set, get) => ({
    activeTour: null,
    stepIndex: 0,
    start: (tour) => {
        markTourDismissed(tour); // starting counts as seen — the prompt never re-appears
        set({ activeTour: tour, stepIndex: 0 });
    },
    next: () => set((s) => ({ stepIndex: s.stepIndex + 1 })),
    back: () => set((s) => ({ stepIndex: Math.max(0, s.stepIndex - 1) })),
    stop: (completed = false) => {
        const { activeTour } = get();
        if (activeTour) markTourDismissed(activeTour, completed);
        set({ activeTour: null, stepIndex: 0 });
    },
}));