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
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 md:space-y-8 pb-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold uppercase tracking-tight">
              Productos
            </h2>
            <p className="text-lg text-on-surface-variant mt-2">
              Administra los artículos disponibles para nuevas órdenes.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="btn-primary px-4 sm:px-6 py-3 text-sm font-bold uppercase industrial-border min-h-[44px]"
            >
              + Nuevo Producto
            </button>
            <Link
              href="/ordenes#nueva-orden"
              className="btn-secondary px-4 sm:px-6 py-3 text-sm font-bold uppercase inline-flex items-center justify-center min-h-[44px]"
            >
              Crear Orden
            </Link>
          </div>
        </div>

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
                {products.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-6 py-16 text-center text-sm font-bold uppercase opacity-50"
                    >
                      Sin productos — agrega el primero al catálogo
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
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
            {products.length === 0 ? (
              <p className="py-12 text-center text-sm font-bold uppercase opacity-50">
                Sin productos — agrega el primero al catálogo
              </p>
            ) : (
              products.map((product) => (
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

        <div className="text-center sm:text-left">
          <p className="text-xs font-bold uppercase opacity-60">
            {products.length}{" "}
            {products.length === 1 ? "producto activo" : "productos activos"}
          </p>
        </div>
      </div>

      <AddProductModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleCreated}
      />
    </AppShell>
  );
}
