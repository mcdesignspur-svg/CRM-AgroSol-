import { getRecentOrders, getOrdersCount } from "@/lib/db";
import { OrdenesContent } from "@/components/ordenes/OrdenesContent";

export const metadata = {
  title: "Órdenes",
};

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
    <OrdenesContent
      key={q ?? ""}
      initialOrders={orders}
      initialTotal={total}
      initialSearch={q ?? ""}
    />
  );
}
