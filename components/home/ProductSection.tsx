import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductGrid } from "@/components/ProductGrid";
import type { CardProduct } from "@/types";

export function ProductSection({ title, subtitle, products, viewAllHref, tourId }: {
  title: string; subtitle?: string; products: CardProduct[]; viewAllHref: string; tourId?: string;
}) {
  if (products.length === 0) return null;
  return (
    <section data-tour={tourId} className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-stone-500">{subtitle}</p>}
        </div>
        <Link
          href={viewAllHref}
          className="inline-flex shrink-0 items-center gap-1 pb-1 text-sm font-medium text-stone-600 hover:text-ink"
        >
          View all <ArrowRight className="size-4" />
        </Link>
      </div>
      <div className="mt-6">
        <ProductGrid products={products} />
      </div>
    </section>
  );
}