import { ensureBranches } from "@/lib/db/branches";
import { findOrCreateCustomerForOrder } from "@/lib/db/customers";
import { isBranchId } from "@/lib/branch-definitions";
import { DELIVERY_SLA_HOURS, PICKUP_SLA_HOURS } from "@/lib/constants";
import {
  checkInventoryForOrder,
  isLoyverseConfigured,
  pushReceiptToLoyverse,
} from "@/lib/loyverse";
import {
  getAllowedStatusTransitions,
  resolveDisplayStatus,
} from "@/lib/order-status";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { BranchId, OrderStatus, OrderType } from "@/lib/types";
import {
  mapOrder,
  mapOrderDetail,
  toAppOrderStatus,
  toPrismaOrderStatus,
} from "./mappers";

export interface OrderFilters {
  status?: OrderStatus | "all";
  type?: OrderType | "all";
  branchId?: BranchId | "all";
  q?: string;
}

function buildOrderWhere(filters: OrderFilters = {}): Prisma.OrderWhereInput {
  const and: Prisma.OrderWhereInput[] = [];

  if (filters.branchId && filters.branchId !== "all") {
    and.push({ branchId: filters.branchId });
  }

  if (filters.type && filters.type !== "all") {
    and.push({ type: filters.type });
  }

  if (filters.q?.trim()) {
    const query = filters.q.trim();
    and.push({
      OR: [
        { displayId: { contains: query, mode: "insensitive" } },
        { customerName: { contains: query, mode: "insensitive" } },
        { customerPhone: { contains: query, mode: "insensitive" } },
      ],
    });
  }

  if (filters.status && filters.status !== "all") {
    if (filters.status === "atrasado") {
      const pickupCutoff = new Date(
        Date.now() - PICKUP_SLA_HOURS * 3_600_000,
      );
      const deliveryCutoff = new Date(
        Date.now() - DELIVERY_SLA_HOURS * 3_600_000,
      );

      and.push({
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
      });
    } else if (filters.status === "pendiente") {
      const pickupCutoff = new Date(
        Date.now() - PICKUP_SLA_HOURS * 3_600_000,
      );
      and.push({
        status: "pendiente",
        fulfillment: "pickup",
        createdAt: { gte: pickupCutoff },
      });
    } else if (filters.status === "en-transito") {
      const deliveryCutoff = new Date(
        Date.now() - DELIVERY_SLA_HOURS * 3_600_000,
      );
      and.push({
        status: "en_transito",
        fulfillment: "delivery",
        createdAt: { gte: deliveryCutoff },
      });
    } else {
      and.push({ status: toPrismaOrderStatus(filters.status) });
    }
  }

  return and.length > 0 ? { AND: and } : {};
}

export async function getRecentOrders(
  limit = 20,
  offset = 0,
  filters: OrderFilters = {},
) {
  const rows = await prisma.order.findMany({
    where: buildOrderWhere(filters),
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  });
  return rows.map(mapOrder);
}

export async function getOrdersCount(filters: OrderFilters = {}) {
  return prisma.order.count({ where: buildOrderWhere(filters) });
}

export async function getOrderByDisplayId(displayId: string) {
  const row = await prisma.order.findUnique({
    where: { displayId },
    include: { lineItems: { orderBy: { name: "asc" } } },
  });
  return row ? mapOrderDetail(row) : null;
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

  if (isLoyverseConfigured()) {
    const stockIssues = await checkInventoryForOrder({
      branchId: input.branchId,
      lineItems: input.lineItems,
    });

    if (stockIssues.length > 0) {
      const first = stockIssues[0];
      throw new OrderValidationError(
        `Stock insuficiente para ${first.name} (${first.sku}): solicitado ${first.requested}, disponible ${first.available}`,
      );
    }
  }

  await ensureBranches();

  const customer = await findOrCreateCustomerForOrder({
    name: input.customerName,
    phone: input.customerPhone,
    address: input.deliveryAddress,
  });

  const status: OrderStatus =
    input.fulfillment === "delivery" ? "en-transito" : "pendiente";

  const order = await prisma.$transaction(async (tx) => {
    const displayId = await getNextDisplayId(tx);

    const created = await tx.order.create({
      data: {
        displayId,
        customerId: customer.id,
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
      include: { lineItems: true },
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

  return mapOrderDetail(order);
}

export async function updateOrderStatus(displayId: string, nextStatus: OrderStatus) {
  const existing = await prisma.order.findUnique({
    where: { displayId },
    include: { lineItems: true },
  });

  if (!existing) {
    throw new OrderValidationError("Orden no encontrada");
  }

  const currentStatus = resolveDisplayStatus({
    status: toAppOrderStatus(existing.status),
    fulfillment: existing.fulfillment,
    createdAt: existing.createdAt,
  });

  const allowed = getAllowedStatusTransitions({
    type: existing.type,
    status: currentStatus,
    fulfillment: existing.fulfillment,
    createdAt: existing.createdAt,
  });

  if (!allowed.includes(nextStatus)) {
    throw new OrderValidationError(
      `No se puede cambiar de "${currentStatus}" a "${nextStatus}"`,
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    const order = await tx.order.update({
      where: { displayId },
      data: { status: toPrismaOrderStatus(nextStatus) },
      include: { lineItems: { orderBy: { name: "asc" } } },
    });

    const statusLabel =
      nextStatus === "listo"
        ? "lista para retiro"
        : nextStatus === "completado"
          ? "completada"
          : nextStatus;

    await tx.notificationLog.create({
      data: {
        source: "SISTEMA",
        message: `Orden ${displayId} marcada como ${statusLabel}.`,
        accent: nextStatus === "completado" ? "primary" : "default",
      },
    });

    if (nextStatus === "listo") {
      await tx.ping.create({
        data: {
          priority: "sistema",
          title: `Orden Lista: ${displayId}`,
          description: `${existing.customerName} puede retirar en sucursal ${existing.branchId}.`,
        },
      });
    }

    if (nextStatus === "completado") {
      await tx.ping.create({
        data: {
          priority: "sistema",
          title: `Orden Completada: ${displayId}`,
          description: `La orden de ${existing.customerName} fue finalizada.`,
        },
      });
    }

    return order;
  });

  if (nextStatus === "completado" && isLoyverseConfigured()) {
    try {
      await pushReceiptToLoyverse(displayId);
      await prisma.notificationLog.create({
        data: {
          source: "LOYVERSE",
          message: `Receipt Loyverse creado para orden ${displayId}.`,
          accent: "primary",
        },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error al sincronizar receipt";
      await prisma.notificationLog.create({
        data: {
          source: "LOYVERSE",
          message: `No se pudo crear receipt para ${displayId}: ${message}`,
        },
      });
    }
  }

  const refreshed = await prisma.order.findUnique({
    where: { displayId },
    include: { lineItems: { orderBy: { name: "asc" } } },
  });

  return mapOrderDetail(refreshed ?? updated);
}
