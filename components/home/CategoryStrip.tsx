import Image from "next/image";
import Link from "next/link";

type CategoryLink = { name: string; slug: string; imageUrl: string | null };

export function CategoryStrip({ categories }: { categories: CategoryLink[] }) {
  if (categories.length === 0) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <h2 className="font-display text-2xl font-semibold sm:text-3xl">Shop by Category</h2>
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4 sm:gap-5">
        {categories.map((c) => (
          <Link
            key={c.slug}
            href={`/shop?category=${c.slug}`}
            className="group relative aspect-[4/5] overflow-hidden rounded-lg bg-stone-100"
          >
            {c.imageUrl && (
              <Image
                src={c.imageUrl}
                alt={c.name}
                fill
                sizes="(min-width: 768px) 25vw, 50vw"
                className="object-cover transition duration-500 group-hover:scale-105"
              />
            )}
            <div className="absolute inset-x-0 bottom-0 bg-ink/60 p-3 backdrop-blur-sm">
              <span className="text-sm font-medium text-white">{c.name}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}