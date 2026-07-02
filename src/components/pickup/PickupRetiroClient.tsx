"use client";

import { useEffect, useState } from "react";

interface PickupData {
  displayId: string;
  customerName: string;
  status: string;
  statusLabel: string;
  branchName: string;
  branchAddress: string;
  branchPhone: string;
  total: number;
  arrivedAt: string | null;
  canNotifyArrival: boolean;
}

interface PickupRetiroClientProps {
  token: string;
}

export function PickupRetiroClient({ token }: PickupRetiroClientProps) {
  const [pickup, setPickup] = useState<PickupData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifying, setNotifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notified, setNotified] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`/api/pickup/${encodeURIComponent(token)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Orden no encontrada");
        if (!cancelled) {
          setPickup(data);
          setNotified(Boolean(data.arrivedAt));
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "No se pudo cargar la orden",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleArrive() {
    setNotifying(true);
    setError(null);
    try {
      const res = await fetch(`/api/pickup/${encodeURIComponent(token)}`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al avisar llegada");
      setPickup(data);
      setNotified(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al avisar llegada",
      );
    } finally {
      setNotifying(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <p className="text-sm text-on-surface-variant">Cargando orden...</p>
      </div>
    );
  }

  if (error && !pickup) {
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

  if (!pickup) return null;

  const phoneHref = `tel:${pickup.branchPhone.replace(/\s/g, "")}`;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white border-b border-outline px-4 py-5">
        <p className="text-xs font-medium text-primary">Agrocentro Solá</p>
        <h1 className="font-display text-2xl font-semibold mt-1">
          Retiro de orden
        </h1>
        <p className="font-mono text-sm text-on-surface-variant mt-1">
          {pickup.displayId}
        </p>
      </header>

      <main className="max-w-lg mx-auto p-4 space-y-4">
        <section className="bg-white rounded-xl border border-outline p-5 shadow-sm">
          <p className="text-sm text-on-surface-variant">Hola, {pickup.customerName}</p>
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-sm font-medium">Estado</span>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                pickup.status === "listo"
                  ? "bg-emerald-50 text-emerald-700"
                  : pickup.status === "completado"
                    ? "bg-gray-100 text-gray-600"
                    : "bg-amber-50 text-amber-700"
              }`}
            >
              {pickup.statusLabel}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3 text-sm">
            <span className="text-on-surface-variant">Total</span>
            <span className="font-semibold text-primary">
              ${pickup.total.toFixed(2)}
            </span>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-outline p-5 shadow-sm space-y-2">
          <h2 className="text-sm font-semibold">Sucursal</h2>
          <p className="font-medium">{pickup.branchName}</p>
          <p className="text-sm text-on-surface-variant">{pickup.branchAddress}</p>
        </section>

        {notified ? (
          <section className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-center">
            <span className="material-symbols-outlined text-emerald-600 text-3xl">
              check_circle
            </span>
            <p className="mt-2 font-semibold text-emerald-800">
              ¡Avisamos a la sucursal que llegaste!
            </p>
            <p className="text-sm text-emerald-700 mt-1">
              El personal te atenderá en breve.
            </p>
          </section>
        ) : (
          <section className="space-y-3">
            <p className="text-sm text-on-surface-variant text-center px-2">
              Al llegar, elige cómo avisar a la sucursal:
            </p>
            <a
              href={phoneHref}
              className="btn-secondary w-full py-4 text-sm font-semibold flex items-center justify-center gap-2 min-h-[52px]"
            >
              <span className="material-symbols-outlined">call</span>
              Llamar a la sucursal
            </a>
            {pickup.canNotifyArrival && (
              <button
                type="button"
                onClick={handleArrive}
                disabled={notifying}
                className="btn-primary w-full py-4 text-sm font-semibold flex items-center justify-center gap-2 min-h-[52px] disabled:opacity-60"
              >
                <span className="material-symbols-outlined">location_on</span>
                {notifying ? "Avisando..." : "Ya llegué"}
              </button>
            )}
          </section>
        )}

        {error && (
          <p className="text-sm text-red-600 text-center">{error}</p>
        )}
      </main>
    </div>
  );
}
