export const MAX_LINE_ITEM_QUANTITY = 10_000;
export const MAX_MANUAL_ITEM_NAME_LENGTH = 160;
export const MAX_MANUAL_ITEM_UNIT_PRICE = 1_000_000;

export interface CatalogOrderLineItemInput {
  productId: string;
  quantity: number;
}

export interface ManualOrderLineItemInput {
  productId?: undefined;
  name: string;
  unitPrice: number;
  quantity: number;
}

export type CreateOrderLineItemInput =
  | CatalogOrderLineItemInput
  | ManualOrderLineItemInput;

export function isCatalogOrderLineItem(
  item: CreateOrderLineItemInput,
): item is CatalogOrderLineItemInput {
  return typeof item.productId === "string";
}

function parseQuantity(value: unknown): number | null {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value <= 0 ||
    value > MAX_LINE_ITEM_QUANTITY
  ) {
    return null;
  }

  return value;
}

export function parseOrderLineItems(
  raw: unknown,
): CreateOrderLineItemInput[] | null {
  if (!Array.isArray(raw) || raw.length === 0) {
    return null;
  }

  const items: CreateOrderLineItemInput[] = [];

  for (const rawItem of raw) {
    if (!rawItem || typeof rawItem !== "object") {
      return null;
    }

    const item = rawItem as Record<string, unknown>;
    const quantity = parseQuantity(item.quantity);

    if (!quantity) {
      return null;
    }

    if (item.productId !== undefined && item.productId !== null) {
      if (typeof item.productId !== "string" || !item.productId.trim()) {
        return null;
      }

      items.push({ productId: item.productId.trim(), quantity });
      continue;
    }

    if (typeof item.name !== "string") {
      return null;
    }

    const name = item.name.trim();
    const unitPrice = item.unitPrice;
    const roundedUnitPrice =
      typeof unitPrice === "number"
        ? Math.round(unitPrice * 100) / 100
        : Number.NaN;

    if (
      !name ||
      name.length > MAX_MANUAL_ITEM_NAME_LENGTH ||
      !Number.isFinite(roundedUnitPrice) ||
      roundedUnitPrice <= 0 ||
      roundedUnitPrice > MAX_MANUAL_ITEM_UNIT_PRICE
    ) {
      return null;
    }

    items.push({ name, unitPrice: roundedUnitPrice, quantity });
  }

  return items;
}
