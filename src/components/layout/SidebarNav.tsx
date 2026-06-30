"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/constants";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

interface SidebarNavProps {
  onNavigate?: () => void;
  onPingClick: () => void;
  onConfigClick: () => void;
  onSupportClick: () => void;
}

export function SidebarNav({
  onNavigate,
  onPingClick,
  onConfigClick,
  onSupportClick,
}: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <>
      <nav className="flex-1 space-y-2 px-2">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-4 py-3 font-bold transition-transform active:translate-x-1 min-h-[44px] ${
                active
                  ? "bg-secondary-container text-on-secondary-container border-l-4 border-primary"
                  : "text-on-surface hover:bg-surface-container"
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-4 mt-auto space-y-2">
        <button
          type="button"
          onClick={() => {
            onPingClick();
            onNavigate?.();
          }}
          className="w-full btn-primary font-bold py-3 industrial-border industrial-shadow mb-4 flex items-center justify-center gap-2 text-sm min-h-[44px]"
        >
          <span className="material-symbols-outlined">bolt</span>
          PING RÁPIDO
        </button>
        <button
          type="button"
          onClick={() => {
            onConfigClick();
            onNavigate?.();
          }}
          className="flex items-center gap-3 px-4 py-3 text-on-surface hover:bg-surface-container text-sm font-bold w-full min-h-[44px]"
        >
          <span className="material-symbols-outlined">settings</span>
          Configuración
        </button>
        <button
          type="button"
          onClick={() => {
            onSupportClick();
            onNavigate?.();
          }}
          className="flex items-center gap-3 px-4 py-3 text-on-surface hover:bg-surface-container text-sm font-bold w-full min-h-[44px]"
        >
          <span className="material-symbols-outlined">help</span>
          Soporte
        </button>
      </div>
    </>
  );
}
