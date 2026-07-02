import { prisma } from "@/lib/prisma";
import { BRANCH_DEFINITIONS } from "@/lib/branch-definitions";
import {
  buildOrderConfirmationMessage,
  buildOrderReadyMessage,
  type PickupMessageContext,
} from "@/lib/pickup/messages";
import { sendTelegramMessage, resolveNotificationChatId } from "@/lib/telegram/client";
import type { Order, Branch } from "@prisma/client";

type OrderWithBranch = Order & { branch: Branch };

function resolveBranchPhone(branch: Branch): string | null {
  return (
    branch.phone ??
    BRANCH_DEFINITIONS.find((item) => item.id === branch.id)?.phone ??
    null
  );
}

function buildContext(order: OrderWithBranch): PickupMessageContext | null {
  const branchPhone = resolveBranchPhone(order.branch);
  if (!order.pickupToken || !branchPhone) {
    console.error(
      `[pickup-notify] ${order.displayId}: contexto incompleto`,
      { pickupToken: Boolean(order.pickupToken), branchPhone: Boolean(branchPhone) },
    );
    return null;
  }

  return {
    displayId: order.displayId,
    customerName: order.customerName,
    branchName: order.branch.name,
    branchAddress: order.branch.address,
    branchPhone,
    pickupToken: order.pickupToken,
    total: Number(order.total),
  };
}

async function notifyCustomer(
  order: OrderWithBranch,
  message: string,
  field: "confirmationNotifiedAt" | "readyNotifiedAt",
): Promise<boolean> {
  const chatId = resolveNotificationChatId(order.telegramChatId);
  if (!chatId) {
    console.error(
      `[pickup-notify] ${order.displayId}: sin chat_id (configura TELEGRAM_NOTIFICATIONS_CHAT_ID)`,
    );
    return false;
  }

  const result = await sendTelegramMessage(chatId, message);
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
