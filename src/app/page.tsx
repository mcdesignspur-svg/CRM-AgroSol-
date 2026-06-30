import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { TopBar } from "@/components/layout/TopBar";
import {
  DashboardHeader,
  LivePingsPanel,
} from "@/components/dashboard/DashboardPanels";
import { MetricCard } from "@/components/ui/MetricCard";
import {
  BranchLabel,
  StatusBadge,
  TypeBadge,
} from "@/components/ui/badges";
import { dashboardMetrics, livePings, recentOrders } from "@/lib/data";

export default function DashboardPage() {
  return (
    <AppShell
      topBar={<TopBar />}
      rightPanel={<LivePingsPanel pings={livePings} />}
    >
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 pb-10">
        <DashboardHeader />

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <MetricCard
            label="Órdenes Totales"
            value={dashboardMetrics.totalOrders.toLocaleString("es-PR")}
            icon="inventory"
            subtitle={
              <span className="text-green-600 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">
                  trending_up
                </span>
                {dashboardMetrics.totalOrdersChange}
              </span>
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
              <span className="text-secondary uppercase">
                {dashboardMetrics.activePickupsLocation}
              </span>
            }
          />
          <MetricCard
            label="Alertas del Sistema"
            value={String(dashboardMetrics.systemAlerts).padStart(2, "0")}
            icon="warning"
            variant="alert"
            subtitle={
              <span className="text-white opacity-90 uppercase underline cursor-pointer">
                Ver Críticas
              </span>
            }
          />
        </div>

        <section className="industrial-border bg-white overflow-hidden">
          <div className="p-6 industrial-divider flex justify-between items-center">
            <h3 className="font-display text-2xl font-bold uppercase">
              Órdenes Recientes
            </h3>
            <div className="flex gap-2">
              <button
                type="button"
                className="p-2 industrial-border hover:bg-gray-100"
                aria-label="Filtrar"
              >
                <span className="material-symbols-outlined">filter_list</span>
              </button>
              <button
                type="button"
                className="p-2 industrial-border hover:bg-gray-100"
                aria-label="Actualizar"
              >
                <span className="material-symbols-outlined">refresh</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-black text-white">
                <tr>
                  <th className="p-4 text-sm font-bold uppercase">Cliente</th>
                  <th className="p-4 text-sm font-bold uppercase">Tipo</th>
                  <th className="p-4 text-sm font-bold uppercase">Sucursal</th>
                  <th className="p-4 text-sm font-bold uppercase">Estado</th>
                  <th className="p-4 text-sm font-bold uppercase">
                    Tiempo Transcurrido
                  </th>
                  <th className="p-4 text-sm font-bold uppercase">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentOrders.map((order, index) => (
                  <tr
                    key={order.id}
                    className={`hover:bg-surface-container transition-colors ${
                      index % 2 === 1 ? "bg-surface-container-low" : ""
                    }`}
                  >
                    <td className="p-4 font-bold">{order.customerName}</td>
                    <td className="p-4">
                      <TypeBadge type={order.type} />
                    </td>
                    <td className="p-4">
                      <BranchLabel branchId={order.branchId} />
                    </td>
                    <td className="p-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td
                      className={`p-4 font-mono ${
                        order.status === "atrasado" || order.status === "listo"
                          ? "text-red-600 font-bold"
                          : "opacity-80"
                      }`}
                    >
                      {order.elapsedTime}
                    </td>
                    <td className="p-4">
                      <Link
                        href={`/entregas?orden=${order.id}`}
                        className="text-primary hover:underline font-bold text-sm"
                      >
                        GESTIONAR
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-gray-50 flex justify-center">
            <button
              type="button"
              className="text-sm font-bold uppercase tracking-widest hover:text-primary"
            >
              Cargar Más Órdenes
            </button>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
