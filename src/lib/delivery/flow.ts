import type { OrderStatus, OrderType } from "@/lib/types";

export type DeliveryFlowStepId =
  | "registrada"
  | "preparacion"
  | "en-camino"
  | "entregada";

export interface DeliveryFlowStep {
  id: DeliveryFlowStepId;
  label: string;
  done: boolean;
  active: boolean;
}

export interface DeliveryFlowInput {
  type: OrderType;
  fulfillment?: string;
  status: OrderStatus;
  dispatchedAt?: string;
}

export function isDeliveryOrder(input: DeliveryFlowInput): boolean {
  return input.type === "entrega" || input.fulfillment === "delivery";
}

export function getDeliveryFlowSteps(
  input: DeliveryFlowInput,
): DeliveryFlowStep[] | null {
  if (!isDeliveryOrder(input)) {
    return null;
  }

  const dispatched =
    Boolean(input.dispatchedAt) ||
    input.status === "en-transito" ||
    input.status === "atrasado" ||
    input.status === "completado";
  const completedDone = input.status === "completado";
  const inTransit =
    dispatched &&
    !completedDone &&
    (input.status === "en-transito" || input.status === "atrasado");

  return [
    {
      id: "registrada",
      label: "Registrada",
      done: true,
      active: false,
    },
    {
      id: "preparacion",
      label: "En preparación",
      done: dispatched,
      active: !dispatched && !completedDone,
    },
    {
      id: "en-camino",
      label: "En camino",
      done: completedDone,
      active: inTransit,
    },
    {
      id: "entregada",
      label: "Entregada",
      done: completedDone,
      active: false,
    },
  ];
}

export function getActiveDeliveryStepLabel(
  steps: DeliveryFlowStep[] | null,
): string | null {
  if (!steps) {
    return null;
  }

  const active = steps.find((step) => step.active);
  if (active) {
    return active.label;
  }

  const lastDone = [...steps].reverse().find((step) => step.done);
  return lastDone?.label ?? steps[0]?.label ?? null;
}
