"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { TopBar } from "@/components/layout/TopBar";
import { NuevaOrdenForm } from "@/components/ordenes/NuevaOrdenForm";
import { useToast } from "@/components/providers/ToastProvider";
import {
  BranchLabel,
  StatusBadge,
  TypeBadge,
} from "@/components/ui/badges";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import type { Order, OrderStatus, OrderType, Product } from "@/lib/types";

type FilterMode = "all" | OrderType | OrderStatus;
type OrdenesTab = "lista" | "nueva";

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
  catalogProducts: Product[];
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

function buildOrdenesUrl(tab: OrdenesTab, search: string) {
  const params = new URLSearchParams();
  if (tab === "nueva") {
    params.set("tab", "nueva");
  }
  if (search.trim()) {
    params.set("q", search.trim());
  }
  const query = params.toString();
  return query ? `/ordenes?${query}` : "/ordenes";
}

function OrdenesTabSwitcher({
  tab,
  onTabChange,
}: {
  tab: OrdenesTab;
  onTabChange: (tab: OrdenesTab) => void;
}) {
  return (
    <div className="flex border-2 border-black bg-gray-100 p-1 gap-1 w-full sm:w-auto">
      <button
        type="button"
        onClick={() => onTabChange("lista")}
        className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 text-xs font-bold uppercase transition-all min-h-[44px] flex items-center justify-center gap-2 ${
          tab === "lista"
            ? "bg-primary text-white industrial-shadow"
            : "bg-white text-black hover:bg-surface-container"
        }`}
      >
        <span className="material-symbols-outlined text-sm">receipt_long</span>
        Lista
      </button>
      <button
        type="button"
        onClick={() => onTabChange("nueva")}
        className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 text-xs font-bold uppercase transition-all min-h-[44px] flex items-center justify-center gap-2 ${
          tab === "nueva"
            ? "bg-primary text-white industrial-shadow"
            : "bg-white text-black hover:bg-surface-container"
        }`}
      >
        <span className="material-symbols-outlined text-sm">add_shopping_cart</span>
        Nueva Orden
      </button>
    </div>
  );
}

function OrdenesPageInner({
  initialOrders,
  initialTotal,
  initialSearch = "",
  catalogProducts,
}: OrdenesContentProps) {
  const { showToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab: OrdenesTab =
    searchParams.get("tab") === "nueva" ? "nueva" : "lista";
  const [orders, setOrders] = useState(initialOrders);
  const [total, setTotal] = useState(initialTotal);
  const [filter, setFilter] = useState<FilterMode>("all");
  const [search, setSearch] = useState(initialSearch);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const hasMore = orders.length < total;

  const setTab = useCallback(
    (nextTab: OrdenesTab) => {
      router.replace(buildOrdenesUrl(nextTab, search));
    },
    [router, search],
  );

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
      router.replace(buildOrdenesUrl("lista", search));
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
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold uppercase tracking-tight">
              {tab === "lista" ? "Gestión de Órdenes" : "Nueva Orden"}
            </h2>
            <p className="text-lg text-on-surface-variant mt-2">
              {tab === "lista"
                ? "Consulta, filtra y actualiza el estado de las órdenes activas."
                : "Registra una nueva orden de compra con pickup o entrega."}
            </p>
          </div>
          <OrdenesTabSwitcher tab={tab} onTabChange={setTab} />
        </div>

        {tab === "nueva" ? (
          <NuevaOrdenForm catalogProducts={catalogProducts} />
        ) : (
          <>
            <section className="industrial-border bg-white overflow-hidden industrial-shadow">
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
                              order.status === "atrasado" ||
                              order.status === "listo"
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
                        <span className="font-mono opacity-70">
                          {order.elapsedTime}
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
                    className="text-sm font-bold uppercase tracking-widest hover:text-primary transition-colors disabled:opacity-60 min-h-[44px]"
                  >
                    {loadingMore ? "Cargando..." : "Cargar Más Órdenes"}
                  </button>
                )}
              </div>
            </section>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(
                Object.entries(ORDER_STATUS_LABELS) as [OrderStatus, string][]
              ).map(([status, label]) => (
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
              ))}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

export function OrdenesContent(props: OrdenesContentProps) {
  return (
    <Suspense
      fallback={
        <AppShell topBar={<TopBar title="Órdenes" showSearch={false} />}>
          <div className="flex-1 flex items-center justify-center">
            <span className="material-symbols-outlined animate-spin text-4xl text-primary">
              sync
            </span>
          </div>
        </AppShell>
      }
    >
      <OrdenesPageInner {...props} />
    </Suspense>
  );
}
