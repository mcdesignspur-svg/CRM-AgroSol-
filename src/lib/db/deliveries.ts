import { DELIVERY_SLA_HOURS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { BranchId } from "@/lib/types";
import { mapDelivery } from "./mappers";

const DRIVER_POOL = [
  { name: "Juan Rodriguez", initials: "JR" },
  { name: "Miguel Angel", initials: "MA" },
  { name: "Carlos Mendez", initials: "CM" },
  { name: "Sofia Garcia", initials: "SG" },
] as const;

function pickDriver(seed: string) {
  const index =
    seed.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) %
    DRIVER_POOL.length;
  return DRIVER_POOL[index];
}

export function formatDeliveryEta(createdAt: Date): string {
  const eta = new Date(createdAt.getTime() + DELIVERY_SLA_HOURS * 3_600_000);
  const diffMs = eta.getTime() - Date.now();

  if (diffMs <= 0) {
    return "Llegando Ahora";
  }

  const hours = Math.floor(diffMs / 3_600_000);
  const mins = Math.floor((diffMs % 3_600_000) / 60_000);
  const time = eta.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (hours > 0) {
    return `${time} (${hours}h ${mins}m)`;
  }

  return `${time} (${mins}m)`;
}

async function getNextDeliveryDisplayId(tx: Prisma.TransactionClient) {
  const latest = await tx.delivery.findFirst({
    orderBy: { displayId: "desc" },
    select: { displayId: true },
  });

  const latestNumber = latest
    ? Number.parseInt(latest.displayId.replace(/^TRK-/, ""), 10)
    : 8920;

  return `TRK-${latestNumber + 1}`;
}

export async function getActiveDeliveries() {
  const rows = await prisma.delivery.findMany({
    where: { status: "recogida" },
    orderBy: { createdAt: "desc" },
  });

  const linkedOrderIds = rows
    .map((row) => row.orderId)
    .filter((id): id is string => Boolean(id));

  const orderDisplayById = new Map<string, string>();
  if (linkedOrderIds.length > 0) {
    const orders = await prisma.order.findMany({
      where: { id: { in: linkedOrderIds } },
      select: { id: true, displayId: true },
    });
    for (const order of orders) {
      orderDisplayById.set(order.id, order.displayId);
    }
  }

  return rows.map((row) =>
    mapDelivery(
      row,
      row.orderId ? orderDisplayById.get(row.orderId) : undefined,
    ),
  );
}

export async function getDeliveriesCount() {
  return prisma.delivery.count({ where: { status: "recogida" } });
}

export async function getCompletedDeliveriesCount() {
  return prisma.delivery.count({ where: { status: "entrega" } });
}

export async function createDeliveryForOrder(
  tx: Prisma.TransactionClient,
  input: {
    orderId: string;
    branchId: BranchId;
    destination: string;
    createdAt?: Date;
  },
) {
  const driver = pickDriver(input.orderId);
  const createdAt = input.createdAt ?? new Date();

  return tx.delivery.create({
    data: {
      displayId: await getNextDeliveryDisplayId(tx),
      driverName: driver.name,
      driverInitials: driver.initials,
      destination: input.destination,
      eta: formatDeliveryEta(createdAt),
      status: "recogida",
      branchId: input.branchId,
      orderId: input.orderId,
      createdAt,
    },
  });
}

export async function completeDeliveryForOrder(
  tx: Prisma.TransactionClient,
  orderId: string,
) {
  const existing = await tx.delivery.findUnique({ where: { orderId } });
  if (!existing || existing.status === "entrega") {
    return existing;
  }

  return tx.delivery.update({
    where: { orderId },
    data: { status: "entrega", eta: "Completada" },
  });
}
