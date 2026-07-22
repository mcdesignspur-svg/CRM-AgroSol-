"use client";

import { useState } from "react";
import { useToast } from "@/components/providers/ToastProvider";
import { Modal } from "@/components/ui/Modal";
import {
  MAX_LINE_ITEM_QUANTITY,
  MAX_MANUAL_ITEM_NAME_LENGTH,
  MAX_MANUAL_ITEM_UNIT_PRICE,
} from "@/lib/order-line-items";

export interface ManualLineItemValues {
  name: string;
  unitPrice: number;
  quantity: number;
}

interface ManualLineItemModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (item: ManualLineItemValues) => void;
}

export function ManualLineItemModal({
  open,
  onClose,
  onAdd,
}: ManualLineItemModalProps) {
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [quantity, setQuantity] = useState("1");

  function resetForm() {
    setName("");
    setUnitPrice("");
    setQuantity("1");
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  function handleAdd() {
    const trimmedName = name.trim();
    const parsedPrice = Number(unitPrice);
    const roundedPrice = Math.round(parsedPrice * 100) / 100;
    const parsedQuantity = Number(quantity);

    if (!trimmedName || trimmedName.length > MAX_MANUAL_ITEM_NAME_LENGTH) {
      showToast("Ingresa un nombre válido", "warning");
      return;
    }
    if (
      !Number.isFinite(roundedPrice) ||
      roundedPrice <= 0 ||
      roundedPrice > MAX_MANUAL_ITEM_UNIT_PRICE
    ) {
      showToast("Ingresa un precio válido", "warning");
      return;
    }
    if (
      !Number.isInteger(parsedQuantity) ||
      parsedQuantity <= 0 ||
      parsedQuantity > MAX_LINE_ITEM_QUANTITY
    ) {
      showToast("Ingresa una cantidad válida", "warning");
      return;
    }

    onAdd({
      name: trimmedName,
      unitPrice: roundedPrice,
      quantity: parsedQuantity,
    });
    handleClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Artículo fuera de inventario"
      footer={
        <>
          <button
            type="button"
            onClick={handleClose}
            className="btn-secondary min-h-[44px] px-4 py-2 text-xs font-medium"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleAdd}
            className="btn-primary min-h-[44px] px-4 py-2 text-xs font-medium"
          >
            Agregar a la orden
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="rounded-lg border border-outline bg-surface-container-low p-3 text-xs leading-relaxed text-on-surface-variant">
          Se guardará únicamente en esta orden. No se añadirá al inventario ni a
          Loyverse.
        </p>

        <div className="space-y-1">
          <label className="text-xs font-medium text-on-surface-variant">
            Nombre del artículo
          </label>
          <input
            type="text"
            maxLength={MAX_MANUAL_ITEM_NAME_LENGTH}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ej. Servicio de instalación"
            className="min-h-[44px] w-full rounded-lg border border-outline bg-white px-3 py-2 text-sm font-medium"
            autoFocus
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-on-surface-variant">
              Precio unitario ($)
            </label>
            <input
              type="number"
              min="0.01"
              max={MAX_MANUAL_ITEM_UNIT_PRICE}
              step="0.01"
              inputMode="decimal"
              value={unitPrice}
              onChange={(event) => setUnitPrice(event.target.value)}
              placeholder="0.00"
              className="min-h-[44px] w-full rounded-lg border border-outline bg-white px-3 py-2 text-sm font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-on-surface-variant">
              Cantidad
            </label>
            <input
              type="number"
              min="1"
              max={MAX_LINE_ITEM_QUANTITY}
              step="1"
              inputMode="numeric"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              className="min-h-[44px] w-full rounded-lg border border-outline bg-white px-3 py-2 text-sm font-medium"
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
