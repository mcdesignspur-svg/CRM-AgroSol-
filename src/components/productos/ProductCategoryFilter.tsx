"use client";

import type { ProductCategorySummary } from "@/lib/types";

interface ProductCategoryFilterProps {
  categories: ProductCategorySummary[];
  selectedCategoryId: string | null | undefined;
  onSelect: (categoryId: string | null | undefined) => void;
}

function categoryKey(categoryId: string | null | undefined) {
  if (categoryId === undefined) return "all";
  if (categoryId === null) return "uncategorized";
  return categoryId;
}

export function ProductCategoryFilter({
  categories,
  selectedCategoryId,
  onSelect,
}: ProductCategoryFilterProps) {
  const selectedKey = categoryKey(selectedCategoryId);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xs font-bold uppercase tracking-wider opacity-70">
          Categorías
        </h3>
        {selectedCategoryId !== undefined && (
          <button
            type="button"
            onClick={() => onSelect(undefined)}
            className="text-[10px] font-bold uppercase underline opacity-70 hover:opacity-100"
          >
            Ver todas
          </button>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
        {categories.map((category) => {
          const key = categoryKey(category.id);
          const active = selectedKey === key;

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(category.id)}
              className={`shrink-0 px-3 py-2 border-2 border-black text-xs font-bold uppercase transition-colors ${
                active
                  ? "bg-black text-white"
                  : "bg-white hover:bg-surface-container-low"
              }`}
            >
              {category.name}
              <span className="ml-2 font-mono opacity-70">
                {category.productCount.toLocaleString("es-PR")}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface ProductCategoryGridProps {
  categories: ProductCategorySummary[];
  onSelect: (categoryId: string | null) => void;
}

export function ProductCategoryGrid({
  categories,
  onSelect,
}: ProductCategoryGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
      {categories.map((category) => (
        <button
          key={categoryKey(category.id)}
          type="button"
          onClick={() => onSelect(category.id)}
          className="text-left border-2 border-black p-4 bg-white hover:bg-surface-container-low transition-colors industrial-shadow"
        >
          <p className="font-bold uppercase text-sm">{category.name}</p>
          <p className="text-[10px] font-mono opacity-60 mt-2">
            {category.productCount.toLocaleString("es-PR")} productos
          </p>
        </button>
      ))}
    </div>
  );
}
