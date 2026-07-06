import { execSync } from "node:child_process";
import { loadVercelProductionEnv } from "./load-vercel-env.mjs";

const { loaded, path } = loadVercelProductionEnv();
if (loaded > 0) {
  console.log(`Loaded ${loaded} env var(s) from ${path}`);
}

/** Neon pooled URLs include `-pooler` in the host; Prisma Migrate needs a direct connection (P1002 otherwise). */
function resolveDirectDatabaseUrl() {
  const explicit =
    process.env.DIRECT_DATABASE_URL?.trim() ||
    process.env.DATABASE_URL_UNPOOLED?.trim() ||
    process.env.POSTGRES_URL_NON_POOLING?.trim();

  if (explicit) {
    return explicit;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return null;
  }

  if (databaseUrl.includes("-pooler")) {
    const derived = databaseUrl.replace("-pooler", "");
    console.warn(
      "DIRECT_DATABASE_URL is not set; derived a direct Neon URL from DATABASE_URL " +
        "by removing '-pooler' from the host.",
    );
    return derived;
  }

  return databaseUrl;
}

const migrationUrl = resolveDirectDatabaseUrl();
const isVercel = Boolean(process.env.VERCEL);
const shouldRunMigrations = isVercel && Boolean(migrationUrl);

if (shouldRunMigrations) {
  if (
    process.env.DATABASE_URL?.includes("-pooler") &&
    !process.env.DIRECT_DATABASE_URL
  ) {
    console.warn(
      "Using derived direct URL for migrations. Prefer setting DIRECT_DATABASE_URL explicitly in Vercel Production.",
    );
  }

  const envLabel = process.env.VERCEL_ENV ?? "unknown";
  const branch = process.env.VERCEL_GIT_COMMIT_REF ?? "unknown";
  console.log(
    `Running prisma migrate deploy (env=${envLabel}, branch=${branch})...`,
  );
  const migrateEnv = { ...process.env, DATABASE_URL: migrationUrl };
  try {
    execSync("npx prisma migrate deploy", {
      stdio: "inherit",
      env: migrateEnv,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(
      "migrate deploy failed; continuing build (schema may already be up to date):",
      message,
    );
  }
} else {
  const reasons = [];
  if (!isVercel) {
    reasons.push("not on Vercel");
  }
  if (!migrationUrl) {
    reasons.push("no database URL");
  }
  console.log(`Skipping prisma migrate deploy (${reasons.join(", ")}).`);
}

execSync("npm run build", { stdio: "inherit" });
