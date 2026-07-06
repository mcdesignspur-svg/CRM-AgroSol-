import { getLoyverseStatus } from "@/lib/loyverse";
import { listProductCategories } from "@/lib/db";
import { InventarioContent } from "@/components/inventario/InventarioContent";

export const metadata = {
  title: "Inventario",
};

export const dynamic = "force-dynamic";

export default async function InventarioPage() {
  const [loyverseStatus, categories] = await Promise.all([
    getLoyverseStatus("gurabo"),
    listProductCategories("gurabo"),
  ]);

  return (
    <InventarioContent
      loyverseStatus={loyverseStatus}
      categories={categories}
    />
  );
}
