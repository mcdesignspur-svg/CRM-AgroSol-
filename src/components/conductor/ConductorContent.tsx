"use client";

import { useCallback, useState } from "react";
import { DriverShell } from "@/components/layout/DriverShell";
import { useToast } from "@/components/providers/ToastProvider";
import { BranchLabel, StatusBadge } from "@/components/ui/badges";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import type { DriverOrder } from "@/lib/types";

interface ConductorContentProps {
  initialOrders: DriverOrder[];
  initialTotal: number;
}

export function ConductorContent({
  initialOrders,
  initialTotal,
}: ConductorContentProps) {
  const { showToast } = useToast();
  const [orders, setOrders] = useState(initialOrders);
  const [total, setTotal] = useState(initialTotal);
  const [refreshing, setRefreshing] = useState(false);
  const [completingId, setCompletingId] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    const res = await fetch("/api/orders?activeDelivery=true&limit=50");
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error ?? "Error al cargar entregas");
    }
    setOrders(data.orders);
    setTotal(data.total);
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await loadOrders();
      showToast("Entregas actualizadas", "success");
    } catch {
      showToast("Error al actualizar", "error");
    } finally {
      setRefreshing(false);
    }
  }

  async function handleComplete(orderId: string) {
    setCompletingId(orderId);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completado" }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error ?? "Error al completar la entrega", "error");
        return;
      }
      setOrders((prev) => prev.filter((order) => order.id !== orderId));
      setTotal((prev) => Math.max(0, prev - 1));
      showToast(`Entrega ${orderId} completada`, "success");
    } catch {
      showToast("Error al completar la entrega", "error");
    } finally {
      setCompletingId(null);
    }
  }

  return (
    <DriverShell
      headerRight={
        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex h-10 w-10 items-center justify-center border-2 border-black bg-white hover:bg-surface-container transition-colors disabled:opacity-60"
          aria-label="Actualizar entregas"
        >
          <span
            className={`material-symbols-outlined ${
              refreshing ? "animate-spin" : ""
            }`}
          >
            refresh
          </span>
        </button>
      }
    >
      <div className="p-4 space-y-4 pb-8">
        <div>
          <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight">
            Mis Entregas
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            {total === 0
              ? "No hay entregas pendientes en este momento."
              : `${total} ${total === 1 ? "entrega pendiente" : "entregas pendientes"}`}
          </p>
        </div>

        {orders.length === 0 ? (
          <section className="industrial-border bg-white p-8 text-center industrial-shadow">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant opacity-40">
              check_circle
            </span>
            <p className="mt-4 text-sm font-bold uppercase opacity-60">
              Sin entregas activas
            </p>
            <p className="mt-2 text-xs text-on-surface-variant">
              Cuando haya órdenes de entrega asignadas, aparecerán aquí.
            </p>
          </section>
        ) : (
          <ul className="space-y-4">
            {orders.map((order) => (
              <li
                key={order.id}
                className="industrial-border bg-white industrial-shadow overflow-hidden"
              >
                <div className="border-b-2 border-black bg-black px-4 py-3 text-white">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-xs font-bold text-secondary-container">
                        {order.id}
                      </p>
                      <p className="font-bold text-lg leading-tight">
                        {order.customerName}
                      </p>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>
                </div>

                <div className="space-y-4 p-4">
                  {order.deliveryAddress && (
                    <div className="flex gap-3">
                      <span className="material-symbols-outlined text-primary shrink-0">
                        location_on
                      </span>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                          Dirección
                        </p>
                        <p className="text-sm font-medium leading-snug">
                          {order.deliveryAddress}
                        </p>
                      </div>
                    </div>
                  )}

                  {order.customerPhone && (
                    <div className="flex gap-3">
                      <span className="material-symbols-outlined text-primary shrink-0">
                        call
                      </span>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                          Teléfono
                        </p>
                        <a
                          href={`tel:${order.customerPhone.replace(/\s/g, "")}`}
                          className="text-sm font-bold text-primary hover:underline"
                        >
                          {order.customerPhone}
                        </a>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <BranchLabel branchId={order.branchId} />
                    <span
                      className={`font-mono font-bold ${
                        order.status === "atrasado" ? "text-red-600" : "opacity-70"
                      }`}
                    >
                      {order.elapsedTime}
                    </span>
                    <span className="text-[10px] font-bold uppercase opacity-50">
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </div>

                  {order.allowedTransitions.includes("completado") && (
                    <button
                      type="button"
                      onClick={() => handleComplete(order.id)}
                      disabled={completingId === order.id}
                      className="btn-primary w-full py-3 text-sm font-bold uppercase industrial-border min-h-[48px] bg-green-600 hover:bg-green-700 disabled:opacity-60"
                    >
                      {completingId === order.id
                        ? "Completando..."
                        : "Marcar Entregada"}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </DriverShell>
  );
}
