"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { TopBar } from "@/components/layout/TopBar";
import { ErpConnectionStatus } from "@/components/integrations/ErpConnectionStatus";
import { AddProductModal } from "@/components/productos/AddProductModal";
import { ProductCategoryFilter } from "@/components/productos/ProductCategoryFilter";
import { ProductCategorySections } from "@/components/productos/ProductCategorySections";
import { ProductSearchBar } from "@/components/productos/ProductSearchBar";
import {
  useProductCategories,
  useProductSearch,
} from "@/hooks/useProductSearch";
import { groupProductsByCategory } from "@/lib/products/group-by-category";
import type { LoyverseStatus } from "@/lib/loyverse/types";
import type {
  Product,
  ProductCategoryGroup,
  ProductCategorySummary,
} from "@/lib/types";

interface ProductosContentProps {
  loyverseStatus: LoyverseStatus;
  categories: ProductCategorySummary[];
  groupedCatalog: ProductCategoryGroup[];
}

export function ProductosContent({
  loyverseStatus,
  categories: initialCategories,
  groupedCatalog,
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

  const selectedCategory = categories.find(
    (category) => category.id === selectedCategoryId,
  );
  const hasSearch = query.trim().length >= 2;
  const isFiltering = selectedCategoryId !== undefined || hasSearch;

  const displayGroups = useMemo(() => {
    if (!isFiltering) {
      return groupedCatalog;
    }

    if (selectedCategoryId !== undefined && !hasSearch) {
      return [
        {
          categoryId: selectedCategory?.id ?? undefined,
          categoryName: selectedCategory?.name ?? "Sin categoría",
          products: results,
        },
      ];
    }

    return groupProductsByCategory(results);
  }, [
    groupedCatalog,
    hasSearch,
    isFiltering,
    results,
    selectedCategory,
    selectedCategoryId,
  ]);

  const totalVisibleProducts = useMemo(
    () => displayGroups.reduce((sum, group) => sum + group.products.length, 0),
    [displayGroups],
  );

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
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 pb-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-on-surface">
              Productos
            </h2>
            <p className="text-sm text-on-surface-variant mt-1">
              Catálogo de Gurabo (Central) agrupado por categoría. Filtra con
              los chips o busca por nombre, SKU o categoría.
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

        <ProductSearchBar
          value={query}
          onChange={setQuery}
          helperText={`${(loyverseStatus.cachedProductCount ?? 0).toLocaleString("es-PR")} productos en cache · ${categories.length} categorías`}
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

        <section className="rounded-xl border border-outline bg-white shadow-sm overflow-hidden">
          {isFiltering && loading ? (
            <div className="px-6 py-16 text-center text-sm text-on-surface-variant">
              <span className="inline-flex items-center gap-2">
                <span className="material-symbols-outlined animate-spin text-primary">
                  sync
                </span>
                Cargando productos...
              </span>
            </div>
          ) : isFiltering && error ? (
            <div className="px-6 py-16 text-center text-sm text-red-600">
              {error}
            </div>
          ) : isFiltering && results.length === 0 ? (
            <div className="px-6 py-16 text-center text-sm text-on-surface-variant">
              {hasSearch
                ? `Sin resultados para "${query.trim()}"`
                : "Esta categoría no tiene productos visibles"}
            </div>
          ) : displayGroups.length === 0 ? (
            <div className="px-6 py-16 text-center text-sm text-on-surface-variant">
              No hay productos importados todavía. Usa &quot;Importar catálogo
              completo&quot; para sincronizar desde Loyverse.
            </div>
          ) : (
            <ProductCategorySections
              products={results}
              groups={displayGroups}
              showCategoryHeaders
            />
          )}
        </section>

        {(!isFiltering || (!loading && totalVisibleProducts > 0)) && (
          <p className="text-xs text-on-surface-variant">
            {totalVisibleProducts.toLocaleString("es-PR")} productos
            {displayGroups.length > 1
              ? ` en ${displayGroups.length} categorías`
              : selectedCategory
                ? ` en ${selectedCategory.name}`
                : ""}
            {hasSearch ? ` para "${query.trim()}"` : ""}
            {isFiltering && results.length >= 500
              ? " · mostrando los primeros 500"
              : ""}
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
