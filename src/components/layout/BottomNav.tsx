"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/constants";
import { isNavActive } from "./navActive";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 backdrop-blur-sm border-t border-outline safe-area-bottom"
      aria-label="Navegación principal"
    >
      <div className="grid grid-cols-6 h-14">
        {NAV_ITEMS.map((item) => {
          const active = isNavActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 min-h-[44px] transition-colors ${
                active
                  ? "text-primary"
                  : "text-on-surface-variant"
              }`}
            >
              <span
                className={`material-symbols-outlined text-[22px] ${
                  active ? "text-primary" : ""
                }`}
              >
                {item.icon}
              </span>
              <span className="text-[9px] font-medium leading-none text-center px-0.5 truncate max-w-full">
                {item.label.split(" ")[0]}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
