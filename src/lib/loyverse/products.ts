import { prisma } from "@/lib/prisma";
import { LoyverseApiError, loyverseGetAllPages } from "./client";
import type {
  LoyverseItem,
  LoyverseSyncResult,
  LoyverseVariant,
} from "./types";

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

  return variant.variant_id || itemId;
}

function getVariantPrice(variant: LoyverseVariant): number {
  const price = variant.default_price ?? 0;
  return Number.isFinite(price) ? price : 0;
}

export async function syncLoyverseProducts(): Promise<LoyverseSyncResult> {
  const items = await loyverseGetAllPages<"items", LoyverseItem>(
    "/items",
    "items",
  );

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const item of items) {
    if (item.deleted_at) {
      skipped += item.variants?.length ?? 1;
      continue;
    }

    const itemName = getItemName(item);
    const variants = item.variants?.length
      ? item.variants
      : [{ variant_id: item.id, default_price: 0 } satisfies LoyverseVariant];

    for (const variant of variants) {
      if (variant.deleted_at) {
        skipped += 1;
        continue;
      }

      const sku = getVariantSku(variant, item.id);
      const name = getVariantLabel(itemName, variant);
      const unitPrice = getVariantPrice(variant);

      const existing = await prisma.product.findUnique({ where: { sku } });

      await prisma.product.upsert({
        where: { sku },
        update: {
          name,
          unitPrice,
          active: true,
        },
        create: {
          name,
          sku,
          unitPrice,
          active: true,
        },
      });

      if (existing) {
        updated += 1;
      } else {
        created += 1;
      }
    }
  }

  return {
    created,
    updated,
    skipped,
    total: created + updated,
  };
}

export async function safeSyncLoyverseProducts(): Promise<
  LoyverseSyncResult | { error: string }
> {
  try {
    return await syncLoyverseProducts();
  } catch (error) {
    if (error instanceof LoyverseApiError) {
      return { error: error.message };
    }

    return { error: "Error al sincronizar productos desde Loyverse" };
  }
}
