import { execSync } from "node:child_process";
import { loadVercelProductionEnv } from "./load-vercel-env.mjs";

const { loaded, path } = loadVercelProductionEnv();
if (loaded > 0) {
  console.log(`Loaded ${loaded} env var(s) from ${path}`);
}

const isProduction = process.env.VERCEL_ENV === "production";

// Las migraciones deben ir por la conexión directa (sin pooler): PgBouncer/Neon
// pooler no soporta los advisory locks que usa prisma migrate (error P1002).
const migrationUrl =
  process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;

if (isProduction) {
  if (!migrationUrl) {
    console.error(
      "FATAL: DATABASE_URL is required for production builds.\n" +
        "Set DATABASE_URL (and ideally DIRECT_DATABASE_URL) in:\n" +
        "  1) Vercel → Project → Settings → Environment Variables → Production, or\n" +
        "  2) GitHub → Repository → Settings → Secrets → DATABASE_URL\n" +
        "Then re-run the Production Deploy workflow.",
    );
    process.exit(1);
  }

  if (!process.env.DIRECT_DATABASE_URL) {
    console.warn(
      "DIRECT_DATABASE_URL is not set; running migrations over DATABASE_URL. " +
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
