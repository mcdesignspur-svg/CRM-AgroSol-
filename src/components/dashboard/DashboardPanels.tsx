"use client";

import Link from "next/link";
import { useState } from "react";
import { PingCard } from "@/components/dashboard/PingCard";
import { usePingsSheet } from "@/components/dashboard/PingsSheetProvider";
import { useToast } from "@/components/providers/ToastProvider";
import type { Branch, Order } from "@/lib/types";

export function LivePingsPanel({ branches }: { branches: Branch[] }) {
  const { pings, dismissPing, callDriver } = usePingsSheet();

  return (
    <aside className="hidden lg:flex flex-col w-72 border-l border-outline bg-white h-full shrink-0">
      <div className="px-5 py-4 border-b border-outline flex items-center gap-2.5">
        <div className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
        </div>
        <h3 className="font-display text-sm font-semibold text-on-surface">
          Pings en vivo
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {pings.length === 0 ? (
          <p className="text-xs text-on-surface-variant text-center py-8">
            Sin pings activos
          </p>
        ) : (
          pings.map((ping) => (
            <PingCard
              key={ping.id}
              ping={ping}
              onDismiss={dismissPing}
              onCallDriver={callDriver}
            />
          ))
        )}

        {pings.length > 0 && (
          <div className="pt-6 opacity-30 text-center">
            <span className="material-symbols-outlined text-4xl">history</span>
            <p className="text-xs text-on-surface-variant mt-1">
              Fin del historial reciente
            </p>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-outline bg-surface">
        <div className="rounded-lg border border-outline p-3 bg-white text-center">
          <p className="text-xs font-medium text-on-surface-variant mb-2">
            Estado de la red
          </p>
          <div className="flex justify-between items-center">
            {branches.map((branch) => (
              <span
                key={branch.id}
                className="flex items-center gap-1 text-xs font-medium text-on-surface-variant"
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    branch.status === "online"
                      ? "bg-green-500"
                      : branch.status === "warning"
                        ? "bg-yellow-500"
                        : "bg-red-500"
                  }`}
                />
                {branch.id === "gurabo"
                  ? "GUR"
                  : branch.id === "san-lorenzo"
                    ? "SLZ"
                    : "NAV"}
              </span>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function DashboardHeader() {
  const { showToast } = useToast();
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch("/api/orders?limit=1000&offset=0");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Error al exportar datos");
      }

      const header = "ID,Cliente,Tipo,Sucursal,Estado,Tiempo";
      const rows = (data.orders as Order[]).map((o) =>
        [
          csvEscape(o.id),
          csvEscape(o.customerName),
          csvEscape(o.type),
          csvEscape(o.branchId),
          csvEscape(o.status),
          csvEscape(o.elapsedTime),
        ].join(","),
      );
      const csv = [header, ...rows].join("\n");

      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "agrosol-ordenes.csv";
      a.click();
      URL.revokeObjectURL(url);

      showToast("Datos exportados correctamente", "success");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Error al exportar datos",
        "error",
      );
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
      <div>
        <h2 className="font-display text-2xl md:text-3xl font-semibold tracking-tight text-on-surface">
          Panel de logística
        </h2>
        <p className="text-sm text-on-surface-variant mt-1">
          Supervisión en tiempo real de la red Agrocentro Solá.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="btn-secondary px-4 py-2.5 text-sm disabled:opacity-60 w-full sm:w-auto min-h-[40px]"
        >
          {exporting ? "Exportando..." : "Exportar datos"}
        </button>
        <Link
          href="/ordenes/nueva"
          className="btn-primary px-4 py-2.5 text-sm inline-flex items-center justify-center w-full sm:w-auto min-h-[40px]"
        >
          Crear nueva orden
        </Link>
      </div>
    </div>
  );
}
