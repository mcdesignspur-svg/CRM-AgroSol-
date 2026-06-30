"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useToast } from "@/components/providers/ToastProvider";
import {
  BranchLabel,
  StatusBadge,
  TypeBadge,
} from "@/components/ui/badges";
import { extraOrders, recentOrders } from "@/lib/data";
import type { OrderStatus, OrderType } from "@/lib/types";

type FilterMode = "all" | OrderType | OrderStatus;

const filterLabels: Record<FilterMode, string> = {
  all: "Todas",
  entrega: "Entregas",
  retiro: "Retiros",
  atrasado: "Atrasadas",
  "en-transito": "En Tránsito",
  listo: "Listas",
  pendiente: "Pendientes",
  completado: "Completadas",
};

const filterCycle: FilterMode[] = [
  "all",
  "entrega",
  "retiro",
  "atrasado",
  "en-transito",
];

export function DashboardOrdersSection() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState(recentOrders);
  const [filter, setFilter] = useState<FilterMode>("all");
  const [refreshing, setRefreshing] = useState(false);
  const [loadedMore, setLoadedMore] = useState(false);

  const filteredOrders = orders.filter((order) => {
    if (filter === "all") return true;
    if (filter === "entrega" || filter === "retiro") return order.type === filter;
    return order.status === filter;
  });

  const cycleFilter = useCallback(() => {
    const idx = filterCycle.indexOf(filter);
    const next = filterCycle[(idx + 1) % filterCycle.length];
    setFilter(next);
    showToast(`Filtro: ${filterLabels[next]}`, "info");
  }, [filter, showToast]);

  async function handleRefresh() {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 800));
    setOrders(recentOrders);
    setLoadedMore(false);
    setRefreshing(false);
    showToast("Datos actualizados", "success");
  }

  function handleLoadMore() {
    if (loadedMore) {
      showToast("No hay más órdenes disponibles", "info");
      return;
    }
    setOrders((prev) => [...prev, ...extraOrders]);
    setLoadedMore(true);
    showToast(`${extraOrders.length} órdenes cargadas`, "success");
  }

  return (
    <>
      <section className="industrial-border bg-white overflow-hidden">
        <div className="p-6 industrial-divider flex justify-between items-center">
          <h3 className="font-display text-2xl font-bold uppercase">
            Órdenes Recientes
            {filter !== "all" && (
              <span className="ml-2 text-sm text-primary font-mono">
                [{filterLabels[filter]}]
              </span>
            )}
          </h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={cycleFilter}
              className={`p-2 industrial-border hover:bg-gray-100 transition-colors ${
                filter !== "all" ? "bg-secondary-container" : ""
              }`}
              aria-label="Filtrar"
            >
              <span className="material-symbols-outlined">filter_list</span>
            </button>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 industrial-border hover:bg-gray-100 transition-colors disabled:opacity-60"
              aria-label="Actualizar"
            >
              <span
                className={`material-symbols-outlined ${
                  refreshing ? "animate-spin" : ""
                }`}
              >
                refresh
              </span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-black text-white">
              <tr>
                <th className="p-4 text-sm font-bold uppercase">Cliente</th>
                <th className="p-4 text-sm font-bold uppercase">Tipo</th>
                <th className="p-4 text-sm font-bold uppercase">Sucursal</th>
                <th className="p-4 text-sm font-bold uppercase">Estado</th>
                <th className="p-4 text-sm font-bold uppercase">
                  Tiempo Transcurrido
                </th>
                <th className="p-4 text-sm font-bold uppercase">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="p-8 text-center text-sm font-bold uppercase opacity-50"
                  >
                    Sin órdenes con este filtro
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order, index) => (
                  <tr
                    key={order.id}
                    className={`hover:bg-surface-container transition-colors ${
                      index % 2 === 1 ? "bg-surface-container-low" : ""
                    }`}
                  >
                    <td className="p-4 font-bold">{order.customerName}</td>
                    <td className="p-4">
                      <TypeBadge type={order.type} />
                    </td>
                    <td className="p-4">
                      <BranchLabel branchId={order.branchId} />
                    </td>
                    <td className="p-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td
                      className={`p-4 font-mono ${
                        order.status === "atrasado" || order.status === "listo"
                          ? "text-red-600 font-bold"
                          : "opacity-80"
                      }`}
                    >
                      {order.elapsedTime}
                    </td>
                    <td className="p-4">
                      <Link
                        href={`/entregas?orden=${order.id}`}
                        className="text-primary hover:underline font-bold text-sm"
                      >
                        GESTIONAR
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-gray-50 flex justify-center">
          <button
            type="button"
            onClick={handleLoadMore}
            className="text-sm font-bold uppercase tracking-widest hover:text-primary transition-colors"
          >
            {loadedMore ? "Sin Más Resultados" : "Cargar Más Órdenes"}
          </button>
        </div>
      </section>
    </>
  );
}

export function CriticalAlertsLink() {
  const { showToast } = useToast();

  function handleClick() {
    showToast("Mostrando 3 alertas críticas del sistema", "warning");
    document
      .querySelector("[data-pings-panel]")
      ?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="text-white opacity-90 uppercase underline cursor-pointer hover:opacity-100 transition-opacity"
    >
      Ver Críticas
    </button>
  );
}
