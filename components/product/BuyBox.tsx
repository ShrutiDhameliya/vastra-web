"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Check, Heart, Minus, Plus, ShoppingBag, Zap } from "lucide-react";
import { formatPaise } from "@/lib/money";
import { sortSizes } from "@/lib/sizes";
import { useCartStore } from "@/lib/cart-store";
import { useWishlistStore } from "@/lib/wishlist-store";
import type { DetailProduct } from "@/types";

function Chip({ active, disabled, onClick, children }: {
  active: boolean; disabled?: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      title={disabled ? "Sold out" : undefined}
      onClick={onClick}
      className={`min-w-11 rounded-full border px-3.5 py-2 text-sm font-medium transition ${
        active
          ? "border-ink bg-ink text-paper"
          : disabled
            ? "cursor-not-allowed border-stone-200 text-stone-300 line-through"
            : "border-stone-300 text-stone-700 hover:border-ink"
      }`}
    >
      {children}
    </button>
  );
}

export function BuyBox({ product }: { product: DetailProduct }) {
  const router = useRouter();
  const add = useCartStore((s) => s.add);
  const wished = useWishlistStore((s) => s.productIds.includes(product.id));
  const toggleWishlist = useWishlistStore((s) => s.toggle);

  const colors = useMemo(
    () => [...new Set(product.variants.map((v) => v.color))].filter((c) => c !== ""),
    [product.variants]
  );
  const sizes = useMemo(
    () => sortSizes([...new Set(product.variants.map((v) => v.size))].filter((s) => s !== "")),
    [product.variants]
  );

  // Auto-select dimensions with ≤1 option; require user choice otherwise.
  const [color, setColor] = useState<string | null>(colors.length <= 1 ? colors[0] ?? null : null);
  const [size, setSize] = useState<string | null>(sizes.length <= 1 ? sizes[0] ?? null : null);
  const [qty, setQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const colorChosen = colors.length <= 1 || color !== null;
  const sizeChosen = sizes.length <= 1 || size !== null;
  const selColor = color ?? colors[0] ?? "";
  const selSize = size ?? sizes[0] ?? "";

  const variant =
    colorChosen && sizeChosen
      ? product.variants.find((v) => v.color === selColor && v.size === selSize)
      : undefined;

  const price = variant?.price ?? product.price;
  const mrp = product.mrp && product.mrp > price ? product.mrp : null;
  const discount = mrp ? Math.round((1 - price / mrp) * 100) : null;
  const stock = variant?.stock ?? 0;

  // Bidirectional availability: a size is buyable in the selected colour
  // (any colour if none selected yet) — mirrored for colours.
  const stockOf = (c: string, s: string) =>
    product.variants.find((v) => v.color === c && v.size === s)?.stock ?? 0;
  const sizeOk = (s: string) =>
    color != null ? stockOf(color, s) > 0 : product.variants.some((v) => v.size === s && v.stock > 0);
  const colorOk = (c: string) =>
    size != null ? stockOf(c, size) > 0 : product.variants.some((v) => v.color === c && v.stock > 0);

  function pick(next: string, set: (v: string) => void, cur: string | null) {
    if (next === cur) return;
    set(next);
    setQty(1);
    setJustAdded(false);
  }

  function handleAdd() {
    if (!variant || stock <= 0) return;
    add(
      {
        productId: product.id,
        variantId: variant.id,
        slug: product.slug,
        name: product.name,
        variantLabel: [selColor, selSize].filter(Boolean).join(" · ") || null,
        imageUrl: product.images[0]?.url ?? "",
        unitPrice: price,
        maxQty: stock,
      },
      qty
    );
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1400);
  }

  function handleBuyNow() {
    if (!variant || stock <= 0) return;
    handleAdd();
    router.push("/checkout"); // ships in the next phase
  }

  const label =
    !colorChosen && !sizeChosen ? "Select options"
    : !colorChosen ? "Select a colour"
    : !sizeChosen ? "Select a size"
    : stock > 0 ? (justAdded ? "Added to Cart" : "Add to Cart")
    : "Out of Stock";
  const disabled = !colorChosen || !sizeChosen || stock <= 0;

  const legend = (title: string, value: string | null) => (
    <legend className="text-xs font-semibold uppercase tracking-wider text-stone-500">
      {title}{" "}
      {value ? (
        <span className="font-normal normal-case tracking-normal text-stone-600">· {value}</span>
      ) : (
        <span className="font-normal normal-case tracking-normal text-sale">required</span>
      )}
    </legend>
  );

  return (
    <div className="mt-6">
      {colors.length > 1 && (
        <fieldset>
          {legend("Colour", color)}
          <div className="mt-2.5 flex flex-wrap gap-2">
            {colors.map((c) => (
              <Chip key={c} active={color === c} disabled={!colorOk(c)} onClick={() => pick(c, setColor, color)}>
                {c}
              </Chip>
            ))}
          </div>
        </fieldset>
      )}

      {sizes.length > 1 && (
        <fieldset className="mt-5">
          {legend("Size", size)}
          <div className="mt-2.5 flex flex-wrap gap-2">
            {sizes.map((s) => (
              <Chip key={s} active={size === s} disabled={!sizeOk(s)} onClick={() => pick(s, setSize, size)}>
                {s}
              </Chip>
            ))}
          </div>
        </fieldset>
      )}

      <div className="mt-6 flex items-baseline gap-2">
        <span className="text-2xl font-semibold">{formatPaise(price)}</span>
        {mrp && <span className="text-stone-400 line-through">{formatPaise(mrp)}</span>}
        {discount != null && <span className="text-sm font-semibold text-sale">{discount}% off</span>}
      </div>
      <p className="mt-1 text-xs text-stone-500">Inclusive of all taxes</p>

      {stock > 0 && (
        <div className="mt-5 flex items-center gap-4">
          <div className="inline-flex items-center rounded-full border border-stone-300">
            <button
              type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1}
              aria-label="Decrease quantity"
              className="grid size-9 place-items-center rounded-full transition hover:bg-stone-100 disabled:opacity-30"
            >
              <Minus className="size-4" />
            </button>
            <span className="w-8 text-center text-sm font-medium">{qty}</span>
            <button
              type="button" onClick={() => setQty((q) => Math.min(stock, q + 1))} disabled={qty >= stock}
              aria-label="Increase quantity"
              className="grid size-9 place-items-center rounded-full transition hover:bg-stone-100 disabled:opacity-30"
            >
              <Plus className="size-4" />
            </button>
          </div>
          {stock <= 5 && <span className="text-xs font-medium text-sale">Only {stock} left</span>}
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <button
          type="button" onClick={handleAdd} disabled={disabled}
          className="flex flex-1 items-center justify-center gap-2 rounded-full border border-ink px-6 py-3 text-sm font-medium transition-colors hover:bg-ink hover:text-paper disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-ink"
        >
          {justAdded ? <Check className="size-4" /> : <ShoppingBag className="size-4" />}
          {label}
        </button>
        <button
          type="button" onClick={() => toggleWishlist(product.id)}
          aria-pressed={mounted && wished}
          aria-label={(mounted && wished ? "Remove from" : "Add to") + " wishlist"}
          className="grid size-[46px] shrink-0 place-items-center rounded-full border border-stone-300 transition hover:border-sale"
        >
          <Heart className={`size-5 transition ${mounted && wished ? "fill-sale text-sale" : "text-stone-600"}`} />
        </button>
      </div>

      <button
        type="button" onClick={handleBuyNow} disabled={disabled}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-paper transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Zap className="size-4" /> Buy Now
      </button>
    </div>
  );
}