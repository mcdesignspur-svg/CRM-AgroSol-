import { prisma } from "@/lib/prisma";
import {
  getLoyverseBranchLabel,
  isLoyverseBranchEnabled,
  isLoyverseConfigured,
} from "./config";
import { LoyverseApiError, loyverseGetAllPages, loyverseRequest } from "./client";
import type { BranchId } from "@/lib/types";
import type {
  LoyverseItem,
  LoyverseSyncResult,
  LoyverseVariant,
} from "./types";

const UPSERT_BATCH_SIZE = 50;

function getItemName(item: LoyverseItem): string {
  return (item.item_name ?? item.name ?? "Producto sin nombre").trim();
}

function getVariantLabel(itemName: string, variant: LoyverseVariant): string {
  const options = [
    variant.option1_value,
    variant.option2_value,
    variant.option3_value,
  ]
    .map((value) => value?.trim())
    .filter(Boolean);

  if (options.length === 0) {
    return itemName;
  }

  return `${itemName} (${options.join(" / ")})`;
}

function getVariantSku(variant: LoyverseVariant, itemId: string): string {
  const sku = variant.sku?.trim();
  if (sku) {
    return sku.toUpperCase();
  }

  return (variant.variant_id || itemId).toUpperCase();
}

function getVariantPrice(variant: LoyverseVariant): number {
  const price = variant.default_price ?? 0;
  return Number.isFinite(price) ? price : 0;
}

interface NormalizedProductRow {
  branchId: BranchId;
  name: string;
  sku: string;
  unitPrice: number;
  loyverseItemId: string;
  loyverseVariantId: string;
}

function normalizeLoyverseItems(
  items: LoyverseItem[],
  branchId: BranchId,
): NormalizedProductRow[] {
  const rows: NormalizedProductRow[] = [];

  for (const item of items) {
    if (item.deleted_at) continue;

    const itemName = getItemName(item);
    const variants = item.variants?.length
      ? item.variants
      : [{ variant_id: item.id, default_price: 0 } satisfies LoyverseVariant];

    for (const variant of variants) {
      if (variant.deleted_at) continue;

      rows.push({
        branchId,
        name: getVariantLabel(itemName, variant),
        sku: getVariantSku(variant, item.id),
        unitPrice: getVariantPrice(variant),
        loyverseItemId: item.id,
        loyverseVariantId: variant.variant_id,
      });
    }
  }

  return rows;
}

async function upsertProductBatch(
  rows: NormalizedProductRow[],
  syncedAt: Date,
): Promise<{ created: number; updated: number }> {
  let created = 0;
  let updated = 0;

  for (let index = 0; index < rows.length; index += UPSERT_BATCH_SIZE) {
    const batch = rows.slice(index, index + UPSERT_BATCH_SIZE);

    await prisma.$transaction(async (tx) => {
      for (const row of batch) {
        const existing = await tx.product.findUnique({
          where: {
            branchId_sku: {
              branchId: row.branchId,
              sku: row.sku,
            },
          },
        });

        await tx.product.upsert({
          where: {
            branchId_sku: {
              branchId: row.branchId,
              sku: row.sku,
            },
          },
          update: {
            name: row.name,
            unitPrice: row.unitPrice,
            loyverseItemId: row.loyverseItemId,
            loyverseVariantId: row.loyverseVariantId,
            active: true,
            syncedAt,
          },
          create: {
            branchId: row.branchId,
            name: row.name,
            sku: row.sku,
            unitPrice: row.unitPrice,
            loyverseItemId: row.loyverseItemId,
            loyverseVariantId: row.loyverseVariantId,
            active: true,
            syncedAt,
          },
        });

        if (existing) {
          updated += 1;
        } else {
          created += 1;
        }
      }
    });
  }

  return { created, updated };
}

export async function syncLoyverseProducts(input: {
  branchId: BranchId;
  mode?: "full" | "incremental";
}): Promise<LoyverseSyncResult> {
  const branchId = input.branchId;
  const mode = input.mode ?? "full";

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

  const integration = await prisma.loyverseIntegration.findUnique({
    where: { branchId },
  });

  const query: Record<string, string | undefined> = {};
  if (
    mode === "incremental" &&
    integration?.lastIncrementalSyncAt
  ) {
    query.updated_at_min = integration.lastIncrementalSyncAt.toISOString();
  }

  const items = await loyverseGetAllPages<"items", LoyverseItem>(
    "/items",
    "items",
    branchId,
    { query },
  );

  const rows = normalizeLoyverseItems(items, branchId);
  const syncedAt = new Date();
  const { created, updated } = await upsertProductBatch(rows, syncedAt);
  const productCount = await prisma.product.count({
    where: { branchId, active: true },
  });

  const merchant = await loyverseRequest<{
    business_name?: string;
    name?: string;
  }>("/merchant", branchId).catch(() => null);

  const merchantName =
    merchant?.business_name?.trim() ||
    merchant?.name?.trim() ||
    getLoyverseBranchLabel(branchId);

  await prisma.loyverseIntegration.upsert({
    where: { branchId },
    update: {
      merchantName,
      productCount,
      lastIncrementalSyncAt: syncedAt,
      ...(mode === "full" ? { lastFullSyncAt: syncedAt } : {}),
    },
    create: {
      branchId,
      merchantName,
      productCount,
      lastFullSyncAt: mode === "full" ? syncedAt : null,
      lastIncrementalSyncAt: syncedAt,
    },
  });

  return {
    branchId,
    mode,
    created,
    updated,
    skipped: Math.max(0, items.length - rows.length),
    total: created + updated,
  };
}

export async function safeSyncLoyverseProducts(input: {
  branchId: BranchId;
  mode?: "full" | "incremental";
}): Promise<LoyverseSyncResult | { error: string }> {
  try {
    return await syncLoyverseProducts(input);
  } catch (error) {
    if (error instanceof LoyverseApiError) {
      return { error: error.message };
    }

    return { error: "Error al sincronizar productos desde Loyverse" };
  }
}
