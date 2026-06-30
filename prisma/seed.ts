import { PrismaClient } from "@prisma/client";
import { BRANCH_DEFINITIONS } from "../src/lib/branch-definitions";

const prisma = new PrismaClient();

async function main() {
  console.log("Sembrando sucursales...");

  for (const branch of BRANCH_DEFINITIONS) {
    await prisma.branch.upsert({
      where: { id: branch.id },
      update: {
        name: branch.name,
        address: branch.address,
      },
      create: {
        id: branch.id,
        name: branch.name,
        address: branch.address,
        capacityPercent: 0,
        currentVolume: 0,
        status: "online",
      },
    });
  }

  console.log(`✓ ${BRANCH_DEFINITIONS.length} sucursales listas`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
