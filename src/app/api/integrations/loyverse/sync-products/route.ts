import { NextResponse } from "next/server";
import {
  getLoyverseStatus,
  isLoyverseConfigured,
  safeSyncLoyverseProducts,
} from "@/lib/loyverse";

export const dynamic = "force-dynamic";

export async function POST() {
  if (!isLoyverseConfigured()) {
    return NextResponse.json(
      { error: "LOYVERSE_ACCESS_TOKEN no configurado" },
      { status: 400 },
    );
  }

  const connection = await getLoyverseStatus();
  if (!connection.connected) {
    return NextResponse.json({ error: connection.message }, { status: 401 });
  }

  const result = await safeSyncLoyverseProducts();
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json(result);
}
