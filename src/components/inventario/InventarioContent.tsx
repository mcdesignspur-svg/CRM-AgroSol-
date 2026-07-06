"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { TopBar } from "@/components/layout/TopBar";
import { ErpConnectionStatus } from "@/components/integrations/ErpConnectionStatus";
import { AddProductModal } from "@/components/productos/AddProductModal";
import { ProductCategoryFilter } from "@/components/productos/ProductCategoryFilter";
import { ProductSearchBar } from "@/components/productos/ProductSearchBar";
import { InventarioCategorySections } from "@/components/inventario/InventarioCategorySections";
import {
  useGroupedCatalog,
  useProductCategories,
  useProductSearch,
} from "@/hooks/useProductSearch";
import { groupProductsByCategory } from "@/lib/products/group-by-category";
import type { LoyverseStatus } from "@/lib/loyverse/types";
import type { Product, ProductCategorySummary } from "@/lib/types";

interface InventarioContentProps {
  loyverseStatus: LoyverseStatus;
  categories: ProductCategorySummary[];
}

export function InventarioContent({
  loyverseStatus,
  categories: initialCategories,
}: InventarioContentProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<
    string | null | undefined
  >(undefined);
  const [catalogKey, setCatalogKey] = useState(0);

  const { categories } = useProductCategories("gurabo", initialCategories);
  const {
    groups: groupedCatalog,
    loading: catalogLoading,
    error: catalogError,
  } = useGroupedCatalog("gurabo", catalogKey);
  const { query, setQuery, results, loading, error } = useProductSearch(
    "gurabo",
    selectedCategoryId,
    catalogKey,
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

  const lowStockCount = useMemo(
    () =>
      displayGroups.reduce(
        (sum, group) =>
          sum +
          group.products.filter(
            (product) =>
              product.stockQuantity !== null &&
              product.stockQuantity !== undefined &&
              product.stockQuantity <= 5,
          ).length,
        0,
      ),
    [displayGroups],
  );

  const showLoading = isFiltering ? loading : catalogLoading;
  const showError = isFiltering ? error : catalogError;

  function handleCreated(product: Product) {
    setQuery(product.name);
    setSelectedCategoryId(undefined);
    setCatalogKey((current) => current + 1);
  }

  function handleSynced() {
    setCatalogKey((current) => current + 1);
  }

  function handleCategorySelect(categoryId: string | null | undefined) {
    setSelectedCategoryId(categoryId);
    if (categoryId === undefined) {
      setQuery("");
    }
  }

  return (
    <AppShell topBar={<TopBar title="Inventario" showSearch={false} />}>
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 pb-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-on-surface">
              Inventario
            </h2>
            <p className="text-sm text-on-surface-variant mt-1">
              Referencia visual del stock en Gurabo (Central). Consulta nombre,
              precio y unidades disponibles por producto.
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-outline bg-white p-4 shadow-sm">
            <p className="text-xs text-on-surface-variant">Productos en cache</p>
            <p className="text-2xl font-semibold mt-1 tabular-nums">
              {(loyverseStatus.cachedProductCount ?? 0).toLocaleString("es-PR")}
            </p>
          </div>
          <div className="rounded-xl border border-outline bg-white p-4 shadow-sm">
            <p className="text-xs text-on-surface-variant">Categorías</p>
            <p className="text-2xl font-semibold mt-1 tabular-nums">
              {categories.length.toLocaleString("es-PR")}
            </p>
          </div>
          <div className="rounded-xl border border-outline bg-white p-4 shadow-sm">
            <p className="text-xs text-on-surface-variant">Bajo stock (≤ 5)</p>
            <p className="text-2xl font-semibold mt-1 tabular-nums text-amber-700">
              {showLoading ? "—" : lowStockCount.toLocaleString("es-PR")}
            </p>
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
          onSynced={handleSynced}
        />

        <section className="rounded-xl border border-outline bg-white shadow-sm overflow-hidden">
          {showLoading ? (
            <div className="px-6 py-16 text-center text-sm text-on-surface-variant">
              <span className="inline-flex items-center gap-2">
                <span className="material-symbols-outlined animate-spin text-primary">
                  sync
                </span>
                Cargando inventario...
              </span>
            </div>
          ) : showError ? (
            <div className="px-6 py-16 text-center text-sm text-red-600">
              {showError}
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
            <InventarioCategorySections
              products={results}
              groups={displayGroups}
              showCategoryHeaders
            />
          )}
        </section>

        {!showLoading && !showError && totalVisibleProducts > 0 && (
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
