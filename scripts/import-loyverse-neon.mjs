/**
 * Importa el catálogo Loyverse a Neon (producción) en páginas pequeñas.
 * Usa la API desplegada en Vercel, donde DATABASE_URL de Neon está disponible.
 *
 * Uso:
 *   node scripts/import-loyverse-neon.mjs
 *   PRODUCTION_URL=https://crm-agro-sola.vercel.app node scripts/import-loyverse-neon.mjs
 */

const PRODUCTION_URL =
  process.env.PRODUCTION_URL?.replace(/\/$/, "") ||
  "https://crm-agro-sola.vercel.app";

const BRANCH_ID = "gurabo";
const PAGE_SIZE = 100;

async function syncPage(cursor) {
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
}

async function main() {
  console.log(`Importando Loyverse → Neon vía ${PRODUCTION_URL}`);
  const started = Date.now();
  let cursor = null;
  let page = 0;
  let totals = { created: 0, updated: 0, rows: 0 };

  do {
    page += 1;
    const result = await syncPage(cursor);

    totals.created += result.created ?? 0;
    totals.updated += result.updated ?? 0;
    totals.rows += result.pageItems ?? result.total ?? 0;

    console.log(
      `Página ${page}: +${result.created} creados, ~${result.updated} actualizados` +
        (result.hasMore ? " (continúa…)" : " (fin)"),
    );

    cursor = result.nextCursor ?? null;
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
