"use client";

import { useEffect, useState } from "react";
import type { BranchId, Product } from "@/lib/types";

export function useProductSearch(branchId: BranchId) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);

      void fetch(
        `/api/products/search?q=${encodeURIComponent(trimmed)}&branchId=${encodeURIComponent(branchId)}&limit=50`,
        { signal: controller.signal },
      )
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
  }, [query, branchId]);

  return { query, setQuery, results, loading, error };
}
