"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";
import { PingCard } from "@/components/dashboard/PingCard";
import { useToast } from "@/components/providers/ToastProvider";
import type { Ping } from "@/lib/types";

interface PingsSheetContextValue {
  openPings: () => void;
  pings: Ping[];
  dismissPing: (id: string) => Promise<void>;
  callDriver: (ping: Ping) => void;
}

const PingsSheetContext = createContext<PingsSheetContextValue | null>(null);

export function PingsSheetProvider({
  initialPings,
  children,
}: {
  initialPings: Ping[];
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pings, setPings] = useState(initialPings);
  const { showToast } = useToast();

  const openPings = useCallback(() => setOpen(true), []);

  const dismissPing = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/pings/${id}`, { method: "PATCH" });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          showToast(
            (data as { error?: string }).error ?? "Error al descartar ping",
            "error",
          );
          return;
        }
        setPings((prev) => prev.filter((p) => p.id !== id));
        showToast("Ping descartado", "info");
      } catch {
        showToast("Error al descartar ping", "error");
      }
    },
    [showToast],
  );

  const callDriver = useCallback(
    (ping: Ping) => {
      showToast(`Contactando — ${ping.title}`, "info");
    },
    [showToast],
  );

  return (
    <PingsSheetContext.Provider
      value={{ openPings, pings, dismissPing, callDriver }}
    >
      {children}

      {pings.length > 0 && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="lg:hidden fixed bottom-20 right-4 z-40 btn-primary industrial-border industrial-shadow w-14 h-14 flex items-center justify-center"
          aria-label="Ver pings en vivo"
        >
          <span className="relative">
            <span className="material-symbols-outlined text-2xl">bolt</span>
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-black text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {pings.length}
            </span>
          </span>
        </button>
      )}

      {open && (
        <div className="lg:hidden fixed inset-0 z-[70]">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
            aria-label="Cerrar pings"
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[75vh] bg-white border-t-2 border-black flex flex-col animate-[slideFromBottom_0.25s_ease-out] safe-area-bottom">
            <div className="p-4 border-b-2 border-black flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600" />
                </div>
                <h3 className="font-display text-sm font-extrabold uppercase">
                  Pings en Vivo
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Cerrar"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {pings.length === 0 ? (
                <p className="text-xs font-bold uppercase text-center opacity-50 py-8">
                  Sin pings activos
                </p>
              ) : (
                pings.map((ping) => (
                  <PingCard
                    key={ping.id}
                    ping={ping}
                    onDismiss={dismissPing}
                    onCallDriver={callDriver}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </PingsSheetContext.Provider>
  );
}

export function usePingsSheet() {
  const ctx = useContext(PingsSheetContext);
  if (!ctx) {
    throw new Error("usePingsSheet debe usarse dentro de PingsSheetProvider");
  }
  return ctx;
}
