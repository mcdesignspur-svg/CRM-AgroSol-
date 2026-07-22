import { prisma } from "@/lib/prisma";
import { loyverseGetAllPages } from "./client";
import type { BranchId } from "@/lib/types";
import type { LoyverseCategory } from "./types";

export async function syncLoyverseCategories(
  branchId: BranchId,
): Promise<{ created: number; updated: number; total: number }> {
  const categories = await loyverseGetAllPages<
    "categories",
    LoyverseCategory
  >("/categories", "categories", branchId);

  const syncedAt = new Date();
  let created = 0;
  let updated = 0;

  for (const category of categories) {
    const name = category.name?.trim();
    if (!name) continue;

    const existing = await prisma.productCategory.findUnique({
      where: { id: category.id },
    });

    await prisma.productCategory.upsert({
      where: { id: category.id },
      update: {
        name,
        active: !category.deleted_at,
        syncedAt,
      },
      create: {
        id: category.id,
        branchId,
        name,
        active: !category.deleted_at,
        syncedAt,
      },
    });

    if (existing) {
      updated += 1;
    } else {
      created += 1;
    }
  }

  return {
    created,
    updated,
    total: categories.length,
  };
}
