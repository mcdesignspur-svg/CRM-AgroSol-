import { getLoyverseAccessToken, LOYVERSE_API_BASE } from "./config";

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
    const data = (await res.json()) as { message?: string; error?: string };
    return data.message ?? data.error ?? res.statusText;
  } catch {
    return res.statusText || "Error desconocido";
  }
}

export async function loyverseRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const token = getLoyverseAccessToken();
  if (!token) {
    throw new LoyverseApiError(401, "LOYVERSE_ACCESS_TOKEN no configurado");
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

export async function loyverseGetAllPages<TKey extends string, TItem>(
  path: string,
  collectionKey: TKey,
  limit = 250,
): Promise<TItem[]> {
  const items: TItem[] = [];
  let cursor: string | undefined;

  do {
    const params = new URLSearchParams({ limit: String(limit) });
    if (cursor) {
      params.set("cursor", cursor);
    }

    const page = await loyverseRequest<
      Record<TKey, TItem[]> & { cursor?: string | null }
    >(`${path}?${params.toString()}`);

    items.push(...(page[collectionKey] ?? []));
    cursor = page.cursor ?? undefined;
  } while (cursor);

  return items;
}
