"use client";

import { useState } from "react";
import { useToast } from "@/components/providers/ToastProvider";
import { buildGoogleMapsSearchUrl } from "@/lib/google-maps";
import type { OrderDetail } from "@/lib/types";

interface DeliveryAddressValidationPanelProps {
  order: OrderDetail;
  onValidated: (order: OrderDetail) => void;
}

function formatValidationTime(value: string) {
  return new Intl.DateTimeFormat("es-PR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function DeliveryAddressValidationPanel({
  order,
  onValidated,
}: DeliveryAddressValidationPanelProps) {
  const { showToast } = useToast();
  const [mapOpened, setMapOpened] = useState(false);
  const [saving, setSaving] = useState(false);
  const mapsUrl = buildGoogleMapsSearchUrl(order.deliveryAddress ?? "");
  const validatedAt = order.deliveryAddressValidatedAt;

  async function markValidated() {
    setSaving(true);
    try {
      const response = await fetch(
        `/api/orders/${encodeURIComponent(order.id)}/delivery-address-validation`,
        { method: "PATCH" },
      );
      const data = await response.json();
      if (!response.ok) {
        showToast(data.error ?? "No se pudo validar la dirección", "error");
        return;
      }
      onValidated(data);
      showToast("Dirección validada", "success");
    } catch {
      showToast("No se pudo validar la dirección", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-xl border border-outline bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined mt-0.5 text-primary">
            location_on
          </span>
          <div>
            <h3 className="text-base font-semibold text-on-surface">
              Validación de dirección
            </h3>
            <p className="mt-1 text-sm text-on-surface-variant">
              {order.deliveryAddress}
            </p>
            <div className="mt-3 flex items-center gap-2 text-xs font-medium">
              <span
                className={`h-2 w-2 rounded-full ${
                  validatedAt ? "bg-green-600" : "bg-amber-500"
                }`}
              />
              <span className={validatedAt ? "text-green-700" : "text-amber-700"}>
                {validatedAt
                  ? `Validada ${formatValidationTime(validatedAt)}`
                  : "Pendiente de validar"}
              </span>
            </div>
          </div>
        </div>

        {mapsUrl ? (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMapOpened(true)}
            className="btn-secondary inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 px-4 py-2 text-xs font-medium"
          >
            <span className="material-symbols-outlined text-base">map</span>
            Abrir en Google Maps
          </a>
        ) : null}
      </div>

      {!validatedAt ? (
        <div className="mt-4 flex flex-col gap-3 border-t border-outline pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-on-surface-variant">
            Revisa el resultado antes de confirmar la dirección.
          </p>
          <button
            type="button"
            disabled={!mapOpened || saving}
            onClick={markValidated}
            className="btn-primary inline-flex min-h-[44px] items-center justify-center px-4 py-2 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Marcar como validada"}
          </button>
        </div>
      ) : null}
    </section>
  );
}
