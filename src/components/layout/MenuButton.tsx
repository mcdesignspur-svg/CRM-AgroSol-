"use client";

import { useMobileNav } from "@/components/providers/MobileNavProvider";

export function MenuButton() {
  const { toggleDrawer } = useMobileNav();

  return (
    <button
      type="button"
      onClick={toggleDrawer}
      className="md:hidden p-2 -ml-2 hover:bg-surface-container transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
      aria-label="Abrir menú"
    >
      <span className="material-symbols-outlined text-2xl">menu</span>
    </button>
  );
}
