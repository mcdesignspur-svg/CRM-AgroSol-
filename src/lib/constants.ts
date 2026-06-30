import { BRANCH_DEFINITIONS } from "./branch-definitions";
import type { BranchId } from "./types";

export const APP_NAME = "Agrocentro Solá";
export const APP_TAGLINE = "Logistics CRM";

export const BRANCH_LABELS = Object.fromEntries(
  BRANCH_DEFINITIONS.map((branch) => [branch.id, branch.name]),
) as Record<BranchId, string>;

export const NAV_ITEMS = [
  { href: "/", label: "Panel", icon: "dashboard" },
  { href: "/ordenes", label: "Órdenes", icon: "receipt_long" },
  { href: "/productos", label: "Productos", icon: "inventory_2" },
  { href: "/entregas", label: "Entregas", icon: "local_shipping" },
  { href: "/sucursales", label: "Sucursales", icon: "storefront" },
] as const;

export const DEFAULT_BRANCH: BranchId = "gurabo";

export const TAX_RATE = 0.21;
export const DELIVERY_FEE = 25;

export const PICKUP_SLA_HOURS = 2;
export const DELIVERY_SLA_HOURS = 4;
