"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useToast } from "@/components/providers/ToastProvider";
import { NotificationsButton } from "@/components/ui/NotificationsButton";
import { useRealtime } from "@/hooks/useRealtime";
import { BRANCH_LABELS } from "@/lib/constants";
import { isBranchId } from "@/lib/branch-definitions";
import { isDeliveryHighlighted } from "@/lib/geo";
import type { RealtimeServerMessage } from "@/lib/realtime/messages";
import type {
  Branch,
  BranchId,
  Delivery,
  EntregasLiveSnapshot,
  NotificationLog,
} from "@/lib/types";

const ENTREGAS_FALLBACK_POLL_MS = 12_000;

const EntregasMap = dynamic(
  () => import("./EntregasMap").then((mod) => mod.EntregasMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full bg-surface-container flex items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">
          sync
        </span>
      </div>
    ),
  },
);

interface EntregasPageContentProps {
  initialBranches: Branch[];
  initialDeliveries: Delivery[];
  initialLogs: NotificationLog[];
  completedCount: number;
}

function BranchCard({
  branch,
  highlighted,
  onPing,
  sending,
}: {
  branch: Branch;
  highlighted?: boolean;
  onPing: (id: string) => void;
  sending: string | null;
}) {
  return (
    <div
      className={`bg-white border border-outline rounded-lg p-4 shadow-sm transition-all ${
        highlighted
          ? "ring-2 ring-primary/30 bg-primary-container/30"
          : "hover:shadow-md"
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-display text-base font-semibold leading-tight text-on-surface">
            {branch.name}
          </h4>
          <p className="text-xs text-on-surface-variant mt-0.5">
            {branch.address}
          </p>
        </div>
        <span
          className={`px-2 py-0.5 text-xs font-medium rounded-full ${
            branch.capacityPercent >= 90
              ? "bg-red-50 text-red-700"
              : "bg-surface-container text-on-surface-variant"
          }`}
        >
          {branch.capacityPercent}%
        </span>
      </div>
      <div className="flex items-center justify-between mt-3">
        <div className="flex flex-col">
          <span className="text-xs text-on-surface-variant">
            Volumen actual
          </span>
          <span className="text-lg font-semibold text-on-surface">
            {branch.currentVolume} unidades
          </span>
        </div>
        {branch.lastPingSent ? (
          <div className="flex items-center gap-1.5 text-emerald-700">
            <span
              className="material-symbols-outlined text-base"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
            <span className="text-xs font-medium">
              {branch.lastPingSent}
            </span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onPing(branch.id)}
            disabled={sending === branch.id}
            className="btn-primary py-2 px-3 text-xs flex items-center gap-1.5 disabled:opacity-60"
          >
            <span
              className={`material-symbols-outlined text-sm ${
                sending === branch.id ? "animate-spin" : ""
              }`}
            >
              {sending === branch.id ? "sync" : "cell_tower"}
            </span>
            {sending === branch.id ? "Enviando..." : "GESTIONAR PING"}
          </button>
        )}
      </div>
    </div>
  );
}

export function EntregasPageContent({
  initialBranches,
  initialDeliveries,
  initialLogs,
  completedCount,
}: EntregasPageContentProps) {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center">
          <span className="material-symbols-outlined animate-spin text-4xl text-primary">
            sync
          </span>
        </div>
      }
    >
      <EntregasContent
        initialBranches={initialBranches}
        initialDeliveries={initialDeliveries}
        initialLogs={initialLogs}
        completedCount={completedCount}
      />
    </Suspense>
  );
}

type MobileTab = "mapa" | "entregas" | "sucursales";

function matchesDeliverySearch(delivery: Delivery, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  return [
    delivery.id,
    delivery.driverName,
    delivery.destination,
    delivery.orderId,
  ].some((value) => value?.toLowerCase().includes(normalized));
}

function EntregasContent({
  initialBranches,
  initialDeliveries,
  initialLogs,
  completedCount,
}: EntregasPageContentProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const ordenId = searchParams.get("orden");
  const branchFilter = searchParams.get("branch");
  const { showToast } = useToast();

  const [branches, setBranches] = useState(initialBranches);
  const [activeDeliveries, setActiveDeliveries] = useState(initialDeliveries);
  const [liveCompletedCount, setLiveCompletedCount] = useState(completedCount);
  const [logs, setLogs] = useState<NotificationLog[]>(initialLogs);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [mobileTab, setMobileTab] = useState<MobileTab>(() => {
    if (branchFilter) return "sucursales";
    if (ordenId) return "entregas";
    return "entregas";
  });
  const [sendingPing, setSendingPing] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [branchOpen, setBranchOpen] = useState(false);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | null>(
    null,
  );
  const branchRef = useRef<HTMLDivElement>(null);
  const deliveryRowRefs = useRef(new Map<string, HTMLElement>());

  const activeBranchId =
    branchFilter && isBranchId(branchFilter) ? branchFilter : null;

  const filteredDeliveries = useMemo(() => {
    return activeDeliveries.filter((delivery) => {
      if (activeBranchId && delivery.branchId !== activeBranchId) {
        return false;
      }
      return matchesDeliverySearch(delivery, searchQuery);
    });
  }, [activeBranchId, activeDeliveries, searchQuery]);

  const applyLiveSnapshot = useCallback((snapshot: EntregasLiveSnapshot) => {
    setActiveDeliveries(snapshot.deliveries);
    setLiveCompletedCount(snapshot.completedCount);
    setSelectedDeliveryId((current) => {
      if (!current) return current;
      return snapshot.deliveries.some((delivery) => delivery.id === current)
        ? current
        : null;
    });
  }, []);

  const silentRefresh = useCallback(async () => {
    try {
      const res = await fetch("/api/entregas/live");
      if (!res.ok) return;
      const data = (await res.json()) as EntregasLiveSnapshot;
      applyLiveSnapshot(data);
    } catch {
      // Keep last known snapshot on transient network errors.
    }
  }, [applyLiveSnapshot]);

  const handleRealtimeMessage = useCallback(
    (message: RealtimeServerMessage) => {
      if (message.type !== "entregas:update") {
        return;
      }
      applyLiveSnapshot(message.data);
    },
    [applyLiveSnapshot],
  );

  const { connected } = useRealtime({
    channel: "entregas",
    onMessage: handleRealtimeMessage,
  });

  useEffect(() => {
    if (connected) {
      return;
    }

    const initial = window.setTimeout(() => {
      void silentRefresh();
    }, 0);
    const timer = window.setInterval(() => {
      void silentRefresh();
    }, ENTREGAS_FALLBACK_POLL_MS);

    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
    };
  }, [connected, silentRefresh]);

  useEffect(() => {
    if (!selectedDeliveryId) return;
    const row = deliveryRowRefs.current.get(selectedDeliveryId);
    row?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selectedDeliveryId]);

  useEffect(() => {
    if (!branchOpen) return;
    function handleClick(event: MouseEvent) {
      if (branchRef.current && !branchRef.current.contains(event.target as Node)) {
        setBranchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [branchOpen]);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
  }, []);

  function selectDelivery(deliveryId: string | null) {
    setSelectedDeliveryId((current) =>
      deliveryId && current === deliveryId ? null : deliveryId,
    );
    if (deliveryId && mobileTab === "entregas") {
      // Keep list visible on desktop; on mobile jump to map for context.
      if (typeof window !== "undefined" && window.innerWidth < 1280) {
        setMobileTab("mapa");
      }
    }
  }

  function selectBranchFilter(branchId: BranchId | null) {
    setBranchOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    if (branchId) {
      params.set("branch", branchId);
    } else {
      params.delete("branch");
    }
    const query = params.toString();
    router.push(query ? `/entregas?${query}` : "/entregas");
  }

  function isRowHighlighted(delivery: Delivery) {
    return (
      isDeliveryHighlighted(delivery, ordenId) ||
      delivery.id === selectedDeliveryId
    );
  }

  async function handleBranchPing(branchId: string) {
    setSendingPing(branchId);
    try {
      const res = await fetch(`/api/branches/${branchId}/ping`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error();
      const updatedBranch = await res.json();
      setBranches((prev) =>
        prev.map((b) => (b.id === branchId ? updatedBranch : b)),
      );
      const notifRes = await fetch("/api/notifications");
      if (notifRes.ok) setLogs(await notifRes.json());
      showToast(`Ping enviado a ${updatedBranch.name}`, "success");
    } catch {
      showToast("Error al enviar ping", "error");
    } finally {
      setSendingPing(null);
    }
  }

  async function handleClearLogs() {
    try {
      await fetch("/api/notifications", { method: "DELETE" });
      setLogs([]);
      showToast("Registro de notificaciones limpiado", "info");
    } catch {
      showToast("Error al limpiar notificaciones", "error");
    }
  }

  const inTransitCount = filteredDeliveries.length;
  const hasActiveFilters = Boolean(activeBranchId || searchQuery.trim());
  const displayCompletedCount = liveCompletedCount;

  return (
    <AppShell
      fullWidth
      topBar={
        <>
          <header className="flex justify-between items-center px-3 sm:px-4 md:px-6 py-2 border-b border-outline bg-white z-40 shrink-0 gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <h2 className="font-display text-base sm:text-lg font-extrabold text-primary-container uppercase truncate md:hidden">
                Entregas
              </h2>
              <div className="hidden md:flex items-center gap-4 md:gap-8 min-w-0">
                <h2 className="font-display text-lg md:text-xl font-extrabold text-primary-container uppercase truncate">
                  Entregas y Sucursales
                </h2>
                <div className="flex gap-6">
                  <Link
                    href="/"
                    className="text-on-surface-variant font-mono hover:text-primary-container transition-all uppercase tracking-wider text-[11px]"
                  >
                    Panel
                  </Link>
                  <Link
                    href="/ordenes"
                    className="text-on-surface-variant font-mono hover:text-primary-container transition-all uppercase tracking-wider text-[11px]"
                  >
                    Órdenes
                  </Link>
                  <span className="text-black font-bold border-b-2 border-primary-container font-mono uppercase tracking-wider text-[11px]">
                    Entregas
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setSearchOpen((v) => !v)}
                className="sm:hidden p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Buscar"
              >
                <span className="material-symbols-outlined">search</span>
              </button>
              <form
                onSubmit={handleSearch}
                className="relative hidden sm:flex items-center bg-surface-container-low border border-outline px-4 py-1"
              >
                <span className="material-symbols-outlined text-black text-lg mr-2">
                  search
                </span>
                <input
                  className="bg-transparent border-none focus:ring-0 text-sm text-black w-36 md:w-48 placeholder:text-on-surface-variant/70 font-medium"
                  placeholder="Buscar entregas..."
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>
              <div className="relative hidden lg:block" ref={branchRef}>
                <button
                  type="button"
                  onClick={() => setBranchOpen((value) => !value)}
                  className="flex items-center gap-2 px-3 py-1.5 border border-outline text-xs font-medium hover:bg-surface-container transition-all min-h-[44px]"
                  aria-expanded={branchOpen}
                >
                  <span className="material-symbols-outlined text-base">hub</span>
                  <span className="max-w-[120px] truncate">
                    {activeBranchId
                      ? BRANCH_LABELS[activeBranchId].split(" ")[0]
                      : "Todas"}
                  </span>
                  <span className="material-symbols-outlined text-sm">
                    expand_more
                  </span>
                </button>
                {branchOpen && (
                  <div className="absolute right-0 top-full mt-1 w-56 bg-white industrial-border industrial-shadow z-50">
                    <button
                      type="button"
                      onClick={() => selectBranchFilter(null)}
                      className={`w-full text-left px-4 py-3 text-sm font-bold hover:bg-surface-container transition-colors min-h-[44px] ${
                        !activeBranchId ? "bg-secondary-container" : ""
                      }`}
                    >
                      Todas las sucursales
                    </button>
                    {(Object.entries(BRANCH_LABELS) as [BranchId, string][]).map(
                      ([id, label]) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => selectBranchFilter(id)}
                          className={`w-full text-left px-4 py-3 text-sm font-bold hover:bg-surface-container transition-colors min-h-[44px] ${
                            activeBranchId === id ? "bg-secondary-container" : ""
                          }`}
                        >
                          {label}
                        </button>
                      ),
                    )}
                  </div>
                )}
              </div>
              <NotificationsButton />
            </div>
          </header>

          {searchOpen && (
            <form
              onSubmit={(e) => {
                handleSearch(e);
                setSearchOpen(false);
              }}
              className="sm:hidden px-4 py-2 bg-surface-container-low border-b border-outline"
            >
              <input
                autoFocus
                className="w-full industrial-border bg-white text-sm font-bold py-2.5 px-3"
                placeholder="Buscar entregas..."
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          )}

          {/* Tabs móvil */}
          <div className="xl:hidden flex border-b border-outline bg-white shrink-0">
            {(
              [
                { id: "mapa" as const, label: "Mapa", icon: "map" },
                { id: "entregas" as const, label: "Entregas", icon: "local_shipping" },
                { id: "sucursales" as const, label: "Sucursales", icon: "storefront" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setMobileTab(tab.id)}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[48px] text-xs font-medium transition-colors ${
                  mobileTab === tab.id
                    ? "bg-secondary-container text-on-secondary-container border-b-2 border-primary -mb-[2px]"
                    : "text-on-surface-variant"
                }`}
              >
                <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {ordenId && (
            <div className="bg-secondary-container border-b border-outline px-6 py-2 flex items-center justify-between">
              <span className="text-xs font-medium">
                Gestionando orden{" "}
                <span className="font-mono text-primary">{ordenId}</span>
              </span>
              <Link
                href={activeBranchId ? `/entregas?branch=${activeBranchId}` : "/entregas"}
                className="text-xs font-medium hover:underline"
              >
                Cerrar
              </Link>
            </div>
          )}

          {hasActiveFilters && !ordenId && (
            <div className="bg-surface-container-low border-b border-outline px-4 sm:px-6 py-2 flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-on-surface-variant">
                Filtros activos:
              </span>
              {activeBranchId && (
                <button
                  type="button"
                  onClick={() => selectBranchFilter(null)}
                  className="inline-flex items-center gap-1 bg-white border border-black px-2 py-1 text-xs font-medium"
                >
                  {BRANCH_LABELS[activeBranchId]}
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              )}
              {searchQuery.trim() && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="inline-flex items-center gap-1 bg-white border border-black px-2 py-1 text-xs font-medium"
                >
                  &quot;{searchQuery.trim()}&quot;
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              )}
              <span className="text-[10px] font-mono font-bold uppercase ml-auto">
                {filteredDeliveries.length} resultado
                {filteredDeliveries.length === 1 ? "" : "s"}
              </span>
            </div>
          )}
        </>
      }
    >
      <div className="flex-1 overflow-hidden grid grid-cols-1 xl:grid-cols-12 gap-0 min-h-0">
        <div
          className={`xl:col-span-8 flex flex-col border-r-2 border-black relative min-h-0 xl:min-h-0 ${
            mobileTab !== "mapa" && mobileTab !== "entregas" ? "hidden xl:flex" : ""
          } ${mobileTab === "mapa" ? "flex" : mobileTab === "entregas" ? "flex" : ""}`}
        >
          <div
            className={`${
              mobileTab === "mapa" ? "flex-1" : "h-48 sm:h-64 xl:h-1/2"
            } w-full bg-surface-container relative border-b border-outline overflow-hidden shrink-0 ${
              mobileTab !== "mapa" ? "hidden xl:block" : ""
            }`}
          >
            <EntregasMap
              branches={branches}
              deliveries={filteredDeliveries}
              activeBranchId={activeBranchId}
              ordenId={ordenId}
              selectedDeliveryId={selectedDeliveryId}
              onSelectDelivery={selectDelivery}
              onLocateError={(message) => showToast(message, "info")}
            />
            <div className="absolute bottom-3 left-3 sm:bottom-6 sm:left-6 bg-white p-3 sm:p-4 border border-outline industrial-shadow flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-6 z-[400] pointer-events-none max-w-[calc(100%-1.5rem)]">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-3 h-3 border border-black bg-primary-container animate-pulse shrink-0" />
                <span className="font-mono font-bold text-black uppercase text-[10px] sm:text-xs">
                  {inTransitCount} EN TRÁNSITO
                </span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 sm:border-l-2 sm:border-black sm:pl-6">
                <div className="w-3 h-3 border border-black bg-secondary-container shrink-0" />
                <span className="font-mono font-bold text-black uppercase text-[10px] sm:text-xs">
                  {displayCompletedCount} ENTREGAS REALIZADAS
                </span>
              </div>
            </div>
          </div>

          <div
            className={`flex-1 flex flex-col bg-white min-h-0 ${
              mobileTab !== "entregas" ? "hidden xl:flex" : ""
            }`}
          >
            <div className="p-4 sm:p-6 border-b border-outline flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-surface-container-lowest">
              <h3 className="font-display text-lg sm:text-xl text-black flex items-center gap-2 uppercase">
                <span className="material-symbols-outlined text-primary-container">
                  local_shipping
                </span>
                Entregas Activas
                <span className="text-sm font-mono text-on-surface-variant">
                  ({filteredDeliveries.length})
                </span>
              </h3>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 font-mono text-xs font-medium transition-all min-h-[44px] ${
                    viewMode === "list"
                      ? "bg-primary text-white rounded-lg"
                      : "bg-white border border-outline text-black hover:bg-surface-container"
                  }`}
                >
                  Lista
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 font-mono text-xs font-medium transition-all min-h-[44px] ${
                    viewMode === "grid"
                      ? "bg-primary text-white rounded-lg"
                      : "bg-white border border-outline text-black hover:bg-surface-container"
                  }`}
                >
                  Cuadrícula
                </button>
              </div>
            </div>

            {viewMode === "list" ? (
              <>
                {/* Lista móvil — tarjetas */}
                <div className="md:hidden flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                  {filteredDeliveries.length === 0 ? (
                    <p className="text-center text-sm font-medium opacity-50 py-12">
                      {hasActiveFilters
                        ? "Sin entregas con estos filtros"
                        : "Sin entregas activas"}
                    </p>
                  ) : (
                    filteredDeliveries.map((delivery) => (
                    <div
                      key={delivery.id}
                      role="button"
                      tabIndex={0}
                      ref={(node) => {
                        if (node) {
                          deliveryRowRefs.current.set(delivery.id, node);
                        } else {
                          deliveryRowRefs.current.delete(delivery.id);
                        }
                      }}
                      onClick={() => selectDelivery(delivery.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          selectDelivery(delivery.id);
                        }
                      }}
                      className={`border border-outline p-4 industrial-shadow cursor-pointer transition-colors ${
                        isRowHighlighted(delivery)
                          ? "bg-secondary-container/30 ring-2 ring-primary/20"
                          : "hover:bg-surface-container-low"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-mono font-bold text-primary-container text-sm">
                          #{delivery.id}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-[9px] font-bold uppercase ${
                            delivery.status === "recogida"
                              ? "bg-primary-container text-white"
                              : "bg-secondary-container text-black"
                          }`}
                        >
                          {delivery.status === "recogida" ? "Recogida" : "Entrega"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 border border-black bg-surface-container flex items-center justify-center text-[10px] font-bold">
                          {delivery.driverInitials}
                        </div>
                        <span className="font-semibold text-sm">{delivery.driverName}</span>
                      </div>
                      <p className="text-xs text-on-surface-variant">{delivery.destination}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <p className="text-xs font-mono opacity-70">ETA: {delivery.eta}</p>
                        {delivery.branchId && (
                          <span className="text-[9px] font-bold uppercase bg-surface-container px-2 py-0.5 border border-black">
                            {BRANCH_LABELS[delivery.branchId]}
                          </span>
                        )}
                        {delivery.orderId && (
                          <Link
                            href={`/entregas?orden=${encodeURIComponent(delivery.orderId)}`}
                            onClick={(event) => event.stopPropagation()}
                            className="text-[9px] font-bold uppercase text-primary hover:underline"
                          >
                            {delivery.orderId}
                          </Link>
                        )}
                      </div>
                    </div>
                  ))
                  )}
                </div>
                {/* Lista desktop — tabla */}
                <div className="hidden md:block flex-1 overflow-y-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 table-header z-10">
                    <tr>
                      <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-wider">
                        Conductor
                      </th>
                      <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-wider">
                        Destino
                      </th>
                      <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-wider">
                        ETA
                      </th>
                      <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-wider text-right pr-6">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDeliveries.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-12 text-center text-sm font-medium opacity-50"
                        >
                          {hasActiveFilters
                            ? "Sin entregas con estos filtros"
                            : "Sin entregas activas"}
                        </td>
                      </tr>
                    ) : (
                      filteredDeliveries.map((delivery) => (
                      <tr
                        key={delivery.id}
                        ref={(node) => {
                          if (node) {
                            deliveryRowRefs.current.set(delivery.id, node);
                          } else {
                            deliveryRowRefs.current.delete(delivery.id);
                          }
                        }}
                        onClick={() => selectDelivery(delivery.id)}
                        className={`hover:bg-surface-container-low transition-colors border-b border-black/10 cursor-pointer ${
                          isRowHighlighted(delivery)
                            ? "bg-secondary-container/30"
                            : ""
                        }`}
                      >
                        <td className="px-6 py-4 text-primary-container font-bold font-mono">
                          <div className="flex flex-col gap-1">
                            <span>#{delivery.id}</span>
                            {delivery.orderId && (
                              <Link
                                href={`/entregas?orden=${encodeURIComponent(delivery.orderId)}`}
                                onClick={(event) => event.stopPropagation()}
                                className="text-[10px] text-black hover:underline"
                              >
                                {delivery.orderId}
                              </Link>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 border border-black bg-surface-container flex items-center justify-center text-[10px] font-bold">
                              {delivery.driverInitials}
                            </div>
                            <span className="font-semibold text-black">
                              {delivery.driverName}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium">
                          <div>{delivery.destination}</div>
                          {delivery.branchId && (
                            <span className="text-xs font-medium text-on-surface-variant">
                              {BRANCH_LABELS[delivery.branchId]}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-on-surface-variant font-medium">
                          {delivery.eta}
                        </td>
                        <td className="px-6 py-4 text-right pr-6">
                          <span
                            className={`px-3 py-1 text-xs font-medium industrial-border ${
                              delivery.status === "recogida"
                                ? "bg-primary-container text-white"
                                : "bg-secondary-container text-black"
                            }`}
                          >
                            {delivery.status === "recogida"
                              ? "Recogida"
                              : "Entrega"}
                          </span>
                        </td>
                      </tr>
                    ))
                    )}
                  </tbody>
                </table>
                </div>
              </>
            ) : (
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredDeliveries.length === 0 ? (
                  <p className="col-span-full text-center text-sm font-medium opacity-50 py-12">
                    {hasActiveFilters
                      ? "Sin entregas con estos filtros"
                      : "Sin entregas activas"}
                  </p>
                ) : (
                  filteredDeliveries.map((delivery) => (
                  <div
                    key={delivery.id}
                    role="button"
                    tabIndex={0}
                    ref={(node) => {
                      if (node) {
                        deliveryRowRefs.current.set(delivery.id, node);
                      } else {
                        deliveryRowRefs.current.delete(delivery.id);
                      }
                    }}
                    onClick={() => selectDelivery(delivery.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        selectDelivery(delivery.id);
                      }
                    }}
                    className={`border border-outline p-4 industrial-shadow hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer ${
                      isRowHighlighted(delivery)
                        ? "bg-secondary-container/30 ring-2 ring-primary/20"
                        : ""
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className="font-mono font-bold text-primary-container">
                        #{delivery.id}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-[9px] font-bold uppercase ${
                          delivery.status === "recogida"
                            ? "bg-primary-container text-white"
                            : "bg-secondary-container text-black"
                        }`}
                      >
                        {delivery.status === "recogida" ? "Recogida" : "Entrega"}
                      </span>
                    </div>
                    <p className="font-bold text-sm">{delivery.driverName}</p>
                    <p className="text-xs text-on-surface-variant mt-1">
                      {delivery.destination}
                    </p>
                    <p className="text-xs font-mono mt-2 opacity-70">
                      ETA: {delivery.eta}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {delivery.branchId && (
                        <span className="text-[9px] font-bold uppercase bg-surface-container px-2 py-0.5 border border-black">
                          {BRANCH_LABELS[delivery.branchId]}
                        </span>
                      )}
                      {delivery.orderId && (
                        <Link
                          href={`/entregas?orden=${encodeURIComponent(delivery.orderId)}`}
                          onClick={(event) => event.stopPropagation()}
                          className="text-[9px] font-bold uppercase text-primary hover:underline"
                        >
                          {delivery.orderId}
                        </Link>
                      )}
                    </div>
                  </div>
                ))
                )}
              </div>
            )}
          </div>
        </div>

        <div
          className={`xl:col-span-4 flex flex-col bg-surface-container-lowest overflow-hidden ${
            mobileTab !== "sucursales" ? "hidden xl:flex" : ""
          }`}
        >
          <section className="p-6 border-b border-outline bg-white">
            <h3 className="font-mono text-black font-extrabold mb-6 uppercase tracking-widest text-xs flex justify-between items-center">
              Estado de Sucursales ({branches.length})
              <span className="material-symbols-outlined text-base">info</span>
            </h3>
            <div className="space-y-4">
              {branches.map((branch) => (
                <BranchCard
                  key={branch.id}
                  branch={branch}
                  highlighted={branch.id === activeBranchId}
                  onPing={handleBranchPing}
                  sending={sendingPing}
                />
              ))}
            </div>
          </section>

          <section className="flex-1 flex flex-col p-6 overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-mono text-black font-semibold tracking-widest text-xs">
                Registro de Notificaciones
              </h3>
              <button
                type="button"
                onClick={handleClearLogs}
                disabled={logs.length === 0}
                className="text-primary-container text-[10px] font-extrabold hover:underline uppercase disabled:opacity-40"
              >
                Limpiar Todo
              </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
              {logs.length === 0 ? (
                <p className="text-xs font-medium opacity-40 text-center py-8">
                  Sin notificaciones
                </p>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className={`bg-white p-3 border-y border-r border-black shadow-sm ${
                      log.accent === "primary"
                        ? "border-l-4 border-l-primary-container"
                        : "border-l-4 border-l-black"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] text-black font-bold font-mono">
                        {log.time}
                      </span>
                      <span
                        className={`text-[10px] px-1 font-bold uppercase ${
                          log.source === "SISTEMA" || log.source === "Propietario"
                            ? "bg-primary text-white rounded-lg"
                            : "bg-surface-container-high text-black"
                        }`}
                      >
                        {log.source}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-black">
                      {log.message}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
