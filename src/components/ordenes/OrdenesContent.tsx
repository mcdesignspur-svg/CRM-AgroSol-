"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { TopBar } from "@/components/layout/TopBar";
import { useToast } from "@/components/providers/ToastProvider";
import {
  BranchLabel,
  StatusBadge,
  TypeBadge,
} from "@/components/ui/badges";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import type { Order, OrderStatus, OrderType } from "@/lib/types";

type FilterMode = "all" | OrderType | OrderStatus;

const filterLabels: Record<FilterMode, string> = {
  all: "Todas",
  entrega: "Entregas",
  retiro: "Pickups",
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

interface OrdenesContentProps {
  initialOrders: Order[];
  initialTotal: number;
  initialSearch?: string;
}

function buildQuery(filter: FilterMode, search: string, offset = 0) {
  const params = new URLSearchParams({
    limit: "20",
    offset: String(offset),
  });

  if (filter !== "all") {
    if (filter === "entrega" || filter === "retiro") {
      params.set("type", filter);
    } else {
      params.set("status", filter);
    }
  }

  if (search.trim()) {
    params.set("q", search.trim());
  }

  return params.toString();
}

export function OrdenesContent({
  initialOrders,
  initialTotal,
  initialSearch = "",
}: OrdenesContentProps) {
  const { showToast } = useToast();
  const [orders, setOrders] = useState(initialOrders);
  const [total, setTotal] = useState(initialTotal);
  const [filter, setFilter] = useState<FilterMode>("all");
  const [search, setSearch] = useState(initialSearch);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const hasMore = orders.length < total;

  const loadOrders = useCallback(
    async (
      nextFilter: FilterMode,
      nextSearch: string,
      offset = 0,
      replace = true,
    ) => {
      const res = await fetch(
        `/api/orders?${buildQuery(nextFilter, nextSearch, offset)}`,
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Error al cargar órdenes");
      }
      setTotal(data.total);
      setOrders((prev) => (replace ? data.orders : [...prev, ...data.orders]));
      return data;
    },
    [],
  );

  const cycleFilter = useCallback(() => {
    const idx = filterCycle.indexOf(filter);
    const next = filterCycle[(idx + 1) % filterCycle.length];
    setFilter(next);
    void loadOrders(next, search, 0, true);
    showToast(`Filtro: ${filterLabels[next]}`, "info");
  }, [filter, loadOrders, search, showToast]);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await loadOrders(filter, search, 0, true);
      showToast("Datos actualizados", "success");
    } catch {
      showToast("Error al actualizar", "error");
    } finally {
      setRefreshing(false);
    }
  }

  async function handleSearchSubmit(event: React.FormEvent) {
    event.preventDefault();
    setRefreshing(true);
    try {
      await loadOrders(filter, search, 0, true);
    } catch {
      showToast("Error al buscar órdenes", "error");
    } finally {
      setRefreshing(false);
    }
  }

  async function handleLoadMore() {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const data = await loadOrders(filter, search, orders.length, false);
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
    <AppShell topBar={<TopBar title="Órdenes" showSearch={false} />}>
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 pb-10">
        <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-on-surface">
              Gestión de órdenes
            </h2>
            <p className="text-sm text-on-surface-variant mt-1">
              Consulta, filtra y actualiza el estado de las órdenes activas.
            </p>
          </div>
          <Link
            href="/ordenes/nueva"
            className="btn-primary px-4 py-2.5 text-sm min-h-[40px] inline-flex items-center justify-center"
          >
            + Nueva orden
          </Link>
        </div>

        <section className="rounded-xl border border-outline bg-white overflow-hidden shadow-sm">
          <div className="px-4 md:px-5 py-4 border-b border-outline flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
            <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-1 max-w-xl">
              <input
                className="flex-1 border border-outline rounded-lg px-3 py-2 text-sm min-h-[40px] bg-surface"
                type="search"
                placeholder="Buscar por ID, cliente o teléfono..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button
                type="submit"
                className="btn-secondary px-4 py-2 text-sm min-h-[40px]"
              >
                Buscar
              </button>
            </form>
            <div className="flex gap-1.5 items-center">
              <span className="text-xs text-on-surface-variant">
                {total} órdenes
              </span>
              <button
                type="button"
                onClick={cycleFilter}
                className={`p-2 rounded-lg border border-outline hover:bg-surface-container transition-colors min-h-[40px] min-w-[40px] ${
                  filter !== "all" ? "bg-primary-container text-primary border-red-200" : ""
                }`}
                aria-label="Filtrar"
              >
                <span className="material-symbols-outlined text-xl">filter_list</span>
              </button>
              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 rounded-lg border border-outline hover:bg-surface-container transition-colors disabled:opacity-60 min-h-[40px] min-w-[40px]"
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

          {filter !== "all" && (
            <div className="px-4 py-2 bg-primary-container border-b border-red-100 text-xs font-medium text-primary">
              Filtro activo: {filterLabels[filter]}
            </div>
          )}

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="table-header">
                <tr>
                  <th className="px-4 py-3 text-xs font-medium">ID</th>
                  <th className="px-4 py-3 text-xs font-medium">Cliente</th>
                  <th className="px-4 py-3 text-xs font-medium">Tipo</th>
                  <th className="px-4 py-3 text-xs font-medium">Sucursal</th>
                  <th className="px-4 py-3 text-xs font-medium">Estado</th>
                  <th className="px-4 py-3 text-xs font-medium">Tiempo</th>
                  <th className="px-4 py-3 text-xs font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-10 text-center text-sm text-on-surface-variant"
                    >
                      Sin órdenes registradas
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-surface transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-sm text-primary">
                        {order.id}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">{order.customerName}</td>
                      <td className="px-4 py-3">
                        <TypeBadge type={order.type} />
                      </td>
                      <td className="px-4 py-3">
                        <BranchLabel branchId={order.branchId} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={order.status} />
                      </td>
                      <td
                        className={`px-4 py-3 text-sm font-mono ${
                          order.status === "atrasado" || order.status === "listo"
                            ? "text-red-600 font-medium"
                            : "text-on-surface-variant"
                        }`}
                      >
                        {order.elapsedTime}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/ordenes/${encodeURIComponent(order.id)}`}
                          className="text-primary hover:text-primary/80 text-sm font-medium"
                        >
                          Ver
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="md:hidden divide-y divide-gray-100">
            {orders.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-on-surface-variant">
                Sin órdenes registradas
              </p>
            ) : (
              orders.map((order) => (
                <article
                  key={order.id}
                  className="px-4 py-3.5 space-y-2 hover:bg-surface transition-colors"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <p className="font-mono text-xs text-primary">{order.id}</p>
                      <p className="font-medium text-sm">{order.customerName}</p>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>
                  <div className="flex flex-wrap gap-2 items-center text-xs">
                    <TypeBadge type={order.type} />
                    <BranchLabel branchId={order.branchId} />
                    <span className="font-mono text-on-surface-variant">{order.elapsedTime}</span>
                  </div>
                  <Link
                    href={`/ordenes/${encodeURIComponent(order.id)}`}
                    className="inline-flex items-center gap-1 text-primary text-sm font-medium min-h-[40px]"
                  >
                    Ver orden
                    <span className="material-symbols-outlined text-sm">
                      arrow_forward
                    </span>
                  </Link>
                </article>
              ))
            )}
          </div>

          <div className="px-4 py-3 border-t border-outline flex justify-center">
            {hasMore && (
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors disabled:opacity-60 min-h-[40px]"
              >
                {loadingMore ? "Cargando..." : "Cargar más órdenes"}
              </button>
            )}
          </div>
        </section>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {(Object.entries(ORDER_STATUS_LABELS) as [OrderStatus, string][]).map(
            ([status, label]) => (
              <button
                key={status}
                type="button"
                onClick={() => {
                  setFilter(status);
                  void loadOrders(status, search, 0, true);
                }}
                className={`p-3 rounded-lg border text-left hover:bg-surface-container transition-colors ${
                  filter === status
                    ? "bg-primary-container border-red-200 text-primary"
                    : "bg-white border-outline"
                }`}
              >
                <span className="text-xs font-medium text-on-surface-variant">
                  {label}
                </span>
              </button>
            ),
          )}
        </div>
      </div>
    </AppShell>
  );
}
