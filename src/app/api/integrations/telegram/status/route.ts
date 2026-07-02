import { NextResponse } from "next/server";
import { getTelegramConfigStatus } from "@/lib/telegram/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const status = getTelegramConfigStatus();
  return NextResponse.json({
    ...status,
    ready: status.configured,
    message: status.configured
      ? "Telegram configurado para notificaciones de pickup"
      : "Faltan variables de entorno de Telegram en Vercel (TELEGRAM_BOT_TOKEN, TELEGRAM_BOT_USERNAME, TELEGRAM_NOTIFICATIONS_CHAT_ID)",
  });
}
