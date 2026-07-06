import { describe, expect, it } from "vitest";
import {
  formatStockQuantity,
  getStockStatus,
} from "@/lib/inventory/stock-status";

describe("getStockStatus", () => {
  it("clasifica stock desconocido, agotado, bajo y normal", () => {
    expect(getStockStatus(undefined)).toBe("unknown");
    expect(getStockStatus(null)).toBe("unknown");
    expect(getStockStatus(0)).toBe("out");
    expect(getStockStatus(3)).toBe("low");
    expect(getStockStatus(5)).toBe("low");
    expect(getStockStatus(6)).toBe("ok");
  });
});

describe("formatStockQuantity", () => {
  it("formatea cantidades y muestra sin datos", () => {
    expect(formatStockQuantity(null)).toBe("Sin datos");
    expect(formatStockQuantity(1200)).toBe("1,200");
  });
});
