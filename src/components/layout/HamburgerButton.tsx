"use client";

import { useMobileNav } from "@/components/providers/MobileNavProvider";

interface HamburgerButtonProps {
  className?: string;
}

export function HamburgerButton({ className = "" }: HamburgerButtonProps) {
  const { drawerOpen, toggleDrawer } = useMobileNav();

  return (
    <button
      type="button"
      onClick={toggleDrawer}
      className={`md:hidden industrial-border bg-white industrial-shadow active:translate-y-0.5 active:shadow-none transition-all min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0 ${className}`}
      aria-label={drawerOpen ? "Cerrar menú" : "Abrir menú"}
      aria-expanded={drawerOpen}
      aria-controls="mobile-drawer"
    >
      <span className={`hamburger-icon ${drawerOpen ? "hamburger-icon--open" : ""}`}>
        <span />
        <span />
        <span />
      </span>
    </button>
  );
}
