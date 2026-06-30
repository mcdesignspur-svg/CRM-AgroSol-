"use client";

import Link from "next/link";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { TopBar } from "@/components/layout/TopBar";
import { ErpConnectionStatus } from "@/components/integrations/ErpConnectionStatus";
import { AddProductModal } from "@/components/productos/AddProductModal";
import { ProductSearchBar } from "@/components/productos/ProductSearchBar";
import { useProductSearch } from "@/hooks/useProductSearch";
import type { LoyverseStatus } from "@/lib/loyverse/types";
import type { Product } from "@/lib/types";

interface ProductosContentProps {
  loyverseStatus: LoyverseStatus;
}

export function ProductosContent({ loyverseStatus }: ProductosContentProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const { query, setQuery, results, loading, error } = useProductSearch("gurabo");

  function handleCreated(product: Product) {
    setQuery(product.name);
  }

  return (
    <AppShell topBar={<TopBar title="Productos" showSearch={false} />}>
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 md:space-y-8 pb-10">
        <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold uppercase tracking-tight">
              Productos
            </h2>
            <p className="text-lg text-on-surface-variant mt-2">
              Busca en el cache de Loyverse de Gurabo (Central) o agrega productos manuales.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto shrink-0">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="btn-primary px-4 sm:px-6 py-3 text-sm font-bold uppercase industrial-border min-h-[44px]"
            >
              + Nuevo Producto
            </button>
            <Link
              href="/ordenes/nueva"
              className="btn-secondary px-4 sm:px-6 py-3 text-sm font-bold uppercase inline-flex items-center justify-center min-h-[44px]"
            >
              Crear Orden
            </Link>
          </div>
        </div>

        <ProductSearchBar
          value={query}
          onChange={setQuery}
          helperText={`${(loyverseStatus.cachedProductCount ?? 0).toLocaleString("es-PR")} productos en cache · mínimo 2 caracteres`}
        />

        <ErpConnectionStatus
          branchId="gurabo"
          initialStatus={loyverseStatus}
          showSyncAction
        />

        <section className="industrial-border bg-white industrial-shadow overflow-hidden">
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-black text-white">
                <tr>
                  <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-wider text-right">
                    Precio
                  </th>
                </tr>
              </thead>
              <tbody>
                {query.trim().length < 2 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-6 py-16 text-center text-sm font-bold uppercase opacity-50"
                    >
                      Usa la barra de búsqueda para encontrar productos
                    </td>
                  </tr>
                ) : loading ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-6 py-16 text-center text-sm font-bold uppercase opacity-50"
                    >
                      <span className="inline-flex items-center gap-2">
                        <span className="material-symbols-outlined animate-spin text-primary">
                          sync
                        </span>
                        Buscando...
                      </span>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-6 py-16 text-center text-sm font-bold uppercase text-red-600"
                    >
                      {error}
                    </td>
                  </tr>
                ) : results.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-6 py-16 text-center text-sm font-bold uppercase opacity-50"
                    >
                      Sin resultados para &quot;{query.trim()}&quot;
                    </td>
                  </tr>
                ) : (
                  results.map((product) => (
                    <tr
                      key={product.id}
                      className="border-b border-black/10 hover:bg-surface-container-low transition-colors"
                    >
                      <td className="px-6 py-4 font-bold uppercase">
                        {product.name}
                      </td>
                      <td className="px-6 py-4 font-mono text-sm">
                        {product.sku}
                      </td>
                      <td className="px-6 py-4 text-right font-extrabold">
                        ${product.unitPrice.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="sm:hidden p-4 space-y-3">
            {query.trim().length < 2 ? (
              <p className="py-12 text-center text-sm font-bold uppercase opacity-50">
                Usa la barra de búsqueda para encontrar productos
              </p>
            ) : loading ? (
              <p className="py-12 text-center text-sm font-bold uppercase opacity-50">
                Buscando...
              </p>
            ) : error ? (
              <p className="py-12 text-center text-sm font-bold uppercase text-red-600">
                {error}
              </p>
            ) : results.length === 0 ? (
              <p className="py-12 text-center text-sm font-bold uppercase opacity-50">
                Sin resultados para &quot;{query.trim()}&quot;
              </p>
            ) : (
              results.map((product) => (
                <article
                  key={product.id}
                  className="border-2 border-black p-4 bg-gray-50"
                >
                  <p className="font-bold uppercase text-sm">{product.name}</p>
                  <p className="text-[10px] font-mono text-gray-500 mt-1">
                    SKU: {product.sku}
                  </p>
                  <p className="text-lg font-extrabold text-primary mt-2">
                    ${product.unitPrice.toFixed(2)}
                  </p>
                </article>
              ))
            )}
          </div>
        </section>

        {query.trim().length >= 2 && !loading && (
          <p className="text-xs font-bold uppercase opacity-60">
            {results.length} resultados para &quot;{query.trim()}&quot;
          </p>
        )}
      </div>

      <AddProductModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleCreated}
      />
    </AppShell>
  );
}
