import { describe, expect, it } from "vitest";
import { getDeliveryFlowSteps, isDeliveryOrder } from "./flow";

describe("isDeliveryOrder", () => {
  it("returns false for pickup orders", () => {
    expect(
      isDeliveryOrder({
        type: "retiro",
        fulfillment: "pickup",
        status: "pendiente",
      }),
    ).toBe(false);
  });

  it("returns true for delivery orders", () => {
    expect(
      isDeliveryOrder({
        type: "entrega",
        fulfillment: "delivery",
        status: "pendiente",
      }),
    ).toBe(true);
  });
});

describe("getDeliveryFlowSteps", () => {
  it("marks preparation as active for pending delivery", () => {
    const steps = getDeliveryFlowSteps({
      type: "entrega",
      fulfillment: "delivery",
      status: "pendiente",
    });

    expect(steps).not.toBeNull();
    expect(steps?.find((s) => s.id === "preparacion")?.active).toBe(true);
    expect(steps?.find((s) => s.id === "en-camino")?.active).toBe(false);
  });

  it("marks en camino as active after dispatch", () => {
    const steps = getDeliveryFlowSteps({
      type: "entrega",
      fulfillment: "delivery",
      status: "en-transito",
      dispatchedAt: new Date().toISOString(),
    });

    expect(steps?.find((s) => s.id === "preparacion")?.done).toBe(true);
    expect(steps?.find((s) => s.id === "en-camino")?.active).toBe(true);
    expect(steps?.find((s) => s.id === "en-camino")?.done).toBe(false);
  });

  it("marks all steps done when completed", () => {
    const steps = getDeliveryFlowSteps({
      type: "entrega",
      fulfillment: "delivery",
      status: "completado",
      dispatchedAt: new Date().toISOString(),
    });

    expect(steps?.every((s) => s.done)).toBe(true);
    expect(steps?.every((s) => !s.active)).toBe(true);
  });
});
