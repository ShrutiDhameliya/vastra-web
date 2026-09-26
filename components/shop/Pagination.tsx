import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

function pageHref(params: Record<string, string>, page: number) {
  const sp = new URLSearchParams(params);
  if (page <= 1) sp.delete("page");
  else sp.set("page", String(page));
  const qs = sp.toString();
  return qs ? `/shop?${qs}` : "/shop";
}

function pageList(page: number, pageCount: number): (number | "gap")[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);
  const wanted = new Set([1, 2, pageCount - 1, pageCount, page - 1, page, page + 1]);
  const nums = [...wanted].filter((n) => n >= 1 && n <= pageCount).sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  let prev = 0;
  for (const n of nums) {
    if (n - prev > 1) out.push("gap");
    out.push(n);
    prev = n;
  }
  return out;
}

export function Pagination({
  page, pageCount, params,
}: { page: number; pageCount: number; params: Record<string, string> }) {
  if (pageCount <= 1) return null;

  const btn = "grid size-9 place-items-center rounded-full border transition";
  const enabled = `${btn} border-stone-300 hover:border-ink`;

  return (
    <nav aria-label="Pagination" className="mt-14 flex flex-wrap items-center justify-center gap-1.5">
      {page > 1 ? (
        <Link href={pageHref(params, page - 1)} aria-label="Previous page" className={enabled}>
          <ChevronLeft className="size-4" />
        </Link>
      ) : (
        <span className={`${btn} border-stone-200 text-stone-300`} aria-hidden>
          <ChevronLeft className="size-4" />
        </span>
      )}

      {pageList(page, pageCount).map((p, i) =>
        p === "gap" ? (
          <span key={`gap-${i}`} className="px-1 text-stone-400">…</span>
        ) : (
          <Link
            key={p}
            href={pageHref(params, p)}
            aria-current={p === page ? "page" : undefined}
            className={
              p === page
                ? "grid size-9 place-items-center rounded-full bg-ink text-sm font-semibold text-paper"
                : `${enabled} text-sm`
            }
          >
            {p}
          </Link>
        )
      )}

      {page < pageCount ? (
        <Link href={pageHref(params, page + 1)} aria-label="Next page" className={enabled}>
          <ChevronRight className="size-4" />
        </Link>
      ) : (
        <span className={`${btn} border-stone-200 text-stone-300`} aria-hidden>
          <ChevronRight className="size-4" />
        </span>
      )}
    </nav>
  );
}