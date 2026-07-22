import { ensureBranches } from "@/lib/db/branches";
import {
  completeDeliveryForOrder,
  createDeliveryForOrder,
} from "@/lib/db/deliveries";
import { generatePickupToken } from "@/lib/db/pickup";
import { generateDeliveryToken } from "@/lib/db/delivery";
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
import { formatDeliveryTime } from "@/lib/delivery-time";
import {
  isCatalogOrderLineItem,
  MAX_LINE_ITEM_QUANTITY,
  MAX_MANUAL_ITEM_NAME_LENGTH,
  MAX_MANUAL_ITEM_UNIT_PRICE,
  type CreateOrderLineItemInput,
} from "@/lib/order-line-items";
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
            status: "pendiente",
            fulfillment: "delivery",
            createdAt: { lt: pickupCutoff },
          },
          {
            status: "en_transito",
            fulfillment: "delivery",
            OR: [
              { dispatchedAt: { lt: deliveryCutoff } },
              { dispatchedAt: null, createdAt: { lt: deliveryCutoff } },
            ],
          },
        ],
      });
    } else if (filters.status === "pendiente") {
      const prepCutoff = new Date(
        Date.now() - PICKUP_SLA_HOURS * 3_600_000,
      );
      and.push({
        status: "pendiente",
        createdAt: { gte: prepCutoff },
      });
    } else if (filters.status === "en-transito") {
      const deliveryCutoff = new Date(
        Date.now() - DELIVERY_SLA_HOURS * 3_600_000,
      );
      and.push({
        OR: [
          {
            status: "en_transito",
            fulfillment: { not: "delivery" },
          },
          {
            status: "en_transito",
            fulfillment: "delivery",
            OR: [
              { dispatchedAt: { gte: deliveryCutoff } },
              { dispatchedAt: null, createdAt: { gte: deliveryCutoff } },
            ],
          },
        ],
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
    include: {
      lineItems: { orderBy: { name: "asc" } },
      delivery: true,
    },
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

interface CreateOrderInput {
  customerName: string;
  customerPhone?: string;
  telegramChatId?: string;
  deliveryAddress?: string;
  deliveryAddressValidated?: boolean;
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
    if (
      !Number.isInteger(item.quantity) ||
      item.quantity <= 0 ||
      item.quantity > MAX_LINE_ITEM_QUANTITY
    ) {
      throw new OrderValidationError(
        `La cantidad debe ser un entero entre 1 y ${MAX_LINE_ITEM_QUANTITY}`,
      );
    }

    if (isCatalogOrderLineItem(item)) {
      if (!item.productId.trim()) {
        throw new OrderValidationError(
          "Cada producto debe tener un identificador válido",
        );
      }
      continue;
    }

    const name = item.name.trim();
    if (!name || name.length > MAX_MANUAL_ITEM_NAME_LENGTH) {
      throw new OrderValidationError(
        "El nombre del artículo manual no es válido",
      );
    }
    if (
      !Number.isFinite(item.unitPrice) ||
      item.unitPrice <= 0 ||
      item.unitPrice > MAX_MANUAL_ITEM_UNIT_PRICE
    ) {
      throw new OrderValidationError(
        "El precio del artículo manual no es válido",
      );
    }
  }
}

async function resolveLineItems(lineItems: CreateOrderLineItemInput[]) {
  const productIds = [
    ...new Set(
      lineItems
        .filter(isCatalogOrderLineItem)
        .map((item) => item.productId.trim()),
    ),
  ];
  const products = productIds.length
    ? await prisma.product.findMany({ where: { id: { in: productIds } } })
    : [];
  const productById = new Map(products.map((product) => [product.id, product]));

  const resolvedItems: {
    productId?: string;
    name: string;
    sku: string;
    unitPrice: number;
    quantity: number;
  }[] = [];

  for (const item of lineItems) {
    if (!isCatalogOrderLineItem(item)) {
      resolvedItems.push({
        name: item.name.trim(),
        sku: "MANUAL",
        unitPrice: roundMoney(item.unitPrice),
        quantity: item.quantity,
      });
      continue;
    }

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
  deliveryAddressValidatedAt?: Date;
  branchId: BranchId;
  fulfillment: "pickup" | "delivery";
  smsNotify: boolean;
  pickupToken?: string;
  deliveryToken?: string;
  type: OrderType;
  status: OrderStatus;
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
        deliveryAddressValidatedAt:
          input.deliveryAddressValidatedAt ?? null,
        type: input.type,
        branchId: input.branchId,
        status: toPrismaOrderStatus(input.status),
        fulfillment: input.fulfillment,
        smsNotify: input.smsNotify,
        pickupToken: input.pickupToken ?? null,
        deliveryToken: input.deliveryToken ?? null,
        subtotal: input.subtotal,
        taxes: input.taxes,
        deliveryFee: input.deliveryFee,
        total: input.total,
        lineItems: {
          create: input.lineItems.map((item) => ({
            productId: item.productId ?? null,
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
  if (input.fulfillment === "delivery" && !input.deliveryAddressValidated) {
    throw new OrderValidationError(
      "Corrobora la dirección en Google Maps antes de crear la orden",
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
  const status: OrderStatus = "pendiente";

  await ensureBranches();

  const orderInput = {
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    telegramChatId: input.telegramChatId,
    deliveryAddress: input.deliveryAddress,
    deliveryAddressValidatedAt:
      input.fulfillment === "delivery" ? new Date() : undefined,
    branchId: input.branchId,
    fulfillment: input.fulfillment,
    smsNotify: input.smsNotify,
    pickupToken:
      input.fulfillment === "pickup" ? generatePickupToken() : undefined,
    deliveryToken:
      input.fulfillment === "delivery" ? generateDeliveryToken() : undefined,
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

export async function validateOrderDeliveryAddress(displayId: string) {
  const existing = await prisma.order.findUnique({
    where: { displayId },
  });

  if (!existing) {
    throw new OrderValidationError("Orden no encontrada");
  }
  if (
    existing.fulfillment !== "delivery" ||
    !existing.deliveryAddress?.trim()
  ) {
    throw new OrderValidationError(
      "La orden no tiene una dirección de entrega para validar",
    );
  }

  const updated = await prisma.order.update({
    where: { displayId },
    data: { deliveryAddressValidatedAt: new Date() },
    include: {
      lineItems: { orderBy: { name: "asc" } },
      delivery: true,
    },
  });

  return mapOrderDetail(updated);
}

export async function updateOrderStatus(
  displayId: string,
  nextStatus: OrderStatus,
  deliveryTime?: unknown,
) {
  const updated = await prisma.$transaction(async (tx) => {
    const existing = await tx.order.findUnique({
      where: { displayId },
      include: { lineItems: true },
    });

    if (!existing) {
      throw new OrderValidationError("Orden no encontrada");
    }

    const storedStatus = toAppOrderStatus(existing.status);
    const currentStatus = resolveDisplayStatus({
      status: storedStatus,
      fulfillment: existing.fulfillment,
      createdAt: existing.createdAt,
      dispatchedAt: existing.dispatchedAt,
    });

    const allowed = getAllowedStatusTransitions({
      type: existing.type,
      status: storedStatus,
      fulfillment: existing.fulfillment,
      createdAt: existing.createdAt,
      dispatchedAt: existing.dispatchedAt,
    });

    if (!allowed.includes(nextStatus)) {
      throw new OrderValidationError(
        `No se puede cambiar de "${currentStatus}" a "${nextStatus}"`,
      );
    }

    const deliveryEta =
      existing.fulfillment === "delivery" && nextStatus === "en-transito"
        ? formatDeliveryTime(deliveryTime)
        : null;

    if (
      existing.fulfillment === "delivery" &&
      nextStatus === "en-transito" &&
      !deliveryEta
    ) {
      throw new OrderValidationError(
        "Selecciona una hora aproximada para la entrega",
      );
    }

    const updateData: Prisma.OrderUpdateInput = {
      status: toPrismaOrderStatus(nextStatus),
    };

    if (
      existing.fulfillment === "delivery" &&
      nextStatus === "en-transito" &&
      !existing.dispatchedAt
    ) {
      updateData.dispatchedAt = new Date();
    }

    const updateResult = await tx.order.updateMany({
      where: {
        displayId,
        status: existing.status,
      },
      data: updateData,
    });

    if (updateResult.count === 0) {
      throw new OrderConflictError(
        "La orden fue modificada por otro proceso. Intenta de nuevo.",
      );
    }

    const order = await tx.order.findUniqueOrThrow({
      where: { displayId },
      include: {
        lineItems: { orderBy: { name: "asc" } },
        delivery: true,
      },
    });

    const statusLabel =
      nextStatus === "listo"
        ? "lista para pickup"
        : nextStatus === "en-transito"
          ? "despachada"
          : nextStatus === "completado"
            ? existing.fulfillment === "delivery"
              ? "entregada"
              : "completada"
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

    if (
      existing.fulfillment === "delivery" &&
      nextStatus === "en-transito" &&
      existing.deliveryAddress?.trim()
    ) {
      const dispatchedAt = order.dispatchedAt ?? new Date();
      await createDeliveryForOrder(tx, {
        orderId: existing.id,
        branchId: existing.branchId as BranchId,
        destination: existing.deliveryAddress.trim(),
        createdAt: dispatchedAt,
        eta: deliveryEta ?? undefined,
      });

      await tx.ping.create({
        data: {
          priority: "sistema",
          title: `Entrega Despachada: ${displayId}`,
          description: `Orden de ${existing.customerName} salió hacia ${existing.deliveryAddress.trim()}.`,
        },
      });

      await tx.notificationLog.create({
        data: {
          source: "SISTEMA",
          message: `Entrega despachada para orden ${displayId}.`,
          accent: "primary",
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

    return tx.order.findUniqueOrThrow({
      where: { displayId },
      include: {
        lineItems: { orderBy: { name: "asc" } },
        delivery: true,
      },
    });
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

    return { displayId, pickupToken: existing.pickupToken, deliveryToken: existing.deliveryToken };
  });
}
