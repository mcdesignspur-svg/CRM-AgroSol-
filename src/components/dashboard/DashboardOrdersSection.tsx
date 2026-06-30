"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useToast } from "@/components/providers/ToastProvider";
import { usePingsSheet } from "@/components/dashboard/PingsSheetProvider";
import {
  BranchLabel,
  StatusBadge,
  TypeBadge,
} from "@/components/ui/badges";
import { ElapsedTime } from "@/components/ui/ElapsedTime";
import type { Order, OrderStatus, OrderType } from "@/lib/types";

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
  "pendiente",
  "en-transito",
  "listo",
  "atrasado",
  "completado",
  "entrega",
  "retiro",
];

export function DashboardOrdersSection({
  initialOrders,
  initialTotal,
}: {
  initialOrders: Order[];
  initialTotal: number;
}) {
  const { showToast } = useToast();
  const [orders, setOrders] = useState(initialOrders);
  const [total, setTotal] = useState(initialTotal);
  const [filter, setFilter] = useState<FilterMode>("all");
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const hasMore = orders.length < total;

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
    try {
      const res = await fetch("/api/orders?limit=20&offset=0");
      const data = await res.json();
      setOrders(data.orders);
      setTotal(data.total);
      showToast("Datos actualizados", "success");
    } catch {
      showToast("Error al actualizar", "error");
    } finally {
      setRefreshing(false);
    }
  }

  async function handleLoadMore() {
    if (!hasMore || loadingMore) {
      showToast("No hay más órdenes disponibles", "info");
      return;
    }
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/orders?limit=20&offset=${orders.length}`);
      const data = await res.json();
      setOrders((prev) => [...prev, ...data.orders]);
      setTotal(data.total);
      if (data.orders.length > 0) {
        showToast(`${data.orders.length} órdenes cargadas`, "success");
      }
    } catch {
      showToast("Error al cargar órdenes", "error");
    } finally {
      setLoadingMore(false);
    }
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

        {/* Vista tabla — desktop */}
        <div className="hidden md:block overflow-x-auto">
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
                    Sin órdenes registradas
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
                      <ElapsedTime createdAt={order.createdAt} />
                    </td>
                    <td className="p-4">
                      <Link
                        href={`/ordenes/${encodeURIComponent(order.id)}`}
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

        {/* Vista tarjetas — móvil */}
        <div className="md:hidden divide-y divide-gray-200">
          {filteredOrders.length === 0 ? (
            <p className="p-8 text-center text-sm font-bold uppercase opacity-50">
              Sin órdenes registradas
            </p>
          ) : (
            filteredOrders.map((order) => (
              <article
                key={order.id}
                className="p-4 space-y-3 hover:bg-surface-container-low transition-colors"
              >
                <div className="flex justify-between items-start gap-2">
                  <p className="font-bold text-sm">{order.customerName}</p>
                  <StatusBadge status={order.status} />
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <TypeBadge type={order.type} />
                  <BranchLabel branchId={order.branchId} />
                  <span
                    className={`text-xs font-mono ${
                      order.status === "atrasado" || order.status === "listo"
                        ? "text-red-600 font-bold"
                        : "opacity-70"
                    }`}
                  >
                    <ElapsedTime createdAt={order.createdAt} />
                  </span>
                </div>
                <Link
                  href={`/ordenes/${encodeURIComponent(order.id)}`}
                  className="inline-flex items-center gap-1 text-primary font-bold text-xs uppercase min-h-[44px]"
                >
                  Gestionar
                  <span className="material-symbols-outlined text-sm">
                    arrow_forward
                  </span>
                </Link>
              </article>
            ))
          )}
        </div>

        <div className="p-4 bg-gray-50 flex justify-center">
          {hasMore && (
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="text-sm font-bold uppercase tracking-widest hover:text-primary transition-colors disabled:opacity-60"
            >
              {loadingMore ? "Cargando..." : "Cargar Más Órdenes"}
            </button>
          )}
        </div>
      </section>
    </>
  );
}

export function CriticalAlertsLink() {
  const { showToast } = useToast();
  const { openPings } = usePingsSheet();

  function handleClick() {
    showToast("Mostrando alertas críticas del sistema", "warning");
    if (window.matchMedia("(min-width: 1024px)").matches) {
      document
        .querySelector("[data-pings-panel]")
        ?.scrollIntoView({ behavior: "smooth" });
    } else {
      openPings();
    }
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
