import { prisma } from "@/lib/prisma";
import {
  getLoyverseBranchLabel,
  getLoyverseStoreId,
  isLoyverseBranchEnabled,
  isLoyverseConfigured,
} from "./config";
import { LoyverseApiError, loyverseGetAllPages } from "./client";
import type { BranchId } from "@/lib/types";
import type { LoyverseInventoryLevel } from "./types";

function aggregateStockByVariant(
  levels: LoyverseInventoryLevel[],
  storeId: string | null,
): Map<string, number> {
  const stockByVariant = new Map<string, number>();

  for (const level of levels) {
    if (!level.variant_id) continue;
    if (storeId && level.store_id !== storeId) continue;

    const quantity = Number(level.in_stock ?? 0);
    if (!Number.isFinite(quantity)) continue;

    const rounded = Math.max(0, Math.round(quantity));
    const current = stockByVariant.get(level.variant_id) ?? 0;
    stockByVariant.set(level.variant_id, current + rounded);
  }

  return stockByVariant;
}

export async function syncLoyverseInventory(
  branchId: BranchId,
): Promise<{ updated: number; variantsTracked: number }> {
  if (!isLoyverseBranchEnabled(branchId)) {
    throw new LoyverseApiError(
      400,
      `Loyverse no está habilitado para ${getLoyverseBranchLabel(branchId)}`,
    );
  }

  if (!isLoyverseConfigured(branchId)) {
    throw new LoyverseApiError(
      401,
      `Token Loyverse no configurado para ${getLoyverseBranchLabel(branchId)}`,
    );
  }

  const storeId = getLoyverseStoreId(branchId);
  const query: Record<string, string | undefined> = {};
  if (storeId) {
    query.store_ids = storeId;
  }

  const levels = await loyverseGetAllPages<
    "inventory_levels",
    LoyverseInventoryLevel
  >("/inventory", "inventory_levels", branchId, { limit: 250, query });

  const stockByVariant = aggregateStockByVariant(levels, storeId);
  const syncedAt = new Date();
  let updated = 0;

  for (const [variantId, stockQuantity] of stockByVariant) {
    const result = await prisma.product.updateMany({
      where: { branchId, loyverseVariantId: variantId },
      data: { stockQuantity, syncedAt },
    });
    updated += result.count;
  }

  await prisma.loyverseIntegration.upsert({
    where: { branchId },
    update: { lastInventorySyncAt: syncedAt },
    create: {
      branchId,
      lastInventorySyncAt: syncedAt,
    },
  });

  return { updated, variantsTracked: stockByVariant.size };
}

export async function safeSyncLoyverseInventory(
  branchId: BranchId,
): Promise<{ updated: number; variantsTracked: number } | { error: string }> {
  try {
    return await syncLoyverseInventory(branchId);
  } catch (error) {
    if (error instanceof LoyverseApiError) {
      return { error: error.message };
    }

    return { error: "Error al sincronizar inventario desde Loyverse" };
  }
}
