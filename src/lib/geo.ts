import { BRANCH_DEFINITIONS } from "@/lib/branch-definitions";
import type { BranchId, Delivery } from "@/lib/types";

export type LatLng = [number, number];

export const MAP_DEFAULT_CENTER: LatLng = [18.22, -65.98];
export const MAP_DEFAULT_ZOOM = 11;

function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function getBranchCoordinates(branchId: BranchId): LatLng {
  const branch = BRANCH_DEFINITIONS.find((item) => item.id === branchId);
  if (!branch) {
    return MAP_DEFAULT_CENTER;
  }
  return [branch.lat, branch.lng];
}

/** Deterministic offset near the branch when geocoding is unavailable. */
export function getSyntheticDeliveryCoordinates(input: {
  id: string;
  destination: string;
  branchId?: BranchId | null;
}): LatLng {
  const branchId = input.branchId ?? "gurabo";
  const [baseLat, baseLng] = getBranchCoordinates(branchId);
  const hash = hashString(`${input.id}:${input.destination}`);
  const angle = ((hash % 360) * Math.PI) / 180;
  const distance = 0.012 + (hash % 80) / 4000;

  return [
    baseLat + distance * Math.cos(angle),
    baseLng + distance * Math.sin(angle),
  ];
}

export function getDeliveryCoordinates(delivery: Delivery): LatLng {
  if (
    typeof delivery.lat === "number" &&
    typeof delivery.lng === "number" &&
    Number.isFinite(delivery.lat) &&
    Number.isFinite(delivery.lng)
  ) {
    return [delivery.lat, delivery.lng];
  }

  return getSyntheticDeliveryCoordinates({
    id: delivery.id,
    destination: delivery.destination,
    branchId: delivery.branchId,
  });
}

export function isDeliveryHighlighted(
  delivery: Delivery,
  ordenId: string | null,
): boolean {
  if (!ordenId) return false;
  if (delivery.orderId && delivery.orderId === ordenId) return true;
  return delivery.id.toLowerCase().includes(ordenId.slice(-4).toLowerCase());
}
