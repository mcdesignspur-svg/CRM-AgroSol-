import { prisma } from "@/lib/prisma";
import type { DashboardMetrics } from "@/lib/types";
import { buildOrderWhere } from "./orders";
import { getSystemAlertsCount } from "./pings";

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const pickupActiveWhere = {
    OR: [
      buildOrderWhere({ status: "pendiente", fulfillment: "pickup" }),
      { status: "listo" as const, fulfillment: "pickup" },
    ],
  };

  const [
    totalOrders,
    pendingDeliveries,
    activePickups,
    systemAlerts,
    lastMonthOrders,
    pickupBranch,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({
      where: buildOrderWhere({ status: "en-transito" }),
    }),
    prisma.order.count({ where: pickupActiveWhere }),
    getSystemAlertsCount(),
    prisma.order.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    }),
    prisma.order.findFirst({
      where: pickupActiveWhere,
      orderBy: { createdAt: "desc" },
      include: { branch: true },
    }),
  ]);

  const prevMonthStart = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
  const prevMonthEnd = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const previousMonthOrders = await prisma.order.count({
    where: { createdAt: { gte: prevMonthStart, lt: prevMonthEnd } },
  });

  let totalOrdersChange = "";
  if (previousMonthOrders > 0) {
    const pct = Math.round(
      ((lastMonthOrders - previousMonthOrders) / previousMonthOrders) * 100,
    );
    totalOrdersChange = `${pct >= 0 ? "+" : ""}${pct}% vs mes ant.`;
  }

  return {
    totalOrders,
    totalOrdersChange,
    pendingDeliveries,
    activePickups,
    activePickupsLocation: pickupBranch?.branch.name ?? "",
    systemAlerts,
  };
}
