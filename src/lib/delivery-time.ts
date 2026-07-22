import { DELIVERY_SLA_HOURS } from "@/lib/constants";

const DELIVERY_TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function formatDeliveryTime(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const match = DELIVERY_TIME_PATTERN.exec(value.trim());
  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = match[2];
  const period = hours < 12 ? "a. m." : "p. m.";
  const displayHours = hours % 12 || 12;

  return `${displayHours}:${minutes} ${period}`;
}

export function getDefaultDeliveryTime(reference = new Date()): string {
  const estimated = new Date(
    reference.getTime() + DELIVERY_SLA_HOURS * 3_600_000,
  );

  return `${String(estimated.getHours()).padStart(2, "0")}:${String(
    estimated.getMinutes(),
  ).padStart(2, "0")}`;
}
