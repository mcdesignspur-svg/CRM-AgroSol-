import { BRANCH_DEFINITIONS } from "@/lib/branch-definitions";
import { prisma } from "@/lib/prisma";
import { mapBranch } from "./mappers";

export async function ensureBranches() {
  await Promise.all(
    BRANCH_DEFINITIONS.map((branch) =>
      prisma.branch.upsert({
        where: { id: branch.id },
        update: {
          name: branch.name,
          address: branch.address,
        },
        create: {
          id: branch.id,
          name: branch.name,
          address: branch.address,
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

export async function sendBranchPing(branchId: string, message?: string) {
  await ensureBranches();

  const branch = await prisma.branch.update({
    where: { id: branchId },
    data: { lastPingAt: new Date() },
  });

  await prisma.notificationLog.create({
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
