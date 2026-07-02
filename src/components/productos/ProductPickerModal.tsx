"use client";

import { Modal } from "@/components/ui/Modal";
import type { Product } from "@/lib/types";

interface ProductPickerModalProps {
  open: boolean;
  onClose: () => void;
  products: Product[];
  selectedIds: string[];
  onSelect: (product: Product) => void;
  onCreateNew: () => void;
}

export function ProductPickerModal({
  open,
  onClose,
  products,
  selectedIds,
  onSelect,
  onCreateNew,
}: ProductPickerModalProps) {
  const available = products.filter((p) => !selectedIds.includes(p.id));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Seleccionar Producto"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary px-4 py-2 text-xs font-medium min-h-[44px]"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={onCreateNew}
            className="btn-primary px-4 py-2 text-xs font-medium industrial-border min-h-[44px]"
          >
            + Nuevo Producto
          </button>
        </>
      }
    >
      {available.length === 0 ? (
        <div className="text-center py-6 space-y-3">
          <p className="text-sm font-medium opacity-60">
            {products.length === 0
              ? "El catálogo está vacío"
              : "Todos los productos ya están en la orden"}
          </p>
          {products.length === 0 && (
            <p className="text-xs text-on-surface-variant">
              Crea un producto para poder agregarlo a la orden.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
          {available.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => {
                onSelect(product);
                onClose();
              }}
              className="w-full text-left p-3 border border-outline hover:bg-surface-container-low transition-colors"
            >
              <p className="font-bold uppercase text-sm">{product.name}</p>
              <div className="flex justify-between items-center mt-1">
                <span className="text-[10px] font-mono text-gray-500">
                  SKU: {product.sku}
                </span>
                <span className="font-extrabold text-primary">
                  ${product.unitPrice.toFixed(2)}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}
