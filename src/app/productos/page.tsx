import { getLoyverseStatus } from "@/lib/loyverse";
import { ProductosContent } from "@/components/productos/ProductosContent";

export const metadata = {
  title: "Productos",
};

export const dynamic = "force-dynamic";

export default async function ProductosPage() {
  const loyverseStatus = await getLoyverseStatus("gurabo");

  return <ProductosContent loyverseStatus={loyverseStatus} />;
}
