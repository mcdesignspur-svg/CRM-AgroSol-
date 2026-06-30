"use client";

import { useEffect } from "react";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { useMobileNav } from "@/components/providers/MobileNavProvider";
import { SidebarNav } from "./SidebarNav";

interface MobileDrawerProps {
  onPingClick: () => void;
  onConfigClick: () => void;
  onSupportClick: () => void;
}

export function MobileDrawer({
  onPingClick,
  onConfigClick,
  onSupportClick,
}: MobileDrawerProps) {
  const { drawerOpen, closeDrawer } = useMobileNav();

  useEffect(() => {
    if (!drawerOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  useEffect(() => {
    if (!drawerOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeDrawer();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [drawerOpen, closeDrawer]);

  if (!drawerOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] md:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        onClick={closeDrawer}
        aria-label="Cerrar menú"
      />
      <aside className="absolute inset-y-0 left-0 w-[min(85vw,280px)] bg-surface-container-lowest border-r-2 border-on-background flex flex-col py-6 animate-[slideFromLeft_0.2s_ease-out] safe-area-top">
        <div className="px-6 mb-8 flex justify-between items-start">
          <div>
            <h1 className="font-display text-xl font-extrabold text-primary">
              {APP_NAME}
            </h1>
            <p className="text-xs font-bold opacity-70 uppercase tracking-wide">
              {APP_TAGLINE}
            </p>
          </div>
          <button
            type="button"
            onClick={closeDrawer}
            className="p-2 hover:bg-surface-container min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Cerrar"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <SidebarNav
          onNavigate={closeDrawer}
          onPingClick={onPingClick}
          onConfigClick={onConfigClick}
          onSupportClick={onSupportClick}
        />
      </aside>
    </div>
  );
}
