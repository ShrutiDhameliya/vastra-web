"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { slugify } from "@/lib/slug";
import { ImageField } from "./ImageField";

export type ProductFormInitial = {
    id: string;
    name: string;
    slug: string;
    description: string;
    brand: string | null;
    categoryId: string;
    price: number;
    mrp: number | null;
    isFeatured: boolean;
    isArchived: boolean;
    images: { id: string; url: string; altText: string | null }[];
    variants: { id: string; color: string; size: string; sku: string; stock: number; price: number | null }[];
};

type VariantRow = { id?: string; color: string; size: string; sku: string; stock: string; price: string };
type ImageRow = { id?: string; url: string; alt: string };

const toPaise = (v: string): number | null => {
    if (!v.trim()) return null;
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
};
const toRupees = (p: number | null): string => (p == null ? "" : String(p / 100));

function Input({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">{label}</span>
            <input {...props}
                className="mt-1.5 w-full rounded-lg border border-stone-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-ink" />
        </label>
    );
}

export function ProductForm({ categories, initial }: {
    categories: { id: string; name: string }[];
    initial?: ProductFormInitial;
}) {
    const router = useRouter();
    const isEdit = !!initial;

    const [name, setName] = useState(initial?.name ?? "");
    const [slug, setSlug] = useState(initial?.slug ?? "");
    const [slugEdited, setSlugEdited] = useState(isEdit);
    const [description, setDescription] = useState(initial?.description ?? "");
    const [brand, setBrand] = useState(initial?.brand ?? "");
    const [categoryId, setCategoryId] = useState(initial?.categoryId ?? categories[0]?.id ?? "");
    const [price, setPrice] = useState(toRupees(initial?.price ?? null));
    const [mrp, setMrp] = useState(toRupees(initial?.mrp ?? null));
    const [isFeatured, setIsFeatured] = useState(initial?.isFeatured ?? false);
    const [isArchived, setIsArchived] = useState(initial?.isArchived ?? false);

    const [images, setImages] = useState<ImageRow[]>(
        initial?.images.map((i) => ({ id: i.id, url: i.url, alt: i.altText ?? "" })) ?? [{ url: "", alt: "" }]
    );
    const [variants, setVariants] = useState<VariantRow[]>(
        initial?.variants.map((v) => ({
            id: v.id, color: v.color, size: v.size, sku: v.sku,
            stock: String(v.stock), price: toRupees(v.price),
        })) ?? [{ color: "", size: "", sku: "", stock: "10", price: "" }]
    );

    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function setVariant(i: number, patch: Partial<VariantRow>) {
        setVariants((vs) => vs.map((v, j) => (j === i ? { ...v, ...patch } : v)));
    }
    function setImage(i: number, patch: Partial<ImageRow>) {
        setImages((is) => is.map((im, j) => (j === i ? { ...im, ...patch } : im)));
    }

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        const pricePaise = toPaise(price);
        if (pricePaise == null || pricePaise < 100) return setError("Enter a valid selling price (at least ₹1)");
        const mrpPaise = mrp.trim() ? toPaise(mrp) : null;
        if (mrpPaise != null && mrpPaise <= pricePaise) mrpPaise === null; // allowed — mrp just won't show

        const cleanVariants = variants.map((v) => ({
            id: v.id,
            color: v.color.trim(),
            size: v.size.trim(),
            sku: v.sku.trim(),
            stock: Math.max(0, Math.floor(Number(v.stock) || 0)),
            price: v.price.trim() ? toPaise(v.price) : null,
        }));
        if (cleanVariants.some((v) => !v.sku)) return setError("Every variant needs a SKU");
        if (!categoryId) return setError("Pick a category");

        const body = {
            name: name.trim(),
            slug: slugify(slugEdited ? slug : name),
            description: description.trim(),
            brand: brand.trim(),
            categoryId,
            price: pricePaise,
            mrp: mrpPaise != null && mrpPaise > pricePaise ? mrpPaise : null,
            isFeatured,
            isArchived,
            images: images
                .map((i) => ({ id: i.id, url: i.url.trim(), alt: i.alt.trim() }))
                .filter((i) => i.url.length > 0),
            variants: cleanVariants,
        };
        if (body.images.length === 0) return setError("Add at least one image URL");
        if (body.variants.length === 0) return setError("Add at least one variant");
        if (body.description.length < 10) return setError("Description needs at least 10 characters");

        setBusy(true);
        try {
            const res = await fetch(isEdit ? `/api/admin/products/${initial!.id}` : "/api/admin/products", {
                method: isEdit ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.problems?.[0] ?? data.error ?? "Couldn't save the product");
                return;
            }
            router.push("/admin/products");
            router.refresh();
        } finally {
            setBusy(false);
        }
    }

    const vr = "w-full min-w-0 rounded-lg border border-stone-300 px-2.5 py-2 text-sm outline-none focus:border-ink";

    return (
        <form onSubmit={submit} className="space-y-8">
            <header className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="font-display text-3xl font-semibold">{isEdit ? "Edit Product" : "New Product"}</h1>
                <Link href="/admin/products" className="text-sm text-stone-500 hover:text-ink">← Back to products</Link>
            </header>

            <section className="rounded-xl border border-stone-200 bg-white p-6">
                <h2 className="font-display text-lg font-semibold">Basics</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <Input label="Name" required value={name} onChange={(e) => setName(e.target.value)} />
                    <Input label="Slug (URL)" required
                        value={slugEdited ? slug : slugify(name)}
                        onChange={(e) => { setSlugEdited(true); setSlug(e.target.value); }}
                        placeholder="auto-generated-from-name" />
                    <label className="block">
                        <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">Category</span>
                        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
                            className="mt-1.5 w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm outline-none focus:border-ink">
                            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </label>
                    <Input label="Brand (optional)" value={brand} onChange={(e) => setBrand(e.target.value)} />
                    <div className="sm:col-span-2">
                        <Input label="Selling price (₹)" required inputMode="decimal" placeholder="1999" value={price} onChange={(e) => setPrice(e.target.value)} />
                    </div>
                    <Input label="MRP (₹, optional — enables the sale badge)" inputMode="decimal" placeholder="2799" value={mrp} onChange={(e) => setMrp(e.target.value)} />
                    <div className="flex items-end gap-6 pb-1">
                        <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} className="accent-[#1c1917]" />
                            Featured
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" checked={isArchived} onChange={(e) => setIsArchived(e.target.checked)} className="accent-[#1c1917]" />
                            Archived
                        </label>
                    </div>
                    <label className="block sm:col-span-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">Description</span>
                        <textarea required rows={4} value={description} onChange={(e) => setDescription(e.target.value)}
                            className="mt-1.5 w-full rounded-lg border border-stone-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-ink" />
                    </label>
                </div>
                {isArchived && (
                    <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                        Archived products are hidden from the shop but remain in past orders and admin lists.
                    </p>
                )}
            </section>

            <section className="rounded-xl border border-stone-200 bg-white p-6">
                <h2 className="font-display text-lg font-semibold">Images</h2>
                <p className="mt-1 text-xs text-stone-500">
                    First image is the card thumbnail; hover-swap uses the second. Local paths like <code>/uploads/x.jpg</code> work today.
                </p>
                <div className="mt-4 space-y-2">
                    {images.map((img, i) => (
                        <ImageField
                            key={i}
                            image={img}
                            onChange={(patch) => setImage(i, patch)}
                            onMoveUp={() => setImages((is) => [is[i - 1], is[i], ...is.slice(i + 1)])}
                            onMoveDown={() => setImages((is) => [...is.slice(0, i), is[i + 1], is[i], ...is.slice(i + 2)])}
                            onRemove={() => setImages((is) => is.filter((_, j) => j !== i))}
                            isFirst={i === 0}
                            isLast={i === images.length - 1}
                        />
                    ))}
                </div>
                <button type="button" onClick={() => setImages((is) => [...is, { url: "", alt: "" }])}
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-ink">
                    <Plus className="size-4" /> Add image
                </button>
            </section>

            <section className="rounded-xl border border-stone-200 bg-white p-6">
                <h2 className="font-display text-lg font-semibold">Variants</h2>
                <p className="mt-1 text-xs text-stone-500">
                    Stock lives per variant. Empty price = use the product price. Leave colour/size blank for one-variant products.
                </p>
                <div className="mt-4 space-y-2">
                    {variants.map((v, i) => (
                        <div key={i}
                            className="grid grid-cols-2 gap-2 rounded-lg border border-stone-200 p-2.5 sm:grid-cols-[1fr_1fr_1.3fr_5.5rem_4.5rem_2.25rem] sm:items-center">
                            <input className={vr} placeholder="Colour" aria-label={`Variant ${i + 1} colour`} value={v.color}
                                onChange={(e) => setVariant(i, { color: e.target.value })} />
                            <input className={vr} placeholder="Size" aria-label={`Variant ${i + 1} size`} value={v.size}
                                onChange={(e) => setVariant(i, { size: e.target.value })} />
                            <input className={vr} placeholder="SKU *" aria-label={`Variant ${i + 1} SKU`} value={v.sku}
                                onChange={(e) => setVariant(i, { sku: e.target.value })} />
                            <input className={vr} placeholder="Price ₹" inputMode="decimal" aria-label={`Variant ${i + 1} price override`} value={v.price}
                                onChange={(e) => setVariant(i, { price: e.target.value })} />
                            <input className={vr} placeholder="Stock" inputMode="numeric" aria-label={`Variant ${i + 1} stock`} value={v.stock}
                                onChange={(e) => setVariant(i, { stock: e.target.value })} />
                            <button type="button" aria-label="Remove variant"
                                onClick={() => setVariants((vs) => vs.filter((_, j) => j !== i))}
                                className="grid size-9 place-items-center justify-self-end rounded-full text-stone-400 hover:text-sale">
                                <Trash2 className="size-4" />
                            </button>
                        </div>
                    ))}
                </div>
                <button type="button" onClick={() => setVariants((vs) => [...vs, { color: "", size: "", sku: "", stock: "10", price: "" }])}
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-ink">
                    <Plus className="size-4" /> Add variant
                </button>
            </section>

            {error && <p className="text-sm text-sale" role="alert">{error}</p>}

            <div className="flex gap-3">
                <button type="submit" disabled={busy}
                    className="rounded-full bg-ink px-7 py-3 text-sm font-medium text-paper transition hover:bg-stone-800 disabled:opacity-40">
                    {busy ? "Saving…" : "Save Product"}
                </button>
                <Link href="/admin/products"
                    className="rounded-full border border-stone-300 px-7 py-3 text-sm font-medium transition hover:border-ink">
                    Cancel
                </Link>
            </div>
        </form>
    );
}