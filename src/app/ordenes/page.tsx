import { getCatalogProducts, getOrdersCount, getRecentOrders } from "@/lib/db";
import { OrdenesContent } from "@/components/ordenes/OrdenesContent";

export const dynamic = "force-dynamic";

interface OrdenesPageProps {
  searchParams: Promise<{ q?: string; tab?: string }>;
}

export default async function OrdenesPage({ searchParams }: OrdenesPageProps) {
  const { q, tab } = await searchParams;
  const filters = q ? { q } : {};

  const [orders, total, catalogProducts] = await Promise.all([
    tab === "nueva" ? Promise.resolve([]) : getRecentOrders(20, 0, filters),
    tab === "nueva" ? Promise.resolve(0) : getOrdersCount(filters),
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
