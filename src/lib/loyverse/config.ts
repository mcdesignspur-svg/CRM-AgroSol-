import type { BranchId } from "@/lib/types";

export const LOYVERSE_API_BASE = "https://api.loyverse.com/v1.0";

/** Sucursales con integración Loyverse activa (por ahora solo Gurabo). */
export const LOYVERSE_ENABLED_BRANCHES: BranchId[] = ["gurabo"];

const TOKEN_ENV_KEYS: Partial<Record<BranchId, string>> = {
  gurabo: "LOYVERSE_ACCESS_TOKEN",
  // Futuro: una cuenta Loyverse por sucursal
  // "san-lorenzo": "LOYVERSE_ACCESS_TOKEN_SAN_LORENZO",
  // navarro: "LOYVERSE_ACCESS_TOKEN_NAVARRO",
};

const STORE_ENV_KEYS: Partial<Record<BranchId, string>> = {
  gurabo: "LOYVERSE_STORE_ID",
};

export function getLoyverseAccessToken(
  branchId: BranchId = "gurabo",
): string | null {
  const envKey = TOKEN_ENV_KEYS[branchId];
  if (!envKey) return null;

  const token = process.env[envKey]?.trim();
  return token || null;
}

export function isLoyverseConfigured(branchId: BranchId = "gurabo"): boolean {
  return !!getLoyverseAccessToken(branchId);
}

export function isLoyverseBranchEnabled(branchId: BranchId): boolean {
  return LOYVERSE_ENABLED_BRANCHES.includes(branchId);
}

/** Si está definido, el inventario se toma solo de esa tienda Loyverse. */
export function getLoyverseStoreId(branchId: BranchId = "gurabo"): string | null {
  const envKey = STORE_ENV_KEYS[branchId];
  if (!envKey) return null;

  const storeId = process.env[envKey]?.trim();
  return storeId || null;
}

export function getLoyverseBranchLabel(branchId: BranchId): string {
  if (branchId === "gurabo") return "Gurabo (Central)";
  if (branchId === "san-lorenzo") return "San Lorenzo";
  return "Ferretería Navarro";
}
