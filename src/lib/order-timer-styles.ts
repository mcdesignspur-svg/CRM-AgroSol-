import type { OrderStatus } from "@/lib/types";

export function getOrderTimerClass(status: OrderStatus): string {
  switch (status) {
    case "atrasado":
      return "text-red-600 font-medium";
    case "listo":
      return "text-amber-600 font-medium";
    case "completado":
      return "text-on-surface-variant";
    default:
      return "text-on-surface-variant";
  }
}
