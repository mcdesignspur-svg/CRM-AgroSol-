import { execSync } from "node:child_process";
import { loadVercelProductionEnv } from "./load-vercel-env.mjs";

const { loaded, path } = loadVercelProductionEnv();
if (loaded > 0) {
  console.log(`Loaded ${loaded} env var(s) from ${path}`);
}

const isProduction = process.env.VERCEL_ENV === "production";
const gitRef = process.env.VERCEL_GIT_COMMIT_REF;
const isMainBranch = !gitRef || gitRef === "main";

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
const shouldRunMigrations = isProduction && isMainBranch;

if (shouldRunMigrations) {
  if (!migrationUrl) {
    console.error(
      "FATAL: DATABASE_URL (or DIRECT_DATABASE_URL) is required for production builds.\n" +
        "Set DATABASE_URL (pooled) and DIRECT_DATABASE_URL (direct, no '-pooler') in:\n" +
        "  1) Vercel → Project → Settings → Environment Variables → Production, or\n" +
        "  2) GitHub → Repository → Settings → Secrets\n" +
        "Then re-run the Production Deploy workflow.",
    );
    process.exit(1);
  }

  if (
    process.env.DATABASE_URL?.includes("-pooler") &&
    !process.env.DIRECT_DATABASE_URL
  ) {
    console.warn(
      "Using derived direct URL for migrations. Prefer setting DIRECT_DATABASE_URL explicitly in Vercel Production.",
    );
  }

  console.log("Running prisma migrate deploy...");
  const migrateEnv = { ...process.env, DATABASE_URL: migrationUrl };
  let migrated = false;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      execSync("npx prisma migrate deploy", {
        stdio: "inherit",
        env: migrateEnv,
      });
      migrated = true;
      break;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("P1002")) {
        try {
          const status = execSync("npx prisma migrate status", {
            encoding: "utf8",
            env: migrateEnv,
          });
          if (status.includes("Database schema is up to date")) {
            console.warn(
              "migrate deploy timed out (P1002) but schema is up to date; continuing.",
            );
            migrated = true;
            break;
          }
        } catch {
          // fall through to retry / throw
        }
      }
      if (attempt < 3 && message.includes("P1002")) {
        console.warn(
          `migrate deploy timeout (intento ${attempt}/3), reintentando en 5s...`,
        );
        execSync("sleep 5");
        continue;
      }
      throw error;
    }
  }
  if (!migrated) {
    throw new Error("prisma migrate deploy failed after retries");
  }
} else {
  const reasons = [];
  if (!isProduction) {
    reasons.push(`VERCEL_ENV=${process.env.VERCEL_ENV ?? "unset"}`);
  }
  if (!isMainBranch) {
    reasons.push(`branch=${gitRef}`);
  }
  console.log(
    `Skipping prisma migrate deploy (${reasons.join(", ")}). ` +
      "Only main production builds mutate the shared database schema.",
  );
}

execSync("npm run build", { stdio: "inherit" });
