import { Prisma } from "@/src/generated/prisma/client";
import { prisma } from "./db";
import type { CardProduct, DetailProduct, ParsedShopQuery, ShopFacets, ShopSort } from "@/types";
import { sortSizes } from "./sizes";
import { cache } from "react";

const productInclude = {
  images: true,
  variants: true,
} satisfies Prisma.ProductInclude;

type DbProduct = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

function toCardProduct(p: DbProduct): CardProduct {
  const firstInStock = p.variants.find((v) => v.stock > 0);
  const singleVariant = p.variants.length === 1;
  const solo = singleVariant ? p.variants[0] : null;
  const label = (v: DbProduct["variants"][number]) =>
    [v.color, v.size].filter(Boolean).join(" · ") || null;

  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    brand: p.brand,
    price: solo?.price ?? p.price,
    mrp: p.mrp,
    discountPercent: p.discountPercent,
    rating: p.ratingAvg,
    reviewCount: p.reviewCount,
    images: p.images.map((i) => ({ url: i.url, alt: i.altText })),
    inStock: p.variants.some((v) => v.stock > 0),
    defaultVariantId: singleVariant ? (firstInStock?.id ?? null) : null,
    defaultVariantLabel: singleVariant ? (firstInStock ? label(firstInStock) : null) : null,
    maxQty: singleVariant ? (firstInStock?.stock ?? 0) : 0,
  };
}

/** Card data for arbitrary ids — order follows the input, so wishlist
 *  order (added-first) survives the round trip. */
export async function getCardProducts(ids: string[]): Promise<CardProduct[]> {
  if (ids.length === 0) return [];
  const products = await prisma.product.findMany({
    where: { id: { in: ids }, isArchived: false },
    include: productInclude,
  });
  const byId = new Map(products.map((p) => [p.id, toCardProduct(p)]));
  return ids.flatMap((id) => {
    const card = byId.get(id);
    return card ? [card] : []; // archived/deleted ids silently drop out
  });
}

export async function getHomeData() {
  const [categories, featured, newArrivals] = await Promise.all([
    prisma.category.findMany({
      where: { parentId: null },
      orderBy: { name: "asc" },
      take: 4,
      select: { name: true, slug: true, imageUrl: true },
    }),
    prisma.product.findMany({
      where: { isFeatured: true, isArchived: false },
      include: productInclude,
      take: 8,
    }),
    prisma.product.findMany({
      where: { isArchived: false },
      orderBy: { createdAt: "desc" },
      include: productInclude,
      take: 4,
    }),
  ]);

  return {
    categories,
    featured: featured.map(toCardProduct),
    newArrivals: newArrivals.map(toCardProduct),
  };
}


// ─── Shop: parsing, filtering, facets, pagination ────────────

const PAGE_SIZE = 12;

const SHOP_SORTS: Record<ShopSort, Prisma.ProductOrderByWithRelationInput[]> = {
  featured: [{ isFeatured: "desc" }, { createdAt: "desc" }],
  new: [{ createdAt: "desc" }],
  "price-asc": [{ price: "asc" }],
  "price-desc": [{ price: "desc" }],
  // nulls: "last" matters — Postgres sorts NULLS FIRST on DESC,
  // which would float unreviewed products to the top of "Top Rated".
  rating: [{ ratingAvg: { sort: "desc", nulls: "last" } }, { reviewCount: "desc" }],
};

/** URL → typed query. URL price params are RUPEES (human-shareable); DB stores paise. */
export function parseShopQuery(sp: Record<string, string>): ParsedShopQuery {
  const get = (k: string) => sp[k] ?? "";
  const rupeesToPaise = (k: string) => {
    const n = Number(get(k));
    return Number.isFinite(n) && n > 0 && n <= 10_000_000 ? Math.round(n * 100) : null;
  };
  let minPrice = rupeesToPaise("min");
  let maxPrice = rupeesToPaise("max");
  if (minPrice != null && maxPrice != null && minPrice > maxPrice)
    [minPrice, maxPrice] = [maxPrice, minPrice]; // tolerate swapped inputs
  const rating = Number(get("rating"));
  const sort = get("sort") as ShopSort;
  const page = Number(get("page"));
  return {
    q: get("q").trim() || null,
    categorySlug: get("category") || null,
    sizes: get("size").split(",").filter(Boolean),   // comma-joined multi-select
    colors: get("color").split(",").filter(Boolean), // (safe: values never contain commas)
    minPrice,
    maxPrice,
    rating: rating === 4 || rating === 3 ? rating : null,
    saleOnly: get("sale") === "true",
    sort: sort in SHOP_SORTS ? sort : "featured",
    page: Number.isInteger(page) && page >= 1 ? Math.trunc(page) : 1,
  };
}

