import Link from "next/link";

export function PromoBanner() {
  return (
    <section className="bg-ink text-paper">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 py-14 text-center sm:px-6 md:flex-row md:justify-between md:text-left">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-stone-400">Limited time</p>
          <h2 className="mt-2 font-display text-3xl sm:text-4xl">Summer Sale — up to 50% off</h2>
        </div>
        <Link
          href="/shop?sale=true"
          className="rounded-full bg-paper px-7 py-3 text-sm font-semibold text-ink transition hover:bg-white"
        >
          Shop Sale
        </Link>
      </div>
    </section>
  );
}