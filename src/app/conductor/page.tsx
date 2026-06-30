import { ConductorContent } from "@/components/conductor/ConductorContent";
import { getActiveDeliveryOrders, getOrdersCount } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ConductorPage() {
  const [orders, total] = await Promise.all([
    getActiveDeliveryOrders(50, 0),
    getOrdersCount({ activeDelivery: true }),
  ]);

  return <ConductorContent initialOrders={orders} initialTotal={total} />;
}
