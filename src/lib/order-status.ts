import type { OrderStatus, OrderType } from "./types";
import { DELIVERY_SLA_HOURS, PICKUP_SLA_HOURS } from "./constants";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pendiente: "Pendiente",
  "en-transito": "En Tránsito",
  listo: "Listo para Pickup",
  atrasado: "Atrasado",
  completado: "Completado",
};

const PICKUP_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  pendiente: ["listo", "completado"],
  atrasado: ["listo", "completado"],
  listo: ["completado"],
};

const DELIVERY_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  "en-transito": ["completado"],
  atrasado: ["completado"],
};

export function isOrderOverdue(input: {
  status: OrderStatus;
  fulfillment: string;
  createdAt: Date;
}): boolean {
  if (input.status === "completado" || input.status === "listo") {
    return false;
  }

  const hours = (Date.now() - input.createdAt.getTime()) / 3_600_000;

  if (input.fulfillment === "pickup" && input.status === "pendiente") {
    return hours > PICKUP_SLA_HOURS;
  }

  if (input.fulfillment === "delivery" && input.status === "en-transito") {
    return hours > DELIVERY_SLA_HOURS;
  }

  return input.status === "atrasado";
}

export function resolveDisplayStatus(input: {
  status: OrderStatus;
  fulfillment: string;
  createdAt: Date;
}): OrderStatus {
  if (input.status === "completado" || input.status === "listo") {
    return input.status;
  }

  if (isOrderOverdue(input)) {
    return "atrasado";
  }

  return input.status;
}

export function getAllowedStatusTransitions(input: {
  type: OrderType;
  status: OrderStatus;
  fulfillment: string;
  createdAt: Date;
}): OrderStatus[] {
  const displayStatus = resolveDisplayStatus(input);
  const transitions =
    input.type === "retiro" || input.fulfillment === "pickup"
      ? PICKUP_TRANSITIONS
      : DELIVERY_TRANSITIONS;

  return transitions[displayStatus] ?? [];
}

export const STATUS_ACTION_LABELS: Partial<Record<OrderStatus, string>> = {
  listo: "Marcar Lista para Pickup",
  completado: "Marcar Completada",
};
