import type {
  Branch,
  BranchId,
  Delivery,
  NotificationLog,
  Order,
  OrderStatus,
  Ping,
  Product,
} from "@/lib/types";
import type {
  Branch as PrismaBranch,
  Delivery as PrismaDelivery,
  NotificationLog as PrismaNotification,
  Order as PrismaOrder,
  Ping as PrismaPing,
  Product as PrismaProduct,
  OrderStatus as PrismaOrderStatus,
} from "@prisma/client";

const ORDER_STATUS_MAP: Record<PrismaOrderStatus, OrderStatus> = {
  pendiente: "pendiente",
  en_transito: "en-transito",
  listo: "listo",
  atrasado: "atrasado",
  completado: "completado",
};

export function formatElapsedTime(createdAt: Date): string {
  const diffMs = Date.now() - createdAt.getTime();
  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");
}

export function formatTimeAgo(createdAt: Date): string {
  const diffMs = Date.now() - createdAt.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "ahora";
  if (minutes < 60) return `hace ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `hace ${days}d`;
}

export function formatPingSent(at: Date): string {
  const diffMs = Date.now() - at.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "ENVIADO AHORA";
  if (minutes < 60) return `ENVIADO HACE ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `ENVIADO HACE ${hours}h`;
}

export function formatLogTime(createdAt: Date): string {
  return createdAt.toLocaleTimeString("es-PR", { hour12: false });
}

export function mapBranch(branch: PrismaBranch): Branch {
  return {
    id: branch.id as BranchId,
    name: branch.name,
    address: branch.address,
    capacityPercent: branch.capacityPercent,
    currentVolume: branch.currentVolume,
    status: branch.status,
    lastPingSent: branch.lastPingAt
      ? formatPingSent(branch.lastPingAt)
      : undefined,
  };
}

export function mapOrder(order: PrismaOrder): Order {
  return {
    id: order.displayId,
    customerName: order.customerName,
    type: order.type,
    branchId: order.branchId as BranchId,
    status: ORDER_STATUS_MAP[order.status],
    elapsedTime: formatElapsedTime(order.createdAt),
    createdAt: order.createdAt.toISOString(),
  };
}

export function mapDelivery(delivery: PrismaDelivery): Delivery {
  return {
    id: delivery.displayId,
    driverName: delivery.driverName,
    driverInitials: delivery.driverInitials,
    destination: delivery.destination,
    eta: delivery.eta ?? "—",
    status: delivery.status,
  };
}

export function mapPing(ping: PrismaPing): Ping {
  return {
    id: ping.id,
    priority: ping.priority,
    title: ping.title,
    description: ping.description,
    timeAgo: formatTimeAgo(ping.createdAt),
  };
}

export function mapNotification(log: PrismaNotification): NotificationLog {
  return {
    id: log.id,
    time: formatLogTime(log.createdAt),
    source: log.source,
    message: log.message,
    accent: log.accent === "primary" ? "primary" : "default",
  };
}

export function mapProduct(product: PrismaProduct): Product {
  return {
    id: product.id,
    name: product.name,
    sku: product.sku,
    unitPrice: Number(product.unitPrice),
  };
}

export function toPrismaOrderStatus(status: OrderStatus) {
  const map: Record<OrderStatus, PrismaOrderStatus> = {
    pendiente: "pendiente",
    "en-transito": "en_transito",
    listo: "listo",
    atrasado: "atrasado",
    completado: "completado",
  };
  return map[status];
}
