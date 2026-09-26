import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getShopData, parseShopQuery } from "@/lib/queries";
import { ProductGrid } from "@/components/ProductGrid";
import { FilterPanel } from "@/components/shop/FilterPanel";
import { MobileFilters } from "@/components/shop/MobileFilters";
import { ActiveFilters } from "@/components/shop/ActiveFilters";
import { SortSelect } from "@/components/shop/SortSelect";
import { Pagination } from "@/components/shop/Pagination";
import { EmptyState } from "@/components/shop/EmptyState";

type SearchParams = Record<string, string | string[] | undefined>;

// Next 15: params/searchParams are Promises — must await.
// (On Next 14, drop both `await`s.)
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const query = parseShopQuery(flatten(await searchParams));

  let title = "Shop All";

  if (query.q) {
    title = `Search: ${query.q}`;
  } else if (query.categorySlug) {
    const c = await prisma.category.findUnique({
      where: { slug: query.categorySlug },
      select: { name: true },
    });

    if (c) title = `${c.name} — Shop`;
  }

  return {
    title,
    description:
      "Browse the full Vastra collection — filter by category, size, color, price and rating.",
  };
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const flat = flatten(await searchParams);
  const query = parseShopQuery(flat);
  const data = await getShopData(query);

  const hasFilters = Boolean(
    query.q ||
    query.categorySlug ||
    query.sizes.length ||
    query.colors.length ||
    query.minPrice != null ||
    query.maxPrice != null ||
    query.rating ||
    query.saleOnly
  );

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <header className="border-b border-stone-200 py-8">
        <h1 className="font-display text-3xl font-semibold sm:text-4xl">
          {query.q
            ? `Search: “${query.q}”`
            : data.category
              ? data.category.name
              : "Shop All"}
        </h1>

        <p className="mt-2 text-sm text-stone-500">
          {data.total} {data.total === 1 ? "product" : "products"}
        </p>
      </header>

      <div className="mt-8 grid gap-10 lg:grid-cols-[250px_1fr]">

        {/* Desktop filters */}
        <aside data-tour="filters" className="hidden lg:block">
          <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pb-4 pr-3">
            <FilterPanel facets={data.facets} />
          </div>
        </aside>

        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <MobileFilters facets={data.facets} />

            <div className="ml-auto">
              <SortSelect />
            </div>
          </div>

          <ActiveFilters facets={data.facets} />

          {data.products.length === 0 ? (
            <EmptyState hasFilters={hasFilters} />
          ) : (
            <>
              {/* Products grid */}
              <div data-tour="shop-grid" className="mt-6">
                <ProductGrid products={data.products} />
              </div>

              <Pagination
                page={query.page}
                pageCount={data.pageCount}
                params={flat}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/** Keep first value if a param repeats; drop empties. */
function flatten(sp: SearchParams): Record<string, string> {
  const out: Record<string, string> = {};

  for (const [k, v] of Object.entries(sp)) {
    const val = Array.isArray(v) ? v[0] : v;

    if (val != null && val !== "") {
      out[k] = val;
    }
  }

  return out;
}
