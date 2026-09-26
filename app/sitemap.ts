import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

    const [products, categories] = await Promise.all([
        prisma.product.findMany({
            where: { isArchived: false },
            select: { slug: true, updatedAt: true },
        }),
        prisma.category.findMany({ select: { slug: true } }),
    ]);

    return [
        { url: base, changeFrequency: "daily", priority: 1 },
        { url: `${base}/shop`, changeFrequency: "daily", priority: 0.9 },
        ...categories.map((c) => ({
            url: `${base}/shop?category=${c.slug}`,
            changeFrequency: "weekly" as const,
            priority: 0.6,
        })),
        ...products.map((p) => ({
            url: `${base}/products/${p.slug}`,
            lastModified: p.updatedAt,
            changeFrequency: "weekly" as const,
            priority: 0.8,
        })),
    ];
}