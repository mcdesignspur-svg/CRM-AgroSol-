"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { TopBar } from "@/components/layout/TopBar";
import { ErpConnectionStatus } from "@/components/integrations/ErpConnectionStatus";
import { AddProductModal } from "@/components/productos/AddProductModal";
import {
  ProductCategoryFilter,
  ProductCategoryGrid,
} from "@/components/productos/ProductCategoryFilter";
import { ProductCategorySections } from "@/components/productos/ProductCategorySections";
import { ProductSearchBar } from "@/components/productos/ProductSearchBar";
import {
  useProductCategories,
  useProductSearch,
} from "@/hooks/useProductSearch";
import { groupProductsByCategory } from "@/lib/products/group-by-category";
import type { LoyverseStatus } from "@/lib/loyverse/types";
import type { Product, ProductCategorySummary } from "@/lib/types";

interface ProductosContentProps {
  loyverseStatus: LoyverseStatus;
  categories: ProductCategorySummary[];
}

export function ProductosContent({
  loyverseStatus,
  categories: initialCategories,
}: ProductosContentProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<
    string | null | undefined
  >(undefined);

  const { categories } = useProductCategories("gurabo", initialCategories);
  const { query, setQuery, results, loading, error } = useProductSearch(
    "gurabo",
    selectedCategoryId,
  );

  const groupedResults = useMemo(
    () => groupProductsByCategory(results),
    [results],
  );

  const selectedCategory = categories.find(
    (category) => category.id === selectedCategoryId,
  );
  const hasSearch = query.trim().length >= 2;
  const browsingCategory = selectedCategoryId !== undefined;
  const showResults = browsingCategory || hasSearch;
  const showCategoryHeaders = !browsingCategory || hasSearch;

  function handleCreated(product: Product) {
    setQuery(product.name);
    setSelectedCategoryId(undefined);
  }

  function handleCategorySelect(categoryId: string | null | undefined) {
    setSelectedCategoryId(categoryId);
    if (categoryId === undefined) {
      setQuery("");
    }
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
              Explora por categoría o busca en el cache de Loyverse de Gurabo
              (Central).
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
          helperText={`${(loyverseStatus.cachedProductCount ?? 0).toLocaleString("es-PR")} productos en cache · selecciona una categoría o escribe al menos 2 caracteres`}
        />

        <ProductCategoryFilter
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelect={handleCategorySelect}
        />

        <ErpConnectionStatus
          branchId="gurabo"
          initialStatus={loyverseStatus}
          showSyncAction
        />

        <section className="industrial-border bg-white industrial-shadow overflow-hidden">
          {!showResults ? (
            <div className="p-4 md:p-6 space-y-4">
              <div>
                <h3 className="text-sm font-bold uppercase">
                  Explorar por categoría
                </h3>
                <p className="text-xs font-bold uppercase opacity-60 mt-1">
                  Selecciona una categoría para ver sus productos ordenados
                  alfabéticamente.
                </p>
              </div>
              <ProductCategoryGrid
                categories={categories}
                onSelect={(categoryId) => setSelectedCategoryId(categoryId)}
              />
            </div>
          ) : loading ? (
            <div className="px-6 py-16 text-center text-sm font-bold uppercase opacity-50">
              <span className="inline-flex items-center gap-2">
                <span className="material-symbols-outlined animate-spin text-primary">
                  sync
                </span>
                Cargando productos...
              </span>
            </div>
          ) : error ? (
            <div className="px-6 py-16 text-center text-sm font-bold uppercase text-red-600">
              {error}
            </div>
          ) : results.length === 0 ? (
            <div className="px-6 py-16 text-center text-sm font-bold uppercase opacity-50">
              {hasSearch
                ? `Sin resultados para "${query.trim()}"`
                : "Esta categoría no tiene productos visibles"}
            </div>
          ) : (
            <ProductCategorySections
              products={results}
              groups={
                browsingCategory && !hasSearch
                  ? [
                      {
                        categoryId: selectedCategory?.id ?? undefined,
                        categoryName:
                          selectedCategory?.name ?? "Sin categoría",
                        products: results,
                      },
                    ]
                  : groupedResults
              }
              showCategoryHeaders={showCategoryHeaders}
            />
          )}
        </section>

        {showResults && !loading && results.length > 0 && (
          <p className="text-xs font-bold uppercase opacity-60">
            {results.length} productos
            {selectedCategory ? ` en ${selectedCategory.name}` : ""}
            {hasSearch ? ` para "${query.trim()}"` : ""}
            {results.length >= 100 ? " · mostrando los primeros 100" : ""}
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
