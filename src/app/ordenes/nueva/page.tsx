import { getCatalogProducts } from "@/lib/db";
import NuevaOrdenClient from "./NuevaOrdenClient";

export const metadata = {
  title: "Nueva Orden",
};

export const dynamic = "force-dynamic";

export default async function NuevaOrdenPage() {
  const catalogProducts = await getCatalogProducts();

  return <NuevaOrdenClient catalogProducts={catalogProducts} />;
}
