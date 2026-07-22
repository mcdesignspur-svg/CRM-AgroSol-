"use client";

import { useEffect, useMemo, useState } from "react";
import type { BranchId, Product, ProductCategoryGroup, ProductCategorySummary } from "@/lib/types";

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

  const trimmedQuery = query.trim();
  const hasCategory = selectedCategoryId !== undefined;
  const isActive = hasCategory || trimmedQuery.length >= 2;

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        branchId,
        limit: "500",
      });

      if (trimmedQuery.length >= 2) {
        params.set("q", trimmedQuery);
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
  }, [branchId, hasCategory, isActive, selectedCategoryId, trimmedQuery]);

  return useMemo(
    () => ({
      query,
      setQuery,
      results: isActive ? results : [],
      loading: isActive ? loading : false,
      error: isActive ? error : null,
    }),
    [error, isActive, loading, query, results],
  );
}

export function useProductCategories(
  branchId: BranchId,
  initialCategories: ProductCategorySummary[] = [],
) {
  const [fetchedCategories, setFetchedCategories] = useState<
    ProductCategorySummary[]
  >([]);
  const [loading, setLoading] = useState(initialCategories.length === 0);
  const hasInitialCategories = initialCategories.length > 0;

  useEffect(() => {
    if (hasInitialCategories) {
      return;
    }

    void fetch(`/api/products/categories?branchId=${encodeURIComponent(branchId)}`)
      .then((res) => res.json())
      .then((data: { categories?: ProductCategorySummary[] }) => {
        setFetchedCategories(Array.isArray(data.categories) ? data.categories : []);
      })
      .catch(() => setFetchedCategories([]))
      .finally(() => setLoading(false));
  }, [branchId, hasInitialCategories]);

  return {
    categories: hasInitialCategories ? initialCategories : fetchedCategories,
    loading: hasInitialCategories ? false : loading,
  };
}

export function useGroupedCatalog(branchId: BranchId) {
  const [groups, setGroups] = useState<ProductCategoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    void fetch(`/api/products/grouped?branchId=${encodeURIComponent(branchId)}`, {
      signal: controller.signal,
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error ?? "Error al cargar productos agrupados");
        }
        setGroups(Array.isArray(data.groups) ? data.groups : []);
      })
      .catch((fetchError) => {
        if (controller.signal.aborted) return;
        setGroups([]);
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Error al cargar productos agrupados",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [branchId]);

  return { groups, loading, error };
}
