"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { Order } from "@/lib/types";

interface DashboardSearchContextValue {
  query: string;
  results: Order[] | null;
  resultsTotal: number;
  isSearching: boolean;
  submitSearch: (query: string) => Promise<void>;
  clearSearch: () => void;
}

const DashboardSearchContext =
  createContext<DashboardSearchContextValue | null>(null);

export function DashboardSearchProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Order[] | null>(null);
  const [resultsTotal, setResultsTotal] = useState(0);
  const [isSearching, setIsSearching] = useState(false);

  const clearSearch = useCallback(() => {
    setQuery("");
    setResults(null);
    setResultsTotal(0);
    setIsSearching(false);
  }, []);

  const submitSearch = useCallback(async (nextQuery: string) => {
    const trimmed = nextQuery.trim();
    setQuery(trimmed);

    if (!trimmed) {
      clearSearch();
      return;
    }

    setIsSearching(true);
    try {
      const params = new URLSearchParams({ limit: "20", offset: "0", q: trimmed });
      const res = await fetch(`/api/orders?${params}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Error al buscar órdenes");
      }
      setResults(data.orders);
      setResultsTotal(data.total);
    } catch {
      setResults([]);
      setResultsTotal(0);
      throw new Error("Error al buscar órdenes");
    } finally {
      setIsSearching(false);
    }
  }, [clearSearch]);

  const value = useMemo(
    () => ({
      query,
      results,
      resultsTotal,
      isSearching,
      submitSearch,
      clearSearch,
    }),
    [query, results, resultsTotal, isSearching, submitSearch, clearSearch],
  );

  return (
    <DashboardSearchContext.Provider value={value}>
      {children}
    </DashboardSearchContext.Provider>
  );
}

export function useDashboardSearch() {
  return useContext(DashboardSearchContext);
}
