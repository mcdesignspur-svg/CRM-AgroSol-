import type { Product, ProductCategoryGroup } from "@/lib/types";

const UNCategorized_KEY = "__uncategorized__";

export function groupProductsByCategory(
  products: Product[],
): ProductCategoryGroup[] {
  const groups = new Map<string, ProductCategoryGroup>();

  for (const product of products) {
    const key = product.categoryId ?? UNCategorized_KEY;
    const categoryName = product.categoryName ?? "Sin categoría";

    if (!groups.has(key)) {
      groups.set(key, {
        categoryId: product.categoryId,
        categoryName,
        products: [],
      });
    }

    groups.get(key)?.products.push(product);
  }

  return [...groups.values()].sort((a, b) =>
    a.categoryName.localeCompare(b.categoryName, "es"),
  );
}
