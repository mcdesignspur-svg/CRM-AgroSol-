import { NextResponse } from "next/server";
import { createQuickPing, getLivePings } from "@/lib/db";
import type { BranchId, PingPriority } from "@/lib/types";
import { sendBranchPing } from "@/lib/db/branches";

export async function GET() {
  try {
    const pings = await getLivePings();
    return NextResponse.json(pings);
  } catch (error) {
    console.error("GET /api/pings", error);
    return NextResponse.json(
      { error: "Error al obtener pings" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const branchId = body.branchId as BranchId;
    const message = body.message as string | undefined;
    const priority = (body.priority as PingPriority) ?? "urgente";

    if (branchId) {
      await sendBranchPing(branchId, message);
    }

    const ping = await createQuickPing(branchId, message, priority);
    return NextResponse.json(ping, { status: 201 });
  } catch (error) {
    console.error("POST /api/pings", error);
    return NextResponse.json(
      { error: "Error al enviar ping" },
      { status: 500 },
    );
  }
}
