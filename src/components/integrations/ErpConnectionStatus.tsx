"use client";

import { useEffect, useState } from "react";
import type { LoyverseStatus } from "@/lib/loyverse/types";

interface ErpConnectionStatusProps {
  initialStatus?: LoyverseStatus;
  showSyncAction?: boolean;
  onSynced?: () => void;
}

export function ErpConnectionStatus({
  initialStatus,
  showSyncAction = false,
  onSynced,
}: ErpConnectionStatusProps) {
  const [status, setStatus] = useState<LoyverseStatus | null>(
    initialStatus ?? null,
  );
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialStatus) return;

    void fetch("/api/integrations/loyverse/status")
      .then((res) => res.json())
      .then((data: LoyverseStatus) => setStatus(data))
      .catch(() =>
        setStatus({
          configured: false,
          connected: false,
          message: "No se pudo verificar la conexión",
        }),
      );
  }, [initialStatus]);

  async function handleSync() {
    setSyncing(true);
    setSyncMessage(null);

    try {
      const res = await fetch("/api/integrations/loyverse/sync-products", {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        setSyncMessage(data.error ?? "Error al sincronizar productos");
        return;
      }

      setSyncMessage(
        `${data.total} productos sincronizados (${data.created} nuevos, ${data.updated} actualizados)`,
      );
      onSynced?.();
    } catch {
      setSyncMessage("Error al sincronizar productos");
    } finally {
      setSyncing(false);
    }
  }

  const connected = status?.connected ?? false;
  const message =
    status?.message ??
    (status === null ? "Verificando conexión..." : "No conectado");

  return (
    <div className="bg-white border-2 border-black p-4 flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <div
          className={`w-4 h-4 border-2 border-black shrink-0 ${
            connected ? "bg-green-500" : "bg-surface-container"
          }`}
        />
        <div className="text-[10px] flex-1">
          <div className="font-bold uppercase">Conexión Loyverse</div>
          <div className="font-mono opacity-60">{message}</div>
        </div>
      </div>

      {showSyncAction && connected && (
        <button
          type="button"
          onClick={handleSync}
          disabled={syncing}
          className="w-full py-2 border-2 border-black bg-white font-bold uppercase text-xs hover:bg-gray-100 transition-all disabled:opacity-60"
        >
          {syncing ? "Sincronizando..." : "Sincronizar Productos"}
        </button>
      )}

      {syncMessage && (
        <p className="text-[10px] font-bold uppercase opacity-70">{syncMessage}</p>
      )}
    </div>
  );
}
