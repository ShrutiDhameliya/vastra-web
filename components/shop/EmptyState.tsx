import Link from "next/link";
import { PackageSearch } from "lucide-react";

export function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center py-24 text-center">
      <PackageSearch className="size-10 text-stone-400" />
      <h2 className="mt-4 font-display text-xl font-semibold">
        {hasFilters ? "No products match" : "No products yet"}
      </h2>
      <p className="mt-2 max-w-sm text-sm text-stone-500">
        {hasFilters
          ? "Try removing some filters or searching for something else."
          : "Check back soon — new arrivals land every week."}
      </p>
      {hasFilters && (
        <Link
          href="/shop"
          className="mt-6 rounded-full border border-ink px-6 py-2.5 text-sm font-medium transition hover:bg-ink hover:text-paper"
        >
          Clear all filters
        </Link>
      )}
    </div>
  );
}