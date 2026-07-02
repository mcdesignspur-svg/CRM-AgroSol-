import type { OrderStatus, OrderType, BranchId } from "@/lib/types";
import { BRANCH_LABELS } from "@/lib/constants";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";

const statusStyles: Record<OrderStatus, string> = {
  pendiente: "bg-gray-200 text-gray-800",
  "en-transito": "status-yellow",
  listo: "bg-green-500 text-white",
  atrasado: "bg-red-600 text-white",
  completado: "bg-green-600 text-white",
};

const typeStyles: Record<OrderType, string> = {
  entrega: "bg-blue-100 text-blue-800",
  retiro: "bg-purple-100 text-purple-800",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`px-3 py-1 text-xs font-bold uppercase industrial-border ${statusStyles[status]}`}
    >
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}

export function TypeBadge({ type }: { type: OrderType }) {
  return (
    <span className={`px-2 py-1 text-xs font-bold uppercase ${typeStyles[type]}`}>
      {type === "entrega" ? "Entrega" : "Pickup"}
    </span>
  );
}

export function BranchLabel({ branchId }: { branchId: BranchId }) {
  return <span className="font-medium">{BRANCH_LABELS[branchId]}</span>;
}
