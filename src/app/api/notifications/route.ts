import { NextResponse } from "next/server";
import { clearNotificationLogs, getNotificationLogs } from "@/lib/db";

export async function GET() {
  try {
    const logs = await getNotificationLogs();
    return NextResponse.json(logs);
  } catch (error) {
    console.error("GET /api/notifications", error);
    return NextResponse.json(
      { error: "Error al obtener notificaciones" },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  try {
    await clearNotificationLogs();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/notifications", error);
    return NextResponse.json(
      { error: "Error al limpiar notificaciones" },
      { status: 500 },
    );
  }
}
