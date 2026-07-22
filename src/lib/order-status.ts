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
  pendiente: ["en-transito", "completado"],
  "en-transito": ["completado"],
};

function getDeliveryTransitions(input: {
  status: OrderStatus;
  displayStatus: OrderStatus;
}): OrderStatus[] {
  if (input.displayStatus === "atrasado") {
    if (input.status === "pendiente") {
      return ["en-transito", "completado"];
    }
    if (input.status === "en-transito") {
      return ["completado"];
    }
  }

  return DELIVERY_TRANSITIONS[input.displayStatus] ?? [];
}

export function isOrderOverdue(input: {
  status: OrderStatus;
  fulfillment: string;
  createdAt: Date;
  dispatchedAt?: Date | null;
  now?: number;
}): boolean {
  if (input.status === "completado" || input.status === "listo") {
    return false;
  }

  const now = input.now ?? Date.now();
  const hours = (now - input.createdAt.getTime()) / 3_600_000;

  if (input.fulfillment === "pickup" && input.status === "pendiente") {
    return hours > PICKUP_SLA_HOURS;
  }

  if (input.fulfillment === "delivery" && input.status === "pendiente") {
    return hours > PICKUP_SLA_HOURS;
  }

  if (input.fulfillment === "delivery" && input.status === "en-transito") {
    const reference = input.dispatchedAt ?? input.createdAt;
    const transitHours = (now - reference.getTime()) / 3_600_000;
    return transitHours > DELIVERY_SLA_HOURS;
  }

  return input.status === "atrasado";
}

export function resolveDisplayStatus(input: {
  status: OrderStatus;
  fulfillment: string;
  createdAt: Date;
  dispatchedAt?: Date | null;
  now?: number;
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
  dispatchedAt?: Date | null;
  now?: number;
}): OrderStatus[] {
  const displayStatus = resolveDisplayStatus(input);
  if (input.type === "entrega" || input.fulfillment === "delivery") {
    return getDeliveryTransitions({
      status: input.status,
      displayStatus,
    });
  }

  const transitions = PICKUP_TRANSITIONS;

  return transitions[displayStatus] ?? [];
}

export const STATUS_ACTION_LABELS: Partial<Record<OrderStatus, string>> = {
  listo: "Marcar Lista para Pickup",
  "en-transito": "Marcar Despachada",
  completado: "Marcar Completada",
};

export function getStatusActionLabel(
  status: OrderStatus,
  fulfillment?: string,
): string {
  if (status === "completado" && fulfillment === "delivery") {
    return "Marcar Entregada";
  }

  return STATUS_ACTION_LABELS[status] ?? ORDER_STATUS_LABELS[status];
}
