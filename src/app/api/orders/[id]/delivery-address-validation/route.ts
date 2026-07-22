import { NextResponse } from "next/server";
import {
  OrderValidationError,
  validateOrderDeliveryAddress,
} from "@/lib/db";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const order = await validateOrderDeliveryAddress(decodeURIComponent(id));
    return NextResponse.json(order);
  } catch (error) {
    if (error instanceof OrderValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("PATCH /api/orders/[id]/delivery-address-validation", error);
    return NextResponse.json(
      { error: "Error al validar la dirección" },
      { status: 500 },
    );
  }
}
