import { NextResponse } from "next/server";
import { buildDashboardUpdates } from "@/lib/realtime/build-dashboard-updates";

export async function GET() {
  try {
    const payload = await buildDashboardUpdates();
    return NextResponse.json(payload);
  } catch (error) {
    console.error("GET /api/dashboard/updates", error);
    return NextResponse.json(
      { error: "Error al obtener actualizaciones del panel" },
      { status: 500 },
    );
  }
}
