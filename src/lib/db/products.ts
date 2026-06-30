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

export async function upsertProductFromLoyverse(input: {
  name: string;
  sku: string;
  unitPrice: number;
  loyverseItemId: string;
  loyverseVariantId: string;
  categoryName?: string;
}) {
  const sku = input.sku.trim().toUpperCase();

  const existing = await prisma.product.findFirst({
    where: {
      OR: [{ loyverseVariantId: input.loyverseVariantId }, { sku }],
    },
  });

  if (existing) {
    const row = await prisma.product.update({
      where: { id: existing.id },
      data: {
        name: input.name,
        sku,
        unitPrice: input.unitPrice,
        active: true,
        loyverseItemId: input.loyverseItemId,
        loyverseVariantId: input.loyverseVariantId,
        categoryName: input.categoryName,
      },
    });
    return mapProduct(row);
  }

  const row = await prisma.product.create({
    data: {
      name: input.name,
      sku,
      unitPrice: input.unitPrice,
      active: true,
      loyverseItemId: input.loyverseItemId,
      loyverseVariantId: input.loyverseVariantId,
      categoryName: input.categoryName,
    },
  });
  return mapProduct(row);
}
