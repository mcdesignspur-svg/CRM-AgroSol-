"use client";

import { CriticalAlertsLink } from "@/components/dashboard/DashboardOrdersSection";
import { useDashboardLive } from "@/components/dashboard/DashboardLiveProvider";
import { MetricCard } from "@/components/ui/MetricCard";

export function DashboardMetricsGrid() {
  const { metrics } = useDashboardLive();

  return (
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
            <span className="text-gray-500">Sin datos</span>
          )
        }
      />
      <MetricCard
        label="Entregas Pendientes"
        value={metrics.pendingDeliveries}
        icon="local_shipping"
        subtitle={<span className="text-gray-500">En tránsito</span>}
      />
      <MetricCard
        label="Pickups Activos"
        value={metrics.activePickups}
        icon="hail"
        subtitle={
          metrics.activePickupsLocation ? (
            <span className="text-secondary">{metrics.activePickupsLocation}</span>
          ) : (
            <span className="text-gray-500">Sin pickups</span>
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
            <span className="text-primary text-xs">Sin alertas</span>
          )
        }
      />
    </div>
  );
}
