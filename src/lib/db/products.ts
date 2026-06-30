import { prisma } from "@/lib/prisma";
import { mapProduct } from "./mappers";
import type { BranchId } from "@/lib/types";

export async function getCatalogProducts(branchId: BranchId = "gurabo") {
  const rows = await prisma.product.findMany({
    where: { branchId, active: true },
    orderBy: { name: "asc" },
    take: 100,
  });
  return rows.map(mapProduct);
}

export async function searchCatalogProducts(input: {
  branchId: BranchId;
  query: string;
  limit?: number;
}) {
  const query = input.query.trim();
  if (query.length < 2) {
    return [];
  }

  const rows = await prisma.product.findMany({
    where: {
      branchId: input.branchId,
      active: true,
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { sku: { contains: query.toUpperCase(), mode: "insensitive" } },
      ],
    },
    orderBy: [{ name: "asc" }],
    take: input.limit ?? 50,
  });

  return rows.map(mapProduct);
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
  });
  return mapProduct(row);
}
