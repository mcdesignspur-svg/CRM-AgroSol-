"use client";

import { useEffect, useRef, useState } from "react";
import { useBranch } from "@/components/providers/BranchProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { MobileHeader } from "@/components/layout/MobileHeader";
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
  const [searchOpen, setSearchOpen] = useState(false);
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
      setSearchOpen(false);
    }
  }

  const branchSelector = showBranchSelector && !title && (
    <div className="relative" ref={branchRef}>
      <button
        type="button"
        onClick={() => setBranchOpen((v) => !v)}
        className="flex items-center gap-1 sm:gap-2 btn-secondary px-2 sm:px-4 py-2 text-xs sm:text-sm font-bold max-w-[140px] sm:max-w-none"
        aria-expanded={branchOpen}
      >
        <span className="material-symbols-outlined text-base">location_on</span>
        <span className="truncate">{BRANCH_LABELS[branchId].split(" ")[0]}</span>
        <span className="material-symbols-outlined text-sm hidden sm:inline">
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
                className={`w-full text-left px-4 py-3 text-sm font-bold hover:bg-surface-container transition-colors min-h-[44px] ${
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
  );

  return (
    <>
      <header className="flex justify-between items-center w-full px-4 md:px-8 py-3 md:py-4 bg-surface-container-lowest border-b-2 border-on-background shrink-0 gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1 md:flex-none">
          <div className="md:hidden flex-1 min-w-0">
            <MobileHeader
              title={title}
              right={
                !title && showSearch ? (
                  <button
                    type="button"
                    onClick={() => setSearchOpen((v) => !v)}
                    className="p-2 hover:bg-surface-container min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
                    aria-label="Buscar"
                  >
                    <span className="material-symbols-outlined">search</span>
                  </button>
                ) : undefined
              }
            />
          </div>

          {/* Desktop header */}
          <div className="hidden md:flex items-center gap-4 min-w-0 flex-1">
            {title ? (
              <h1 className="font-display text-xl md:text-2xl font-extrabold uppercase tracking-tight truncate">
                {title}
              </h1>
            ) : (
              showSearch && (
                <form
                  onSubmit={handleSearch}
                  className="relative flex-1 max-w-md"
                >
                  <span className="absolute inset-y-0 left-3 flex items-center text-gray-500">
                    <span className="material-symbols-outlined text-xl">
                      search
                    </span>
                  </span>
                  <input
                    className="pl-10 industrial-border bg-surface-container-low text-sm font-bold focus:ring-2 focus:ring-primary w-full py-2"
                    placeholder="Buscar órdenes..."
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </form>
              )
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {children}
          {branchSelector}
          <NotificationsButton />
          <div className="hidden sm:flex w-10 h-10 industrial-border bg-gray-200 overflow-hidden items-center justify-center">
            <span className="material-symbols-outlined text-gray-600">person</span>
          </div>
        </div>
      </header>

      {searchOpen && !title && showSearch && (
        <form
          onSubmit={handleSearch}
          className="md:hidden px-4 py-2 bg-surface-container-low border-b-2 border-on-background"
        >
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center text-gray-500">
              <span className="material-symbols-outlined">search</span>
            </span>
            <input
              autoFocus
              className="w-full pl-10 industrial-border bg-white text-sm font-bold py-2.5"
              placeholder="Buscar órdenes..."
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>
      )}
    </>
  );
}
