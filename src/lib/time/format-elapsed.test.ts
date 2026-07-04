import { describe, expect, it } from "vitest";
import {
  formatElapsedTime,
  getElapsedMs,
} from "@/lib/time/format-elapsed";
import { getOrderTimerClass } from "@/lib/order-timer-styles";

describe("formatElapsedTime", () => {
  const now = new Date("2026-07-04T12:00:00Z").getTime();

  it("formatea duración como HH:MM:SS", () => {
    const created = new Date(now - (2 * 3600 + 15 * 60 + 30) * 1000);
    expect(formatElapsedTime(created, now)).toBe("02:15:30");
  });

  it("no devuelve valores negativos", () => {
    const future = new Date(now + 60_000);
    expect(getElapsedMs(future, now)).toBe(0);
    expect(formatElapsedTime(future, now)).toBe("00:00:00");
  });

  it("acepta ISO string", () => {
    const created = new Date(now - 90_000).toISOString();
    expect(formatElapsedTime(created, now)).toBe("00:01:30");
  });
});

describe("getOrderTimerClass", () => {
  it("resalta atrasado en rojo y listo en ámbar", () => {
    expect(getOrderTimerClass("atrasado")).toContain("red");
    expect(getOrderTimerClass("listo")).toContain("amber");
    expect(getOrderTimerClass("pendiente")).not.toContain("red");
  });
});
