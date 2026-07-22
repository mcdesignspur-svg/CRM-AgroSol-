import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Loads variables from `.vercel/.env.production.local` created by `vercel pull`.
 * GitHub Actions runs `vercel build` on the runner; those vars are not always
 * injected into `buildCommand` unless we load the file explicitly.
 */
export function loadVercelProductionEnv(cwd = process.cwd()) {
  const envPath = resolve(cwd, ".vercel/.env.production.local");
  if (!existsSync(envPath)) {
    return { loaded: 0, path: envPath };
  }

  let loaded = 0;
  const content = readFileSync(envPath, "utf8");

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (process.env[key] === undefined) {
      process.env[key] = value;
      loaded += 1;
    }
  }

  return { loaded, path: envPath };
}
