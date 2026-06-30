import {
  getActiveDeliveries,
  getBranches,
  getCompletedDeliveriesCount,
  getNotificationLogs,
} from "@/lib/db";
import { EntregasPageContent } from "@/components/entregas/EntregasContent";

export const metadata = {
  title: "Entregas y Sucursales",
};

export const dynamic = "force-dynamic";

export default async function EntregasPage() {
  const [branches, deliveries, logs, completedCount] = await Promise.all([
    getBranches(),
    getActiveDeliveries(),
    getNotificationLogs(),
    getCompletedDeliveriesCount(),
  ]);

  return (
    <EntregasPageContent
      initialBranches={branches}
      initialDeliveries={deliveries}
      initialLogs={logs}
      completedCount={completedCount}
    />
  );
}
