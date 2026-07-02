import { syncLoyverseProducts } from "../src/lib/loyverse/products";

async function main() {
  console.log("Iniciando importación Loyverse para Gurabo...");
  const started = Date.now();

  const result = await syncLoyverseProducts({
    branchId: "gurabo",
    mode: "full",
  });

  const elapsedSec = ((Date.now() - started) / 1000).toFixed(1);

  console.log(
    JSON.stringify(
      {
        ...result,
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
