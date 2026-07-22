"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";
import { DEFAULT_BRANCH } from "@/lib/constants";
import type { BranchId } from "@/lib/types";

interface BranchContextValue {
  branchId: BranchId;
  setBranchId: (id: BranchId) => void;
}

const BranchContext = createContext<BranchContextValue | null>(null);

export function BranchProvider({ children }: { children: React.ReactNode }) {
  const [branchId, setBranchIdState] = useState<BranchId>(DEFAULT_BRANCH);

  const setBranchId = useCallback((id: BranchId) => {
    setBranchIdState(id);
  }, []);

  return (
    <BranchContext.Provider value={{ branchId, setBranchId }}>
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const ctx = useContext(BranchContext);
  if (!ctx) {
    throw new Error("useBranch debe usarse dentro de BranchProvider");
  }
  return ctx;
}
