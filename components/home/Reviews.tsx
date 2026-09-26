import { Stars } from "@/components/Stars";

const REVIEWS = [
  {
    name: "Ananya S.",
    location: "Mumbai",
    rating: 5,
    quote: "The oxford shirt is my new uniform — the fabric feels twice the price.",
  },
  {
    name: "Rahul M.",
    location: "Bengaluru",
    rating: 5,
    quote: "Ordered Monday, delivered Wednesday. The jeans fit exactly as the size guide said.",
  },
  {
    name: "Priya K.",
    location: "Delhi",
    rating: 4,
    quote: "Returned one size, kept another — refund hit my account in two days.",
  },
];

export function Reviews() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <h2 className="font-display text-2xl font-semibold sm:text-3xl">What customers say</h2>
      <div className="mt-8 grid gap-8 md:grid-cols-3">
        {REVIEWS.map((r) => (
          <figure key={r.name}>
            <Stars value={r.rating} />
            <blockquote className="mt-3 text-[15px] leading-relaxed text-stone-700">
              “{r.quote}”
            </blockquote>
            <figcaption className="mt-3 text-xs text-stone-500">
              {r.name} · {r.location}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}