import { getCatalogProducts } from "@/lib/db";
import { ProductosContent } from "@/components/productos/ProductosContent";

export const metadata = {
  title: "Catálogo de Productos",
};

export const dynamic = "force-dynamic";

export default async function ProductosPage() {
  const products = await getCatalogProducts();

  return <ProductosContent initialProducts={products} />;
}
