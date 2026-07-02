"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
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
    const query = searchQuery.trim();
    if (query) {
      router.push(`/ordenes?q=${encodeURIComponent(query)}`);
      setSearchOpen(false);
    }
  }

  const branchSelector = showBranchSelector && !title && (
    <div className="relative" ref={branchRef}>
      <button
        type="button"
        onClick={() => setBranchOpen((v) => !v)}
        className="flex items-center gap-1.5 btn-secondary px-3 py-2 text-sm max-w-[140px] sm:max-w-none"
        aria-expanded={branchOpen}
      >
        <span className="material-symbols-outlined text-base text-on-surface-variant">
          location_on
        </span>
        <span className="truncate text-on-surface">
          {BRANCH_LABELS[branchId].split(" ")[0]}
        </span>
        <span className="material-symbols-outlined text-sm text-on-surface-variant hidden sm:inline">
          expand_more
        </span>
      </button>
      {branchOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-56 bg-white border border-outline rounded-lg shadow-lg z-50 overflow-hidden">
          {(Object.entries(BRANCH_LABELS) as [BranchId, string][]).map(
            ([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => selectBranch(id)}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors min-h-[44px] ${
                  branchId === id
                    ? "bg-primary-container text-primary font-medium"
                    : "text-on-surface hover:bg-surface-container"
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
      <header className="flex justify-between items-center w-full px-4 md:px-8 py-3 bg-white border-b border-outline shrink-0 gap-2 sticky top-0 z-40">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {title ? (
            <h1 className="font-display text-lg sm:text-xl font-semibold tracking-tight truncate text-on-surface">
              {title}
            </h1>
          ) : (
            <>
              <div className="md:hidden font-display text-lg font-semibold text-primary shrink-0">
                AgroSol
              </div>
              {showSearch && (
                <form
                  onSubmit={handleSearch}
                  className="relative hidden sm:block flex-1 max-w-md"
                >
                  <span className="absolute inset-y-0 left-3 flex items-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-xl">
                      search
                    </span>
                  </span>
                  <input
                    className="pl-10 border border-outline bg-surface rounded-lg text-sm w-full py-2 text-on-surface placeholder:text-on-surface-variant"
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

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {children}
          {showSearch && !title && (
            <button
              type="button"
              onClick={() => setSearchOpen((v) => !v)}
              className="sm:hidden p-2 rounded-lg hover:bg-surface-container min-h-[44px] min-w-[44px] flex items-center justify-center text-on-surface-variant"
              aria-label="Buscar"
            >
              <span className="material-symbols-outlined">search</span>
            </button>
          )}
          {branchSelector}
          <NotificationsButton />
          <div className="hidden sm:flex w-9 h-9 rounded-full bg-surface-container overflow-hidden items-center justify-center">
            <span className="material-symbols-outlined text-on-surface-variant text-xl">
              person
            </span>
          </div>
        </div>
      </header>

      {searchOpen && !title && showSearch && (
        <form
          onSubmit={handleSearch}
          className="sm:hidden px-4 py-2 bg-white border-b border-outline"
        >
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center text-on-surface-variant">
              <span className="material-symbols-outlined">search</span>
            </span>
            <input
              autoFocus
              className="w-full pl-10 border border-outline bg-surface rounded-lg text-sm py-2.5"
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
