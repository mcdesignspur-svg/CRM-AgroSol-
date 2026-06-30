import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import {
  getOrderByDisplayId,
  updateOrderStatus,
  OrderValidationError,
} from "@/lib/db";
import type { OrderStatus } from "@/lib/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const order = await getOrderByDisplayId(decodeURIComponent(id));

    if (!order) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("GET /api/orders/[id]", error);
    return NextResponse.json(
      { error: "Error al obtener la orden" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const status = body.status as OrderStatus;

    if (!status) {
      return NextResponse.json(
        { error: "El estado es obligatorio" },
        { status: 400 },
      );
    }

    const order = await updateOrderStatus(decodeURIComponent(id), status);
    return NextResponse.json(order);
  } catch (error) {
    if (error instanceof OrderValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }
    console.error("PATCH /api/orders/[id]", error);
    return NextResponse.json(
      { error: "Error al actualizar la orden" },
      { status: 500 },
    );
  }
}
