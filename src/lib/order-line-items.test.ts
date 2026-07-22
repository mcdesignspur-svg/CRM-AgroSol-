import { describe, expect, it } from "vitest";
import { parseOrderLineItems } from "@/lib/order-line-items";

describe("parseOrderLineItems", () => {
  it("normaliza productos del inventario", () => {
    expect(
      parseOrderLineItems([{ productId: "  product-1  ", quantity: 2 }]),
    ).toEqual([{ productId: "product-1", quantity: 2 }]);
  });

  it("acepta partidas manuales sin productId", () => {
    expect(
      parseOrderLineItems([
        { name: "  Servicio de instalación  ", unitPrice: 12.345, quantity: 1 },
      ]),
    ).toEqual([
      { name: "Servicio de instalación", unitPrice: 12.35, quantity: 1 },
    ]);
  });

  it("acepta una combinación de inventario y partidas manuales", () => {
    expect(
      parseOrderLineItems([
        { productId: "product-1", quantity: 1 },
        { name: "Artículo especial", unitPrice: 25, quantity: 3 },
      ]),
    ).toHaveLength(2);
  });

  it.each([
    [{ productId: "", quantity: 1 }],
    [{ name: "", unitPrice: 10, quantity: 1 }],
    [{ name: "Artículo", unitPrice: 0, quantity: 1 }],
    [{ name: "Artículo", unitPrice: 10, quantity: 0 }],
    [{ name: "Artículo", unitPrice: 10, quantity: 1.5 }],
  ])("rechaza partidas inválidas", (lineItems) => {
    expect(parseOrderLineItems(lineItems)).toBeNull();
  });
});
