/**
 * Importa el catálogo Loyverse a Neon (producción) en páginas pequeñas.
 * Usa la API desplegada en Vercel, donde DATABASE_URL de Neon está disponible.
 *
 * Uso:
 *   node scripts/import-loyverse-neon.mjs
 *   PRODUCTION_URL=https://crm-agro-sola.vercel.app node scripts/import-loyverse-neon.mjs
 *   RESUME=1 node scripts/import-loyverse-neon.mjs
 */

import fs from "node:fs";

const PRODUCTION_URL =
  process.env.PRODUCTION_URL?.replace(/\/$/, "") ||
  "https://crm-agro-sola.vercel.app";

const BRANCH_ID = "gurabo";
const PAGE_SIZE = Number(process.env.PAGE_SIZE ?? "250");
const CHECKPOINT_FILE =
  process.env.CHECKPOINT_FILE ?? "/tmp/loyverse-import.checkpoint.json";
const RESUME = process.env.RESUME === "1";
const MAX_RETRIES = 5;

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function syncPage(cursor) {
  let lastError;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const res = await fetch(
        `${PRODUCTION_URL}/api/integrations/loyverse/sync-products`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            branchId: BRANCH_ID,
            mode: "full",
            singlePage: true,
            pageSize: PAGE_SIZE,
            cursor: cursor ?? null,
          }),
        },
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      return data;
    } catch (error) {
      lastError = error;
      const delayMs = Math.min(4000 * 2 ** (attempt - 1), 32000);
      console.warn(
        `Reintento ${attempt}/${MAX_RETRIES} tras error: ${
          error instanceof Error ? error.message : error
        }`,
      );
      if (attempt < MAX_RETRIES) {
        await sleep(delayMs);
      }
    }
  }

  throw lastError;
}

function loadCheckpoint() {
  if (!RESUME) return null;

  try {
    return JSON.parse(fs.readFileSync(CHECKPOINT_FILE, "utf8"));
  } catch {
    return null;
  }
}

function saveCheckpoint(state) {
  fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(state, null, 2));
}

function clearCheckpoint() {
  try {
    fs.unlinkSync(CHECKPOINT_FILE);
  } catch {
    // ignore
  }
}

async function main() {
  console.log(`Importando Loyverse → Neon vía ${PRODUCTION_URL}`);
  const started = Date.now();

  const checkpoint = loadCheckpoint();
  let cursor = checkpoint?.nextCursor ?? null;
  let page = checkpoint?.page ?? 0;
  let totals = checkpoint?.totals ?? {
    created: 0,
    updated: 0,
    rows: 0,
    categoriesSynced: 0,
  };

  if (checkpoint) {
    console.log(
      `Reanudando desde página ${page + 1} (cursor guardado)`,
    );
  }

  do {
    page += 1;
    const result = await syncPage(cursor);

    totals.created += result.created ?? 0;
    totals.updated += result.updated ?? 0;
    totals.rows += result.pageItems ?? result.total ?? 0;
    if (result.categoriesSynced) {
      totals.categoriesSynced = result.categoriesSynced;
    }

    cursor = result.nextCursor ?? null;

    console.log(
      `Página ${page}: +${result.created} creados, ~${result.updated} actualizados` +
        (result.categoriesSynced
          ? `, ${result.categoriesSynced} categorías`
          : "") +
        (result.hasMore ? " (continúa…)" : " (fin)"),
    );

    if (result.hasMore && cursor) {
      saveCheckpoint({ page, nextCursor: cursor, totals });
    } else {
      clearCheckpoint();
    }

    if (!result.hasMore) break;
  } while (cursor);

  const elapsedSec = ((Date.now() - started) / 1000).toFixed(1);
  console.log(
    JSON.stringify(
      {
        ok: true,
        pages: page,
        ...totals,
        elapsedSeconds: Number(elapsedSec),
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
