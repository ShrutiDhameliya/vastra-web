"use client";

import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { useShopFilters } from "./use-shop-filters";
import { FilterPanel } from "./FilterPanel";
import type { ShopFacets } from "@/types";

function activeFilterCount(sp: URLSearchParams): number {
  let n = 0;

  for (const key of ["q", "category", "min", "max", "rating"]) {
    if (sp.get(key)) n += 1;
  }

  if (sp.get("sale") === "true") n += 1;

  for (const key of ["size", "color"]) {
    n += (sp.get(key) ?? "").split(",").filter(Boolean).length;
  }

  return n;
}

export function MobileFilters({ facets }: { facets: ShopFacets }) {
  const [open, setOpen] = useState(false);
  const { searchParams } = useShopFilters();
  const count = activeFilterCount(searchParams);

  return (
    <>
      {/* Mobile filters trigger */}
      <button
        onClick={() => setOpen(true)}
        data-tour="filters-btn"
        className="inline-flex items-center gap-2 rounded-full border border-stone-300 px-4 py-2 text-sm font-medium transition hover:border-ink lg:hidden"
      >
        <SlidersHorizontal className="size-4" />

        Filters

        {count > 0 && (
          <span className="grid size-5 place-items-center rounded-full bg-ink text-[10px] font-semibold text-paper">
            {count}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">

          <button
            aria-label="Close filters"
            className="absolute inset-0 bg-ink/40"
            onClick={() => setOpen(false)}
          />

          <div className="absolute inset-y-0 left-0 flex w-80 max-w-[85vw] flex-col bg-paper shadow-xl">

            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
              <span className="font-medium">Filters</span>

              <button
                onClick={() => setOpen(false)}
                aria-label="Close filters"
                className="grid size-9 place-items-center rounded-full hover:bg-stone-100"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Filter content */}
            <div className="flex-1 overflow-y-auto px-5 py-6">
              <FilterPanel facets={facets} />
            </div>

            {/* Show results */}
            <div className="border-t border-stone-200 p-4">
              <button
                onClick={() => setOpen(false)}
                className="w-full rounded-full bg-ink py-2.5 text-sm font-medium text-paper transition hover:bg-stone-800"
              >
                Show Results
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
