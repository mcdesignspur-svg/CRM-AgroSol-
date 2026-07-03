import type { OrderStatus, OrderType } from "@/lib/types";

export type PickupFlowStepId =
  | "confirmacion"
  | "lista"
  | "llegada"
  | "completada";

export interface PickupFlowStep {
  id: PickupFlowStepId;
  label: string;
  done: boolean;
  active: boolean;
}

export interface PickupFlowInput {
  type: OrderType;
  fulfillment?: string;
  status: OrderStatus;
  confirmationNotifiedAt?: string;
  readyNotifiedAt?: string;
  arrivedAt?: string;
}

export function isPickupOrder(input: PickupFlowInput): boolean {
  return input.type === "retiro" || input.fulfillment === "pickup";
}

export function getPickupFlowSteps(input: PickupFlowInput): PickupFlowStep[] | null {
  if (!isPickupOrder(input)) {
    return null;
  }

  const confirmationDone = Boolean(input.confirmationNotifiedAt);
  const readyDone =
    Boolean(input.readyNotifiedAt) ||
    input.status === "listo" ||
    input.status === "completado";
  const arrivedDone = Boolean(input.arrivedAt);
  const completedDone = input.status === "completado";

  return [
    {
      id: "confirmacion",
      label: "Confirmada",
      done: confirmationDone,
      active: !confirmationDone && !completedDone,
    },
    {
      id: "lista",
      label: "Lista",
      done: readyDone,
      active: confirmationDone && !readyDone && !completedDone,
    },
    {
      id: "llegada",
      label: "Cliente llegó",
      done: arrivedDone,
      active: readyDone && !arrivedDone && !completedDone,
    },
    {
      id: "completada",
      label: "Completada",
      done: completedDone,
      active: arrivedDone && !completedDone,
    },
  ];
}

export function getActivePickupStepLabel(
  steps: PickupFlowStep[] | null,
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
