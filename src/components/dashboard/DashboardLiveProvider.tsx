"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { PingCard } from "@/components/dashboard/PingCard";
import { useToast } from "@/components/providers/ToastProvider";
import { useRealtime } from "@/hooks/useRealtime";
import type { RealtimeServerMessage } from "@/lib/realtime/messages";
import {
  areAlertSoundsUnlocked,
  playAlertSound,
  unlockAlertSounds,
} from "@/lib/sounds/alert";
import type {
  DashboardMetrics,
  DashboardUpdates,
  NotificationLog,
  Order,
  Ping,
} from "@/lib/types";

const FALLBACK_POLL_MS = 30_000;
const SLA_CHECK_POLL_MS = 60_000;

interface DashboardLiveContextValue {
  pings: Ping[];
  notifications: NotificationLog[];
  metrics: DashboardMetrics;
  orders: Order[];
  ordersTotal: number;
  lastUpdatedAt: string | null;
  isConnected: boolean;
  isPolling: boolean;
  soundsEnabled: boolean;
  enableSounds: () => void;
  dismissPing: (id: string) => Promise<void>;
  callDriver: (ping: Ping) => void;
  openPings: () => void;
  refresh: () => Promise<void>;
}

const DashboardLiveContext = createContext<DashboardLiveContextValue | null>(
  null,
);

interface DashboardLiveProviderProps {
  initialPings: Ping[];
  initialNotifications: NotificationLog[];
  initialMetrics: DashboardMetrics;
  initialOrders: Order[];
  initialOrdersTotal: number;
  children: React.ReactNode;
}

