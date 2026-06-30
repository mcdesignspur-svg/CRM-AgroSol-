"use client";

import { useEffect, useRef, useState } from "react";
import { useBranch } from "@/components/providers/BranchProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { NotificationsButton } from "@/components/ui/NotificationsButton";
import { BRANCH_LABELS } from "@/lib/constants";
import type { BranchId } from "@/lib/types";

interface TopBarProps {
  title?: string;
  showSearch?: boolean;
  showBranchSelector?: boolean;
  children?: React.ReactNode;
}

export function TopBar({
  title,
  showSearch = true,
  showBranchSelector = true,
  children,
}: TopBarProps) {
  const { branchId, setBranchId } = useBranch();
  const { showToast } = useToast();
  const [branchOpen, setBranchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const branchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!branchOpen) return;
    function handleClick(e: MouseEvent) {
      if (branchRef.current && !branchRef.current.contains(e.target as Node)) {
        setBranchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [branchOpen]);

  function selectBranch(id: BranchId) {
    setBranchId(id);
    setBranchOpen(false);
    showToast(`Sucursal activa: ${BRANCH_LABELS[id]}`, "info");
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      showToast(`Buscando: "${searchQuery}"`, "info");
    }
  }

  return (
    <header className="flex justify-between items-center w-full px-4 md:px-8 py-4 bg-surface-container-lowest border-b-2 border-on-background shrink-0">
      <div className="flex items-center gap-4 min-w-0">
        {title ? (
          <h1 className="font-display text-xl md:text-2xl font-extrabold uppercase tracking-tight truncate">
            {title}
          </h1>
        ) : (
          <>
            <div className="md:hidden font-bold text-primary text-xl">AS</div>
            {showSearch && (
              <form
                onSubmit={handleSearch}
                className="relative hidden sm:block"
              >
                <span className="absolute inset-y-0 left-3 flex items-center text-gray-500">
                  <span className="material-symbols-outlined text-xl">
                    search
                  </span>
                </span>
                <input
                  className="pl-10 industrial-border bg-surface-container-low text-sm font-bold focus:ring-2 focus:ring-primary w-48 md:w-96 py-2"
                  placeholder="Buscar órdenes..."
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>
            )}
          </>
        )}
      </div>

      <div className="flex items-center gap-3 md:gap-4 shrink-0">
        {children}
        {showBranchSelector && !title && (
          <div className="relative hidden md:block" ref={branchRef}>
            <button
              type="button"
              onClick={() => setBranchOpen((v) => !v)}
              className="flex items-center gap-2 btn-secondary px-4 py-2 text-sm font-bold"
              aria-expanded={branchOpen}
            >
              <span className="material-symbols-outlined">location_on</span>
              {BRANCH_LABELS[branchId]}
              <span className="material-symbols-outlined text-sm">
                expand_more
              </span>
            </button>
            {branchOpen && (
              <div className="absolute right-0 top-full mt-1 w-56 bg-white industrial-border industrial-shadow z-50">
                {(Object.entries(BRANCH_LABELS) as [BranchId, string][]).map(
                  ([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => selectBranch(id)}
                      className={`w-full text-left px-4 py-2 text-sm font-bold hover:bg-surface-container transition-colors ${
                        branchId === id ? "bg-secondary-container" : ""
                      }`}
                    >
                      {label}
                    </button>
                  ),
                )}
              </div>
            )}
          </div>
        )}
        <NotificationsButton />
        <div className="w-10 h-10 industrial-border bg-gray-200 overflow-hidden flex items-center justify-center">
          <span className="material-symbols-outlined text-gray-600">person</span>
        </div>
      </div>
    </header>
  );
}
