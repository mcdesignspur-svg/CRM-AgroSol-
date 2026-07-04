import { ensureBranches } from "@/lib/db/branches";
import {
  completeDeliveryForOrder,
  createDeliveryForOrder,
} from "@/lib/db/deliveries";
import { generatePickupToken } from "@/lib/db/pickup";
import { isBranchId } from "@/lib/branch-definitions";
import {
  DELIVERY_FEE,
  DELIVERY_SLA_HOURS,
  PICKUP_SLA_HOURS,
  TAX_RATE,
} from "@/lib/constants";
import {
  getAllowedStatusTransitions,
  resolveDisplayStatus,
} from "@/lib/order-status";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import type { BranchId, OrderStatus, OrderType } from "@/lib/types";
import {
  mapDriverOrder,
  mapOrder,
  mapOrderDetail,
  toAppOrderStatus,
  toPrismaOrderStatus,
} from "./mappers";

const MAX_LINE_ITEM_QUANTITY = 10_000;
const CREATE_ORDER_MAX_RETRIES = 3;

export interface OrderFilters {
  status?: OrderStatus | "all";
  type?: OrderType | "all";
  branchId?: BranchId | "all";
  fulfillment?: "pickup" | "delivery" | "all";
  activeDelivery?: boolean;
  q?: string;
}

export function buildOrderWhere(filters: OrderFilters = {}): Prisma.OrderWhereInput {
  const and: Prisma.OrderWhereInput[] = [];

  if (filters.branchId && filters.branchId !== "all") {
    and.push({ branchId: filters.branchId });
  }

  if (filters.type && filters.type !== "all") {
    and.push({ type: filters.type });
  }

  if (filters.fulfillment && filters.fulfillment !== "all") {
    and.push({ fulfillment: filters.fulfillment });
  }

  if (filters.activeDelivery) {
    and.push({
      fulfillment: "delivery",
      status: { in: ["en_transito", "atrasado"] },
    });
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

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
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

export async function getActiveDeliveryOrders(limit = 50, offset = 0) {
  const rows = await prisma.order.findMany({
    where: buildOrderWhere({ activeDelivery: true }),
    orderBy: { createdAt: "asc" },
    take: limit,
    skip: offset,
  });
  return rows.map(mapDriverOrder);
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
  const rows = await tx.$queryRaw<{ max: number | null }[]>`
    SELECT COALESCE(MAX(CAST(SUBSTRING(display_id FROM 5) AS INTEGER)), 99000) AS max
    FROM orders
    WHERE display_id ~ '^ORD-[0-9]+$'
  `;

  const latestNumber = Number(rows[0]?.max ?? 99000);
  return `ORD-${latestNumber + 1}`;
}

interface CreateOrderLineItemInput {
  productId: string;
  quantity: number;
}

interface CreateOrderInput {
  customerName: string;
  customerPhone?: string;
  telegramChatId?: string;
  deliveryAddress?: string;
  branchId: BranchId;
  fulfillment: "pickup" | "delivery";
  smsNotify: boolean;
  lineItems: CreateOrderLineItemInput[];
}

export class OrderValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrderValidationError";
  }
}

export class OrderConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrderConflictError";
  }
}

function validateLineItems(lineItems: CreateOrderLineItemInput[]) {
  if (lineItems.length === 0) {
    throw new OrderValidationError("Agrega al menos un producto a la orden");
  }

  for (const item of lineItems) {
    if (typeof item.productId !== "string" || !item.productId.trim()) {
      throw new OrderValidationError(
        "Cada producto debe tener un identificador válido",
      );
    }

    if (
      !Number.isInteger(item.quantity) ||
      item.quantity <= 0 ||
      item.quantity > MAX_LINE_ITEM_QUANTITY
    ) {
      throw new OrderValidationError(
        `La cantidad debe ser un entero entre 1 y ${MAX_LINE_ITEM_QUANTITY}`,
      );
    }
  }
}

async function resolveLineItems(lineItems: CreateOrderLineItemInput[]) {
  const productIds = [...new Set(lineItems.map((item) => item.productId.trim()))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });
  const productById = new Map(products.map((product) => [product.id, product]));

  const resolvedItems: {
    productId: string;
    name: string;
    sku: string;
    unitPrice: number;
    quantity: number;
  }[] = [];

  for (const item of lineItems) {
    const productId = item.productId.trim();
    const product = productById.get(productId);

    if (!product) {
      throw new OrderValidationError("Uno o más productos no existen");
    }

    if (!product.active) {
      throw new OrderValidationError(
        `El producto "${product.name}" no está disponible`,
      );
    }

    resolvedItems.push({
      productId,
      name: product.name,
      sku: product.sku,
      unitPrice: Number(product.unitPrice),
      quantity: item.quantity,
    });
  }

  return resolvedItems;
}

function computeOrderTotals(
  lineItems: { unitPrice: number; quantity: number }[],
  fulfillment: "pickup" | "delivery",
) {
  const subtotal = roundMoney(
    lineItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
  );
  const taxes = roundMoney(subtotal * TAX_RATE);
  const deliveryFee =
    fulfillment === "delivery" ? roundMoney(DELIVERY_FEE) : 0;
  const total = roundMoney(subtotal + taxes + deliveryFee);

  return { subtotal, taxes, deliveryFee, total };
}

