"use client";

import { useShopFilters } from "./use-shop-filters";
import type { ShopFacets } from "@/types";

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Chip({ active, onClick, children }: {
  active: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
        active ? "border-ink bg-ink text-paper" : "border-stone-300 text-stone-700 hover:border-ink"
      }`}
    >
      {children}
    </button>
  );
}

export function FilterPanel({ facets }: { facets: ShopFacets }) {
  const { searchParams, setParam, setParams, toggleMulti } = useShopFilters();
  const category = searchParams.get("category");
  const sizes = (searchParams.get("size") ?? "").split(",").filter(Boolean);
  const colors = (searchParams.get("color") ?? "").split(",").filter(Boolean);
  const rating = searchParams.get("rating");
  const sale = searchParams.get("sale") === "true";
  const minRupees = searchParams.get("min") ?? "";
  const maxRupees = searchParams.get("max") ?? "";

  return (
    <div className="space-y-8">
      <Group title="Offers">
        <Chip active={sale} onClick={() => setParam("sale", sale ? null : "true")}>
          On sale
        </Chip>
      </Group>

      <Group title="Category">
        <ul className="space-y-0.5">
          <li>
            <button
              type="button"
              aria-pressed={!category}
              onClick={() => setParam("category", null)}
              className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm transition ${
                !category ? "bg-ink text-paper" : "hover:bg-stone-100"
              }`}
            >
              All Products
            </button>
          </li>
          {facets.categories.map((c) => (
            <li key={c.slug} style={{ paddingLeft: c.depth * 0.9 }}>
              <button
                type="button"
                aria-pressed={category === c.slug}
                onClick={() => setParam("category", category === c.slug ? null : c.slug)}
                className={`flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm transition ${
                  category === c.slug ? "bg-ink text-paper" : "hover:bg-stone-100"
                }`}
              >
                <span className="truncate">{c.name}</span>
                <span className="text-xs opacity-60">{c.count}</span>
              </button>
            </li>
          ))}
        </ul>
      </Group>

      {/* URL stores rupees — inputs match, server converts to paise */}
      <Group title="Price (₹)">
        <form
          key={`${minRupees}-${maxRupees}`} /* remount when URL changes elsewhere (e.g. chip removed) */
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            setParams({
              min: String(f.get("min") ?? "") || null,
              max: String(f.get("max") ?? "") || null,
            });
          }}
          className="flex items-center gap-2"
        >
          <input
            type="number" name="min" min={0} placeholder="Min" defaultValue={minRupees}
            aria-label="Minimum price in rupees"
            className="w-full min-w-0 rounded-lg border border-stone-300 px-2.5 py-1.5 text-sm outline-none focus:border-ink"
          />
          <span className="text-stone-400">–</span>
          <input
            type="number" name="max" min={0} placeholder="Max" defaultValue={maxRupees}
            aria-label="Maximum price in rupees"
            className="w-full min-w-0 rounded-lg border border-stone-300 px-2.5 py-1.5 text-sm outline-none focus:border-ink"
          />
          <button
            type="submit"
            className="shrink-0 rounded-lg border border-stone-300 px-3 py-1.5 text-sm transition hover:border-ink"
          >
            Go
          </button>
        </form>
      </Group>

      {facets.sizes.length > 0 && (
        <Group title="Size">
          <div className="flex flex-wrap gap-2">
            {facets.sizes.map((s) => (
              <Chip key={s} active={sizes.includes(s)} onClick={() => toggleMulti("size", s)}>
                {s}
              </Chip>
            ))}
          </div>
        </Group>
      )}

      {facets.colors.length > 0 && (
        <Group title="Color">
          <div className="flex flex-wrap gap-2">
            {facets.colors.map((c) => (
              <Chip key={c} active={colors.includes(c)} onClick={() => toggleMulti("color", c)}>
                {c}
              </Chip>
            ))}
          </div>
        </Group>
      )}

      <Group title="Rating">
        <div className="flex flex-wrap gap-2">
          <Chip active={rating === "4"} onClick={() => setParam("rating", rating === "4" ? null : "4")}>
            4★ & up
          </Chip>
          <Chip active={rating === "3"} onClick={() => setParam("rating", rating === "3" ? null : "3")}>
            3★ & up
          </Chip>
        </div>
      </Group>
    </div>
  );
}