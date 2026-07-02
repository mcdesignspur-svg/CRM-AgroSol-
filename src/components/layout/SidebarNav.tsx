"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/constants";
import { isNavActive } from "./navActive";

interface SidebarNavProps {
  onNavigate?: () => void;
  onConfigClick: () => void;
  onSupportClick: () => void;
}

export function SidebarNav({
  onNavigate,
  onConfigClick,
  onSupportClick,
}: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <>
      <nav className="flex-1 space-y-0.5 px-3">
        {NAV_ITEMS.map((item) => {
          const active = isNavActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[40px] ${
                active
                  ? "bg-primary-container text-primary"
                  : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
              }`}
            >
              <span
                className={`material-symbols-outlined text-xl ${
                  active ? "text-primary" : "text-on-surface-variant"
                }`}
              >
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 mt-auto space-y-0.5 pt-4 border-t border-outline">
        <button
          type="button"
          onClick={() => {
            onConfigClick();
            onNavigate?.();
          }}
          className="flex items-center gap-3 px-3 py-2.5 text-on-surface-variant hover:bg-surface-container hover:text-on-surface text-sm font-medium w-full rounded-lg transition-colors min-h-[40px]"
        >
          <span className="material-symbols-outlined text-xl">settings</span>
          Configuración
        </button>
        <button
          type="button"
          onClick={() => {
            onSupportClick();
            onNavigate?.();
          }}
          className="flex items-center gap-3 px-3 py-2.5 text-on-surface-variant hover:bg-surface-container hover:text-on-surface text-sm font-medium w-full rounded-lg transition-colors min-h-[40px]"
        >
          <span className="material-symbols-outlined text-xl">help</span>
          Soporte
        </button>
      </div>
    </>
  );
}
