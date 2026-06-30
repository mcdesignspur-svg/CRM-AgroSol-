import type { BranchId } from "./types";

export interface BranchDefinition {
  id: BranchId;
  name: string;
  address: string;
}

export const BRANCH_DEFINITIONS: readonly BranchDefinition[] = [
  {
    id: "gurabo",
    name: "Gurabo (Central)",
    address: "Av. Agrícola 450",
  },
  {
    id: "san-lorenzo",
    name: "San Lorenzo",
    address: "Km 12 Carretera Federal",
  },
  {
    id: "navarro",
    name: "Ferretería Navarro",
    address: "Zona Industrial Lote 9",
  },
] as const;

export const BRANCH_IDS = BRANCH_DEFINITIONS.map((branch) => branch.id);

/** Keywords used to match Loyverse store names to CRM branches during sync. */
export const BRANCH_LOYVERSE_MATCH: Record<BranchId, readonly string[]> = {
  gurabo: ["gurabo", "central"],
  "san-lorenzo": ["san lorenzo", "lorenzo"],
  navarro: ["navarro", "ferretería", "ferreteria"],
};

export function isBranchId(value: string): value is BranchId {
  return (BRANCH_IDS as readonly string[]).includes(value);
}

export function matchBranchIdFromStoreName(storeName: string): BranchId | null {
  const normalized = storeName.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
  for (const branch of BRANCH_DEFINITIONS) {
    const keywords = BRANCH_LOYVERSE_MATCH[branch.id];
    if (keywords.some((keyword) => normalized.includes(keyword))) {
      return branch.id;
    }
  }
  return null;
}
