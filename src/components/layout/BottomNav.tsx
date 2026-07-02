"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/constants";
import { isNavActive } from "./navActive";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t-2 border-black safe-area-bottom"
      aria-label="Navegación principal"
    >
      <div className="grid grid-cols-6 h-16">
        {NAV_ITEMS.map((item) => {
          const active = isNavActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 min-h-[44px] transition-colors ${
                active
                  ? "bg-secondary-container text-on-secondary-container"
                  : "text-on-surface hover:bg-surface-container-low"
              }`}
            >
              <span
                className={`material-symbols-outlined text-xl ${
                  active ? "text-primary" : ""
                }`}
              >
                {item.icon}
              </span>
              <span className="text-[8px] font-bold uppercase tracking-tighter leading-none text-center px-0.5">
                {item.label.split(" ")[0]}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
