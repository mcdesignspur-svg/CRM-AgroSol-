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

export function isBranchId(value: string): value is BranchId {
  return (BRANCH_IDS as readonly string[]).includes(value);
}