async function createOrderTransaction(input: {
  customerName: string;
  customerPhone?: string;
  telegramChatId?: string;
  deliveryAddress?: string;
  branchId: BranchId;
  fulfillment: "pickup" | "delivery";
  smsNotify: boolean;
  pickupToken?: string;
  type: OrderType;
  status: OrderStatus;
  subtotal: number;
  taxes: number;
  deliveryFee: number;
  total: number;
  lineItems: {
    productId: string;
    name: string;
    sku: string;
    unitPrice: number;
    quantity: number;
  }[];
}) {
  return prisma.$transaction(async (tx) => {
    const displayId = await getNextDisplayId(tx);

    const created = await tx.order.create({
      data: {
        displayId,
        customerName: input.customerName.trim(),
        customerPhone: input.customerPhone?.trim() || null,
        telegramChatId: input.telegramChatId?.trim() || null,
        deliveryAddress: input.deliveryAddress?.trim() || null,
        type: input.type,
        branchId: input.branchId,
        status: toPrismaOrderStatus(input.status),
        fulfillment: input.fulfillment,
        smsNotify: input.smsNotify,
        pickupToken: input.pickupToken ?? null,
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

    if (input.fulfillment === "delivery" && input.deliveryAddress?.trim()) {
      await createDeliveryForOrder(tx, {
        orderId: created.id,
        branchId: input.branchId,
        destination: input.deliveryAddress.trim(),
        createdAt: created.createdAt,
      });

      await tx.notificationLog.create({
        data: {
          source: "SISTEMA",
          message: `Entrega asignada para orden ${displayId}.`,
          accent: "primary",
        },
      });
    }

    return created;
  });
}

export async function createOrder(input: CreateOrderInput) {
  if (!input.customerName.trim()) {
    throw new OrderValidationError("El nombre del cliente es obligatorio");
  }
  if (!isBranchId(input.branchId)) {
    throw new OrderValidationError("La sucursal seleccionada no es válida");
  }
  if (input.fulfillment === "delivery" && !input.deliveryAddress?.trim()) {
    throw new OrderValidationError(
      "La dirección de entrega es obligatoria para entregas",
    );
  }
  if (input.fulfillment === "pickup" && !input.customerPhone?.trim()) {
    throw new OrderValidationError(
      "El teléfono del cliente es obligatorio para pickups",
    );
  }

  validateLineItems(input.lineItems);
  const resolvedLineItems = await resolveLineItems(input.lineItems);
  const { subtotal, taxes, deliveryFee, total } = computeOrderTotals(
    resolvedLineItems,
    input.fulfillment,
  );

  const type: OrderType =
    input.fulfillment === "delivery" ? "entrega" : "retiro";
  const status: OrderStatus =
    input.fulfillment === "delivery" ? "en-transito" : "pendiente";

  await ensureBranches();

  const orderInput = {
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    telegramChatId: input.telegramChatId,
    deliveryAddress: input.deliveryAddress,
    branchId: input.branchId,
    fulfillment: input.fulfillment,
    smsNotify: input.smsNotify,
    pickupToken:
      input.fulfillment === "pickup" ? generatePickupToken() : undefined,
    type,
    status,
    subtotal,
    taxes,
    deliveryFee,
    total,
    lineItems: resolvedLineItems,
  };

  for (let attempt = 0; attempt < CREATE_ORDER_MAX_RETRIES; attempt++) {
    try {
      const order = await createOrderTransaction(orderInput);
      return mapOrderDetail(order);
    } catch (error) {
      const isDisplayIdConflict =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002";

      if (isDisplayIdConflict && attempt < CREATE_ORDER_MAX_RETRIES - 1) {
        continue;
      }

      throw error;
    }
  }

  throw new OrderConflictError(
    "Conflicto al generar el número de orden. Intenta de nuevo.",
  );
}

export async function updateOrderStatus(displayId: string, nextStatus: OrderStatus) {
  const updated = await prisma.$transaction(async (tx) => {
    const existing = await tx.order.findUnique({
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

    const updateResult = await tx.order.updateMany({
      where: {
        displayId,
        status: existing.status,
      },
      data: { status: toPrismaOrderStatus(nextStatus) },
    });

    if (updateResult.count === 0) {
      throw new OrderConflictError(
        "La orden fue modificada por otro proceso. Intenta de nuevo.",
      );
    }

    const order = await tx.order.findUniqueOrThrow({
      where: { displayId },
      include: { lineItems: { orderBy: { name: "asc" } } },
    });

    const statusLabel =
      nextStatus === "listo"
        ? "lista para pickup"
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

      if (existing.fulfillment === "delivery") {
        await completeDeliveryForOrder(tx, existing.id);
      }
    }

    return order;
  });

  return mapOrderDetail(updated);
}

export async function deleteOrder(displayId: string) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.order.findUnique({
      where: { displayId },
      include: { delivery: true },
    });

    if (!existing) {
      throw new OrderValidationError("Orden no encontrada");
    }

    if (existing.delivery) {
      await tx.delivery.delete({ where: { id: existing.delivery.id } });
    }

    await tx.order.delete({ where: { displayId } });

    await tx.notificationLog.create({
      data: {
        source: "SISTEMA",
        message: `Orden ${displayId} eliminada.`,
        accent: "default",
      },
    });

    return { displayId, pickupToken: existing.pickupToken };
  });
}
