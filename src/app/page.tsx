import { AppShell } from "@/components/layout/AppShell";
import { TopBar } from "@/components/layout/TopBar";
import {
  CriticalAlertsLink,
  DashboardOrdersSection,
} from "@/components/dashboard/DashboardOrdersSection";
import {
  DashboardHeader,
  LivePingsPanel,
} from "@/components/dashboard/DashboardPanels";
import { PingsSheetProvider } from "@/components/dashboard/PingsSheetProvider";
import { MetricCard } from "@/components/ui/MetricCard";
import {
  getDashboardMetrics,
  getLivePings,
  getOrdersCount,
  getRecentOrders,
  getBranches,
} from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [metrics, pings, orders, ordersTotal, branches] = await Promise.all([
    getDashboardMetrics(),
    getLivePings(),
    getRecentOrders(20, 0),
    getOrdersCount(),
    getBranches(),
  ]);

  return (
    <PingsSheetProvider initialPings={pings}>
      <AppShell
        topBar={<TopBar />}
        rightPanel={
          <div data-pings-panel>
            <LivePingsPanel initialPings={pings} branches={branches} />
          </div>
        }
      >
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 md:space-y-8 pb-10">
          <DashboardHeader />

          <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
            <MetricCard
              label="Órdenes Totales"
              value={metrics.totalOrders.toLocaleString("es-PR")}
              icon="inventory"
              subtitle={
                metrics.totalOrdersChange ? (
                  <span className="text-green-600 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">
                      trending_up
                    </span>
                    {metrics.totalOrdersChange}
                  </span>
                ) : (
                  <span className="text-gray-500 uppercase">Sin datos</span>
                )
              }
            />
            <MetricCard
              label="Entregas Pendientes"
              value={metrics.pendingDeliveries}
              icon="local_shipping"
              subtitle={
                <span className="text-gray-500 uppercase">En Tránsito</span>
              }
            />
            <MetricCard
              label="Retiros Activos"
              value={metrics.activePickups}
              icon="hail"
              subtitle={
                metrics.activePickupsLocation ? (
                  <span className="text-secondary uppercase">
                    {metrics.activePickupsLocation}
                  </span>
                ) : (
                  <span className="text-gray-500 uppercase">Sin retiros</span>
                )
              }
            />
            <MetricCard
              label="Alertas del Sistema"
              value={String(metrics.systemAlerts).padStart(2, "0")}
              icon="warning"
              variant="alert"
              subtitle={
                metrics.systemAlerts > 0 ? (
                  <CriticalAlertsLink />
                ) : (
                  <span className="text-white opacity-90 uppercase">
                    Sin alertas
                  </span>
                )
              }
            />
          </div>

          <DashboardOrdersSection
            initialOrders={orders}
            initialTotal={ordersTotal}
          />
        </div>
      </AppShell>
    </PingsSheetProvider>
  );
}
