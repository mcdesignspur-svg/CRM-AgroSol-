"use client";

import { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { TopBar } from "@/components/layout/TopBar";
import { AddProductModal } from "@/components/productos/AddProductModal";
import type { Product } from "@/lib/types";

interface ProductosContentProps {
  initialProducts: Product[];
}

export function ProductosContent({ initialProducts }: ProductosContentProps) {
  const [products, setProducts] = useState(initialProducts);
  const [modalOpen, setModalOpen] = useState(false);

  function handleCreated(product: Product) {
    setProducts((prev) =>
      [...prev, product].sort((a, b) => a.name.localeCompare(b.name)),
    );
  }

  return (
    <AppShell topBar={<TopBar title="Productos" showSearch={false} />}>
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 pb-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-on-surface">
              Productos
            </h2>
            <p className="text-sm text-on-surface-variant mt-1">
              Administra los artículos disponibles para nuevas órdenes.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="btn-primary px-4 py-2.5 text-sm min-h-[40px]"
            >
              + Nuevo producto
            </button>
            <Link
              href="/ordenes/nueva"
              className="btn-secondary px-4 py-2.5 text-sm inline-flex items-center justify-center min-h-[40px]"
            >
              Crear orden
            </Link>
          </div>
        </div>

        <section className="rounded-xl border border-outline bg-white shadow-sm overflow-hidden">
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="table-header">
                <tr>
                  <th className="px-4 py-3 text-xs font-medium">Producto</th>
                  <th className="px-4 py-3 text-xs font-medium">SKU</th>
                  <th className="px-4 py-3 text-xs font-medium text-right">
                    Precio
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-12 text-center text-sm text-on-surface-variant"
                    >
                      Sin productos — agrega el primero al catálogo
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr
                      key={product.id}
                      className="hover:bg-surface transition-colors"
                    >
                      <td className="px-4 py-3 text-sm font-medium">
                        {product.name}
                      </td>
                      <td className="px-4 py-3 font-mono text-sm text-on-surface-variant">
                        {product.sku}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold">
                        ${product.unitPrice.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="sm:hidden p-4 space-y-2">
            {products.length === 0 ? (
              <p className="py-12 text-center text-sm text-on-surface-variant">
                Sin productos — agrega el primero al catálogo
              </p>
            ) : (
              products.map((product) => (
                <article
                  key={product.id}
                  className="rounded-lg border border-outline p-4 bg-surface"
                >
                  <p className="font-medium text-sm">{product.name}</p>
                  <p className="text-xs font-mono text-on-surface-variant mt-0.5">
                    SKU: {product.sku}
                  </p>
                  <p className="text-base font-semibold text-primary mt-1.5">
                    ${product.unitPrice.toFixed(2)}
                  </p>
                </article>
              ))
            )}
          </div>
        </section>

        <p className="text-xs text-on-surface-variant">
          {products.length}{" "}
          {products.length === 1 ? "producto activo" : "productos activos"}
        </p>
      </div>

      <AddProductModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleCreated}
      />
    </AppShell>
  );
}
