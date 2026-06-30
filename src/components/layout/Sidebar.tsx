"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_NAME, APP_TAGLINE, NAV_ITEMS } from "@/lib/constants";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 border-r-2 border-on-background bg-surface-container-lowest py-10 h-full shrink-0">
      <div className="px-6 mb-10">
        <h1 className="font-display text-2xl font-extrabold text-primary">
          {APP_NAME}
        </h1>
        <p className="text-xs font-bold opacity-70 uppercase tracking-wide">
          {APP_TAGLINE}
        </p>
      </div>

      <nav className="flex-1 space-y-2 px-2">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 font-bold transition-transform active:translate-x-1 ${
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
          className="w-full btn-primary font-bold py-3 industrial-border industrial-shadow mb-4 flex items-center justify-center gap-2 text-sm"
        >
          <span className="material-symbols-outlined">bolt</span>
          PING RÁPIDO
        </button>
        <Link
          href="#"
          className="flex items-center gap-3 px-4 py-2 text-on-surface hover:bg-surface-container text-sm font-bold"
        >
          <span className="material-symbols-outlined">settings</span>
          Configuración
        </Link>
        <Link
          href="#"
          className="flex items-center gap-3 px-4 py-2 text-on-surface hover:bg-surface-container text-sm font-bold"
        >
          <span className="material-symbols-outlined">help</span>
          Soporte
        </Link>
      </div>
    </aside>
  );
}
