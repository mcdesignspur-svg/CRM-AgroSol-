"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { getDefaultDeliveryTime } from "@/lib/delivery-time";

interface DeliveryEtaModalProps {
  onClose: () => void;
  onConfirm: (deliveryTime: string) => void;
  submitting: boolean;
}

export function DeliveryEtaModal({
  onClose,
  onConfirm,
  submitting,
}: DeliveryEtaModalProps) {
  const [deliveryTime, setDeliveryTime] = useState(getDefaultDeliveryTime);
  const [error, setError] = useState(false);

  function handleConfirm() {
    if (!deliveryTime) {
      setError(true);
      return;
    }

    onConfirm(deliveryTime);
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Hora aproximada de entrega"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="btn-secondary min-h-[44px] px-4 py-2 text-xs font-medium disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className="btn-primary min-h-[44px] px-4 py-2 text-xs font-medium disabled:opacity-60"
          >
            {submitting ? "Despachando..." : "Confirmar y despachar"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-on-surface-variant">
          Indica aproximadamente a qué hora llegará la entrega. Esta hora será
          visible en el mapa y en el enlace de seguimiento del cliente.
        </p>

        <div className="space-y-1.5">
          <label
            htmlFor="delivery-time"
            className="text-xs font-medium text-on-surface-variant"
          >
            Hora aproximada
          </label>
          <input
            id="delivery-time"
            type="time"
            value={deliveryTime}
            onChange={(event) => {
              setDeliveryTime(event.target.value);
              setError(false);
            }}
            disabled={submitting}
            className={`min-h-[48px] w-full rounded-lg border bg-white px-3 py-2 text-base font-medium ${
              error ? "border-primary" : "border-outline"
            }`}
            autoFocus
          />
          {error && (
            <p className="text-xs font-medium text-primary">
              Selecciona una hora aproximada
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}
