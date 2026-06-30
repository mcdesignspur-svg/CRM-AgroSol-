import { execSync } from "node:child_process";

// Las migraciones no se ejecutan durante el build de Vercel: Neon pooled
// connections no soportan advisory locks (Prisma P1002). Se aplican en el
// workflow de GitHub Actions con DIRECT_DATABASE_URL antes del deploy.
execSync("npm run build", { stdio: "inherit" });
