import { prisma } from "@/lib/prisma";
import { groupProductsByCategory } from "@/lib/products/group-by-category";
import { mapProduct } from "./mappers";
import type { BranchId, ProductCategoryGroup } from "@/lib/types";

const productInclude = {
  category: true,
} as const;

export async function getCatalogProducts(branchId: BranchId = "gurabo") {
  const rows = await prisma.product.findMany({
    where: { branchId, active: true },
    include: productInclude,
    orderBy: { name: "asc" },
    take: 100,
  });
  return rows.map(mapProduct);
}

export async function searchCatalogProducts(input: {
  branchId: BranchId;
  query?: string;
  categoryId?: string | null;
  limit?: number;
}) {
  const query = input.query?.trim() ?? "";
  const categoryId = input.categoryId?.trim() || undefined;
  const uncategorized = categoryId === "__uncategorized__";

  if (!categoryId && query.length < 2) {
    return [];
  }

  const rows = await prisma.product.findMany({
    where: {
      branchId: input.branchId,
      active: true,
      ...(uncategorized
        ? { categoryId: null }
        : categoryId
          ? { categoryId }
          : {}),
      ...(query.length >= 2
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { sku: { contains: query.toUpperCase(), mode: "insensitive" } },
              { category: { name: { contains: query, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: productInclude,
    orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
    take: input.limit ?? 500,
  });

  return rows.map(mapProduct);
}

export async function listAllProductsGroupedByCategory(
  branchId: BranchId = "gurabo",
): Promise<ProductCategoryGroup[]> {
  const rows = await prisma.product.findMany({
    where: { branchId, active: true },
    include: productInclude,
    orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
  });

  return groupProductsByCategory(rows.map(mapProduct));
}

export async function countCatalogProducts(branchId: BranchId) {
  return prisma.product.count({
    where: { branchId, active: true },
  });
}

interface CreateProductInput {
  branchId?: BranchId;
  name: string;
  sku: string;
  unitPrice: number;
}

export async function createProduct(input: CreateProductInput) {
  const row = await prisma.product.create({
    data: {
      branchId: input.branchId ?? "gurabo",
      name: input.name.trim(),
      sku: input.sku.trim().toUpperCase(),
      unitPrice: input.unitPrice,
      active: true,
    },
    include: productInclude,
  });
  return mapProduct(row);
}
