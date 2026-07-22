import { describe, expect, it } from "vitest";
import {
  formatDeliveryTime,
  getDefaultDeliveryTime,
} from "@/lib/delivery-time";

describe("formatDeliveryTime", () => {
  it.each([
    ["00:00", "12:00 a. m."],
    ["09:05", "9:05 a. m."],
    ["12:30", "12:30 p. m."],
    ["18:45", "6:45 p. m."],
  ])("formatea %s para mostrarlo al cliente", (input, expected) => {
    expect(formatDeliveryTime(input)).toBe(expected);
  });

  it.each([undefined, null, "", "9:30", "24:00", "12:60"])(
    "rechaza una hora inválida: %s",
    (input) => {
      expect(formatDeliveryTime(input)).toBeNull();
    },
  );
});

describe("getDefaultDeliveryTime", () => {
  it("propone la hora usando el SLA actual", () => {
    expect(getDefaultDeliveryTime(new Date(2026, 6, 22, 10, 15))).toBe(
      "14:15",
    );
  });
});
