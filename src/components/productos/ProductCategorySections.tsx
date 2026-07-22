"use client";

import { groupProductsByCategory } from "@/lib/products/group-by-category";
import type { Product, ProductCategoryGroup } from "@/lib/types";

interface ProductCategorySectionsProps {
  products: Product[];
  groups?: ProductCategoryGroup[];
  showCategoryHeaders?: boolean;
}

export function ProductCategorySections({
  products,
  groups,
  showCategoryHeaders = true,
}: ProductCategorySectionsProps) {
  const sections = groups ?? groupProductsByCategory(products);

  return (
    <>
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
              {showCategoryHeaders ? (
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-wider">
                  Categoría
                </th>
              ) : null}
              <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-wider text-right">
                Precio
              </th>
            </tr>
          </thead>
          <tbody>
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
          <section key={group.categoryId ?? group.categoryName} className="space-y-3">
            {showCategoryHeaders && (
              <h4 className="text-xs font-bold uppercase border-b-2 border-black pb-2">
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
  const colSpan = showCategoryHeaders ? 4 : 3;

  return (
    <>
      {showCategoryHeaders && (
        <tr className="bg-surface-container-low border-y border-black/10">
          <td
            colSpan={colSpan}
            className="px-6 py-3 text-xs font-bold uppercase tracking-wider"
          >
            {group.categoryName}
            <span className="ml-2 font-mono opacity-60">
              ({group.products.length})
            </span>
          </td>
        </tr>
      )}
      {group.products.map((product) => (
        <tr
          key={product.id}
          className="border-b border-black/10 hover:bg-surface-container-low transition-colors"
        >
          <td className="px-6 py-4 font-bold uppercase">{product.name}</td>
          <td className="px-6 py-4 font-mono text-sm">{product.sku}</td>
          {showCategoryHeaders && (
            <td className="px-6 py-4 text-sm font-bold uppercase opacity-70">
              {product.categoryName ?? "—"}
            </td>
          )}
          <td className="px-6 py-4 text-right font-extrabold">
            ${product.unitPrice.toFixed(2)}
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
    <article className="border-2 border-black p-4 bg-gray-50">
      <p className="font-bold uppercase text-sm">{product.name}</p>
      <p className="text-[10px] font-mono text-gray-500 mt-1">
        SKU: {product.sku}
      </p>
      {showCategory && (
        <p className="text-[10px] font-bold uppercase text-gray-500 mt-1">
          Categoría: {product.categoryName ?? "Sin categoría"}
        </p>
      )}
      <p className="text-lg font-extrabold text-primary mt-2">
        ${product.unitPrice.toFixed(2)}
      </p>
    </article>
  );
}
