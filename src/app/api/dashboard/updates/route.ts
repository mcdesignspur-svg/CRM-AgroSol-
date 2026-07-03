import { NextResponse } from "next/server";
import {
  getDashboardMetrics,
  getLivePings,
  getNotificationLogs,
  getOrdersCount,
  getRecentOrders,
} from "@/lib/db";
import type { DashboardUpdates } from "@/lib/types";

export async function GET() {
  try {
    const [pings, notifications, metrics, orders, ordersTotal] =
      await Promise.all([
        getLivePings(),
        getNotificationLogs(20),
        getDashboardMetrics(),
        getRecentOrders(20, 0),
        getOrdersCount(),
      ]);

    const payload: DashboardUpdates = {
      pings,
      notifications,
      metrics,
      orders,
      ordersTotal,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error("GET /api/dashboard/updates", error);
    return NextResponse.json(
      { error: "Error al obtener actualizaciones del panel" },
      { status: 500 },
    );
  }
}
