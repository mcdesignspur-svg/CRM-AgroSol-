import { prisma } from "@/lib/prisma";
import type { PingPriority } from "@/lib/types";
import { mapPing } from "./mappers";

export async function getLivePings() {
  const rows = await prisma.ping.findMany({
    where: { dismissed: false },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return rows.map(mapPing);
}

export async function dismissPing(id: string) {
  await prisma.ping.update({
    where: { id },
    data: { dismissed: true },
  });
}

export async function createQuickPing(
  branchId: string,
  message?: string,
  priority: PingPriority = "urgente",
) {
  const branch = await prisma.branch.findUnique({ where: { id: branchId } });
  const title = branch
    ? `Ping a ${branch.name}`
    : `Ping a sucursal ${branchId}`;

  const ping = await prisma.ping.create({
    data: {
      priority,
      title,
      description: message?.trim() || "Ping rápido enviado desde el panel.",
    },
  });

  return mapPing(ping);
}

export async function getSystemAlertsCount() {
  return prisma.ping.count({
    where: { dismissed: false, priority: { in: ["urgente", "advertencia"] } },
  });
}
