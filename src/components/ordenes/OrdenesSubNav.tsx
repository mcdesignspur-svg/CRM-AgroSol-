"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SUB_PAGES = [
  {
    href: "/ordenes",
    label: "Órdenes",
    icon: "receipt_long",
    match: (pathname: string) => pathname === "/ordenes",
  },
  {
    href: "/ordenes/nueva",
    label: "Nueva Orden",
    icon: "add_shopping_cart",
    match: (pathname: string) => pathname === "/ordenes/nueva",
  },
] as const;

export function OrdenesSubNav() {
  const pathname = usePathname();

  return (
    <nav
      className="flex border-2 border-black bg-gray-100 p-1 gap-1 w-full sm:w-auto"
      aria-label="Secciones de órdenes"
    >
      {SUB_PAGES.map((item) => {
        const active = item.match(pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 text-xs font-bold uppercase transition-all min-h-[44px] flex items-center justify-center gap-2 ${
              active
                ? "bg-primary text-white industrial-shadow"
                : "bg-white text-black hover:bg-surface-container"
            }`}
          >
            <span className="material-symbols-outlined text-sm">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
