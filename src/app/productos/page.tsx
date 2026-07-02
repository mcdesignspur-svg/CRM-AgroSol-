import { getLoyverseStatus } from "@/lib/loyverse";
import { listProductCategories } from "@/lib/db";
import { ProductosContent } from "@/components/productos/ProductosContent";

export const metadata = {
  title: "Productos",
};

export const dynamic = "force-dynamic";

export default async function ProductosPage() {
  const [loyverseStatus, categories] = await Promise.all([
    getLoyverseStatus("gurabo"),
    listProductCategories("gurabo"),
  ]);

  return (
    <ProductosContent
      loyverseStatus={loyverseStatus}
      categories={categories}
    />
  );
}
