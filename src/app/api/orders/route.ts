import { NextResponse } from "next/server";
import { getRecentOrders, getOrdersCount, createOrder } from "@/lib/db";
import type { BranchId } from "@/lib/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit") ?? "20");
    const offset = Number(searchParams.get("offset") ?? "0");

    const [orders, total] = await Promise.all([
      getRecentOrders(limit, offset),
      getOrdersCount(),
    ]);

    return NextResponse.json({ orders, total, hasMore: offset + orders.length < total });
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
    const order = await createOrder({
      customerName: body.customerName ?? "Cliente",
      customerPhone: body.customerPhone,
      deliveryAddress: body.deliveryAddress,
      type: body.type ?? "retiro",
      branchId: body.branchId as BranchId,
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
    console.error("POST /api/orders", error);
    return NextResponse.json(
      { error: "Error al crear la orden" },
      { status: 500 },
    );
  }
}
