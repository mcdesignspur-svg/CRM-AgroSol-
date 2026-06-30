import { prisma } from "@/lib/prisma";
import type { BranchId, OrderStatus, OrderType } from "@/lib/types";
import { mapOrder, toPrismaOrderStatus } from "./mappers";

export async function getRecentOrders(limit = 20, offset = 0) {
  const rows = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  });
  return rows.map(mapOrder);
}

export async function getOrdersCount() {
  return prisma.order.count();
}

export async function getNextDisplayId() {
  const count = await prisma.order.count();
  return `ORD-${String(99000 + count + 1)}`;
}

interface CreateOrderInput {
  customerName: string;
  customerPhone?: string;
  deliveryAddress?: string;
  type: OrderType;
  branchId: BranchId;
  fulfillment: "pickup" | "delivery";
  smsNotify: boolean;
  subtotal: number;
  taxes: number;
  deliveryFee: number;
  total: number;
  lineItems: {
    productId?: string;
    name: string;
    sku: string;
    unitPrice: number;
    quantity: number;
  }[];
}

export async function createOrder(input: CreateOrderInput) {
  const displayId = await getNextDisplayId();
  const status: OrderStatus =
    input.fulfillment === "delivery" ? "en-transito" : "pendiente";

  const order = await prisma.order.create({
    data: {
      displayId,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      deliveryAddress: input.deliveryAddress,
      type: input.type,
      branchId: input.branchId,
      status: toPrismaOrderStatus(status),
      fulfillment: input.fulfillment,
      smsNotify: input.smsNotify,
      subtotal: input.subtotal,
      taxes: input.taxes,
      deliveryFee: input.deliveryFee,
      total: input.total,
      lineItems: {
        create: input.lineItems.map((item) => ({
          productId: item.productId,
          name: item.name,
          sku: item.sku,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
        })),
      },
    },
  });

  await prisma.notificationLog.create({
    data: {
      source: "SISTEMA",
      message: `Nueva orden ${displayId} registrada en ${input.branchId}.`,
      accent: "primary",
    },
  });

  await prisma.ping.create({
    data: {
      priority: "sistema",
      title: `Nueva Orden: ${displayId}`,
      description: `Orden registrada en sucursal ${input.branchId}.`,
    },
  });

  return mapOrder(order);
}
