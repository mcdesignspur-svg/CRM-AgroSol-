import { BRANCH_DEFINITIONS } from "@/lib/branch-definitions";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { mapBranch } from "./mappers";

export async function ensureBranches() {
  await Promise.all(
    BRANCH_DEFINITIONS.map((branch) =>
      prisma.branch.upsert({
        where: { id: branch.id },
        update: {
          name: branch.name,
          address: branch.address,
          phone: branch.phone,
        },
        create: {
          id: branch.id,
          name: branch.name,
          address: branch.address,
          phone: branch.phone,
          capacityPercent: 0,
          currentVolume: 0,
          status: "online",
        },
      }),
    ),
  );
}

export async function getBranches() {
  const rows = await prisma.branch.findMany({ orderBy: { name: "asc" } });
  return rows.map(mapBranch);
}

export async function getBranchById(id: string) {
  const row = await prisma.branch.findUnique({ where: { id } });
  return row ? mapBranch(row) : null;
}

export async function sendBranchPingInTx(
  tx: Prisma.TransactionClient,
  branchId: string,
  message?: string,
) {
  const branch = await tx.branch.update({
    where: { id: branchId },
    data: { lastPingAt: new Date() },
  });

  await tx.notificationLog.create({
    data: {
      source: "SISTEMA",
      message:
        message?.trim() ||
        `Ping de gerente enviado a ${branch.name}.`,
      accent: "primary",
    },
  });

  return mapBranch(branch);
}

export async function sendBranchPing(branchId: string, message?: string) {
  await ensureBranches();

  return prisma.$transaction(async (tx) =>
    sendBranchPingInTx(tx, branchId, message),
  );
}
