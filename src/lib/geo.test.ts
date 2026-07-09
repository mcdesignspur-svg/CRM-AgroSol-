import { describe, expect, it } from "vitest";
import {
  getDeliveryCoordinates,
  getSyntheticDeliveryCoordinates,
  isDeliveryHighlighted,
} from "./geo";
import type { Delivery } from "./types";

const baseDelivery: Delivery = {
  id: "TRK-1000",
  driverName: "Juan Rodriguez",
  driverInitials: "JR",
  destination: "Calle Principal 123",
  eta: "12:00",
  status: "recogida",
  branchId: "gurabo",
};

describe("geo", () => {
  it("uses persisted coordinates when present", () => {
    expect(
      getDeliveryCoordinates({
        ...baseDelivery,
        lat: 18.4,
        lng: -66.1,
      }),
    ).toEqual([18.4, -66.1]);
  });

  it("falls back to synthetic coordinates near the branch", () => {
    const synthetic = getSyntheticDeliveryCoordinates({
      id: baseDelivery.id,
      destination: baseDelivery.destination,
      branchId: "gurabo",
    });
    expect(getDeliveryCoordinates(baseDelivery)).toEqual(synthetic);
    expect(synthetic[0]).toBeGreaterThan(18);
    expect(synthetic[1]).toBeLessThan(-65);
  });

  it("highlights deliveries by order display id", () => {
    expect(
      isDeliveryHighlighted({ ...baseDelivery, orderId: "ORD-42" }, "ORD-42"),
    ).toBe(true);
    expect(isDeliveryHighlighted(baseDelivery, "ORD-42")).toBe(false);
  });
});
