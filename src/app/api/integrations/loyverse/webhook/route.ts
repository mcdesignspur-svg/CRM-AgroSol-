import { NextResponse } from "next/server";
import { getLoyverseWebhookSecret } from "@/lib/loyverse/config";
import { handleLoyverseWebhook } from "@/lib/loyverse";
import type { LoyverseWebhookPayload } from "@/lib/loyverse/types";

export async function POST(request: Request) {
  try {
    const secret = getLoyverseWebhookSecret();
    if (secret) {
      const provided = request.headers.get("x-loyverse-secret");
      if (provided !== secret) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
      }
    }

    const payload = (await request.json()) as LoyverseWebhookPayload;
    await handleLoyverseWebhook(payload);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/integrations/loyverse/webhook", error);
    return NextResponse.json(
      { error: "Error al procesar webhook de Loyverse" },
      { status: 500 },
    );
  }
}
