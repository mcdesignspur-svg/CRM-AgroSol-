"use client";

import { Modal } from "@/components/ui/Modal";
import { ProductSearchBar } from "@/components/productos/ProductSearchBar";
import { useProductSearch } from "@/hooks/useProductSearch";
import { BRANCH_LABELS } from "@/lib/constants";
import type { BranchId, Product } from "@/lib/types";

interface ProductPickerModalProps {
  open: boolean;
  onClose: () => void;
  branchId: BranchId;
  selectedIds: string[];
  onSelect: (product: Product) => void;
  onCreateNew: () => void;
}

export function ProductPickerModal({
  open,
  onClose,
  branchId,
  selectedIds,
  onSelect,
  onCreateNew,
}: ProductPickerModalProps) {
  const { query, setQuery, results, loading, error } = useProductSearch(branchId);
  const available = results.filter((product) => !selectedIds.includes(product.id));

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
            className="btn-secondary px-4 py-2 text-xs font-bold uppercase min-h-[44px]"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={onCreateNew}
            className="btn-primary px-4 py-2 text-xs font-bold uppercase industrial-border min-h-[44px]"
          >
            + Nuevo Producto
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <ProductSearchBar
          value={query}
          onChange={setQuery}
          placeholder="Nombre o SKU..."
          helperText={`Buscando en ${BRANCH_LABELS[branchId]}`}
          autoFocus
        />

        {query.trim().length < 2 ? (
          <p className="text-sm font-bold uppercase opacity-60 text-center py-8">
            Escribe para buscar productos
          </p>
        ) : loading ? (
          <div className="flex items-center justify-center py-8 gap-2">
            <span className="material-symbols-outlined animate-spin text-primary">
              sync
            </span>
            <span className="text-xs font-bold uppercase">Buscando...</span>
          </div>
        ) : error ? (
          <p className="text-sm font-bold uppercase text-red-600 text-center py-8">
            {error}
          </p>
        ) : available.length === 0 ? (
          <div className="text-center py-8 space-y-3">
            <p className="text-sm font-bold uppercase opacity-60">
              {results.length === 0
                ? "Sin resultados — importa el catálogo Loyverse o crea un producto"
                : "Todos los productos encontrados ya están en la orden"}
            </p>
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
                className="w-full text-left p-3 border-2 border-black hover:bg-surface-container-low transition-colors"
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
      </div>
    </Modal>
  );
}
