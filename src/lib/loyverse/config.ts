export const LOYVERSE_API_BASE = "https://api.loyverse.com/v1.0";

export function getLoyverseAccessToken(): string | null {
  const token = process.env.LOYVERSE_ACCESS_TOKEN?.trim();
  return token || null;
}

export function isLoyverseConfigured(): boolean {
  return !!getLoyverseAccessToken();
}
