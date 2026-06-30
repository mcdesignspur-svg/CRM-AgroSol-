import { matchBranchIdFromStoreName } from "@/lib/branch-definitions";
import { ensureBranches } from "@/lib/db/branches";
import { prisma } from "@/lib/prisma";
import { loyverseListAll } from "./client";
import type { LoyverseStore, LoyverseSyncResult } from "./types";

export async function syncStoresFromLoyverse(): Promise<LoyverseSyncResult> {
  const result: LoyverseSyncResult = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  await ensureBranches();

  const stores = await loyverseListAll<"stores", LoyverseStore>(
    "/stores",
    "stores",
  );

  for (const store of stores) {
    if (store.deleted_at) {
      result.skipped += 1;
      continue;
    }

    const branchId = matchBranchIdFromStoreName(store.name);
    if (!branchId) {
      result.errors.push(
        `No se pudo mapear la tienda Loyverse "${store.name}" a una sucursal del CRM`,
      );
      result.skipped += 1;
      continue;
    }

    const existing = await prisma.branch.findUnique({ where: { id: branchId } });
    const wasMapped = Boolean(existing?.loyverseStoreId);

    await prisma.branch.update({
      where: { id: branchId },
      data: {
        loyverseStoreId: store.id,
        name: store.name || existing?.name,
        address: store.address || existing?.address || "",
      },
    });

    if (wasMapped) {
      result.updated += 1;
    } else {
      result.created += 1;
    }
  }

  return result;
}

export async function getMappedStoreCount(): Promise<number> {
  return prisma.branch.count({
    where: { loyverseStoreId: { not: null } },
  });
}

export async function getBranchIdForLoyverseStore(
  storeId: string,
): Promise<string | null> {
  const branch = await prisma.branch.findFirst({
    where: { loyverseStoreId: storeId },
    select: { id: true },
  });
  return branch?.id ?? null;
}

export async function getLoyverseStoreIdForBranch(
  branchId: string,
): Promise<string | null> {
  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
    select: { loyverseStoreId: true },
  });
  return branch?.loyverseStoreId ?? null;
}
