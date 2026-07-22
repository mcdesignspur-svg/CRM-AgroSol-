"use client";

import { useState } from "react";
import { useToast } from "@/components/providers/ToastProvider";
import { DeliveryFlowProgress } from "@/components/delivery/DeliveryFlowProgress";
import type { OrderDetail } from "@/lib/types";

interface DeliveryTrackingPanelProps {
  order: OrderDetail;
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      showToast(`${label} copiado`, "success");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast("No se pudo copiar", "error");
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="btn-secondary px-3 py-2 text-xs font-medium min-h-[36px] shrink-0"
    >
      {copied ? "Copiado" : "Copiar"}
    </button>
  );
}

export function DeliveryTrackingPanel({ order }: DeliveryTrackingPanelProps) {
  if (order.fulfillment !== "delivery" || !order.deliveryUrl) {
    return null;
  }

  const dispatched = Boolean(order.dispatchedAt);

  return (
    <section className="bg-surface border border-outline rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex items-start gap-3">
        <span className="material-symbols-outlined text-primary text-2xl">
          local_shipping
        </span>
        <div>
          <h3 className="text-sm font-semibold text-on-surface">
            Flujo de entrega
          </h3>
          <p className="text-xs text-on-surface-variant mt-1">
            Prepara la orden y despáchala cuando salga del almacén. Comparte el
            enlace de seguimiento con el cliente.
          </p>
        </div>
      </div>

      <DeliveryFlowProgress
        type={order.type}
        fulfillment={order.fulfillment}
        status={order.status}
        dispatchedAt={order.dispatchedAt}
      />

      <ol className="space-y-2 text-xs text-on-surface-variant">
        <li>
          {dispatched
            ? "Orden despachada — el cliente puede ver el conductor en el enlace de seguimiento."
            : 'Presiona "Marcar despachada" cuando la orden salga del almacén.'}
        </li>
        {order.smsNotify && (
          <li>
            SMS al despachar: pendiente de integración (ver notas del sprint).
          </li>
        )}
      </ol>

      {order.deliveryDriverName && (
        <div className="text-sm">
          <span className="text-on-surface-variant">Conductor asignado: </span>
          <span className="font-medium">{order.deliveryDriverName}</span>
          {order.deliveryEta && (
            <span className="text-on-surface-variant"> · ETA {order.deliveryEta}</span>
          )}
        </div>
      )}

      <div className="pt-3 border-t border-outline">
        <p className="text-xs font-medium text-on-surface-variant mb-1.5">
          Enlace de seguimiento (compartir con el cliente)
        </p>
        <div className="flex gap-2 items-start">
          <a
            href={order.deliveryUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-primary break-all hover:underline flex-1"
          >
            {order.deliveryUrl}
          </a>
          <CopyButton value={order.deliveryUrl} label="Enlace" />
        </div>
      </div>
    </section>
  );
}
