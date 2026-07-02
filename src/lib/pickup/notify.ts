import { prisma } from "@/lib/prisma";
import {
  buildOrderConfirmationMessage,
  buildOrderReadyMessage,
  type PickupMessageContext,
} from "@/lib/pickup/messages";
import { sendTelegramMessage } from "@/lib/telegram/client";
import type { Order, Branch } from "@prisma/client";

type OrderWithBranch = Order & { branch: Branch };

function buildContext(order: OrderWithBranch): PickupMessageContext | null {
  if (!order.pickupToken || !order.branch.phone) {
    return null;
  }

  return {
    displayId: order.displayId,
    customerName: order.customerName,
    branchName: order.branch.name,
    branchAddress: order.branch.address,
    branchPhone: order.branch.phone,
    pickupToken: order.pickupToken,
    total: Number(order.total),
  };
}

async function notifyCustomer(
  order: OrderWithBranch,
  message: string,
  field: "confirmationNotifiedAt" | "readyNotifiedAt",
): Promise<boolean> {
  if (!order.telegramChatId) {
    return false;
  }

  const result = await sendTelegramMessage(order.telegramChatId, message);
  if (!result.sent) {
    console.error(`[pickup-notify] ${order.displayId}:`, result.error);
    return false;
  }

  await prisma.order.update({
    where: { id: order.id },
    data: { [field]: new Date() },
  });

  return true;
}

export async function sendPickupOrderConfirmation(
  orderId: string,
): Promise<boolean> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { branch: true },
  });

  if (
    !order ||
    order.fulfillment !== "pickup" ||
    order.confirmationNotifiedAt
  ) {
    return false;
  }

  const ctx = buildContext(order);
  if (!ctx) return false;

  return notifyCustomer(
    order,
    buildOrderConfirmationMessage(ctx),
    "confirmationNotifiedAt",
  );
}

export async function sendPickupOrderReady(orderId: string): Promise<boolean> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { branch: true },
  });

  if (!order || order.fulfillment !== "pickup" || order.readyNotifiedAt) {
    return false;
  }

  const ctx = buildContext(order);
  if (!ctx) return false;

  return notifyCustomer(
    order,
    buildOrderReadyMessage(ctx),
    "readyNotifiedAt",
  );
}
