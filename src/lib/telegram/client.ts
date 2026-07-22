export interface TelegramSendResult {
  sent: boolean;
  provider: "telegram" | "console";
  messageId?: number;
  error?: string;
}

function getBotToken(): string | null {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  return token || null;
}

export function getBotUsername(): string | null {
  const username = process.env.TELEGRAM_BOT_USERNAME?.trim();
  return username?.replace(/^@/, "") || null;
}

export function getNotificationsChatId(): string | null {
  const chatId = process.env.TELEGRAM_NOTIFICATIONS_CHAT_ID?.trim();
  return chatId || null;
}

export function resolveNotificationChatId(
  orderChatId?: string | null,
): string | null {
  return orderChatId?.trim() || getNotificationsChatId();
}

export function buildTelegramStartLink(pickupToken: string): string | null {
  const username = getBotUsername();
  if (!username) return null;
  return `https://t.me/${username}?start=${pickupToken}`;
}

async function sendViaTelegram(
  chatId: string,
  text: string,
): Promise<TelegramSendResult> {
  const token = getBotToken();
  if (!token) {
    return { sent: false, provider: "console", error: "TELEGRAM_BOT_TOKEN no configurado" };
  }

  const response = await fetch(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        disable_web_page_preview: false,
      }),
    },
  );

  const data = (await response.json()) as {
    ok: boolean;
    result?: { message_id: number };
    description?: string;
  };

  if (!data.ok) {
    return {
      sent: false,
      provider: "telegram",
      error: data.description ?? `Telegram HTTP ${response.status}`,
    };
  }

  return {
    sent: true,
    provider: "telegram",
    messageId: data.result?.message_id,
  };
}

function sendViaConsole(chatId: string, text: string): TelegramSendResult {
  console.info("[Telegram:console]", { chatId, text });
  const isProduction = process.env.VERCEL_ENV === "production";
  return {
    sent: !isProduction,
    provider: "console",
    error: isProduction
      ? "TELEGRAM_BOT_TOKEN no configurado en producción"
      : undefined,
  };
}

export function getTelegramConfigStatus() {
  const token = getBotToken();
  const username = getBotUsername();
  const chatId = getNotificationsChatId();
  return {
    configured: Boolean(token && username && chatId),
    hasToken: Boolean(token),
    hasUsername: Boolean(username),
    hasNotificationsChatId: Boolean(chatId),
  };
}

export async function sendTelegramMessage(
  chatId: string,
  text: string,
): Promise<TelegramSendResult> {
  if (!chatId.trim()) {
    return { sent: false, provider: "console", error: "chat_id vacío" };
  }

  if (getBotToken()) {
    return sendViaTelegram(chatId, text);
  }

  return sendViaConsole(chatId, text);
}
