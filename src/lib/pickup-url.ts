const APP_BASE_URL =
  process.env.APP_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

export function buildPickupUrl(token: string): string {
  return `${APP_BASE_URL}/retiro/${token}`;
}
