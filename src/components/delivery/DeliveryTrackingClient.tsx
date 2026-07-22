"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRealtime } from "@/hooks/useRealtime";
import type { RealtimeServerMessage } from "@/lib/realtime/messages";
import { DeliveryFlowProgress } from "@/components/delivery/DeliveryFlowProgress";

interface DeliveryData {
  displayId: string;
  customerName: string;
  status: string;
  statusLabel: string;
  deliveryAddress: string;
  branchName: string;
  total: number;
  driverName: string | null;
  eta: string | null;
  dispatchedAt: string | null;
}

interface DeliveryTrackingClientProps {
  token: string;
}

const FALLBACK_POLL_MS = 15_000;

export function DeliveryTrackingClient({ token }: DeliveryTrackingClientProps) {
  const [delivery, setDelivery] = useState<DeliveryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const previousStatus = useRef<string | null>(null);

  const applyDelivery = useCallback((data: DeliveryData) => {
    previousStatus.current = data.status;
    setDelivery(data);
  }, []);

  const loadDelivery = useCallback(async () => {
    const res = await fetch(`/api/delivery/${encodeURIComponent(token)}`);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error ?? "Orden no encontrada");
    }
    applyDelivery(data as DeliveryData);
    return data as DeliveryData;
  }, [applyDelivery, token]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        await loadDelivery();
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "No se pudo cargar la orden",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [loadDelivery]);

  const handleRealtimeMessage = useCallback(
    (message: RealtimeServerMessage) => {
      if (message.type !== "delivery:update") {
        return;
      }
      applyDelivery(message.data);
      setError(null);
      setLoading(false);
    },
    [applyDelivery],
  );

  const { connected } = useRealtime({
    channel: "delivery",
    token,
    onMessage: handleRealtimeMessage,
  });

  useEffect(() => {
    if (connected) {
      return;
    }

    const timer = window.setInterval(() => {
      void loadDelivery().catch(() => undefined);
    }, FALLBACK_POLL_MS);

    return () => window.clearInterval(timer);
  }, [connected, loadDelivery]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <p className="text-sm text-on-surface-variant">Cargando orden...</p>
      </div>
    );
  }

  if (error && !delivery) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-xl border border-outline p-6 text-center shadow-sm">
          <span className="material-symbols-outlined text-primary text-4xl">
            error
          </span>
          <p className="mt-3 font-semibold text-on-surface">{error}</p>
        </div>
      </div>
    );
  }

  if (!delivery) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white border-b border-outline px-4 py-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-primary">
              Agrocentro y Ferretería Solá
            </p>
            <h1 className="font-display text-2xl font-semibold mt-1">
              Seguimiento de entrega
            </h1>
            <p className="font-mono text-sm text-on-surface-variant mt-1">
              {delivery.displayId}
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${
              connected
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-outline bg-surface text-on-surface-variant"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                connected ? "bg-emerald-500 animate-pulse" : "bg-gray-400"
              }`}
            />
            {connected ? "En vivo" : "Sincronizando"}
          </span>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4 space-y-4">
        <section className="bg-white rounded-xl border border-outline p-5 shadow-sm">
          <p className="text-sm text-on-surface-variant">
            Hola, {delivery.customerName}
          </p>
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-sm font-medium">Estado</span>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                delivery.status === "en-transito"
                  ? "bg-blue-50 text-blue-700"
                  : delivery.status === "completado"
                    ? "bg-gray-100 text-gray-600"
                    : "bg-amber-50 text-amber-700"
              }`}
            >
              {delivery.statusLabel}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3 text-sm">
            <span className="text-on-surface-variant">Total</span>
            <span className="font-semibold text-primary">
              ${delivery.total.toFixed(2)}
            </span>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-outline p-5 shadow-sm">
          <h2 className="text-sm font-semibold mb-3">Progreso</h2>
          <DeliveryFlowProgress
            type="entrega"
            fulfillment="delivery"
            status={
              delivery.status as
                | "pendiente"
                | "en-transito"
                | "atrasado"
                | "completado"
            }
            dispatchedAt={delivery.dispatchedAt ?? undefined}
          />
        </section>

        <section className="bg-white rounded-xl border border-outline p-5 shadow-sm space-y-2">
          <h2 className="text-sm font-semibold">Dirección de entrega</h2>
          <p className="text-sm text-on-surface-variant whitespace-pre-wrap">
            {delivery.deliveryAddress}
          </p>
          <p className="text-xs text-on-surface-variant pt-1">
            Desde {delivery.branchName}
          </p>
        </section>

        {delivery.driverName && delivery.status === "en-transito" && (
          <section className="bg-white rounded-xl border border-outline p-5 shadow-sm space-y-2">
            <h2 className="text-sm font-semibold">Conductor</h2>
            <p className="font-medium">{delivery.driverName}</p>
            {delivery.eta && (
              <p className="text-sm text-on-surface-variant">
                ETA estimado: {delivery.eta}
              </p>
            )}
          </section>
        )}

        {delivery.status === "completado" && (
          <section className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-center">
            <span className="material-symbols-outlined text-emerald-600 text-3xl">
              check_circle
            </span>
            <p className="mt-2 font-semibold text-emerald-800">
              ¡Tu pedido fue entregado!
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
