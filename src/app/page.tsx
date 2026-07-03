import { AppShell } from "@/components/layout/AppShell";
import { TopBar } from "@/components/layout/TopBar";
import { DashboardOrdersSection } from "@/components/dashboard/DashboardOrdersSection";
import {
  DashboardHeader,
  LivePingsPanel,
} from "@/components/dashboard/DashboardPanels";
import { DashboardLiveProvider } from "@/components/dashboard/DashboardLiveProvider";
import { DashboardMetricsGrid } from "@/components/dashboard/DashboardMetricsGrid";
import {
  getDashboardMetrics,
  getLivePings,
  getNotificationLogs,
  getOrdersCount,
  getRecentOrders,
  getBranches,
} from "@/lib/db";

export const metadata = {
  title: "Panel",
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [metrics, pings, notifications, orders, ordersTotal, branches] =
    await Promise.all([
      getDashboardMetrics(),
      getLivePings(),
      getNotificationLogs(20),
      getRecentOrders(20, 0),
      getOrdersCount(),
      getBranches(),
    ]);

  return (
    <DashboardLiveProvider
      initialPings={pings}
      initialNotifications={notifications}
      initialMetrics={metrics}
      initialOrders={orders}
      initialOrdersTotal={ordersTotal}
    >
      <AppShell
        topBar={<TopBar />}
        rightPanel={
          <div data-pings-panel>
            <LivePingsPanel branches={branches} />
          </div>
        }
      >
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 md:space-y-8 pb-10">
          <DashboardHeader />

          <DashboardMetricsGrid />

          <DashboardOrdersSection
            initialOrders={orders}
            initialTotal={ordersTotal}
          />
        </div>
      </AppShell>
    </DashboardLiveProvider>
  );
}
