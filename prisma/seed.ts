import { PrismaClient } from "@prisma/client";
import { BRANCH_DEFINITIONS } from "../src/lib/branch-definitions";
import { formatDeliveryEta } from "../src/lib/db/deliveries";

const prisma = new PrismaClient();

const SAMPLE_DELIVERIES = [
  {
    displayId: "TRK-8921",
    driverName: "Juan Rodriguez",
    driverInitials: "JR",
    destination: "Finca Santa Maria, SE",
    status: "recogida" as const,
    branchId: "gurabo",
    hoursAgo: 1,
  },
  {
    displayId: "TRK-7740",
    driverName: "Miguel Angel",
    driverInitials: "MA",
    destination: "Centro Logístico Sur",
    status: "recogida" as const,
    branchId: "san-lorenzo",
    hoursAgo: 0.5,
  },
  {
    displayId: "TRK-1055",
    driverName: "Carlos Mendez",
    driverInitials: "CM",
    destination: "Rancho Las Palmas",
    status: "recogida" as const,
    branchId: "navarro",
    hoursAgo: 2,
  },
  {
    displayId: "TRK-4422",
    driverName: "Sofia Garcia",
    driverInitials: "SG",
    destination: "Bodega Central",
    status: "entrega" as const,
    branchId: "gurabo",
    hoursAgo: 6,
  },
];

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
        capacityPercent: branch.id === "gurabo" ? 88 : branch.id === "san-lorenzo" ? 42 : 65,
        currentVolume: branch.id === "gurabo" ? 142 : branch.id === "san-lorenzo" ? 68 : 95,
        status: "online",
      },
    });
  }

  console.log(`✓ ${BRANCH_DEFINITIONS.length} sucursales listas`);

  console.log("Sembrando entregas de ejemplo...");

  for (const sample of SAMPLE_DELIVERIES) {
    const createdAt = new Date(Date.now() - sample.hoursAgo * 3_600_000);

    await prisma.delivery.upsert({
      where: { displayId: sample.displayId },
      update: {
        driverName: sample.driverName,
        driverInitials: sample.driverInitials,
        destination: sample.destination,
        status: sample.status,
        branchId: sample.branchId,
        eta:
          sample.status === "entrega"
            ? "Completada"
            : formatDeliveryEta(createdAt),
        createdAt,
      },
      create: {
        displayId: sample.displayId,
        driverName: sample.driverName,
        driverInitials: sample.driverInitials,
        destination: sample.destination,
        status: sample.status,
        branchId: sample.branchId,
        eta:
          sample.status === "entrega"
            ? "Completada"
            : formatDeliveryEta(createdAt),
        createdAt,
      },
    });
  }

  console.log(`✓ ${SAMPLE_DELIVERIES.length} entregas listas`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
