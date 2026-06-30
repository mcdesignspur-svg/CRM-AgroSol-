import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import {
  getRecentOrders,
  getOrdersCount,
  createOrder,
  OrderValidationError,
  type OrderFilters,
} from "@/lib/db";
import { isBranchId } from "@/lib/branch-definitions";
import type { BranchId, OrderStatus, OrderType } from "@/lib/types";

export const dynamic = "force-dynamic";

function parseFilters(searchParams: URLSearchParams): OrderFilters {
  const status = searchParams.get("status");
  const type = searchParams.get("type");
  const branchId = searchParams.get("branchId");
  const q = searchParams.get("q")?.trim() || undefined;

  return {
    status: (status as OrderStatus | "all" | null) ?? "all",
    type: (type as OrderType | "all" | null) ?? "all",
    branchId:
      branchId && isBranchId(branchId) ? (branchId as BranchId) : "all",
    q,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit") ?? "20");
    const offset = Number(searchParams.get("offset") ?? "0");
    const filters = parseFilters(searchParams);

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

    const order = await createOrder({
      customerName: String(body.customerName ?? ""),
      customerPhone: body.customerPhone
        ? String(body.customerPhone)
        : undefined,
      deliveryAddress: body.deliveryAddress
        ? String(body.deliveryAddress)
        : undefined,
      type: body.type ?? "retiro",
      branchId: branchId as BranchId,
      fulfillment: body.fulfillment ?? "pickup",
      smsNotify: Boolean(body.smsNotify),
      subtotal: Number(body.subtotal ?? 0),
      taxes: Number(body.taxes ?? 0),
      deliveryFee: Number(body.deliveryFee ?? 0),
      total: Number(body.total ?? 0),
      lineItems: body.lineItems ?? [],
    });
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    if (error instanceof OrderValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
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
