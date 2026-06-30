import type {
  Branch,
  DashboardMetrics,
  Delivery,
  NotificationLog,
  Order,
  Ping,
  Product,
} from "./types";

export const dashboardMetrics: DashboardMetrics = {
  totalOrders: 0,
  totalOrdersChange: "",
  pendingDeliveries: 0,
  activePickups: 0,
  activePickupsLocation: "",
  systemAlerts: 0,
};

export const recentOrders: Order[] = [];

export const extraOrders: Order[] = [];

export const livePings: Ping[] = [];

export const activeDeliveries: Delivery[] = [];

export const branches: Branch[] = [
  {
    id: "gurabo",
    name: "Gurabo (Central)",
    address: "Av. Agrícola 450",
    capacityPercent: 0,
    currentVolume: 0,
    status: "online",
  },
  {
    id: "san-lorenzo",
    name: "San Lorenzo",
    address: "Km 12 Carretera Federal",
    capacityPercent: 0,
    currentVolume: 0,
    status: "online",
  },
  {
    id: "navarro",
    name: "Ferretería Navarro",
    address: "Zona Industrial Lote 9",
    capacityPercent: 0,
    currentVolume: 0,
    status: "online",
  },
];

export const notificationLogs: NotificationLog[] = [];

export const catalogProducts: Product[] = [];

export const extraCatalogProducts: Product[] = [];
