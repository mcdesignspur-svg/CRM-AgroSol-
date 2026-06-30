import { getCatalogProducts } from "@/lib/db";
import { getLoyverseStatus } from "@/lib/loyverse";
import NuevaOrdenClient from "./NuevaOrdenClient";

export const metadata = {
  title: "Nueva Orden",
};

export const dynamic = "force-dynamic";

export default async function NuevaOrdenPage() {
  const [catalogProducts, loyverseStatus] = await Promise.all([
    getCatalogProducts(),
    getLoyverseStatus(),
  ]);

  return (
    <NuevaOrdenClient
      catalogProducts={catalogProducts}
      loyverseStatus={loyverseStatus}
    />
  );
}
