import { getOrdersCount, getRecentOrders } from "@/lib/db";
import { OrdenesListContent } from "@/components/ordenes/OrdenesListContent";

export const dynamic = "force-dynamic";

interface OrdenesPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function OrdenesPage({ searchParams }: OrdenesPageProps) {
  const { q } = await searchParams;
  const filters = q ? { q } : {};

  const [orders, total] = await Promise.all([
    getRecentOrders(20, 0, filters),
    getOrdersCount(filters),
  ]);

  return (
    <OrdenesListContent
      initialOrders={orders}
      initialTotal={total}
      initialSearch={q ?? ""}
    />
  );
}
