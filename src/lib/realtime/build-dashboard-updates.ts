import {
  getDashboardMetrics,
  getLivePings,
  getNotificationLogs,
  getOrdersCount,
  getRecentOrders,
} from "@/lib/db";
import type { DashboardUpdates } from "@/lib/types";

export async function buildDashboardUpdates(): Promise<DashboardUpdates> {
  const [pings, notifications, metrics, orders, ordersTotal] =
    await Promise.all([
      getLivePings(),
      getNotificationLogs(20),
      getDashboardMetrics(),
      getRecentOrders(20, 0),
      getOrdersCount(),
    ]);

  return {
    pings,
    notifications,
    metrics,
    orders,
    ordersTotal,
    updatedAt: new Date().toISOString(),
  };
}
