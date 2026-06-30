import { NextResponse } from "next/server";
import { getLoyverseStatus } from "@/lib/loyverse";

export async function GET() {
  try {
    const status = await getLoyverseStatus();
    return NextResponse.json(status);
  } catch (error) {
    console.error("GET /api/integrations/loyverse/status", error);
    return NextResponse.json(
      { error: "Error al consultar el estado de Loyverse" },
      { status: 500 },
    );
  }
}
