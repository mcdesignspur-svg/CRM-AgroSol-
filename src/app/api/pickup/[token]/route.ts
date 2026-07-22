import { NextResponse } from "next/server";
import {
  getPickupByToken,
  markCustomerArrived,
  PickupArrivalError,
} from "@/lib/db/pickup";
import { emitOrderRealtimeUpdates } from "@/lib/realtime/emit";

interface RouteContext {
  params: Promise<{ token: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { token } = await context.params;
    const pickup = await getPickupByToken(token);

    if (!pickup) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    return NextResponse.json(pickup);
  } catch (error) {
    console.error("GET /api/pickup/[token]", error);
    return NextResponse.json(
      { error: "Error al obtener la orden" },
      { status: 500 },
    );
  }
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { token } = await context.params;
    const pickup = await markCustomerArrived(token);
    void emitOrderRealtimeUpdates({ pickupToken: token });
    return NextResponse.json(pickup);
  } catch (error) {
    if (error instanceof PickupArrivalError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("POST /api/pickup/[token]", error);
    return NextResponse.json(
      { error: "Error al registrar llegada" },
      { status: 500 },
    );
  }
}
