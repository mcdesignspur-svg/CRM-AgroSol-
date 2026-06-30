import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const branches = [
  {
    id: "gurabo",
    name: "Gurabo (Central)",
    address: "Av. Agrícola 450",
  },
  {
    id: "san-lorenzo",
    name: "San Lorenzo",
    address: "Km 12 Carretera Federal",
  },
  {
    id: "navarro",
    name: "Ferretería Navarro",
    address: "Zona Industrial Lote 9",
  },
] as const;

async function main() {
  console.log("Sembrando sucursales...");

  for (const branch of branches) {
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

  console.log(`✓ ${branches.length} sucursales listas`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
