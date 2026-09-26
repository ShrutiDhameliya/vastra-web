"use client";

import { X } from "lucide-react";
import { useShopFilters } from "./use-shop-filters";
import type { ShopFacets } from "@/types";

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-stone-200/70 px-3 py-1 text-xs font-medium">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove filter: ${label}`}
        className="grid size-4 place-items-center rounded-full transition hover:bg-stone-300"
      >
        <X className="size-3" />
      </button>
    </span>
  );
}

export function ActiveFilters({ facets }: { facets: ShopFacets }) {
  const { searchParams, setParams, toggleMulti, clearAll } = useShopFilters();

  const q = searchParams.get("q");
  const category = searchParams.get("category");
  const sizes = (searchParams.get("size") ?? "").split(",").filter(Boolean);
  const colors = (searchParams.get("color") ?? "").split(",").filter(Boolean);
  const rating = searchParams.get("rating");
  const sale = searchParams.get("sale") === "true";
  const min = searchParams.get("min");
  const max = searchParams.get("max");

  const rupee = (v: string) => `₹${Number(v).toLocaleString("en-IN")}`;
  const priceLabel = min && max ? `${rupee(min)} – ${rupee(max)}` : min ? `${rupee(min)} +` : `Under ${rupee(max!)}`;

  const chips: { key: string; label: string; onRemove: () => void }[] = [];
  if (q) chips.push({ key: "q", label: `“${q}”`, onRemove: () => setParams({ q: null }) });
  if (category) {
    const name = facets.categories.find((c) => c.slug === category)?.name ?? category;
    chips.push({ key: "cat", label: name, onRemove: () => setParams({ category: null }) });
  }
  for (const s of sizes) chips.push({ key: `size-${s}`, label: s, onRemove: () => toggleMulti("size", s) });
  for (const c of colors) chips.push({ key: `color-${c}`, label: c, onRemove: () => toggleMulti("color", c) });
  if (min || max) chips.push({ key: "price", label: priceLabel, onRemove: () => setParams({ min: null, max: null }) });
  if (rating) chips.push({ key: "rating", label: `${rating}★ & up`, onRemove: () => setParams({ rating: null }) });
  if (sale) chips.push({ key: "sale", label: "On sale", onRemove: () => setParams({ sale: null }) });

  if (chips.length === 0) return null;

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      {chips.map((c) => (
        <FilterChip key={c.key} label={c.label} onRemove={c.onRemove} />
      ))}
      <button
        onClick={clearAll}
        className="inline-flex items-center gap-1 text-xs font-medium text-stone-500 transition hover:text-ink"
      >
        <X className="size-3.5" /> Clear all
      </button>
    </div>
  );
}