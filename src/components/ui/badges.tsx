import type { OrderStatus, OrderType, BranchId } from "@/lib/types";
import { BRANCH_LABELS } from "@/lib/constants";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";

const statusStyles: Record<OrderStatus, string> = {
  pendiente: "bg-gray-100 text-gray-600",
  "en-transito": "status-yellow",
  listo: "bg-emerald-50 text-emerald-700",
  atrasado: "bg-red-50 text-red-700",
  completado: "bg-emerald-50 text-emerald-600",
};

const typeStyles: Record<OrderType, string> = {
  entrega: "bg-blue-50 text-blue-700",
  retiro: "bg-violet-50 text-violet-700",
};

export function ArrivedBadge() {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700">
      Cliente en camino
    </span>
  );
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status]}`}
    >
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}

export function TypeBadge({ type }: { type: OrderType }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeStyles[type]}`}
    >
      {type === "entrega" ? "Entrega" : "Pickup"}
    </span>
  );
}

export function BranchLabel({ branchId }: { branchId: BranchId }) {
  return (
    <span className="text-sm text-on-surface-variant">
      {BRANCH_LABELS[branchId]}
    </span>
  );
}
