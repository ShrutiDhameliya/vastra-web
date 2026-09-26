"use client";

import { useShopFilters } from "./use-shop-filters";

export function SortSelect() {
  const { searchParams, setParam } = useShopFilters();

  return (
    <label data-tour="sort" className="flex items-center gap-2 text-sm">
      <span className="hidden text-stone-500 sm:inline">Sort</span>
      <select
        value={searchParams.get("sort") ?? "featured"}
        onChange={(e) => setParam("sort", e.target.value === "featured" ? null : e.target.value)}
        className="rounded-full border border-stone-300 bg-white px-3 py-2 outline-none transition hover:border-ink focus:border-ink"
      >
        <option value="featured">Featured</option>
        <option value="new">Newest</option>
        <option value="price-asc">Price: Low to High</option>
        <option value="price-desc">Price: High to Low</option>
        <option value="rating">Top Rated</option>
      </select>
    </label>
  );
}