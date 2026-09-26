import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { formatPaise } from "@/lib/money";

export const metadata = { title: "Products" };

const PAGE_SIZE = 20;

export default async function AdminProducts({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    await requireAdmin();
    const sp = await searchParams;
    const get = (k: string) => (Array.isArray(sp[k]) ? sp[k][0] : sp[k]) ?? "";
    const q = get("q").trim();
    const page = Math.max(1, Number(get("page")) || 1);

    const mode = { mode: "insensitive" as const };
    const where = q
        ? { OR: [{ name: { contains: q, ...mode } }, { slug: { contains: q, ...mode } }, { brand: { contains: q, ...mode } }] }
        : {};

    const [total, products] = await Promise.all([
        prisma.product.count({ where }),
        prisma.product.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * PAGE_SIZE,
            take: PAGE_SIZE,
            include: {
                category: { select: { name: true } },
                variants: { select: { stock: true } },
                images: { take: 1, orderBy: { position: "asc" } },
            },
        }),
    ]);
    const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

    const href = (p: number) => {
        const sp2 = new URLSearchParams();
        if (q) sp2.set("q", q);
        if (p > 1) sp2.set("page", String(p));
        const s = sp2.toString();
        return `/admin/products${s ? `?${s}` : ""}`;
    };

    const th = "px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-stone-500";

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="font-display text-3xl font-semibold">Products</h1>
                <Link href="/admin/products/new"
                    className="inline-flex items-center gap-1.5 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition hover:bg-stone-800">
                    <Plus className="size-4" /> New Product
                </Link>
            </div>

            <form action="/admin/products" className="mt-6 flex max-w-md gap-2">
                <input name="q" defaultValue={q} placeholder="Name, slug or brand"
                    className="w-full rounded-full border border-stone-300 px-4 py-2 text-sm outline-none focus:border-ink" />
                <button type="submit" className="shrink-0 rounded-full border border-stone-300 px-5 text-sm font-medium transition hover:border-ink">Search</button>
            </form>

            <div data-tour="admin-products" className="mt-4 overflow-x-auto rounded-xl border border-stone-200 bg-white">
                <table className="w-full min-w-[680px] text-sm">
                    <thead className="border-b border-stone-200">
                        <tr>
                            <th className={th}>Product</th><th className={th}>Category</th><th className={th}>Price</th>
                            <th className={th}>Stock</th><th className={th}>Flags</th><th className={th} />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                        {products.length === 0 && (
                            <tr><td colSpan={6} className="px-3 py-8 text-center text-stone-500">No products match.</td></tr>
                        )}
                        {products.map((p) => {
                            const stock = p.variants.reduce((n, v) => n + v.stock, 0);
                            return (
                                <tr key={p.id} className="hover:bg-stone-50">
                                    <td className="px-3 py-2.5">
                                        <div className="flex items-center gap-2.5">
                                            <div className="relative h-11 w-9 shrink-0 overflow-hidden rounded bg-stone-100">
                                                {p.images[0] && <Image src={p.images[0].url} alt="" fill sizes="36px" className="object-cover" />}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="truncate font-medium">{p.name}</p>
                                                <p className="truncate text-xs text-stone-500">{p.brand ?? "—"}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-3 py-2.5 text-stone-500">{p.category.name}</td>
                                    <td className="px-3 py-2.5">{formatPaise(p.price)}</td>
                                    <td className={`px-3 py-2.5 font-medium ${stock === 0 ? "text-sale" : ""}`}>{stock}</td>
                                    <td className="px-3 py-2.5">
                                        <div className="flex flex-wrap gap-1">
                                            {p.isFeatured && <span className="rounded-full bg-ink px-2 py-0.5 text-[10px] font-semibold text-paper">FEATURED</span>}
                                            {p.isArchived && <span className="rounded-full bg-stone-200 px-2 py-0.5 text-[10px] font-semibold text-stone-600">ARCHIVED</span>}
                                        </div>
                                    </td>
                                    <td className="px-3 py-2.5 text-right">
                                        <Link href={`/admin/products/${p.id}`} className="text-xs font-medium text-stone-600 hover:text-ink">Edit →</Link>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-stone-500">{total} products · page {page} / {pageCount}</span>
                <div className="flex gap-2">
                    {page > 1 ? (
                        <Link href={href(page - 1)} className="rounded-full border border-stone-300 px-4 py-1.5 hover:border-ink">← Prev</Link>
                    ) : (
                        <span className="rounded-full border border-stone-200 px-4 py-1.5 text-stone-300">← Prev</span>
                    )}
                    {page < pageCount ? (
                        <Link href={href(page + 1)} className="rounded-full border border-stone-300 px-4 py-1.5 hover:border-ink">Next →</Link>
                    ) : (
                        <span className="rounded-full border border-stone-200 px-4 py-1.5 text-stone-300">Next →</span>
                    )}
                </div>
            </div>
        </div>
    );
}