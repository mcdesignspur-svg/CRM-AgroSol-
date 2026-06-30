import { getCatalogProducts } from "@/lib/db";
import { NuevaOrdenForm } from "@/components/ordenes/NuevaOrdenForm";

export const dynamic = "force-dynamic";

export default async function NuevaOrdenPage() {
  const catalogProducts = await getCatalogProducts();

  return <NuevaOrdenForm catalogProducts={catalogProducts} />;
}
