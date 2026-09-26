// app/admin/products/[id]/page.tsx
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { ProductForm } from "@/components/admin/ProductForm";

export const metadata = { title: "Edit Product" };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
    await requireAdmin();
    const { id } = await params;
    const [categories, product] = await Promise.all([
        prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
        prisma.product.findUnique({
            where: { id },
            include: {
                images: { orderBy: { position: "asc" } },
                variants: { orderBy: [{ color: "asc" }, { size: "asc" }] },
            },
        }),
    ]);
    if (!product) notFound();
    return <ProductForm categories={categories} initial={product} />;
}