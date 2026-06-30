import { prisma } from "@/lib/prisma";
import { loyverseListAll } from "./client";
import type { LoyverseItem, LoyverseSyncResult } from "./types";

function resolveVariantPrice(variant: LoyverseItem["variants"][number]): number {
  if (
    variant.default_pricing_type === "FIXED" &&
    typeof variant.default_price === "number"
  ) {
    return variant.default_price;
  }
  return 0;
}

export async function syncItemsFromLoyverse(): Promise<LoyverseSyncResult> {
  const result: LoyverseSyncResult = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  const items = await loyverseListAll<"items", LoyverseItem>("/items", "items");

  for (const item of items) {
    if (item.deleted_at) {
      if (item.variants.length > 0) {
        await prisma.product.updateMany({
          where: {
            loyverseItemId: item.id,
          },
          data: { active: false },
        });
      }
      result.skipped += 1;
      continue;
    }

    for (const variant of item.variants) {
      if (variant.deleted_at) {
        await prisma.product.updateMany({
          where: { loyverseVariantId: variant.variant_id },
          data: { active: false },
        });
        result.skipped += 1;
        continue;
      }

      const sku = (variant.sku || `${item.id}-${variant.variant_id}`)
        .trim()
        .toUpperCase();
      const unitPrice = resolveVariantPrice(variant);

      const existing = await prisma.product.findFirst({
        where: {
          OR: [
            { loyverseVariantId: variant.variant_id },
            { sku },
          ],
        },
      });

      if (existing) {
        await prisma.product.update({
          where: { id: existing.id },
          data: {
            name: item.item_name,
            sku,
            unitPrice,
            active: true,
            loyverseItemId: item.id,
            loyverseVariantId: variant.variant_id,
          },
        });
        result.updated += 1;
      } else {
        await prisma.product.create({
          data: {
            name: item.item_name,
            sku,
            unitPrice,
            active: true,
            loyverseItemId: item.id,
            loyverseVariantId: variant.variant_id,
          },
        });
        result.created += 1;
      }
    }
  }

  return result;
}

export async function getSyncedProductCount(): Promise<number> {
  return prisma.product.count({
    where: { loyverseVariantId: { not: null } },
  });
}
