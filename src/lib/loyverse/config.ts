export const LOYVERSE_API_BASE_URL =
  process.env.LOYVERSE_API_BASE_URL ?? "https://api.loyverse.com/v1.0";

export const LOYVERSE_RECEIPT_SOURCE =
  process.env.LOYVERSE_RECEIPT_SOURCE ?? "AgroSol CRM";

export function getLoyverseAccessToken(): string | null {
  const token = process.env.LOYVERSE_ACCESS_TOKEN?.trim();
  return token || null;
}

export function isLoyverseConfigured(): boolean {
  return Boolean(getLoyverseAccessToken());
}

export function getLoyverseWebhookSecret(): string | null {
  const secret = process.env.LOYVERSE_WEBHOOK_SECRET?.trim();
  return secret || null;
}
