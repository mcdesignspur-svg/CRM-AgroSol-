import { prisma } from "@/lib/prisma";
import { mapProduct } from "./mappers";

export async function getCatalogProducts() {
  const rows = await prisma.product.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });
  return rows.map(mapProduct);
}

interface CreateProductInput {
  name: string;
  sku: string;
  unitPrice: number;
}

export async function createProduct(input: CreateProductInput) {
  const row = await prisma.product.create({
    data: {
      name: input.name.trim(),
      sku: input.sku.trim().toUpperCase(),
      unitPrice: input.unitPrice,
      active: true,
    },
  });
  return mapProduct(row);
}
