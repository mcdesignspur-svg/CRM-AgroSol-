import { NextResponse } from "next/server";
import {
  LoyverseApiError,
  runFullLoyverseSync,
  syncCustomersFromLoyverse,
  syncItemsFromLoyverse,
  syncStoresFromLoyverse,
} from "@/lib/loyverse";

type SyncScope = "all" | "stores" | "items" | "customers";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const scope = (body.scope as SyncScope | undefined) ?? "all";

    let result;

    switch (scope) {
      case "stores":
        result = { stores: await syncStoresFromLoyverse() };
        break;
      case "items":
        result = { items: await syncItemsFromLoyverse() };
        break;
      case "customers":
        result = { customers: await syncCustomersFromLoyverse() };
        break;
      default:
        result = await runFullLoyverseSync();
        break;
    }

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof LoyverseApiError) {
      return NextResponse.json(
        { error: error.message, status: error.status },
        { status: error.status >= 400 ? error.status : 502 },
      );
    }

    console.error("POST /api/integrations/loyverse/sync", error);
    return NextResponse.json(
      { error: "Error al sincronizar con Loyverse" },
      { status: 500 },
    );
  }
}
