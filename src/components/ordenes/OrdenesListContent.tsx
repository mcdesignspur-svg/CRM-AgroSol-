"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useCallback, useState } from "react";
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

interface OrdenesListContentProps {
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

function buildOrdenesUrl(search: string) {
  const trimmed = search.trim();
  return trimmed ? `/ordenes?q=${encodeURIComponent(trimmed)}` : "/ordenes";
}

function OrdenesListInner({
  initialOrders,
  initialTotal,
  initialSearch = "",
}: OrdenesListContentProps) {
  const { showToast } = useToast();
  const router = useRouter();
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
      router.replace(buildOrdenesUrl(search));
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
    <div className="space-y-6">
      <div className="industrial-border bg-white overflow-hidden industrial-shadow">
        <div className="p-4 md:p-6 industrial-divider flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
          <form
            onSubmit={handleSearchSubmit}
            className="flex gap-2 flex-1 max-w-xl"
          >
            <input
              className="flex-1 industrial-border px-3 py-2 text-sm font-medium min-h-[44px]"
              type="search"
              placeholder="Buscar por ID, cliente o teléfono..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              type="submit"
              className="btn-secondary px-4 py-2 text-xs font-bold uppercase min-h-[44px]"
            >
              Buscar
            </button>
          </form>
          <div className="flex gap-2 items-center">
            <span className="text-xs font-bold uppercase opacity-60">
              {total} órdenes
            </span>
            <button
              type="button"
              onClick={cycleFilter}
              className={`p-2 industrial-border hover:bg-gray-100 transition-colors min-h-[44px] min-w-[44px] ${
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
              className="p-2 industrial-border hover:bg-gray-100 transition-colors disabled:opacity-60 min-h-[44px] min-w-[44px]"
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
          <div className="px-4 py-2 bg-secondary-container border-b-2 border-black text-xs font-bold uppercase">
            Filtro activo: {filterLabels[filter]}
          </div>
        )}

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-black text-white">
              <tr>
                <th className="p-4 text-sm font-bold uppercase">ID</th>
                <th className="p-4 text-sm font-bold uppercase">Cliente</th>
                <th className="p-4 text-sm font-bold uppercase">Tipo</th>
                <th className="p-4 text-sm font-bold uppercase">Sucursal</th>
                <th className="p-4 text-sm font-bold uppercase">Estado</th>
                <th className="p-4 text-sm font-bold uppercase">Tiempo</th>
                <th className="p-4 text-sm font-bold uppercase">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orders.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="p-8 text-center text-sm font-bold uppercase opacity-50"
                  >
                    Sin órdenes registradas
                  </td>
                </tr>
              ) : (
                orders.map((order, index) => (
                  <tr
                    key={order.id}
                    className={`hover:bg-surface-container transition-colors ${
                      index % 2 === 1 ? "bg-surface-container-low" : ""
                    }`}
                  >
                    <td className="p-4 font-mono font-bold text-primary">
                      {order.id}
                    </td>
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

        <div className="md:hidden divide-y divide-gray-200">
          {orders.length === 0 ? (
            <p className="p-8 text-center text-sm font-bold uppercase opacity-50">
              Sin órdenes registradas
            </p>
          ) : (
            orders.map((order) => (
              <article
                key={order.id}
                className="p-4 space-y-3 hover:bg-surface-container-low transition-colors"
              >
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <p className="font-mono text-xs text-primary font-bold">
                      {order.id}
                    </p>
                    <p className="font-bold text-sm">{order.customerName}</p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
                <div className="flex flex-wrap gap-2 items-center text-xs">
                  <TypeBadge type={order.type} />
                  <BranchLabel branchId={order.branchId} />
                  <span className="font-mono opacity-70">{order.elapsedTime}</span>
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
              className="text-sm font-bold uppercase tracking-widest hover:text-primary transition-colors disabled:opacity-60 min-h-[44px]"
            >
              {loadingMore ? "Cargando..." : "Cargar Más Órdenes"}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(Object.entries(ORDER_STATUS_LABELS) as [OrderStatus, string][]).map(
          ([status, label]) => (
            <button
              key={status}
              type="button"
              onClick={() => {
                setFilter(status);
                void loadOrders(status, search, 0, true);
              }}
              className={`p-3 border-2 border-black text-left hover:bg-surface-container transition-colors ${
                filter === status ? "bg-secondary-container" : "bg-white"
              }`}
            >
              <span className="text-[10px] font-bold uppercase opacity-60">
                {label}
              </span>
            </button>
          ),
        )}
      </div>
    </div>
  );
}

export function OrdenesListContent(props: OrdenesListContentProps) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-16">
          <span className="material-symbols-outlined animate-spin text-4xl text-primary">
            sync
          </span>
        </div>
      }
    >
      <OrdenesListInner {...props} />
    </Suspense>
  );
}
