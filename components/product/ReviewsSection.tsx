import { Stars } from "@/components/Stars";
import type { DetailProduct } from "@/types";

export function ReviewsSection({
  ratingAvg,
  reviewCount,
  reviews,
  form,
}: {
  ratingAvg: number | null;
  reviewCount: number;
  reviews: DetailProduct["reviews"];
  form?: React.ReactNode;
}) {
  return (
    <section id="reviews" className="mt-16 scroll-mt-24">
      <h2 className="font-display text-2xl font-semibold">
        Ratings &amp; Reviews
      </h2>

      {reviews.length === 0 ? (
        <p className="mt-4 text-sm text-stone-500">
          No reviews yet — they&apos;ll appear here once customers start
          writing.
        </p>
      ) : (
        <>
          <div className="mt-6 grid gap-8 rounded-xl border border-stone-200 bg-white p-6 sm:grid-cols-[auto_1fr] sm:items-center sm:gap-12">
            <div className="text-center sm:text-left">
              <p className="font-display text-4xl font-semibold">
                {(ratingAvg ?? 0).toFixed(1)}
              </p>

              <div className="mt-1.5 flex justify-center sm:justify-start">
                <Stars value={ratingAvg ?? 0} />
              </div>

              <p className="mt-1 text-sm text-stone-500">
                {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
              </p>
            </div>

            <div className="space-y-1.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const n = reviews.filter((r) => r.rating === star).length;
                const pct = Math.round((n / reviews.length) * 100);

                return (
                  <div
                    key={star}
                    className="flex items-center gap-3 text-sm"
                  >
                    <span className="w-6 text-right tabular-nums text-stone-500">
                      {star}★
                    </span>

                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-stone-200">
                      <div
                        className="h-full rounded-full bg-ink"
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <span className="w-6 text-right tabular-nums text-stone-500">
                      {n}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {form}

          <ul className="mt-8 divide-y divide-stone-200">
            {reviews.map((r) => (
              <li key={r.id} className="py-6">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-stone-200 text-xs font-semibold uppercase">
                    {r.userName
                      .split(" ")
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join("")}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {r.userName}

                      {r.verifiedPurchase && (
                        <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-800">
                          VERIFIED PURCHASE
                        </span>
                      )}
                    </p>

                    <p className="text-xs text-stone-500">
                      {new Date(r.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  <div className="ml-auto">
                    <Stars value={r.rating} />
                  </div>
                </div>

                {r.title && (
                  <p className="mt-3 text-sm font-semibold">{r.title}</p>
                )}

                <p className="mt-1 text-sm leading-relaxed text-stone-600">
                  {r.comment}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
