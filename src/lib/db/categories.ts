import { prisma } from "@/lib/prisma";
import type { BranchId, ProductCategorySummary } from "@/lib/types";

export async function listProductCategories(
  branchId: BranchId,
): Promise<ProductCategorySummary[]> {
  const [categories, uncategorizedCount] = await Promise.all([
    prisma.productCategory.findMany({
      where: { branchId, active: true },
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            products: {
              where: { active: true },
            },
          },
        },
      },
    }),
    prisma.product.count({
      where: { branchId, active: true, categoryId: null },
    }),
  ]);

  const summaries: ProductCategorySummary[] = categories.map((category) => ({
    id: category.id,
    name: category.name,
    productCount: category._count.products,
  }));

  if (uncategorizedCount > 0) {
    summaries.push({
      id: null,
      name: "Sin categoría",
      productCount: uncategorizedCount,
    });
  }

  return summaries.sort((a, b) => a.name.localeCompare(b.name, "es"));
}
