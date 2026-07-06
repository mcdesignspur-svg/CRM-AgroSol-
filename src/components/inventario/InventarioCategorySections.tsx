"use client";

import { groupProductsByCategory } from "@/lib/products/group-by-category";
import type { Product, ProductCategoryGroup } from "@/lib/types";
import { StockBadge } from "./StockBadge";

interface InventarioCategorySectionsProps {
  products: Product[];
  groups?: ProductCategoryGroup[];
  showCategoryHeaders?: boolean;
}

export function InventarioCategorySections({
  products,
  groups,
  showCategoryHeaders = true,
}: InventarioCategorySectionsProps) {
  const sections = groups ?? groupProductsByCategory(products);

  return (
    <>
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="table-header">
            <tr>
              <th className="px-4 py-3 text-xs font-medium">Producto</th>
              <th className="px-4 py-3 text-xs font-medium">SKU</th>
              {showCategoryHeaders ? (
                <th className="px-4 py-3 text-xs font-medium">Categoría</th>
              ) : null}
              <th className="px-4 py-3 text-xs font-medium text-right">
                Precio
              </th>
              <th className="px-4 py-3 text-xs font-medium text-right">
                Disponibles
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sections.map((group) => (
              <SectionRows
                key={group.categoryId ?? group.categoryName}
                group={group}
                showCategoryHeaders={showCategoryHeaders}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="sm:hidden p-4 space-y-4">
        {sections.map((group) => (
          <section
            key={group.categoryId ?? group.categoryName}
            className="space-y-3"
          >
            {showCategoryHeaders && (
              <h4 className="text-xs font-medium text-on-surface-variant border-b border-outline pb-2">
                {group.categoryName} ({group.products.length})
              </h4>
            )}
            {group.products.map((product) => (
              <MobileProductCard
                key={product.id}
                product={product}
                showCategory={showCategoryHeaders}
              />
            ))}
          </section>
        ))}
      </div>
    </>
  );
}

function SectionRows({
  group,
  showCategoryHeaders,
}: {
  group: ProductCategoryGroup;
  showCategoryHeaders: boolean;
}) {
  const colSpan = showCategoryHeaders ? 5 : 4;

  return (
    <>
      {showCategoryHeaders && (
        <tr className="bg-surface-container-low">
          <td
            colSpan={colSpan}
            className="px-4 py-2.5 text-xs font-medium text-on-surface-variant"
          >
            {group.categoryName}
            <span className="ml-2 font-mono text-[11px]">
              ({group.products.length})
            </span>
          </td>
        </tr>
      )}
      {group.products.map((product) => (
        <tr key={product.id} className="hover:bg-surface transition-colors">
          <td className="px-4 py-3 text-sm font-medium">{product.name}</td>
          <td className="px-4 py-3 font-mono text-sm text-on-surface-variant">
            {product.sku}
          </td>
          {showCategoryHeaders && (
            <td className="px-4 py-3 text-sm text-on-surface-variant">
              {product.categoryName ?? "—"}
            </td>
          )}
          <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums">
            ${product.unitPrice.toFixed(2)}
          </td>
          <td className="px-4 py-3 text-right">
            <StockBadge stockQuantity={product.stockQuantity} />
          </td>
        </tr>
      ))}
    </>
  );
}

function MobileProductCard({
  product,
  showCategory,
}: {
  product: Product;
  showCategory: boolean;
}) {
  return (
    <article className="rounded-lg border border-outline bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">{product.name}</p>
          <p className="text-xs font-mono text-on-surface-variant mt-1">
            SKU: {product.sku}
          </p>
          {showCategory && (
            <p className="text-xs text-on-surface-variant mt-1">
              {product.categoryName ?? "Sin categoría"}
            </p>
          )}
        </div>
        <StockBadge stockQuantity={product.stockQuantity} />
      </div>
      <p className="text-lg font-semibold text-primary mt-3 tabular-nums">
        ${product.unitPrice.toFixed(2)}
      </p>
    </article>
  );
}
