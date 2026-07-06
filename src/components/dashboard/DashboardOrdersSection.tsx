"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useDashboardLiveOptional } from "@/components/dashboard/DashboardLiveProvider";
import { useToast } from "@/components/providers/ToastProvider";
import {
  ArrivedBadge,
  BranchLabel,
  TypeBadge,
} from "@/components/ui/badges";
import {
  OrderElapsedTimer,
  OrderLiveStatusBadge,
} from "@/components/ordenes/OrderElapsedTimer";
import { PickupFlowProgress } from "@/components/pickup/PickupFlowProgress";
import { DeliveryFlowProgress } from "@/components/delivery/DeliveryFlowProgress";
import { isPickupOrder } from "@/lib/pickup/flow";
import { isDeliveryOrder } from "@/lib/delivery/flow";
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

function buildQuery(filter: FilterMode, offset = 0) {
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

  return params.toString();
}

export function DashboardOrdersSection({
  initialOrders,
  initialTotal,
}: {
  initialOrders: Order[];
  initialTotal: number;
}) {
  const live = useDashboardLiveOptional();
  const { showToast } = useToast();
  const [localOrders, setLocalOrders] = useState(initialOrders);
  const [localTotal, setLocalTotal] = useState(initialTotal);
  const [filter, setFilter] = useState<FilterMode>("all");
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const orders = filter === "all" && live ? live.orders : localOrders;
  const total = filter === "all" && live ? live.ordersTotal : localTotal;
  const hasMore = orders.length < total;

  const loadOrders = useCallback(
    async (nextFilter: FilterMode, offset = 0, replace = true) => {
      const res = await fetch(`/api/orders?${buildQuery(nextFilter, offset)}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Error al cargar órdenes");
      }
      setLocalTotal(data.total);
      setLocalOrders((prev) =>
        replace ? data.orders : [...prev, ...data.orders],
      );
      return data;
    },
    [],
  );

  const cycleFilter = useCallback(() => {
    const idx = filterCycle.indexOf(filter);
    const next = filterCycle[(idx + 1) % filterCycle.length];
    setFilter(next);
    void loadOrders(next, 0, true);
    showToast(`Filtro: ${filterLabels[next]}`, "info");
  }, [filter, loadOrders, showToast]);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      if (filter === "all" && live) {
        await live.refresh();
        showToast("Datos actualizados", "success");
      } else {
        await loadOrders(filter, 0, true);
        showToast("Datos actualizados", "success");
      }
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
      const data = await loadOrders(filter, orders.length, false);
      if (data.orders.length > 0) {
        showToast(`${data.orders.length} órdenes cargadas`, "success");
      }
    } catch {
      showToast("Error al cargar órdenes", "error");
    } finally {
      setLoadingMore(false);
    }
  }

  function renderOrderStatus(order: Order) {
    const pickup = isPickupOrder({
      type: order.type,
      fulfillment: order.fulfillment,
      status: order.status,
    });
    const delivery = isDeliveryOrder({
      type: order.type,
      fulfillment: order.fulfillment,
      status: order.status,
    });

    return (
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <OrderLiveStatusBadge
            createdAt={order.createdAt}
            status={order.status}
            fulfillment={order.fulfillment}
            dispatchedAt={order.dispatchedAt}
          />
          {pickup && order.arrivedAt && <ArrivedBadge />}
        </div>
        {pickup && (
          <PickupFlowProgress
            compact
            type={order.type}
            fulfillment={order.fulfillment}
            status={order.status}
            confirmationNotifiedAt={order.confirmationNotifiedAt}
            readyNotifiedAt={order.readyNotifiedAt}
            arrivedAt={order.arrivedAt}
          />
        )}
        {delivery && (
          <DeliveryFlowProgress
            compact
            type={order.type}
            fulfillment={order.fulfillment}
            status={order.status}
            dispatchedAt={order.dispatchedAt}
          />
        )}
      </div>
    );
  }

  return (
    <>
      <section className="rounded-xl border border-outline bg-white overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-outline flex justify-between items-center">
          <h3 className="font-display text-lg font-semibold text-on-surface">
            Órdenes recientes
            {filter !== "all" && (
              <span className="ml-2 text-sm text-primary font-normal">
                · {filterLabels[filter]}
              </span>
            )}
          </h3>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={cycleFilter}
              className={`p-2 rounded-lg border border-outline hover:bg-surface-container transition-colors ${
                filter !== "all" ? "bg-primary-container text-primary border-red-200" : ""
              }`}
              aria-label="Filtrar"
            >
              <span className="material-symbols-outlined text-xl">filter_list</span>
            </button>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing || live?.isPolling}
              className="p-2 rounded-lg border border-outline hover:bg-surface-container transition-colors disabled:opacity-60"
              aria-label="Actualizar"
            >
              <span
                className={`material-symbols-outlined ${
                  refreshing || live?.isPolling ? "animate-spin" : ""
                }`}
              >
                refresh
              </span>
            </button>
          </div>
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="table-header">
              <tr>
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
                    colSpan={6}
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
                    <td className="px-4 py-3 text-sm font-medium">{order.customerName}</td>
                    <td className="px-4 py-3">
                      <TypeBadge type={order.type} />
                    </td>
                    <td className="px-4 py-3">
                      <BranchLabel branchId={order.branchId} />
                    </td>
                    <td className="px-4 py-3">{renderOrderStatus(order)}</td>
                    <td className="px-4 py-3 text-sm">
                      <OrderElapsedTimer
                        createdAt={order.createdAt}
                        status={order.status}
                        fulfillment={order.fulfillment}
                      />
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
                  <p className="font-medium text-sm">{order.customerName}</p>
                  <OrderLiveStatusBadge
                    createdAt={order.createdAt}
                    status={order.status}
                    fulfillment={order.fulfillment}
                    dispatchedAt={order.dispatchedAt}
                  />
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <TypeBadge type={order.type} />
                  <BranchLabel branchId={order.branchId} />
                  {order.arrivedAt && <ArrivedBadge />}
                  <OrderElapsedTimer
                    createdAt={order.createdAt}
                    status={order.status}
                    fulfillment={order.fulfillment}
                    dispatchedAt={order.dispatchedAt}
                    className="text-xs"
                  />
                </div>
                {isPickupOrder({
                  type: order.type,
                  fulfillment: order.fulfillment,
                  status: order.status,
                }) && (
                  <PickupFlowProgress
                    compact
                    type={order.type}
                    fulfillment={order.fulfillment}
                    status={order.status}
                    confirmationNotifiedAt={order.confirmationNotifiedAt}
                    readyNotifiedAt={order.readyNotifiedAt}
                    arrivedAt={order.arrivedAt}
                  />
                )}
                {isDeliveryOrder({
                  type: order.type,
                  fulfillment: order.fulfillment,
                  status: order.status,
                }) && (
                  <DeliveryFlowProgress
                    compact
                    type={order.type}
                    fulfillment={order.fulfillment}
                    status={order.status}
                    dispatchedAt={order.dispatchedAt}
                  />
                )}
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
              className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors disabled:opacity-60"
            >
              {loadingMore ? "Cargando..." : "Cargar más órdenes"}
            </button>
          )}
        </div>
      </section>
    </>
  );
}

export function CriticalAlertsLink() {
  const { showToast } = useToast();
  const live = useDashboardLiveOptional();

  function handleClick() {
    showToast("Mostrando alertas críticas del sistema", "warning");
    if (window.matchMedia("(min-width: 1024px)").matches) {
      document
        .querySelector("[data-pings-panel]")
        ?.scrollIntoView({ behavior: "smooth" });
    } else {
      live?.openPings();
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="text-primary text-xs underline cursor-pointer hover:text-primary/80 transition-colors"
    >
      Ver Críticas
    </button>
  );
}
