import {
  getLoyverseAccessToken,
  getLoyverseBranchLabel,
  LOYVERSE_API_BASE,
} from "./config";
import type { BranchId } from "@/lib/types";

export class LoyverseApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "LoyverseApiError";
    this.status = status;
  }
}

async function parseErrorMessage(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as {
      message?: string;
      error?: string;
      errors?: Array<{ details?: string }>;
    };
    return (
      data.message ??
      data.error ??
      data.errors?.[0]?.details ??
      res.statusText
    );
  } catch {
    return res.statusText || "Error desconocido";
  }
}

export async function loyverseRequest<T>(
  path: string,
  branchId: BranchId,
  init?: RequestInit,
): Promise<T> {
  const token = getLoyverseAccessToken(branchId);
  if (!token) {
    throw new LoyverseApiError(
      401,
      `Token Loyverse no configurado para ${getLoyverseBranchLabel(branchId)}`,
    );
  }

  const res = await fetch(`${LOYVERSE_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new LoyverseApiError(res.status, await parseErrorMessage(res));
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

export async function loyverseGetPage<TKey extends string, TItem>(
  path: string,
  collectionKey: TKey,
  branchId: BranchId,
  options?: {
    limit?: number;
    cursor?: string | null;
    query?: Record<string, string | undefined>;
  },
): Promise<{ items: TItem[]; nextCursor: string | null }> {
  const limit = options?.limit ?? 250;
  const params = new URLSearchParams({ limit: String(limit) });
  if (options?.cursor) params.set("cursor", options.cursor);

  for (const [key, value] of Object.entries(options?.query ?? {})) {
    if (value) params.set(key, value);
  }

  const page = await loyverseRequest<
    Record<TKey, TItem[]> & { cursor?: string | null }
  >(`${path}?${params.toString()}`, branchId);

  return {
    items: page[collectionKey] ?? [],
    nextCursor: page.cursor ?? null,
  };
}

export async function loyverseGetAllPages<TKey extends string, TItem>(
  path: string,
  collectionKey: TKey,
  branchId: BranchId,
  options?: {
    limit?: number;
    query?: Record<string, string | undefined>;
  },
): Promise<TItem[]> {
  const items: TItem[] = [];
  let cursor: string | undefined;

  do {
    const page = await loyverseGetPage(path, collectionKey, branchId, {
      ...options,
      cursor,
    });

    items.push(...page.items);
    cursor = page.nextCursor ?? undefined;
  } while (cursor);

  return items;
}
