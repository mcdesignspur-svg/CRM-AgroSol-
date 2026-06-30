import { execSync } from "node:child_process";

if (process.env.DATABASE_URL) {
  console.log("Running prisma migrate deploy...");
  execSync("npx prisma migrate deploy", { stdio: "inherit" });
} else {
  console.warn(
    "Skipping prisma migrate deploy: DATABASE_URL is not set in the build environment.",
  );
}

execSync("npm run build", { stdio: "inherit" });
