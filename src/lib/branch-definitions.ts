import type { BranchId } from "./types";

export interface BranchDefinition {
  id: BranchId;
  name: string;
  address: string;
  phone: string;
  lat: number;
  lng: number;
}

export const BRANCH_DEFINITIONS: readonly BranchDefinition[] = [
  {
    id: "gurabo",
    name: "Gurabo (Central)",
    address: "Av. Agrícola 450",
    phone: "+17877504500",
    lat: 18.2545,
    lng: -65.9729,
  },
  {
    id: "san-lorenzo",
    name: "San Lorenzo",
    address: "Km 12 Carretera Federal",
    phone: "+17877504501",
    lat: 18.1894,
    lng: -65.9614,
  },
  {
    id: "navarro",
    name: "Ferretería Navarro",
    address: "Zona Industrial Lote 9",
    phone: "+17877504502",
    lat: 18.235,
    lng: -66.008,
  },
] as const;

export const BRANCH_IDS = BRANCH_DEFINITIONS.map((branch) => branch.id);

export function isBranchId(value: string): value is BranchId {
  return (BRANCH_IDS as readonly string[]).includes(value);
}
