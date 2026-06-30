import { prisma } from "@/lib/prisma";
import { mapProduct } from "./mappers";

export async function getCatalogProducts() {
  const rows = await prisma.product.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });
  return rows.map(mapProduct);
}
