import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { CategoryManager } from "@/components/admin/CategoryManager";

export const metadata = { title: "Categories" };

export default async function CategoriesPage() {
    await requireAdmin();
    const categories = await prisma.category.findMany({
        orderBy: { name: "asc" },
        include: {
            _count: { select: { products: true } },
            parent: { select: { name: true } },
        },
    });
    return (
        <CategoryManager
            initial={categories.map((c) => ({
                id: c.id, name: c.name, slug: c.slug, parentId: c.parentId,
                imageUrl: c.imageUrl, productCount: c._count.products,
                parentName: c.parent?.name ?? null,
            }))}
        />
    );
}