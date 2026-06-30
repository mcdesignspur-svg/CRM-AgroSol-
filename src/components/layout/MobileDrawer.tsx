"use client";

import { usePathname } from "next/navigation";
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
  const pathname = usePathname();

  useEffect(() => {
    closeDrawer();
  }, [pathname, closeDrawer]);

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

  return (
    <div
      className={`fixed inset-0 z-[60] md:hidden transition-opacity duration-200 ${
        drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
      aria-hidden={!drawerOpen}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        onClick={closeDrawer}
        aria-label="Cerrar menú"
        tabIndex={drawerOpen ? 0 : -1}
      />

      <aside
        id="mobile-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
        className={`absolute inset-y-0 left-0 w-[min(88vw,300px)] bg-surface-container-lowest border-r-2 border-black flex flex-col py-6 industrial-shadow transition-transform duration-200 ease-out safe-area-top ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-5 mb-6 flex justify-between items-start border-b-2 border-black pb-4 mx-4">
          <div>
            <h2 className="font-display text-xl font-extrabold text-primary">
              {APP_NAME}
            </h2>
            <p className="text-xs font-bold opacity-70 uppercase tracking-wide">
              {APP_TAGLINE}
            </p>
          </div>
          <button
            type="button"
            onClick={closeDrawer}
            className="industrial-border bg-white p-2 hover:bg-surface-container min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Cerrar menú"
            tabIndex={drawerOpen ? 0 : -1}
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
