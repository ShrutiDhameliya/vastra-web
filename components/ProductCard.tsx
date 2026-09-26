"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, Heart, ShoppingBag } from "lucide-react";
import { formatPaise } from "@/lib/money";
import { useCartStore } from "@/lib/cart-store";
import { useWishlistStore } from "@/lib/wishlist-store";
import { Stars } from "@/components/Stars";
import type { CardProduct } from "@/types";

export function ProductCard({ product }: { product: CardProduct }) {
  const [justAdded, setJustAdded] = useState(false);
  // Guard against hydration mismatch — persisted store state isn't
  // available during SSR, so render the neutral state until mounted.
  const [mounted, setMounted] = useState(false);
  const add = useCartStore((s) => s.add);
  const wished = useWishlistStore((s) => s.productIds.includes(product.id));
  const toggleWishlist = useWishlistStore((s) => s.toggle);

  useEffect(() => setMounted(true), []);

const discount =
  product.discountPercent > 0 ? product.discountPercent : null;

  function handleAddToCart() {
    if (!product.defaultVariantId) return;
    add({
      productId: product.id,
      variantId: product.defaultVariantId,
      slug: product.slug,
      name: product.name,
      variantLabel: product.defaultVariantLabel,
      imageUrl: product.images[0]?.url ?? "",
      unitPrice: product.price,
      maxQty: product.maxQty,
    });
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1400);
  }

  return (
    <article className="group flex flex-col">
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-stone-100">
        {product.images.slice(0, 2).map((image, i) => (
          <Image
            key={image.url}
            src={image.url}
            alt={i === 0 ? image.alt ?? product.name : ""}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
            className={`object-cover transition-all duration-500 group-hover:scale-[1.03] ${
              i > 0 ? "opacity-0 group-hover:opacity-100" : ""
            }`}
          />
        ))}

        {/* Overlay link sits above images, below the buttons */}
        <Link href={`/products/${product.slug}`} className="absolute inset-0" aria-label={product.name} />

        {discount !== null && (
          <span className="absolute left-3 top-3 z-10 rounded-full bg-sale px-2.5 py-0.5 text-xs font-semibold text-white">
            {discount}% off
          </span>
        )}

        <button
          type="button"
          onClick={() => toggleWishlist(product.id)}
          aria-pressed={wished}
          aria-label={wished ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          className="absolute right-3 top-3 z-10 grid size-9 place-items-center rounded-full bg-white/90 shadow-sm transition hover:scale-105"
        >
          <Heart
            className={`size-4 transition ${
              mounted && wished ? "fill-sale text-sale" : "text-stone-600"
            }`}
          />
        </button>

        {!product.inStock && (
          <span className="absolute inset-x-3 bottom-3 z-10 rounded-md bg-ink/85 py-1.5 text-center text-xs font-medium text-paper">
            Out of stock
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col pt-3">
        {product.brand && (
          <span className="text-[11px] font-medium uppercase tracking-wider text-stone-500">
            {product.brand}
          </span>
        )}
        <Link
          href={`/products/${product.slug}`}
          className="mt-0.5 text-sm font-medium leading-snug underline-offset-2 hover:underline"
        >
          {product.name}
        </Link>

        {product.reviewCount > 0 && product.rating !== null && (
          <div className="mt-1 flex items-center gap-1.5 text-xs text-stone-500">
            <Stars value={product.rating} />
            <span>
              {product.rating.toFixed(1)} ({product.reviewCount})
            </span>
          </div>
        )}

        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="text-[15px] font-semibold">{formatPaise(product.price)}</span>
          {product.mrp && product.mrp > product.price && (
            <span className="text-sm text-stone-400 line-through">{formatPaise(product.mrp)}</span>
          )}
        </div>

        {product.defaultVariantId ? (
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!product.inStock}
            className="mt-3 inline-flex items-center justify-center gap-2 rounded-full border border-ink px-4 py-2 text-sm font-medium transition-colors hover:bg-ink hover:text-paper disabled:cursor-not-allowed disabled:opacity-40"
          >
            {justAdded ? <Check className="size-4" /> : <ShoppingBag className="size-4" />}
            {justAdded ? "Added to cart" : "Add to Cart"}
          </button>
        ) : (
          <Link
            href={`/products/${product.slug}`}
            className="mt-3 inline-flex items-center justify-center rounded-full border border-ink px-4 py-2 text-sm font-medium transition-colors hover:bg-ink hover:text-paper"
          >
            Select Options
          </Link>
        )}
      </div>
    </article>
  );
}