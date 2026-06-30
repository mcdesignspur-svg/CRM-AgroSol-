import type { BranchId } from "./types";

export const APP_NAME = "Agrocentro Solá";
export const APP_TAGLINE = "Logistics CRM";

export const BRANCH_LABELS: Record<BranchId, string> = {
  gurabo: "Gurabo (Central)",
  "san-lorenzo": "San Lorenzo",
  navarro: "Ferretería Navarro",
};

export const NAV_ITEMS = [
  { href: "/", label: "Panel", icon: "dashboard" },
  { href: "/ordenes/nueva", label: "Nueva Orden", icon: "add_shopping_cart" },
  { href: "/entregas", label: "Entregas", icon: "local_shipping" },
  { href: "/sucursales", label: "Sucursales", icon: "storefront" },
] as const;

export const DEFAULT_BRANCH: BranchId = "gurabo";

export const TAX_RATE = 0.21;
export const DELIVERY_FEE = 25;
