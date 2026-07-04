import { PICKUP_SLA_HOURS, DELIVERY_SLA_HOURS } from "@/lib/constants";
import { resolveDisplayStatus } from "@/lib/order-status";
import { prisma } from "@/lib/prisma";
import { toAppOrderStatus } from "./mappers";

const SLA_PING_TITLE_PREFIX = "SLA vencido:";

function slaPingTitle(displayId: string) {
  return `${SLA_PING_TITLE_PREFIX} ${displayId}`;
}

export async function notifyOverdueOrders(): Promise<boolean> {
  const now = Date.now();
  const pickupCutoff = new Date(now - PICKUP_SLA_HOURS * 3_600_000);
  const deliveryCutoff = new Date(now - DELIVERY_SLA_HOURS * 3_600_000);

  const candidates = await prisma.order.findMany({
    where: {
      status: { notIn: ["completado", "listo"] },
      OR: [
        { status: "atrasado" },
        {
          status: "pendiente",
          fulfillment: "pickup",
          createdAt: { lt: pickupCutoff },
        },
        {
          status: "en_transito",
          fulfillment: "delivery",
          createdAt: { lt: deliveryCutoff },
        },
      ],
    },
    select: {
      displayId: true,
      customerName: true,
      branchId: true,
      fulfillment: true,
      status: true,
      createdAt: true,
    },
  });

  let createdAny = false;

  for (const order of candidates) {
    const displayStatus = resolveDisplayStatus({
      status: toAppOrderStatus(order.status),
      fulfillment: order.fulfillment,
      createdAt: order.createdAt,
      now,
    });

    if (displayStatus !== "atrasado") {
      continue;
    }

    const title = slaPingTitle(order.displayId);
    const existing = await prisma.ping.findFirst({
      where: { title },
    });

    if (existing) {
      continue;
    }

    const kind =
      order.fulfillment === "delivery" ? "entrega" : "pickup";

    await prisma.$transaction([
      prisma.ping.create({
        data: {
          priority: "urgente",
          title,
          description: `La orden ${order.displayId} (${order.customerName}) superó el SLA de ${kind}. Revisa en sucursal ${order.branchId}.`,
        },
      }),
      prisma.notificationLog.create({
        data: {
          source: "SISTEMA",
          message: `SLA vencido: orden ${order.displayId} requiere atención.`,
          accent: "default",
        },
      }),
    ]);

    createdAny = true;
  }

  return createdAny;
}
