import type { BranchId } from "@/lib/types";
import type { LatLng } from "@/lib/geo";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const GEOCODE_TIMEOUT_MS = 4_000;

interface NominatimResult {
  lat: string;
  lon: string;
}

function buildQuery(destination: string, branchId?: BranchId | null): string {
  const trimmed = destination.trim();
  if (!trimmed) {
    return "";
  }

  // Prefer Puerto Rico context for local CRM destinations.
  if (/puerto\s*rico|\bpr\b/i.test(trimmed)) {
    return trimmed;
  }

  const branchHint =
    branchId === "gurabo"
      ? "Gurabo"
      : branchId === "san-lorenzo"
        ? "San Lorenzo"
        : branchId === "navarro"
          ? "Caguas"
          : null;

  if (branchHint && !trimmed.toLowerCase().includes(branchHint.toLowerCase())) {
    return `${trimmed}, ${branchHint}, Puerto Rico`;
  }

  return `${trimmed}, Puerto Rico`;
}

export async function geocodeDestination(
  destination: string,
  branchId?: BranchId | null,
): Promise<LatLng | null> {
  const query = buildQuery(destination, branchId);
  if (!query) {
    return null;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GEOCODE_TIMEOUT_MS);

  try {
    const url = new URL(NOMINATIM_URL);
    url.searchParams.set("q", query);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");
    url.searchParams.set("countrycodes", "pr");

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "CRM-AgroSol/1.0 (entregas-map)",
      },
    });

    if (!response.ok) {
      return null;
    }

    const results = (await response.json()) as NominatimResult[];
    const first = results[0];
    if (!first) {
      return null;
    }

    const lat = Number(first.lat);
    const lng = Number(first.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return null;
    }

    return [lat, lng];
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
