import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { resolveDisplayStatus } from "@/lib/order-status";
import { toAppOrderStatus } from "@/lib/db/mappers";

export function generateDeliveryToken(): string {
  return randomUUID().replace(/-/g, "");
}

export interface PublicDeliveryOrder {
  displayId: string;
  customerName: string;
  status: string;
  statusLabel: string;
  deliveryAddress: string;
  branchName: string;
  total: number;
  driverName: string | null;
  eta: string | null;
  dispatchedAt: string | null;
}

const PUBLIC_STATUS_LABELS: Record<string, string> = {
  pendiente: "En preparación",
  atrasado: "En preparación",
  "en-transito": "En camino",
  completado: "Entregada",
};

function mapPublicDelivery(
  order: NonNullable<Awaited<ReturnType<typeof getDeliveryOrderRecord>>>,
): PublicDeliveryOrder | null {
  if (!order.deliveryToken || !order.deliveryAddress) {
    return null;
  }

  const status = resolveDisplayStatus({
    status: toAppOrderStatus(order.status),
    fulfillment: order.fulfillment,
    createdAt: order.createdAt,
    dispatchedAt: order.dispatchedAt,
  });

  return {
    displayId: order.displayId,
    customerName: order.customerName,
    status,
    statusLabel: PUBLIC_STATUS_LABELS[status] ?? status,
    deliveryAddress: order.deliveryAddress,
    branchName: order.branch.name,
    total: Number(order.total),
    driverName: order.delivery?.driverName ?? null,
    eta: order.delivery?.eta ?? null,
    dispatchedAt: order.dispatchedAt?.toISOString() ?? null,
  };
}

async function getDeliveryOrderRecord(token: string) {
  return prisma.order.findUnique({
    where: { deliveryToken: token },
    include: {
      branch: true,
      delivery: true,
    },
  });
}

export async function getDeliveryByToken(token: string) {
  const order = await getDeliveryOrderRecord(token);
  if (!order || order.fulfillment !== "delivery") {
    return null;
  }
  return mapPublicDelivery(order);
}
