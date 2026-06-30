"use client";

import Link from "next/link";
import { useState } from "react";
import { useToast } from "@/components/providers/ToastProvider";
import type { Branch, Order, Ping } from "@/lib/types";

const priorityStyles: Record<
  Ping["priority"],
  { badge: string; border: string }
> = {
  urgente: {
    badge: "bg-primary text-white",
    border: "industrial-border bg-white industrial-shadow",
  },
  sistema: {
    badge: "text-primary",
    border: "border-l-4 border-primary bg-surface-container",
  },
  advertencia: {
    badge: "text-secondary",
    border: "border-l-4 border-secondary bg-surface-container",
  },
};

export function LivePingsPanel({
  initialPings,
  branches,
}: {
  initialPings: Ping[];
  branches: Branch[];
}) {
  const [pings, setPings] = useState(initialPings);
  const { showToast } = useToast();

  async function dismissPing(id: string) {
    try {
      await fetch(`/api/pings/${id}`, { method: "PATCH" });
      setPings((prev) => prev.filter((p) => p.id !== id));
      showToast("Ping descartado", "info");
    } catch {
      showToast("Error al descartar ping", "error");
    }
  }

  function callDriver(ping: Ping) {
    showToast(`Contactando — ${ping.title}`, "info");
  }

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
          pings.map((ping) => {
            const styles = priorityStyles[ping.priority];
            return (
              <div key={ping.id} className={`p-4 ${styles.border}`}>
                <div className="flex justify-between items-start mb-2">
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 ${styles.badge}`}
                  >
                    {ping.priority === "urgente"
                      ? "Urgente"
                      : ping.priority === "sistema"
                        ? "Sistema"
                        : "Advertencia"}
                  </span>
                  <span className="text-[10px] font-mono opacity-60">
                    {ping.timeAgo}
                  </span>
                </div>
                <p className="text-sm font-bold">{ping.title}</p>
                <p className="text-xs text-on-surface-variant mt-1">
                  {ping.description}
                </p>
                {ping.priority === "urgente" && (
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => dismissPing(ping.id)}
                      className="text-[10px] font-bold uppercase border border-black px-2 py-1 hover:bg-gray-100 transition-colors"
                    >
                      Descartar
                    </button>
                    <button
                      type="button"
                      onClick={() => callDriver(ping)}
                      className="text-[10px] font-bold uppercase bg-black text-white px-2 py-1 hover:bg-primary transition-colors"
                    >
                      Llamar
                    </button>
                  </div>
                )}
              </div>
            );
          })
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

export function DashboardHeader() {
  const { showToast } = useToast();
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    await new Promise((r) => setTimeout(r, 600));

    const res = await fetch("/api/orders?limit=1000&offset=0");
    const data = await res.json();
    const header = "ID,Cliente,Tipo,Sucursal,Estado,Tiempo";
    const rows = data.orders.map(
      (o: Order) =>
        `${o.id},${o.customerName},${o.type},${o.branchId},${o.status},${o.elapsedTime}`,
    );
    const csv = [header, ...rows].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "agrosol-ordenes.csv";
    a.click();
    URL.revokeObjectURL(url);

    setExporting(false);
    showToast("Datos exportados correctamente", "success");
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
          href="/ordenes#nueva-orden"
          className="btn-primary px-4 sm:px-6 py-3 text-sm font-bold uppercase industrial-border inline-flex items-center justify-center w-full sm:w-auto min-h-[44px]"
        >
          Crear Nueva Orden
        </Link>
      </div>
    </div>
  );
}
