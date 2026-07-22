import type { DashboardUpdates } from "@/lib/types";
import type { PublicPickupOrder } from "@/lib/db/pickup";
import type { PublicDeliveryOrder } from "@/lib/db/delivery";

export type RealtimeClientMessage =
  | { action: "subscribe"; channel: "dashboard" }
  | { action: "subscribe"; channel: "pickup"; token: string }
  | { action: "subscribe"; channel: "delivery"; token: string }
  | { action: "ping" };

export type RealtimeServerMessage =
  | { type: "connected" }
  | { type: "dashboard:update"; data: DashboardUpdates }
  | { type: "pickup:update"; data: PublicPickupOrder }
  | { type: "delivery:update"; data: PublicDeliveryOrder };

export function dashboardChannel(): string {
  return "dashboard";
}

export function pickupChannel(token: string): string {
  return `pickup:${token}`;
}

export function deliveryChannel(token: string): string {
  return `delivery:${token}`;
}

export function parseClientMessage(raw: string): RealtimeClientMessage | null {
  try {
    const data = JSON.parse(raw) as RealtimeClientMessage;
    if (data.action === "ping") {
      return data;
    }
    if (data.action === "subscribe" && data.channel === "dashboard") {
      return data;
    }
    if (
      data.action === "subscribe" &&
      data.channel === "pickup" &&
      typeof data.token === "string" &&
      data.token.trim()
    ) {
      return { ...data, token: data.token.trim() };
    }
    if (
      data.action === "subscribe" &&
      data.channel === "delivery" &&
      typeof data.token === "string" &&
      data.token.trim()
    ) {
      return { ...data, token: data.token.trim() };
    }
    return null;
  } catch {
    return null;
  }
}
