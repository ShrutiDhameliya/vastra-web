// app/admin/products/new/page.tsx
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { ProductForm } from "@/components/admin/ProductForm";

export const metadata = { title: "New Product" };

export default async function NewProductPage() {
    await requireAdmin();
    const categories = await prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
    return <ProductForm categories={categories} />;
}