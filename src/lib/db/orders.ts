import { ensureBranches } from "@/lib/db/branches";
import { isBranchId } from "@/lib/branch-definitions";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
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

async function getNextDisplayId(tx: Prisma.TransactionClient) {
  const latest = await tx.order.findFirst({
    orderBy: { displayId: "desc" },
    select: { displayId: true },
  });

  const latestNumber = latest
    ? Number.parseInt(latest.displayId.replace(/^ORD-/, ""), 10)
    : 99000;

  return `ORD-${String(latestNumber + 1)}`;
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

export class OrderValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrderValidationError";
  }
}

export async function createOrder(input: CreateOrderInput) {
  if (!input.customerName.trim()) {
    throw new OrderValidationError("El nombre del cliente es obligatorio");
  }
  if (!isBranchId(input.branchId)) {
    throw new OrderValidationError("La sucursal seleccionada no es válida");
  }
  if (input.lineItems.length === 0) {
    throw new OrderValidationError("Agrega al menos un producto a la orden");
  }
  if (input.fulfillment === "delivery" && !input.deliveryAddress?.trim()) {
    throw new OrderValidationError(
      "La dirección de entrega es obligatoria para entregas",
    );
  }

  await ensureBranches();

  const status: OrderStatus =
    input.fulfillment === "delivery" ? "en-transito" : "pendiente";

  const order = await prisma.$transaction(async (tx) => {
    const displayId = await getNextDisplayId(tx);

    const created = await tx.order.create({
      data: {
        displayId,
        customerName: input.customerName.trim(),
        customerPhone: input.customerPhone?.trim() || null,
        deliveryAddress: input.deliveryAddress?.trim() || null,
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
            productId: item.productId || null,
            name: item.name,
            sku: item.sku,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
          })),
        },
      },
    });

    await tx.notificationLog.create({
      data: {
        source: "SISTEMA",
        message: `Nueva orden ${displayId} registrada en ${input.branchId}.`,
        accent: "primary",
      },
    });

    await tx.ping.create({
      data: {
        priority: "sistema",
        title: `Nueva Orden: ${displayId}`,
        description: `Orden registrada en sucursal ${input.branchId}.`,
      },
    });

    return created;
  });

  return mapOrder(order);
}
