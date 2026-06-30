import { prisma } from "@/lib/prisma";
import { loyverseListAll } from "./client";
import type { LoyverseInventoryLevel } from "./types";
import { getLoyverseStoreIdForBranch } from "./sync-stores";

export interface StockCheckIssue {
  sku: string;
  name: string;
  requested: number;
  available: number;
}

export async function checkInventoryForOrder(input: {
  branchId: string;
  lineItems: { productId?: string; sku: string; name: string; quantity: number }[];
}): Promise<StockCheckIssue[]> {
  const storeId = await getLoyverseStoreIdForBranch(input.branchId);
  if (!storeId) {
    return [];
  }

  const productIds = input.lineItems
    .map((item) => item.productId)
    .filter((id): id is string => Boolean(id));

  const products = await prisma.product.findMany({
    where: {
      OR: [
        { id: { in: productIds } },
        { sku: { in: input.lineItems.map((item) => item.sku.toUpperCase()) } },
      ],
    },
    select: { id: true, sku: true, loyverseVariantId: true },
  });

  const variantIds = products
    .map((product) => product.loyverseVariantId)
    .filter((id): id is string => Boolean(id));

  if (variantIds.length === 0) {
    return [];
  }

  const levels = await loyverseListAll<"inventory_levels", LoyverseInventoryLevel>(
    "/inventory",
    "inventory_levels",
    {
      store_ids: storeId,
      variant_ids: variantIds.join(","),
    },
  );

  const stockByVariant = new Map(
    levels.map((level) => [level.variant_id, level.in_stock]),
  );

  const issues: StockCheckIssue[] = [];

  for (const item of input.lineItems) {
    const product =
      products.find((row) => row.id === item.productId) ??
      products.find(
        (row) => row.sku.toUpperCase() === item.sku.toUpperCase(),
      );

    if (!product?.loyverseVariantId) {
      continue;
    }

    const available = stockByVariant.get(product.loyverseVariantId) ?? 0;
    if (available < item.quantity) {
      issues.push({
        sku: item.sku,
        name: item.name,
        requested: item.quantity,
        available,
      });
    }
  }

  return issues;
}

export async function createLowStockPing(
  variantId: string,
  storeId: string,
  inStock: number,
) {
  const product = await prisma.product.findFirst({
    where: { loyverseVariantId: variantId },
    select: { name: true, sku: true },
  });

  const branch = await prisma.branch.findFirst({
    where: { loyverseStoreId: storeId },
    select: { name: true },
  });

  if (!product) {
    return;
  }

  await prisma.ping.create({
    data: {
      priority: "advertencia",
      title: `Inventario bajo: ${product.sku}`,
      description: `${product.name} en ${branch?.name ?? "sucursal"} — quedan ${inStock} unidades.`,
    },
  });
}
