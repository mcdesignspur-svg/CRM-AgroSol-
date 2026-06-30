import { getCatalogProducts, getOrdersCount, getRecentOrders } from "@/lib/db";
import { OrdenesContent } from "@/components/ordenes/OrdenesContent";

export const dynamic = "force-dynamic";

interface OrdenesPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function OrdenesPage({ searchParams }: OrdenesPageProps) {
  const { q } = await searchParams;
  const filters = q ? { q } : {};

  const [orders, total, catalogProducts] = await Promise.all([
    getRecentOrders(20, 0, filters),
    getOrdersCount(filters),
    getCatalogProducts(),
  ]);

  return (
    <OrdenesContent
      initialOrders={orders}
      initialTotal={total}
      initialSearch={q ?? ""}
      catalogProducts={catalogProducts}
    />
  );
}
