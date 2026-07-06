import { describe, expect, it } from "vitest";
import { isNavActive } from "./navActive";

describe("isNavActive", () => {
  it("el panel solo está activo en la raíz exacta", () => {
    expect(isNavActive("/", "/")).toBe(true);
    expect(isNavActive("/ordenes", "/")).toBe(false);
  });

  it("/ordenes está activo en la lista y el detalle", () => {
    expect(isNavActive("/ordenes", "/ordenes")).toBe(true);
    expect(isNavActive("/ordenes/ORD-99001", "/ordenes")).toBe(true);
  });

  it("/ordenes NO está activo en /ordenes/nueva (gana el prefijo más largo)", () => {
    expect(isNavActive("/ordenes/nueva", "/ordenes")).toBe(false);
    expect(isNavActive("/ordenes/nueva", "/ordenes/nueva")).toBe(true);
  });

  it("rutas hermanas no se activan entre sí", () => {
    expect(isNavActive("/inventario", "/entregas")).toBe(false);
    expect(isNavActive("/sucursales", "/sucursales")).toBe(true);
  });
});
