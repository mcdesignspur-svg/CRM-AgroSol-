import { getCatalogProducts } from "@/lib/db";
import { getLoyverseStatus } from "@/lib/loyverse";
import { ProductosContent } from "@/components/productos/ProductosContent";

export const metadata = {
  title: "Productos",
};

export const dynamic = "force-dynamic";

export default async function ProductosPage() {
  const [products, loyverseStatus] = await Promise.all([
    getCatalogProducts(),
    getLoyverseStatus(),
  ]);

  return (
    <ProductosContent
      initialProducts={products}
      loyverseStatus={loyverseStatus}
    />
  );
}