export function DashboardLiveProvider({
  initialPings,
  initialNotifications,
  initialMetrics,
  initialOrders,
  initialOrdersTotal,
  children,
}: DashboardLiveProviderProps) {
  const { showToast } = useToast();
  const [pingsOpen, setPingsOpen] = useState(false);
  const [pings, setPings] = useState(initialPings);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [metrics, setMetrics] = useState(initialMetrics);
  const [orders, setOrders] = useState(initialOrders);
  const [ordersTotal, setOrdersTotal] = useState(initialOrdersTotal);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [soundsEnabled, setSoundsEnabled] = useState(false);

  const seenPingIds = useRef(new Set(initialPings.map((ping) => ping.id)));
  const seenNotificationIds = useRef(
    new Set(initialNotifications.map((log) => log.id)),
  );
  const isFirstUpdate = useRef(true);

  const applyUpdates = useCallback(
    (data: DashboardUpdates, notify: boolean) => {
      setPings(data.pings);
      setNotifications(data.notifications);
      setMetrics(data.metrics);
      setOrders(data.orders);
      setOrdersTotal(data.ordersTotal);
      setLastUpdatedAt(data.updatedAt);

      if (!notify) {
        data.pings.forEach((ping) => seenPingIds.current.add(ping.id));
        data.notifications.forEach((log) =>
          seenNotificationIds.current.add(log.id),
        );
        return;
      }

      for (const ping of data.pings) {
        if (seenPingIds.current.has(ping.id)) {
          continue;
        }
        seenPingIds.current.add(ping.id);

        if (ping.priority === "urgente") {
          showToast(ping.title, "warning");
          if (areAlertSoundsUnlocked()) {
            playAlertSound("urgent");
          }
        } else if (ping.priority === "sistema") {
          showToast(ping.title, "info");
          if (areAlertSoundsUnlocked()) {
            playAlertSound("info");
          }
        }
      }

      for (const log of data.notifications) {
        if (seenNotificationIds.current.has(log.id)) {
          continue;
        }
        seenNotificationIds.current.add(log.id);

        if (log.source === "PICKUP") {
          showToast(log.message, "warning");
          if (areAlertSoundsUnlocked()) {
            playAlertSound("urgent");
          }
        }
      }
    },
    [showToast],
  );

  const refresh = useCallback(async () => {
    setIsPolling(true);
    try {
      const res = await fetch("/api/dashboard/updates");
      const data = (await res.json()) as DashboardUpdates & { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Error al actualizar el panel");
      }
      applyUpdates(data, !isFirstUpdate.current);
      isFirstUpdate.current = false;
    } catch (error) {
      console.error("Dashboard live refresh failed", error);
    } finally {
      setIsPolling(false);
    }
  }, [applyUpdates]);

  const silentRefresh = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/updates");
      const data = (await res.json()) as DashboardUpdates & { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Error al actualizar el panel");
      }
      applyUpdates(data, !isFirstUpdate.current);
      isFirstUpdate.current = false;
    } catch (error) {
      console.error("Dashboard live refresh failed", error);
    }
  }, [applyUpdates]);

  const handleRealtimeMessage = useCallback(
    (message: RealtimeServerMessage) => {
      if (message.type !== "dashboard:update") {
        return;
      }
      applyUpdates(message.data, !isFirstUpdate.current);
      isFirstUpdate.current = false;
    },
    [applyUpdates],
  );

  const { connected } = useRealtime({
    channel: "dashboard",
    onMessage: handleRealtimeMessage,
  });

  useEffect(() => {
    if (connected) {
      return;
    }

    void silentRefresh();
    const timer = window.setInterval(() => {
      void silentRefresh();
    }, FALLBACK_POLL_MS);

    return () => window.clearInterval(timer);
  }, [connected, silentRefresh]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void silentRefresh();
    }, SLA_CHECK_POLL_MS);

    return () => window.clearInterval(timer);
  }, [silentRefresh]);

  useEffect(() => {
    function enableSounds() {
      unlockAlertSounds();
      setSoundsEnabled(true);
    }

    window.addEventListener("pointerdown", enableSounds, { once: true });
    return () => window.removeEventListener("pointerdown", enableSounds);
  }, []);

  const enableSounds = useCallback(() => {
    unlockAlertSounds();
    setSoundsEnabled(true);
    playAlertSound("info");
  }, []);

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
        setPings((prev) => prev.filter((ping) => ping.id !== id));
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

  const openPings = useCallback(() => setPingsOpen(true), []);

  return (
    <DashboardLiveContext.Provider
      value={{
        pings,
        notifications,
        metrics,
        orders,
        ordersTotal,
        lastUpdatedAt,
        isConnected: connected,
        isPolling,
        soundsEnabled,
        enableSounds,
        dismissPing,
        callDriver,
        openPings,
        refresh,
      }}
    >
      {children}

      {!soundsEnabled && (
        <button
          type="button"
          onClick={enableSounds}
          className="fixed bottom-4 left-4 z-40 btn-secondary px-3 py-2 text-xs shadow-sm"
        >
          Activar sonidos
        </button>
      )}

      {pings.length > 0 && (
        <button
          type="button"
          onClick={() => setPingsOpen(true)}
          className="lg:hidden fixed bottom-20 right-4 z-40 btn-primary rounded-full shadow-lg w-12 h-12 flex items-center justify-center"
          aria-label="Ver pings en vivo"
        >
          <span className="relative">
            <span className="material-symbols-outlined text-2xl">bolt</span>
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-[9px] font-medium rounded-full flex items-center justify-center">
              {pings.length}
            </span>
          </span>
        </button>
      )}

      {pingsOpen && (
        <div className="lg:hidden fixed inset-0 z-[70]">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            onClick={() => setPingsOpen(false)}
            aria-label="Cerrar pings"
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[75vh] bg-white border-t border-outline rounded-t-2xl flex flex-col animate-[slideFromBottom_0.25s_ease-out] safe-area-bottom shadow-xl">
            <div className="px-4 py-3 border-b border-outline flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                </div>
                <h3 className="font-display text-sm font-semibold text-on-surface">
                  Pings en vivo
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPingsOpen(false)}
                className="p-2 rounded-lg hover:bg-surface-container min-h-[40px] min-w-[40px] flex items-center justify-center text-on-surface-variant"
                aria-label="Cerrar"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {pings.length === 0 ? (
                <p className="text-xs text-on-surface-variant text-center py-8">
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
    </DashboardLiveContext.Provider>
  );
}

export function useDashboardLive() {
  const ctx = useContext(DashboardLiveContext);
  if (!ctx) {
    throw new Error(
      "useDashboardLive debe usarse dentro de DashboardLiveProvider",
    );
  }
  return ctx;
}

export function useDashboardLiveOptional() {
  return useContext(DashboardLiveContext);
}

export function usePingsSheet() {
  return useDashboardLive();
}
