"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/providers/ToastProvider";
import type { Product } from "@/lib/types";

interface AddProductModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (product: Product) => void;
}

export function AddProductModal({
  open,
  onClose,
  onCreated,
}: AddProductModalProps) {
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function resetForm() {
    setName("");
    setSku("");
    setUnitPrice("");
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  async function handleSubmit() {
    const price = parseFloat(unitPrice);
    if (!name.trim()) {
      showToast("Ingresa el nombre del producto", "warning");
      return;
    }
    if (!sku.trim()) {
      showToast("Ingresa el SKU", "warning");
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      showToast("Ingresa un precio válido", "warning");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          sku: sku.trim(),
          unitPrice: price,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error ?? "Error al crear producto", "error");
        return;
      }
      onCreated(data);
      showToast(`${data.name} agregado al catálogo`, "success");
      handleClose();
    } catch {
      showToast("Error al crear producto", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Nuevo Producto"
      footer={
        <>
          <button
            type="button"
            onClick={handleClose}
            className="btn-secondary px-4 py-2 text-xs font-bold uppercase min-h-[44px]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-primary px-4 py-2 text-xs font-bold uppercase industrial-border disabled:opacity-60 min-h-[44px]"
          >
            {submitting ? "Guardando..." : "Guardar Producto"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="space-y-1">
          <label className="font-bold uppercase text-[10px]">
            Nombre del Producto
          </label>
          <input
            className="w-full industrial-border px-3 py-2 text-sm font-bold min-h-[44px]"
            type="text"
            placeholder="Ej. Fertilizante NPK 20-20-20"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="font-bold uppercase text-[10px]">SKU</label>
          <input
            className="w-full industrial-border px-3 py-2 text-sm font-mono min-h-[44px]"
            type="text"
            placeholder="Ej. FERT-NPK-20"
            value={sku}
            onChange={(e) => setSku(e.target.value.toUpperCase())}
          />
        </div>
        <div className="space-y-1">
          <label className="font-bold uppercase text-[10px]">
            Precio Unitario ($)
          </label>
          <input
            className="w-full industrial-border px-3 py-2 text-sm font-bold min-h-[44px]"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}
