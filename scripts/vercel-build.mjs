import { execSync } from "node:child_process";

const isProduction = process.env.VERCEL_ENV === "production";

// Las migraciones deben ir por la conexión directa (sin pooler): PgBouncer/Neon
// pooler no soporta los advisory locks que usa prisma migrate (error P1002).
// La integración de Neon en Vercel expone DATABASE_URL_UNPOOLED automáticamente.
const migrationUrl =
  process.env.DIRECT_DATABASE_URL ||
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL;

const hasDirectUrl =
  Boolean(process.env.DIRECT_DATABASE_URL) ||
  Boolean(process.env.DATABASE_URL_UNPOOLED) ||
  Boolean(process.env.POSTGRES_URL_NON_POOLING);

if (isProduction) {
  if (!migrationUrl) {
    console.error(
      "FATAL: DATABASE_URL is required for production builds. " +
        "Set DATABASE_URL (and ideally DIRECT_DATABASE_URL for migrations) " +
        "in the Vercel Production environment before deploying.",
    );
    process.exit(1);
  }

  if (!hasDirectUrl) {
    console.warn(
      "No direct (non-pooled) database URL found; running migrations over DATABASE_URL. " +
        "If DATABASE_URL points to a pooled connection (e.g. Neon '-pooler'), " +
        "migrations may fail with advisory lock timeouts (P1002).",
    );
  }

  console.log("Running prisma migrate deploy...");
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: migrationUrl },
  });
} else {
  console.log(
    `Skipping prisma migrate deploy: not a production build (VERCEL_ENV=${process.env.VERCEL_ENV ?? "unset"}). ` +
      "Preview builds must not mutate the shared database schema.",
  );
}

execSync("npm run build", { stdio: "inherit" });
