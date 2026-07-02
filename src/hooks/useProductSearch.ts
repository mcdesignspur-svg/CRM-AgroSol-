"use client";

import { useEffect, useState } from "react";
import type { BranchId, Product, ProductCategorySummary } from "@/lib/types";

function categoryParam(categoryId: string | null): string {
  if (categoryId === null) return "__uncategorized__";
  return categoryId;
}

export function useProductSearch(
  branchId: BranchId,
  selectedCategoryId?: string | null,
) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    const hasCategory = selectedCategoryId !== undefined;

    if (!hasCategory && trimmed.length < 2) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        branchId,
        limit: "100",
      });

      if (trimmed.length >= 2) {
        params.set("q", trimmed);
      }

      if (hasCategory && selectedCategoryId !== undefined) {
        params.set("categoryId", categoryParam(selectedCategoryId));
      }

      void fetch(`/api/products/search?${params.toString()}`, {
        signal: controller.signal,
      })
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error ?? "Error al buscar productos");
          }
          setResults(Array.isArray(data.products) ? data.products : []);
        })
        .catch((fetchError) => {
          if (controller.signal.aborted) return;
          setResults([]);
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : "Error al buscar productos",
          );
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setLoading(false);
          }
        });
    }, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query, branchId, selectedCategoryId]);

  return { query, setQuery, results, loading, error };
}

export function useProductCategories(
  branchId: BranchId,
  initialCategories: ProductCategorySummary[] = [],
) {
  const [categories, setCategories] =
    useState<ProductCategorySummary[]>(initialCategories);
  const [loading, setLoading] = useState(initialCategories.length === 0);

  useEffect(() => {
    if (initialCategories.length > 0) {
      setCategories(initialCategories);
      setLoading(false);
      return;
    }

    void fetch(`/api/products/categories?branchId=${encodeURIComponent(branchId)}`)
      .then((res) => res.json())
      .then((data: { categories?: ProductCategorySummary[] }) => {
        setCategories(Array.isArray(data.categories) ? data.categories : []);
      })
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, [branchId, initialCategories]);

  return { categories, loading };
}
