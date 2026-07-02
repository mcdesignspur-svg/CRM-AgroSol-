import { describe, expect, it } from "vitest";
import {
  getAllowedStatusTransitions,
  isOrderOverdue,
  resolveDisplayStatus,
} from "./order-status";
import { DELIVERY_SLA_HOURS, PICKUP_SLA_HOURS } from "./constants";

const HOUR = 3_600_000;

function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * HOUR);
}

describe("isOrderOverdue", () => {
  it("marca pickup pendiente como atrasado pasado el SLA", () => {
    expect(
      isOrderOverdue({
        status: "pendiente",
        fulfillment: "pickup",
        createdAt: hoursAgo(PICKUP_SLA_HOURS + 1),
      }),
    ).toBe(true);
  });

  it("no marca pickup pendiente dentro del SLA", () => {
    expect(
      isOrderOverdue({
        status: "pendiente",
        fulfillment: "pickup",
        createdAt: hoursAgo(PICKUP_SLA_HOURS - 1),
      }),
    ).toBe(false);
  });

  it("marca delivery en tránsito como atrasado pasado el SLA", () => {
    expect(
      isOrderOverdue({
        status: "en-transito",
        fulfillment: "delivery",
        createdAt: hoursAgo(DELIVERY_SLA_HOURS + 1),
      }),
    ).toBe(true);
  });

  it("nunca marca órdenes completadas o listas como atrasadas", () => {
    for (const status of ["completado", "listo"] as const) {
      expect(
        isOrderOverdue({
          status,
          fulfillment: "pickup",
          createdAt: hoursAgo(100),
        }),
      ).toBe(false);
    }
  });
});

describe("resolveDisplayStatus", () => {
  it("resuelve atrasado para pickup vencido", () => {
    expect(
      resolveDisplayStatus({
        status: "pendiente",
        fulfillment: "pickup",
        createdAt: hoursAgo(PICKUP_SLA_HOURS + 1),
      }),
    ).toBe("atrasado");
  });

  it("conserva el estado almacenado dentro del SLA", () => {
    expect(
      resolveDisplayStatus({
        status: "en-transito",
        fulfillment: "delivery",
        createdAt: hoursAgo(1),
      }),
    ).toBe("en-transito");
  });

  it("conserva completado aunque haya pasado mucho tiempo", () => {
    expect(
      resolveDisplayStatus({
        status: "completado",
        fulfillment: "delivery",
        createdAt: hoursAgo(100),
      }),
    ).toBe("completado");
  });
});

describe("getAllowedStatusTransitions", () => {
  it("pickup pendiente permite listo y completado", () => {
    expect(
      getAllowedStatusTransitions({
        type: "retiro",
        status: "pendiente",
        fulfillment: "pickup",
        createdAt: hoursAgo(0),
      }),
    ).toEqual(["listo", "completado"]);
  });

  it("pickup listo solo permite completado", () => {
    expect(
      getAllowedStatusTransitions({
        type: "retiro",
        status: "listo",
        fulfillment: "pickup",
        createdAt: hoursAgo(0),
      }),
    ).toEqual(["completado"]);
  });

  it("delivery en tránsito solo permite completado", () => {
    expect(
      getAllowedStatusTransitions({
        type: "entrega",
        status: "en-transito",
        fulfillment: "delivery",
        createdAt: hoursAgo(0),
      }),
    ).toEqual(["completado"]);
  });

  it("delivery atrasado (por SLA) permite completado", () => {
    expect(
      getAllowedStatusTransitions({
        type: "entrega",
        status: "en-transito",
        fulfillment: "delivery",
        createdAt: hoursAgo(DELIVERY_SLA_HOURS + 1),
      }),
    ).toEqual(["completado"]);
  });

  it("completado no permite ninguna transición", () => {
    expect(
      getAllowedStatusTransitions({
        type: "retiro",
        status: "completado",
        fulfillment: "pickup",
        createdAt: hoursAgo(0),
      }),
    ).toEqual([]);
  });
});
