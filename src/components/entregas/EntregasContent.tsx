"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useToast } from "@/components/providers/ToastProvider";
import { NotificationsButton } from "@/components/ui/NotificationsButton";
import type { Branch, Delivery, NotificationLog } from "@/lib/types";

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
      className={`bg-white border-2 border-black p-4 industrial-shadow transition-all group ${
        highlighted
          ? "bg-secondary-container/10 border-l-8 border-l-primary-container"
          : "hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-display text-lg font-bold leading-none uppercase">
            {branch.name}
          </h4>
          <p className="text-[10px] font-bold text-on-surface-variant mt-1">
            {branch.address}
          </p>
        </div>
        <span
          className={`px-2 py-1 text-[9px] font-bold uppercase ${
            branch.capacityPercent >= 90
              ? "bg-black text-white"
              : "bg-white border border-black text-black"
          }`}
        >
          {branch.capacityPercent}% CAP
        </span>
      </div>
      <div className="flex items-center justify-between mt-4">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter">
            Vol. Actual
          </span>
          <span className="text-xl font-extrabold text-black">
            {branch.currentVolume} Unidades
          </span>
        </div>
        {branch.lastPingSent ? (
          <div className="flex items-center gap-2 text-black">
            <span
              className="material-symbols-outlined text-base"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
            <span className="text-[10px] font-extrabold uppercase">
              {branch.lastPingSent}
            </span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onPing(branch.id)}
            disabled={sending === branch.id}
            className="bg-primary-container text-white font-bold py-2 px-4 text-[10px] active:scale-95 transition-all border-2 border-black flex items-center gap-2 uppercase disabled:opacity-60"
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

function EntregasContent({
  initialBranches,
  initialDeliveries,
  initialLogs,
  completedCount,
}: EntregasPageContentProps) {
  const searchParams = useSearchParams();
  const ordenId = searchParams.get("orden");
  const branchFilter = searchParams.get("branch");
  const { showToast } = useToast();

  const [branches, setBranches] = useState(initialBranches);
  const [activeDeliveries] = useState(initialDeliveries);
  const [logs, setLogs] = useState<NotificationLog[]>(initialLogs);
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [mobileTab, setMobileTab] = useState<MobileTab>(() => {
    if (branchFilter) return "sucursales";
    if (ordenId) return "entregas";
    return "entregas";
  });
  const [mapZoom, setMapZoom] = useState(1);
  const [sendingPing, setSendingPing] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (searchQuery.trim()) {
        showToast(`Buscando: "${searchQuery}"`, "info");
      }
    },
    [searchQuery, showToast],
  );

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

  function handleMapControl(action: "zoom-in" | "zoom-out" | "locate") {
    if (action === "zoom-in") {
      setMapZoom((z) => Math.min(z + 0.2, 2));
      showToast("Zoom aumentado", "info");
    } else if (action === "zoom-out") {
      setMapZoom((z) => Math.max(z - 0.2, 0.6));
      showToast("Zoom reducido", "info");
    } else {
      showToast("Centrando en tu ubicación...", "info");
    }
  }

  const inTransitCount = activeDeliveries.length;

  return (
    <AppShell
      fullWidth
      topBar={
        <>
          <header className="flex justify-between items-center px-3 sm:px-4 md:px-6 py-2 border-b-2 border-black bg-white z-40 shrink-0 gap-2">
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
                  <span className="text-black font-bold border-b-2 border-primary-container font-mono uppercase tracking-wider text-[11px]">
                    Órdenes
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
                className="relative hidden sm:flex items-center bg-surface-container-low border-2 border-black px-4 py-1"
              >
                <span className="material-symbols-outlined text-black text-lg mr-2">
                  search
                </span>
                <input
                  className="bg-transparent border-none focus:ring-0 text-sm text-black w-36 placeholder:text-on-surface-variant/70 font-medium"
                  placeholder="Buscar órdenes..."
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>
              <NotificationsButton />
            </div>
          </header>

          {searchOpen && (
            <form
              onSubmit={(e) => {
                handleSearch(e);
                setSearchOpen(false);
              }}
              className="sm:hidden px-4 py-2 bg-surface-container-low border-b-2 border-black"
            >
              <input
                autoFocus
                className="w-full industrial-border bg-white text-sm font-bold py-2.5 px-3"
                placeholder="Buscar órdenes..."
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          )}

          {/* Tabs móvil */}
          <div className="xl:hidden flex border-b-2 border-black bg-white shrink-0">
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
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[48px] text-[10px] font-bold uppercase transition-colors ${
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
            <div className="bg-secondary-container border-b-2 border-black px-6 py-2 flex items-center justify-between">
              <span className="text-xs font-bold uppercase">
                Gestionando orden{" "}
                <span className="font-mono text-primary">{ordenId}</span>
              </span>
              <Link
                href="/entregas"
                className="text-[10px] font-bold uppercase hover:underline"
              >
                Cerrar
              </Link>
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
            className={`h-48 sm:h-64 xl:h-1/2 w-full bg-surface-container relative border-b-2 border-black overflow-hidden shrink-0 ${
              mobileTab !== "mapa" ? "hidden xl:block" : ""
            }`}
          >
            <div className="absolute inset-0 z-0 overflow-hidden">
              <div
                className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 grayscale contrast-125 opacity-60 light-grid-pattern transition-transform duration-300 origin-center"
                style={{ transform: `scale(${mapZoom})` }}
              />
              <div className="absolute top-6 right-6 flex flex-col gap-2 z-10">
                <button
                  type="button"
                  onClick={() => handleMapControl("zoom-in")}
                  className="bg-white p-2 border-2 border-black hover:bg-surface-container active:scale-95 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                >
                  <span className="material-symbols-outlined">add</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleMapControl("zoom-out")}
                  className="bg-white p-2 border-2 border-black hover:bg-surface-container active:scale-95 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                >
                  <span className="material-symbols-outlined">remove</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleMapControl("locate")}
                  className="bg-white p-2 border-2 border-black hover:bg-surface-container active:scale-95 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                >
                  <span className="material-symbols-outlined text-primary-container">
                    my_location
                  </span>
                </button>
              </div>
            </div>
            <div className="absolute bottom-3 left-3 sm:bottom-6 sm:left-6 bg-white p-3 sm:p-4 border-2 border-black industrial-shadow flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-6 z-10 max-w-[calc(100%-1.5rem)]">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-3 h-3 border border-black bg-primary-container animate-pulse shrink-0" />
                <span className="font-mono font-bold text-black uppercase text-[10px] sm:text-xs">
                  {inTransitCount} EN TRÁNSITO
                </span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 sm:border-l-2 sm:border-black sm:pl-6">
                <div className="w-3 h-3 border border-black bg-secondary-container shrink-0" />
                <span className="font-mono font-bold text-black uppercase text-[10px] sm:text-xs">
                  {completedCount} ENTREGAS REALIZADAS
                </span>
              </div>
            </div>
          </div>

          <div
            className={`flex-1 flex flex-col bg-white min-h-0 ${
              mobileTab !== "entregas" ? "hidden xl:flex" : ""
            }`}
          >
            <div className="p-4 sm:p-6 border-b-2 border-black flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-surface-container-lowest">
              <h3 className="font-display text-lg sm:text-xl text-black flex items-center gap-2 uppercase">
                <span className="material-symbols-outlined text-primary-container">
                  local_shipping
                </span>
                Entregas Activas
              </h3>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 font-mono text-[10px] font-bold uppercase transition-all min-h-[44px] ${
                    viewMode === "list"
                      ? "bg-black text-white"
                      : "bg-white border-2 border-black text-black hover:bg-surface-container"
                  }`}
                >
                  Lista
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 font-mono text-[10px] font-bold uppercase transition-all min-h-[44px] ${
                    viewMode === "grid"
                      ? "bg-black text-white"
                      : "bg-white border-2 border-black text-black hover:bg-surface-container"
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
                  {activeDeliveries.length === 0 ? (
                    <p className="text-center text-sm font-bold uppercase opacity-50 py-12">
                      Sin entregas activas
                    </p>
                  ) : (
                    activeDeliveries.map((delivery) => (
                    <div
                      key={delivery.id}
                      className={`border-2 border-black p-4 industrial-shadow ${
                        ordenId && delivery.id.includes(ordenId.slice(-4))
                          ? "bg-secondary-container/30"
                          : ""
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
                      <p className="text-xs font-mono mt-1 opacity-70">ETA: {delivery.eta}</p>
                    </div>
                  ))
                  )}
                </div>
                {/* Lista desktop — tabla */}
                <div className="hidden md:block flex-1 overflow-y-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-black text-white z-10">
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
                    {activeDeliveries.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-12 text-center text-sm font-bold uppercase opacity-50"
                        >
                          Sin entregas activas
                        </td>
                      </tr>
                    ) : (
                      activeDeliveries.map((delivery) => (
                      <tr
                        key={delivery.id}
                        className={`hover:bg-surface-container-low transition-colors border-b border-black/10 ${
                          ordenId && delivery.id.includes(ordenId.slice(-4))
                            ? "bg-secondary-container/30"
                            : ""
                        }`}
                      >
                        <td className="px-6 py-4 text-primary-container font-bold font-mono">
                          #{delivery.id}
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
                          {delivery.destination}
                        </td>
                        <td className="px-6 py-4 text-on-surface-variant font-medium">
                          {delivery.eta}
                        </td>
                        <td className="px-6 py-4 text-right pr-6">
                          <span
                            className={`px-3 py-1 text-[10px] font-bold uppercase industrial-border ${
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
                {activeDeliveries.length === 0 ? (
                  <p className="col-span-full text-center text-sm font-bold uppercase opacity-50 py-12">
                    Sin entregas activas
                  </p>
                ) : (
                  activeDeliveries.map((delivery) => (
                  <div
                    key={delivery.id}
                    className="border-2 border-black p-4 industrial-shadow hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
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
          <section className="p-6 border-b-2 border-black bg-white">
            <h3 className="font-mono text-black font-extrabold mb-6 uppercase tracking-widest text-xs flex justify-between items-center">
              Estado de Sucursales ({branches.length})
              <span className="material-symbols-outlined text-base">info</span>
            </h3>
            <div className="space-y-4">
              {branches.map((branch) => (
                <BranchCard
                  key={branch.id}
                  branch={branch}
                  highlighted={branch.id === branchFilter}
                  onPing={handleBranchPing}
                  sending={sendingPing}
                />
              ))}
            </div>
          </section>

          <section className="flex-1 flex flex-col p-6 overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-mono text-black font-extrabold uppercase tracking-widest text-xs">
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
                <p className="text-xs font-bold uppercase opacity-40 text-center py-8">
                  Sin notificaciones
                </p>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className={`bg-white p-3 border-y border-r border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
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
                            ? "bg-black text-white"
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
