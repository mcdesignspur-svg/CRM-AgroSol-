export const LOW_STOCK_THRESHOLD = 5;

export type StockStatus = "unknown" | "out" | "low" | "ok";

export function getStockStatus(
  stockQuantity: number | null | undefined,
): StockStatus {
  if (stockQuantity === null || stockQuantity === undefined) {
    return "unknown";
  }
  if (stockQuantity <= 0) {
    return "out";
  }
  if (stockQuantity <= LOW_STOCK_THRESHOLD) {
    return "low";
  }
  return "ok";
}

export function formatStockQuantity(
  stockQuantity: number | null | undefined,
): string {
  if (stockQuantity === null || stockQuantity === undefined) {
    return "Sin datos";
  }
  return stockQuantity.toLocaleString("es-PR");
}