/** Multi-word search: every term must match SOME field (AND of ORs). "black shoes" →
 *  a product matching "black" in color-ish text and "shoes" in name/category — not
 *  the literal string "black shoes". Good enough until tsvector/full-text later. */
function searchClause(q: string | null): Prisma.ProductWhereInput[] | undefined {
  const terms = (q ?? "").split(/\s+/).filter(Boolean);
  if (terms.length === 0) return undefined;
  return terms.map((t) => ({
    OR: [
      { name: { contains: t, mode: "insensitive" } },
      { description: { contains: t, mode: "insensitive" } },
      { brand: { contains: t, mode: "insensitive" } },
      { category: { name: { contains: t, mode: "insensitive" } } },
    ],
  }));
}

function baseWhere(query: ParsedShopQuery, categoryIds: string[] | null): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = { isArchived: false };
  const search = searchClause(query.q);
  if (search) where.AND = search;
  if (categoryIds) where.categoryId = { in: categoryIds };
  return where;
}

function buildProductWhere(query: ParsedShopQuery, categoryIds: string[] | null) {
  const where = baseWhere(query, categoryIds);

  if (query.minPrice != null || query.maxPrice != null) {
    where.price = {
      ...(query.minPrice != null ? { gte: query.minPrice } : {}),
      ...(query.maxPrice != null ? { lte: query.maxPrice } : {}),
    };
  }

  // Size + color intersect at the VARIANT level when both are set:
  // "Black" + "M" requires one variant that is Black AND M — a product
  // with Black-L and White-M does NOT match. That's the correct semantic.
  // stock > 0: filtering by a size that's sold out everywhere is noise.
  if (query.sizes.length && query.colors.length) {
    where.variants = {
      some: { AND: [{ size: { in: query.sizes } }, { color: { in: query.colors } }, { stock: { gt: 0 } }] },
    };
  } else if (query.sizes.length) {
    where.variants = { some: { size: { in: query.sizes }, stock: { gt: 0 } } };
  } else if (query.colors.length) {
    where.variants = { some: { color: { in: query.colors }, stock: { gt: 0 } } };
  }

  if (query.rating != null) where.ratingAvg = { gte: query.rating }; // nulls fail gte → unreivewed excluded, correct
  if (query.saleOnly) where.discountPercent = { gt: 0 };
  return where;
}

/** Letters in apparel order, numbers ascending ("6" before "10"), unknown last. */
// const LETTER_SIZES = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "2XL", "3XL", "4XL"];
// function sortSizes(sizes: string[]): string[] {
//   return [...sizes].sort((a, b) => {
//     const ai = LETTER_SIZES.indexOf(a);
//     const bi = LETTER_SIZES.indexOf(b);
//     if (ai !== -1 && bi !== -1) return ai - bi;
//     if (ai !== -1) return -1;
//     if (bi !== -1) return 1;
//     const an = Number(a);
//     const bn = Number(b);
//     if (Number.isFinite(an) && Number.isFinite(bn)) return an - bn;
//     if (Number.isFinite(an)) return -1;
//     if (Number.isFinite(bn)) return 1;
//     return a.localeCompare(b);
//   });
// }

