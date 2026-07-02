import { NAV_ITEMS } from "@/lib/constants";

function matchesNavHref(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Longest-prefix-wins so /ordenes is not active on /ordenes/nueva. */
export function isNavActive(pathname: string, href: string): boolean {
  const bestMatch = NAV_ITEMS.filter((item) =>
    matchesNavHref(pathname, item.href),
  ).sort((a, b) => b.href.length - a.href.length)[0];

  return bestMatch?.href === href;
}
