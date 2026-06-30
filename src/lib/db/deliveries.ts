import { prisma } from "@/lib/prisma";
import { mapDelivery } from "./mappers";

export async function getActiveDeliveries() {
  const rows = await prisma.delivery.findMany({
    orderBy: { createdAt: "desc" },
  });
  return rows.map(mapDelivery);
}

export async function getDeliveriesCount() {
  return prisma.delivery.count();
}

export async function getCompletedDeliveriesCount() {
  return prisma.delivery.count({ where: { status: "entrega" } });
}
