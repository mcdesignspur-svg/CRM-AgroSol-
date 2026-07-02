import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { resolveDisplayStatus } from "@/lib/order-status";
import { toAppOrderStatus } from "@/lib/db/mappers";
import {
  buildOrderConfirmationMessage,
  buildCustomerArrivedStaffMessage,
  buildTelegramWelcomeMessage,
  type PickupMessageContext,
} from "@/lib/pickup/messages";
import {
  sendTelegramMessage,
  resolveNotificationChatId,
} from "@/lib/telegram/client";
import type { BranchId } from "@/lib/types";

export function generatePickupToken(): string {
  return randomUUID().replace(/-/g, "");
}

export interface PublicPickupOrder {
  displayId: string;
  customerName: string;
  status: string;
  statusLabel: string;
  branchName: string;
  branchAddress: string;
  branchPhone: string;
  total: number;
  arrivedAt: string | null;
  canNotifyArrival: boolean;
}

const PUBLIC_STATUS_LABELS: Record<string, string> = {
  pendiente: "En preparación",
  atrasado: "En preparación",
  listo: "Lista para retiro",
  completado: "Completada",
};

function mapPublicPickup(
  order: Awaited<ReturnType<typeof getPickupOrderRecord>>,
): PublicPickupOrder | null {
  if (!order?.pickupToken || !order.branch.phone) return null;

  const status = resolveDisplayStatus({
    status: toAppOrderStatus(order.status),
    fulfillment: order.fulfillment,
    createdAt: order.createdAt,
  });

  const canNotifyArrival =
    !order.arrivedAt &&
    order.fulfillment === "pickup" &&
    (status === "listo" || status === "pendiente" || status === "atrasado");

  return {
    displayId: order.displayId,
    customerName: order.customerName,
    status,
    statusLabel: PUBLIC_STATUS_LABELS[status] ?? status,
    branchName: order.branch.name,
    branchAddress: order.branch.address,
    branchPhone: order.branch.phone,
    total: Number(order.total),
    arrivedAt: order.arrivedAt?.toISOString() ?? null,
    canNotifyArrival,
  };
}

async function getPickupOrderRecord(token: string) {
  return prisma.order.findUnique({
    where: { pickupToken: token },
    include: { branch: true },
  });
}

export async function getPickupByToken(token: string) {
  const order = await getPickupOrderRecord(token);
  return mapPublicPickup(order);
}

export async function linkTelegramChatToPickup(
  token: string,
  chatId: string,
): Promise<{ linked: boolean; displayId?: string; error?: string }> {
  const order = await getPickupOrderRecord(token);

  if (!order || order.fulfillment !== "pickup") {
    return { linked: false, error: "Orden no encontrada" };
  }

  await prisma.order.update({
    where: { id: order.id },
    data: { telegramChatId: chatId },
  });

  const notifyChatId = resolveNotificationChatId(chatId) ?? chatId;

  await sendTelegramMessage(
    notifyChatId,
    buildTelegramWelcomeMessage(order.displayId),
  );

  if (!order.confirmationNotifiedAt && order.branch.phone && order.pickupToken) {
    const ctx: PickupMessageContext = {
      displayId: order.displayId,
      customerName: order.customerName,
      branchName: order.branch.name,
      branchAddress: order.branch.address,
      branchPhone: order.branch.phone,
      pickupToken: order.pickupToken,
      total: Number(order.total),
    };

    const result = await sendTelegramMessage(
      notifyChatId,
      buildOrderConfirmationMessage(ctx),
    );

    if (result.sent) {
      await prisma.order.update({
        where: { id: order.id },
        data: { confirmationNotifiedAt: new Date() },
      });
    }
  }

  return { linked: true, displayId: order.displayId };
}

export class PickupArrivalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PickupArrivalError";
  }
}

export async function markCustomerArrived(token: string) {
  const order = await getPickupOrderRecord(token);

  if (!order || order.fulfillment !== "pickup") {
    throw new PickupArrivalError("Orden no encontrada");
  }

  if (order.arrivedAt) {
    return mapPublicPickup(order)!;
  }

  if (order.status === "completado") {
    throw new PickupArrivalError("Esta orden ya fue completada");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const arrivedAt = new Date();

    const result = await tx.order.update({
      where: { id: order.id },
      data: { arrivedAt },
      include: { branch: true },
    });

    await tx.ping.create({
      data: {
        priority: "urgente",
        title: `Cliente en camino: ${order.displayId}`,
        description: `${order.customerName} avisó llegada para retiro en ${order.branch.name}.`,
      },
    });

    await tx.notificationLog.create({
      data: {
        source: "PICKUP",
        message: `${order.customerName} llegó a retirar la orden ${order.displayId} (${order.branch.name}).`,
        accent: "primary",
      },
    });

    return result;
  });

  const staffChatId = resolveNotificationChatId(order.telegramChatId);
  if (staffChatId) {
    void sendTelegramMessage(
      staffChatId,
      buildCustomerArrivedStaffMessage({
        displayId: order.displayId,
        customerName: order.customerName,
        branchName: order.branch.name,
      }),
    );
  }

  return mapPublicPickup(updated)!;
}

export async function getBranchPhone(branchId: BranchId): Promise<string | null> {
  const branch = await prisma.branch.findUnique({ where: { id: branchId } });
  return branch?.phone ?? null;
}
