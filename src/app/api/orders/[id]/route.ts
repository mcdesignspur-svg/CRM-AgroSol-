import { NextResponse } from "next/server";
import {
  getOrderByDisplayId,
  updateOrderStatus,
  OrderValidationError,
  OrderConflictError,
} from "@/lib/db";
import { sendPickupOrderReadyByDisplayId } from "@/lib/pickup/notify";
import { emitOrderRealtimeUpdates } from "@/lib/realtime/emit";
import type { OrderStatus } from "@/lib/types";

const ORDER_STATUSES: OrderStatus[] = [
  "pendiente",
  "en-transito",
  "listo",
  "atrasado",
  "completado",
];

function isOrderStatus(value: unknown): value is OrderStatus {
  return (
    typeof value === "string" &&
    ORDER_STATUSES.includes(value as OrderStatus)
  );
}

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

    if (!isOrderStatus(body.status)) {
      return NextResponse.json(
        {
          error: `Estado inválido. Valores permitidos: ${ORDER_STATUSES.join(", ")}`,
        },
        { status: 400 },
      );
    }

    const order = await updateOrderStatus(decodeURIComponent(id), body.status);

    if (order.fulfillment === "pickup" && body.status === "listo") {
      try {
        await sendPickupOrderReadyByDisplayId(order.id);
        const refreshed = await getOrderByDisplayId(order.id);
        if (refreshed) {
          void emitOrderRealtimeUpdates(refreshed.pickupToken);
          return NextResponse.json(refreshed);
        }
      } catch (error) {
        console.error("PATCH /api/orders/[id] telegram ready", error);
      }
    }

    void emitOrderRealtimeUpdates(order.pickupToken);
    return NextResponse.json(order);
  } catch (error) {
    if (error instanceof OrderValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof OrderConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("PATCH /api/orders/[id]", error);
    return NextResponse.json(
      { error: "Error al actualizar la orden" },
      { status: 500 },
    );
  }
}
