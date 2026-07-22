import { NextResponse } from "next/server";
import { getLivePings } from "@/lib/db";
import { createQuickPingInTx } from "@/lib/db/pings";
import { sendBranchPingInTx } from "@/lib/db/branches";
import { isBranchId } from "@/lib/branch-definitions";
import { emitDashboardRefresh } from "@/lib/realtime/emit";
import { prisma } from "@/lib/prisma";
import type { PingPriority } from "@/lib/types";

const PING_PRIORITIES = new Set<PingPriority>([
  "urgente",
  "sistema",
  "advertencia",
]);

function parsePriority(value: unknown): PingPriority | null {
  if (typeof value !== "string") {
    return "urgente";
  }
  return PING_PRIORITIES.has(value as PingPriority)
    ? (value as PingPriority)
    : null;
}

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
    const branchId =
      typeof body.branchId === "string" ? body.branchId.trim() : "";
    const message =
      typeof body.message === "string" ? body.message : undefined;
    const priority = parsePriority(body.priority);

    if (branchId && !isBranchId(branchId)) {
      return NextResponse.json(
        { error: "La sucursal indicada no es válida" },
        { status: 400 },
      );
    }

    if (priority === null) {
      return NextResponse.json(
        {
          error:
            'Prioridad inválida. Valores permitidos: urgente, sistema, advertencia',
        },
        { status: 400 },
      );
    }

    const ping = await prisma.$transaction(async (tx) => {
      if (branchId) {
        await sendBranchPingInTx(tx, branchId, message);
      }
      return createQuickPingInTx(tx, branchId, message, priority);
    });

    void emitDashboardRefresh();
    return NextResponse.json(ping, { status: 201 });
  } catch (error) {
    console.error("POST /api/pings", error);
    return NextResponse.json(
      { error: "Error al enviar ping" },
      { status: 500 },
    );
  }
}
