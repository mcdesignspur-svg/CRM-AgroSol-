"use client";

import {
  formatStockQuantity,
  getStockStatus,
} from "@/lib/inventory/stock-status";

interface StockBadgeProps {
  stockQuantity: number | null | undefined;
  className?: string;
}

const STATUS_STYLES = {
  unknown: "bg-gray-100 text-gray-600",
  out: "bg-red-50 text-red-700",
  low: "bg-amber-50 text-amber-800",
  ok: "bg-emerald-50 text-emerald-700",
} as const;

const STATUS_LABELS = {
  unknown: "Sin datos",
  out: "Agotado",
  low: "Bajo",
  ok: "Disponible",
} as const;

export function StockBadge({ stockQuantity, className = "" }: StockBadgeProps) {
  const status = getStockStatus(stockQuantity);
  const label = STATUS_LABELS[status];
  const quantityLabel = formatStockQuantity(stockQuantity);

  return (
    <div className={`inline-flex flex-col items-end gap-0.5 ${className}`}>
      <span className="text-sm font-semibold tabular-nums text-on-surface">
        {quantityLabel}
      </span>
      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLES[status]}`}
      >
        {label}
      </span>
    </div>
  );
}
