"use client";

import { useEffect, useState } from "react";
import { BRANCH_LABELS } from "@/lib/constants";
import { getLoyverseBranchLabel } from "@/lib/loyverse";
import type { LoyverseStatus } from "@/lib/loyverse/types";
import type { BranchId } from "@/lib/types";

interface ErpConnectionStatusProps {
  branchId?: BranchId;
  initialStatus?: LoyverseStatus;
  showSyncAction?: boolean;
  onSynced?: () => void;
}

function formatLastSync(lastSyncAt?: string | null) {
  if (!lastSyncAt) return "Nunca importado";
  return new Intl.DateTimeFormat("es-PR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(lastSyncAt));
}

export function ErpConnectionStatus({
  branchId = "gurabo",
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
    if (initialStatus) {
      return;
    }

    void fetch(`/api/integrations/loyverse/status?branchId=${branchId}`)
      .then((res) => res.json())
      .then((data: LoyverseStatus) => setStatus(data))
      .catch(() =>
        setStatus({
          branchId,
          configured: false,
          connected: false,
          message: "No se pudo verificar la conexión",
        }),
      );
  }, [branchId, initialStatus]);

  async function handleSync(mode: "full" | "incremental") {
    setSyncing(true);
    setSyncMessage(null);

    try {
      const res = await fetch("/api/integrations/loyverse/sync-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branchId, mode }),
      });
      const data = await res.json();

      if (!res.ok) {
        setSyncMessage(data.error ?? "Error al importar catálogo");
        return;
      }

      setSyncMessage(
        [
          `${data.total.toLocaleString("es-PR")} productos importados (${data.created} nuevos, ${data.updated} actualizados)`,
          data.categoriesSynced
            ? `${data.categoriesSynced.toLocaleString("es-PR")} categorías sincronizadas`
            : null,
        ]
          .filter(Boolean)
          .join(" · "),
      );

      const refreshed = await fetch(
        `/api/integrations/loyverse/status?branchId=${branchId}`,
      ).then((response) => response.json());
      setStatus(refreshed);
      onSynced?.();
    } catch {
      setSyncMessage("Error al importar catálogo");
    } finally {
      setSyncing(false);
    }
  }

  const connected = status?.connected ?? false;
  const message =
    status?.message ??
    (status === null ? "Verificando conexión..." : "No conectado");
  const branchLabel = BRANCH_LABELS[branchId] ?? getLoyverseBranchLabel(branchId);

  return (
    <div className="bg-white border-2 border-black p-4 flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <div
          className={`w-4 h-4 border-2 border-black shrink-0 ${
            connected ? "bg-green-500" : "bg-surface-container"
          }`}
        />
        <div className="text-[10px] flex-1">
          <div className="font-bold uppercase">
            Loyverse · {branchLabel}
          </div>
          <div className="font-mono opacity-60">{message}</div>
          {status?.cachedProductCount !== undefined && (
            <div className="font-mono opacity-60 mt-1">
              Última importación: {formatLastSync(status.lastSyncAt)}
            </div>
          )}
        </div>
      </div>

      {showSyncAction && connected && (
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={() => handleSync("full")}
            disabled={syncing}
            className="flex-1 py-2 border-2 border-black bg-white font-bold uppercase text-xs hover:bg-gray-100 transition-all disabled:opacity-60"
          >
            {syncing ? "Importando..." : "Importar catálogo completo"}
          </button>
          {(status?.cachedProductCount ?? 0) > 0 && (
            <button
              type="button"
              onClick={() => handleSync("incremental")}
              disabled={syncing}
              className="flex-1 py-2 border-2 border-black bg-gray-50 font-bold uppercase text-xs hover:bg-gray-100 transition-all disabled:opacity-60"
            >
              Actualizar cambios
            </button>
          )}
        </div>
      )}

      {syncMessage && (
        <p className="text-[10px] font-bold uppercase opacity-70">{syncMessage}</p>
      )}
    </div>
  );
}
