import { NextResponse } from "next/server";
import { linkTelegramChatToPickup } from "@/lib/db/pickup";
import { sendTelegramMessage } from "@/lib/telegram/client";

interface TelegramUpdate {
  message?: {
    chat: { id: number };
    text?: string;
  };
}

export async function POST(request: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
  if (secret) {
    const header = request.headers.get("x-telegram-bot-api-secret-token");
    if (header !== secret) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
  }

  try {
    const update = (await request.json()) as TelegramUpdate;
    const message = update.message;

    if (!message?.text || !message.chat?.id) {
      return NextResponse.json({ ok: true });
    }

    const chatId = String(message.chat.id);
    const text = message.text.trim();

    if (text.startsWith("/start")) {
      const token = text.split(/\s+/)[1]?.trim();

      if (!token) {
        await sendTelegramMessage(
          chatId,
          "Hola. Para vincular tu orden de pickup, abre el enlace que recibiste al registrar tu pedido.",
        );
        return NextResponse.json({ ok: true });
      }

      const result = await linkTelegramChatToPickup(token, chatId);

      if (!result.linked) {
        await sendTelegramMessage(
          chatId,
          "No encontramos una orden con ese enlace. Verifica con la sucursal.",
        );
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/telegram/webhook", error);
    return NextResponse.json({ ok: true });
  }
}
