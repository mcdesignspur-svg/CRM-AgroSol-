import { NextResponse } from "next/server";
import { getDeliveryByToken } from "@/lib/db/delivery";

interface RouteContext {
  params: Promise<{ token: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { token } = await context.params;
    const delivery = await getDeliveryByToken(token);

    if (!delivery) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    return NextResponse.json(delivery);
  } catch (error) {
    console.error("GET /api/delivery/[token]", error);
    return NextResponse.json(
      { error: "Error al obtener la orden" },
      { status: 500 },
    );
  }
}
