import {
  getLoyverseAccessToken,
  isLoyverseConfigured,
  LOYVERSE_API_BASE_URL,
} from "./config";
import type { LoyverseListResponse } from "./types";

export class LoyverseApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: string,
  ) {
    super(message);
    this.name = "LoyverseApiError";
  }
}

export async function loyverseFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = getLoyverseAccessToken();
  if (!token) {
    throw new LoyverseApiError("LOYVERSE_ACCESS_TOKEN no configurado", 0);
  }

  const url = `${LOYVERSE_API_BASE_URL.replace(/\/$/, "")}${path}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new LoyverseApiError(
      `Loyverse API ${response.status}: ${body || response.statusText}`,
      response.status,
      body,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function loyverseListAll<TKey extends string, TItem>(
  path: string,
  collectionKey: TKey,
  params: Record<string, string | number | undefined> = {},
): Promise<TItem[]> {
  const items: TItem[] = [];
  let cursor: string | undefined;

  do {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== "") {
        search.set(key, String(value));
      }
    }
    if (cursor) {
      search.set("cursor", cursor);
    }
    search.set("limit", "250");

    const query = search.toString();
    const suffix = query ? `?${query}` : "";
    const page = await loyverseFetch<LoyverseListResponse<TKey, TItem>>(
      `${path}${suffix}`,
    );

    const batch = page[collectionKey];
    if (Array.isArray(batch)) {
      items.push(...batch);
    }

    cursor = typeof page.cursor === "string" ? page.cursor : undefined;
  } while (cursor);

  return items;
}

export async function checkLoyverseConnection(): Promise<boolean> {
  if (!isLoyverseConfigured()) {
    return false;
  }

  try {
    await loyverseFetch<{ stores: unknown[] }>("/stores");
    return true;
  } catch {
    return false;
  }
}
