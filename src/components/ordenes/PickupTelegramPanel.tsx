"use client";

import { useState } from "react";
import { useToast } from "@/components/providers/ToastProvider";
import type { OrderDetail } from "@/lib/types";

interface PickupTelegramPanelProps {
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

function StepStatus({ done, active }: { done: boolean; active?: boolean }) {
  if (done) {
    return (
      <span className="material-symbols-outlined text-emerald-600 text-lg">
        check_circle
      </span>
    );
  }
  if (active) {
    return (
      <span className="material-symbols-outlined text-primary text-lg animate-pulse">
        radio_button_checked
      </span>
    );
  }
  return (
    <span className="material-symbols-outlined text-gray-300 text-lg">
      radio_button_unchecked
    </span>
  );
}

export function PickupTelegramPanel({ order }: PickupTelegramPanelProps) {
  if (order.fulfillment !== "pickup" || !order.pickupUrl) {
    return null;
  }

  const confirmationDone = Boolean(order.confirmationNotifiedAt);
  const readyDone = Boolean(order.readyNotifiedAt);
  const arrivedDone = Boolean(order.arrivedAt);
  const readyStepActive =
    confirmationDone && !readyDone && order.status !== "completado";
  const arrivalStepActive = readyDone && !arrivedDone;

  return (
    <section className="bg-primary-container border border-red-100 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex items-start gap-3">
        <span className="material-symbols-outlined text-primary text-2xl">
          send
        </span>
        <div>
          <h3 className="text-sm font-semibold text-on-surface">
            Flujo pickup → Telegram
          </h3>
          <p className="text-xs text-on-surface-variant mt-1">
            Las notificaciones se envían al Telegram configurado en el sistema.
            Sigue estos pasos desde el CRM.
          </p>
        </div>
      </div>

      <ol className="space-y-3">
        <li className="flex gap-3 items-start">
          <StepStatus done={confirmationDone} active={!confirmationDone} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">1. Confirmación al registrar</p>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {confirmationDone
                ? "Enviada por Telegram al crear la orden."
                : "Se envía automáticamente al confirmar la orden."}
            </p>
          </div>
        </li>

        <li className="flex gap-3 items-start">
          <StepStatus done={readyDone} active={readyStepActive} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">2. Orden lista para retiro</p>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {readyDone
                ? "El cliente recibió el aviso con enlace de retiro."
                : 'Presiona "Marcar lista para pickup" arriba cuando esté preparada.'}
            </p>
          </div>
        </li>

        <li className="flex gap-3 items-start">
          <StepStatus done={arrivedDone} active={arrivalStepActive} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">3. Cliente avisa llegada</p>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {arrivedDone
                ? "El cliente avisó que llegó. Revisa el ping urgente en el panel."
                : "El cliente abre el enlace de retiro y presiona Ya llegué."}
            </p>
          </div>
        </li>
      </ol>

      <div className="pt-3 border-t border-red-100 space-y-3">
        <div>
          <p className="text-xs font-medium text-on-surface-variant mb-1.5">
            Enlace de retiro (compartir con el cliente)
          </p>
          <div className="flex gap-2 items-start">
            <a
              href={order.pickupUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-primary break-all hover:underline flex-1"
            >
              {order.pickupUrl}
            </a>
            <CopyButton value={order.pickupUrl} label="Enlace" />
          </div>
        </div>

        {order.telegramStartLink && (
          <div>
            <p className="text-xs font-medium text-on-surface-variant mb-1.5">
              Bot de Telegram (vincular chat del cliente)
            </p>
            <div className="flex gap-2 items-start">
              <a
                href={order.telegramStartLink}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary break-all hover:underline flex-1"
              >
                {order.telegramStartLink}
              </a>
              <CopyButton value={order.telegramStartLink} label="Enlace del bot" />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
