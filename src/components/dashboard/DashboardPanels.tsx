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
    <aside className="hidden lg:flex flex-col w-80 border-l-2 border-on-background bg-surface-container-lowest h-full shrink-0">
      <div className="p-6 border-b-2 border-on-background flex items-center gap-3">
        <div className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600" />
        </div>
        <h3 className="font-display text-sm font-extrabold uppercase">
          Pings en Vivo
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {pings.length === 0 ? (
          <p className="text-xs font-bold uppercase text-center opacity-50 py-8">
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
          <div className="pt-8 opacity-20 text-center">
            <span className="material-symbols-outlined text-6xl">history</span>
            <p className="text-xs font-bold uppercase mt-2">
              Fin del historial reciente
            </p>
          </div>
        )}
      </div>

      <div className="p-6 border-t-2 border-on-background bg-gray-50">
        <div className="industrial-border p-3 bg-white text-center">
          <p className="text-[10px] font-bold uppercase mb-2">
            Estado de la Red
          </p>
          <div className="flex justify-between items-center">
            {branches.map((branch) => (
              <span
                key={branch.id}
                className="flex items-center gap-1 text-[10px] font-bold"
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
        <h2 className="font-display text-3xl md:text-4xl font-extrabold uppercase tracking-tight">
          Panel de Logística
        </h2>
        <p className="text-lg text-on-surface-variant">
          Supervisión en tiempo real de la red Agrocentro Solá.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="btn-secondary px-4 sm:px-6 py-3 text-sm font-bold uppercase disabled:opacity-60 w-full sm:w-auto min-h-[44px]"
        >
          {exporting ? "Exportando..." : "Exportar Datos"}
        </button>
        <Link
          href="/ordenes/nueva"
          className="btn-primary px-4 sm:px-6 py-3 text-sm font-bold uppercase industrial-border inline-flex items-center justify-center w-full sm:w-auto min-h-[44px]"
        >
          Crear Nueva Orden
        </Link>
      </div>
    </div>
  );
}
