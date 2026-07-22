import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import {
  getActiveDeliveryOrders,
  getRecentOrders,
  getOrdersCount,
  createOrder,
  getOrderByDisplayId,
  OrderValidationError,
  OrderConflictError,
  type OrderFilters,
} from "@/lib/db";
import { isBranchId } from "@/lib/branch-definitions";
import {
  sendPickupOrderConfirmationByDisplayId,
} from "@/lib/pickup/notify";
import { emitOrderRealtimeUpdates } from "@/lib/realtime/emit";
import type { BranchId, OrderStatus, OrderType } from "@/lib/types";

const ORDER_STATUS_FILTERS = new Set<OrderStatus | "all">([
  "all",
  "pendiente",
  "en-transito",
  "listo",
  "atrasado",
  "completado",
]);

const ORDER_TYPE_FILTERS = new Set<OrderType | "all">([
  "all",
  "entrega",
  "retiro",
]);

function parseStatus(value: string | null): OrderStatus | "all" {
  if (value && ORDER_STATUS_FILTERS.has(value as OrderStatus | "all")) {
    return value === "all" ? "all" : (value as OrderStatus);
  }
  return "all";
}

function parseType(value: string | null): OrderType | "all" {
  if (value && ORDER_TYPE_FILTERS.has(value as OrderType | "all")) {
    return value === "all" ? "all" : (value as OrderType);
  }
  return "all";
}

function parseLimit(value: string | null): number {
  const parsed = Number(value ?? "20");
  if (!Number.isFinite(parsed)) {
    return 20;
  }
  return Math.min(100, Math.max(1, Math.trunc(parsed)));
}

function parseOffset(value: string | null): number {
  const parsed = Number(value ?? "0");
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }
  return Math.trunc(parsed);
}

function parseFilters(searchParams: URLSearchParams): OrderFilters {
  const branchId = searchParams.get("branchId");
  const fulfillment = searchParams.get("fulfillment");
  const activeDelivery = searchParams.get("activeDelivery") === "true";
  const q = searchParams.get("q") ?? undefined;

  return {
    status: parseStatus(searchParams.get("status")),
    type: parseType(searchParams.get("type")),
    branchId:
      branchId && isBranchId(branchId) ? (branchId as BranchId) : "all",
    fulfillment:
      fulfillment === "pickup" || fulfillment === "delivery"
        ? fulfillment
        : "all",
    activeDelivery,
    q,
  };
}

function parseLineItems(
  raw: unknown,
): { productId: string; quantity: number }[] | null {
  if (!Array.isArray(raw) || raw.length === 0) {
    return null;
  }

  const items: { productId: string; quantity: number }[] = [];

  for (const item of raw) {
    if (!item || typeof item !== "object") {
      return null;
    }

    const productId = (item as { productId?: unknown }).productId;
    const quantity = (item as { quantity?: unknown }).quantity;

    if (typeof productId !== "string" || !productId.trim()) {
      return null;
    }

    if (
      typeof quantity !== "number" ||
      !Number.isInteger(quantity) ||
      quantity <= 0 ||
      quantity > 10_000
    ) {
      return null;
    }

    items.push({ productId: productId.trim(), quantity });
  }

  return items;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseLimit(searchParams.get("limit"));
    const offset = parseOffset(searchParams.get("offset"));
    const filters = parseFilters(searchParams);

    if (filters.activeDelivery) {
      const [orders, total] = await Promise.all([
        getActiveDeliveryOrders(limit, offset),
        getOrdersCount({ activeDelivery: true }),
      ]);

      return NextResponse.json({
        orders,
        total,
        hasMore: offset + orders.length < total,
      });
    }

    const [orders, total] = await Promise.all([
      getRecentOrders(limit, offset, filters),
      getOrdersCount(filters),
    ]);

    return NextResponse.json({
      orders,
      total,
      hasMore: offset + orders.length < total,
    });
  } catch (error) {
    console.error("GET /api/orders", error);
    return NextResponse.json(
      { error: "Error al obtener órdenes" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const branchId = String(body.branchId ?? "");

    if (!isBranchId(branchId)) {
      return NextResponse.json(
        { error: "Selecciona una sucursal válida" },
        { status: 400 },
      );
    }

    const fulfillment =
      body.fulfillment === "delivery" ? "delivery" : "pickup";
    const lineItems = parseLineItems(body.lineItems);

    if (!lineItems) {
      return NextResponse.json(
        {
          error:
            "lineItems debe ser un arreglo no vacío con productId (string) y quantity (entero 1–10000)",
        },
        { status: 400 },
      );
    }

    const order = await createOrder({
      customerName: String(body.customerName ?? ""),
      customerPhone: body.customerPhone
        ? String(body.customerPhone)
        : undefined,
      telegramChatId: body.telegramChatId
        ? String(body.telegramChatId)
        : undefined,
      deliveryAddress: body.deliveryAddress
        ? String(body.deliveryAddress)
        : undefined,
      branchId: branchId as BranchId,
      fulfillment,
      smsNotify: Boolean(body.smsNotify),
      lineItems,
    });

    if (order.fulfillment === "pickup") {
      try {
        await sendPickupOrderConfirmationByDisplayId(order.id);
        const refreshed = await getOrderByDisplayId(order.id);
        if (refreshed) {
          void emitOrderRealtimeUpdates({
            pickupToken: refreshed.pickupToken,
            deliveryToken: refreshed.deliveryToken,
          });
          return NextResponse.json(refreshed, { status: 201 });
        }
      } catch (error) {
        console.error("POST /api/orders telegram confirmation", error);
      }
    }

    void emitOrderRealtimeUpdates({
      pickupToken: order.pickupToken,
      deliveryToken: order.deliveryToken,
    });
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    if (error instanceof OrderValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof OrderConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return NextResponse.json(
        {
          error:
            "No se pudo vincular la orden con la sucursal o un producto. Verifica que la base de datos esté inicializada.",
        },
        { status: 409 },
      );
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Conflicto al generar el número de orden. Intenta de nuevo." },
        { status: 409 },
      );
    }
    console.error("POST /api/orders", error);
    return NextResponse.json(
      { error: "Error al crear la orden" },
      { status: 500 },
    );
  }
}
