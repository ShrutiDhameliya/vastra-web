import Image from "next/image";
import Link from "next/link";

export function Hero() {
  return (
    <section data-tour="hero" className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-2 lg:gap-14 lg:pt-20">
      <div className="max-w-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
          New Collection · Autumn 2025
        </p>
        <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.05] sm:text-5xl lg:text-6xl">
          Everyday essentials, refined for modern living.
        </h1>
        <p className="mt-5 text-stone-600">
          Considered materials, honest prices, and pieces that earn their place in
          your wardrobe. Free shipping over ₹1,999.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/shop"
            className="rounded-full bg-ink px-7 py-3 text-sm font-medium text-paper transition hover:bg-stone-800"
          >
            Shop Now
          </Link>
          <Link
            href="/shop?sale=true"
            className="rounded-full border border-stone-300 px-7 py-3 text-sm font-medium transition hover:border-ink"
          >
            Explore Sale
          </Link>
        </div>
      </div>
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-stone-100 lg:aspect-[5/4]">
        <Image
          src="https://picsum.photos/seed/vastra-hero/1200/960"
          alt="Model wearing pieces from the new collection"
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
        />
      </div>
    </section>
  );
}