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
import { dashboardMetrics, livePings } from "@/lib/data";

export default function DashboardPage() {
  return (
    <PingsSheetProvider initialPings={livePings}>
      <AppShell
        topBar={<TopBar />}
        rightPanel={
          <div data-pings-panel>
            <LivePingsPanel initialPings={livePings} />
          </div>
        }
      >
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 md:space-y-8 pb-10">
          <DashboardHeader />

          <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
            <MetricCard
              label="Órdenes Totales"
              value={dashboardMetrics.totalOrders.toLocaleString("es-PR")}
              icon="inventory"
              subtitle={
                dashboardMetrics.totalOrdersChange ? (
                  <span className="text-green-600 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">
                      trending_up
                    </span>
                    {dashboardMetrics.totalOrdersChange}
                  </span>
                ) : (
                  <span className="text-gray-500 uppercase">Sin datos</span>
                )
              }
            />
            <MetricCard
              label="Entregas Pendientes"
              value={dashboardMetrics.pendingDeliveries}
              icon="local_shipping"
              subtitle={
                <span className="text-gray-500 uppercase">En Tránsito</span>
              }
            />
            <MetricCard
              label="Retiros Activos"
              value={dashboardMetrics.activePickups}
              icon="hail"
              subtitle={
                dashboardMetrics.activePickupsLocation ? (
                  <span className="text-secondary uppercase">
                    {dashboardMetrics.activePickupsLocation}
                  </span>
                ) : (
                  <span className="text-gray-500 uppercase">Sin retiros</span>
                )
              }
            />
            <MetricCard
              label="Alertas del Sistema"
              value={String(dashboardMetrics.systemAlerts).padStart(2, "0")}
              icon="warning"
              variant="alert"
              subtitle={
                dashboardMetrics.systemAlerts > 0 ? (
                  <CriticalAlertsLink />
                ) : (
                  <span className="text-white opacity-90 uppercase">
                    Sin alertas
                  </span>
                )
              }
            />
          </div>

          <DashboardOrdersSection />
        </div>
      </AppShell>
    </PingsSheetProvider>
  );
}
