import { getLoyverseStatus } from "@/lib/loyverse";
import { listAllProductsGroupedByCategory, listProductCategories } from "@/lib/db";
import { ProductosContent } from "@/components/productos/ProductosContent";

export const metadata = {
  title: "Productos",
};

export const dynamic = "force-dynamic";

export default async function ProductosPage() {
  const [loyverseStatus, categories, groupedCatalog] = await Promise.all([
    getLoyverseStatus("gurabo"),
    listProductCategories("gurabo"),
    listAllProductsGroupedByCategory("gurabo"),
  ]);

  return (
    <ProductosContent
      loyverseStatus={loyverseStatus}
      categories={categories}
      groupedCatalog={groupedCatalog}
    />
  );
}
