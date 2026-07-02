import { describe, expect, it } from "vitest";
import {
  buildOrderConfirmationMessage,
  buildOrderReadyMessage,
} from "@/lib/pickup/messages";
import { normalizePhone } from "@/lib/sms/phone";

describe("normalizePhone", () => {
  it("normaliza teléfono de 10 dígitos de PR", () => {
    expect(normalizePhone("787-555-0100")).toBe("+17875550100");
  });

  it("acepta formato E.164", () => {
    expect(normalizePhone("+17875550100")).toBe("+17875550100");
  });

  it("rechaza números inválidos", () => {
    expect(normalizePhone("123")).toBeNull();
  });
});

describe("pickup messages", () => {
  const ctx = {
    displayId: "ORD-99001",
    customerName: "María",
    branchName: "Gurabo (Central)",
    branchAddress: "Av. Agrícola 450",
    branchPhone: "+17877504500",
    pickupToken: "abc123",
    total: 125.5,
  };

  it("incluye enlace en confirmación", () => {
    const message = buildOrderConfirmationMessage(ctx);
    expect(message).toContain("ORD-99001");
    expect(message).toContain("/retiro/abc123");
    expect(message).toContain("Te avisaremos cuando esté lista");
  });

  it("incluye enlace y teléfono en orden lista", () => {
    const message = buildOrderReadyMessage(ctx);
    expect(message).toContain("está lista para retiro");
    expect(message).toContain("/retiro/abc123");
    expect(message).toContain("787");
  });
});