export async function getShopData(query: ParsedShopQuery) {
  const allCategories = await prisma.category.findMany({
    select: { id: true, name: true, slug: true, parentId: true },
    orderBy: { name: "asc" },
  });

  // Resolve selected category → itself + all descendants (browsing "Men"
  // must include Men → Shirts). Categories are few; BFS in JS is fine.
  let categoryIds: string[] | null = null;
  let selectedCategory: { name: string; slug: string } | null = null;
  if (query.categorySlug) {
    const target = allCategories.find((c) => c.slug === query.categorySlug);
    if (target) {
      selectedCategory = { name: target.name, slug: target.slug };
      const ids = [target.id];
      let frontier = [target.id];
      while (frontier.length) {
        const next = allCategories
          .filter((c) => c.parentId && frontier.includes(c.parentId))
          .map((c) => c.id);
        ids.push(...next);
        frontier = next;
      }
      categoryIds = ids;
    } else {
      categoryIds = []; // unknown slug → visible empty state, not silently ignored
    }
  }

  const where = buildProductWhere(query, categoryIds);
  // Facet options respect search + category (don't offer dress sizes while
  // browsing shoes) but NOT each other — full faceted intersection is a later upgrade.
  const facetWhere = baseWhere(query, categoryIds);

  const [total, products, countRows, sizeRows, colorRows] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: SHOP_SORTS[query.sort],
      skip: (query.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: productInclude,
    }),
    prisma.product.groupBy({ by: ["categoryId"], where: facetWhere, _count: { _all: true } }),
    prisma.productVariant.findMany({
      where: { product: facetWhere, size: { not: "" } },
      distinct: ["size"],
      select: { size: true },
    }),
    prisma.productVariant.findMany({
      where: { product: facetWhere, color: { not: "" } },
      distinct: ["color"],
      select: { color: true },
    }),
  ]);

  const countByCategory = new Map(countRows.map((r) => [r.categoryId, r._count._all]));

  // Flatten the tree for the sidebar (indented children)
  const byParent = new Map<string | null, typeof allCategories>();
  for (const c of allCategories) {
    byParent.set(c.parentId ?? null, [...(byParent.get(c.parentId ?? null) ?? []), c]);
  }
  const categories: ShopFacets["categories"] = [];
  const walk = (parent: string | null, depth: number) => {
    for (const c of byParent.get(parent) ?? []) {
      categories.push({ slug: c.slug, name: c.name, count: countByCategory.get(c.id) ?? 0, depth });
      walk(c.id, depth + 1);
    }
  };
  walk(null, 0);

  return {
    products: products.map(toCardProduct),
    total,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    facets: {
      categories,
      sizes: sortSizes(sizeRows.map((r) => r.size)),
      colors: colorRows.map((r) => r.color).sort((a, b) => a.localeCompare(b)),
    } satisfies ShopFacets,
    category: selectedCategory,
  };
}

export const getProductBySlug = cache(
  async (slug: string): Promise<DetailProduct | null> => {
    const p = await prisma.product.findUnique({
      where: { slug },
      include: {
        images: { orderBy: { position: "asc" } },
        variants: { orderBy: [{ color: "asc" }, { size: "asc" }] },
        category: { select: { name: true, slug: true } },
        reviews: {
          where: { isApproved: true },
          orderBy: { createdAt: "desc" },
          include: { user: { select: { name: true } } },
        },
      },
    });
    if (!p || p.isArchived) return null;
    return {
      id: p.id,
      categoryId: p.categoryId,
      name: p.name,
      slug: p.slug,
      brand: p.brand,
      description: p.description,
      price: p.price,
      mrp: p.mrp,
      discountPercent: p.discountPercent,
      ratingAvg: p.ratingAvg,
      reviewCount: p.reviewCount,
      category: p.category,
      images: p.images.map((i) => ({ url: i.url, alt: i.altText })),
      variants: p.variants.map((v) => ({
        id: v.id, color: v.color, size: v.size, stock: v.stock, price: v.price,
      })),
      reviews: p.reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        createdAt: r.createdAt.toISOString(),
        userName: r.user.name,
        verifiedPurchase: r.verifiedPurchase,
      })),
    };
  }
);

/** Same category first; top up from other categories (best rated) so the
 *  section is never thin — "Shoes" has only one product, after all. */
export async function getRelatedProducts(categoryId: string, excludeId: string): Promise<CardProduct[]> {
  const same = await prisma.product.findMany({
    where: { categoryId, isArchived: false, id: { not: excludeId } },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    take: 4,
    include: productInclude,
  });
  let fill: DbProduct[] = [];
  if (same.length < 4) {
    fill = await prisma.product.findMany({
      where: {
        isArchived: false,
        categoryId: { not: categoryId },
        id: { notIn: [excludeId, ...same.map((p) => p.id)] },
      },
      orderBy: [{ ratingAvg: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
      take: 4 - same.length,
      include: productInclude,
    });
  }
  return [...same, ...fill].map(toCardProduct);
}