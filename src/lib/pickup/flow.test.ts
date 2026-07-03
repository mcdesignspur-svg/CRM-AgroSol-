import { describe, expect, it } from "vitest";
import { getActivePickupStepLabel, getPickupFlowSteps } from "./flow";

describe("getPickupFlowSteps", () => {
  it("returns null for delivery orders", () => {
    expect(
      getPickupFlowSteps({
        type: "entrega",
        fulfillment: "delivery",
        status: "en-transito",
      }),
    ).toBeNull();
  });

  it("marks confirmation as active for a new pickup", () => {
    const steps = getPickupFlowSteps({
      type: "retiro",
      fulfillment: "pickup",
      status: "pendiente",
    });

    expect(steps).not.toBeNull();
    expect(steps?.[0]).toMatchObject({ id: "confirmacion", active: true });
    expect(getActivePickupStepLabel(steps)).toBe("Confirmada");
  });

  it("marks lista as active after confirmation", () => {
    const steps = getPickupFlowSteps({
      type: "retiro",
      fulfillment: "pickup",
      status: "pendiente",
      confirmationNotifiedAt: "2026-07-03T12:00:00.000Z",
    });

    expect(steps?.[1]).toMatchObject({ id: "lista", active: true, done: false });
    expect(getActivePickupStepLabel(steps)).toBe("Lista");
  });

  it("marks llegada as active when order is ready", () => {
    const steps = getPickupFlowSteps({
      type: "retiro",
      fulfillment: "pickup",
      status: "listo",
      confirmationNotifiedAt: "2026-07-03T12:00:00.000Z",
      readyNotifiedAt: "2026-07-03T12:30:00.000Z",
    });

    expect(steps?.[2]).toMatchObject({ id: "llegada", active: true });
    expect(getActivePickupStepLabel(steps)).toBe("Cliente llegó");
  });
});
