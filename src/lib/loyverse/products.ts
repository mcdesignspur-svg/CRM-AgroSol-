import { prisma } from "@/lib/prisma";
import {
  getLoyverseBranchLabel,
  isLoyverseBranchEnabled,
  isLoyverseConfigured,
} from "./config";
import { syncLoyverseCategories } from "./categories";
import {
  LoyverseApiError,
  loyverseGetAllPages,
  loyverseGetPage,
  loyverseRequest,
} from "./client";
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
  categoryId: string | null;
}

function normalizeLoyverseItems(
  items: LoyverseItem[],
  branchId: BranchId,
): NormalizedProductRow[] {
  const rows: NormalizedProductRow[] = [];

  for (const item of items) {
    if (item.deleted_at) continue;

    const itemName = getItemName(item);
    const categoryId = item.category_id?.trim() || null;
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
        categoryId,
      });
    }
  }

  return rows;
}

async function upsertProductBatch(
  rows: NormalizedProductRow[],
  syncedAt: Date,
  validCategoryIds?: Set<string>,
): Promise<{ created: number; updated: number }> {
  let created = 0;
  let updated = 0;

  for (let index = 0; index < rows.length; index += UPSERT_BATCH_SIZE) {
    const batch = rows.slice(index, index + UPSERT_BATCH_SIZE);

    await prisma.$transaction(async (tx) => {
      for (const row of batch) {
        const categoryId =
          row.categoryId && (!validCategoryIds || validCategoryIds.has(row.categoryId))
            ? row.categoryId
            : null;

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
            categoryId,
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
            categoryId,
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
  cursor?: string | null;
  singlePage?: boolean;
  pageSize?: number;
}): Promise<LoyverseSyncResult> {
  const branchId = input.branchId;
  const mode = input.mode ?? "full";
  const singlePage = input.singlePage ?? false;
  const pageSize = input.pageSize ?? 100;

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

  let categoriesCreated = 0;
  let categoriesUpdated = 0;
  let categoriesSynced = 0;
  let validCategoryIds: Set<string> | undefined;

  if (!input.cursor) {
    const categoryResult = await syncLoyverseCategories(branchId);
    categoriesCreated = categoryResult.created;
    categoriesUpdated = categoryResult.updated;
    categoriesSynced = categoryResult.total;

    const categoryRows = await prisma.productCategory.findMany({
      where: { branchId },
      select: { id: true },
    });
    validCategoryIds = new Set(categoryRows.map((category) => category.id));
  }

  const query: Record<string, string | undefined> = {};
  if (
    mode === "incremental" &&
    integration?.lastIncrementalSyncAt
  ) {
    query.updated_at_min = integration.lastIncrementalSyncAt.toISOString();
  }

  let items: LoyverseItem[];
  let nextCursor: string | null = null;

  if (singlePage) {
    const page = await loyverseGetPage<"items", LoyverseItem>(
      "/items",
      "items",
      branchId,
      {
        limit: pageSize,
        cursor: input.cursor,
        query,
      },
    );
    items = page.items;
    nextCursor = page.nextCursor;
  } else {
    items = await loyverseGetAllPages<"items", LoyverseItem>(
      "/items",
      "items",
      branchId,
      { limit: pageSize, query },
    );
  }

  const rows = normalizeLoyverseItems(items, branchId);
  const syncedAt = new Date();
  const { created, updated } = await upsertProductBatch(
    rows,
    syncedAt,
    validCategoryIds,
  );
  const hasMore = singlePage && Boolean(nextCursor);
  const productCount = await prisma.product.count({
    where: { branchId, active: true },
  });

  let merchantName =
    integration?.merchantName?.trim() || getLoyverseBranchLabel(branchId);

  if (!hasMore) {
    const merchant = await loyverseRequest<{
      business_name?: string;
      name?: string;
    }>("/merchant", branchId).catch(() => null);

    merchantName =
      merchant?.business_name?.trim() ||
      merchant?.name?.trim() ||
      merchantName;
  }

  await prisma.loyverseIntegration.upsert({
    where: { branchId },
    update: {
      merchantName,
      productCount,
      ...(hasMore
        ? {}
        : {
            lastIncrementalSyncAt: syncedAt,
            ...(mode === "full" ? { lastFullSyncAt: syncedAt } : {}),
          }),
    },
    create: {
      branchId,
      merchantName,
      productCount,
      lastFullSyncAt: hasMore || mode !== "full" ? null : syncedAt,
      lastIncrementalSyncAt: hasMore ? null : syncedAt,
    },
  });

  return {
    branchId,
    mode,
    created,
    updated,
    skipped: Math.max(0, items.length - rows.length),
    total: created + updated,
    categoriesCreated,
    categoriesUpdated,
    categoriesSynced,
    hasMore,
    nextCursor: hasMore ? nextCursor : null,
    pageItems: items.length,
  };
}

export async function safeSyncLoyverseProducts(input: {
  branchId: BranchId;
  mode?: "full" | "incremental";
  cursor?: string | null;
  singlePage?: boolean;
  pageSize?: number;
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
