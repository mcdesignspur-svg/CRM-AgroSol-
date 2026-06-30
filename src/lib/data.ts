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
  totalOrders: 1284,
  totalOrdersChange: "+12% vs año ant.",
  pendingDeliveries: 42,
  activePickups: 18,
  activePickupsLocation: "Esperando en Navarro",
  systemAlerts: 3,
};

export const recentOrders: Order[] = [
  {
    id: "ORD-99021",
    customerName: "Juan del Pueblo",
    type: "entrega",
    branchId: "gurabo",
    status: "en-transito",
    elapsedTime: "02:14:00",
    createdAt: "2026-06-29T10:00:00",
  },
  {
    id: "ORD-99018",
    customerName: "María Rodríguez",
    type: "retiro",
    branchId: "navarro",
    status: "listo",
    elapsedTime: "08:45:12",
    createdAt: "2026-06-29T03:30:00",
  },
  {
    id: "ORD-99015",
    customerName: "Carlos Ortiz",
    type: "entrega",
    branchId: "san-lorenzo",
    status: "pendiente",
    elapsedTime: "00:15:30",
    createdAt: "2026-06-29T12:00:00",
  },
  {
    id: "ORD-99010",
    customerName: "Agro Industrias PR",
    type: "entrega",
    branchId: "gurabo",
    status: "atrasado",
    elapsedTime: "14:22:05",
    createdAt: "2026-06-28T22:00:00",
  },
];

export const livePings: Ping[] = [
  {
    id: "ping-1",
    priority: "urgente",
    title: "Conductor ID #442 reportó retraso",
    description: "Ruta 7, Área de Gurabo. Incidente de tráfico en PR-30.",
    timeAgo: "hace 2m",
  },
  {
    id: "ping-2",
    priority: "sistema",
    title: "Nueva Orden: #99021",
    description: "Sucursal San Lorenzo asignada automáticamente.",
    timeAgo: "hace 15m",
  },
  {
    id: "ping-3",
    priority: "advertencia",
    title: "Inventario Bajo en Navarro",
    description: "Fertilizante Tipo-A bajo el umbral.",
    timeAgo: "hace 42m",
  },
];

export const activeDeliveries: Delivery[] = [
  {
    id: "TRK-8921",
    driverName: "Juan Rodriguez",
    driverInitials: "JR",
    destination: "Finca Santa Maria, SE",
    eta: "14:30 (45m)",
    status: "recogida",
  },
  {
    id: "TRK-7740",
    driverName: "Miguel Angel",
    driverInitials: "MA",
    destination: "Centro Logístico Sur",
    eta: "Llegando Ahora",
    status: "entrega",
  },
  {
    id: "TRK-1055",
    driverName: "Carlos Mendez",
    driverInitials: "CM",
    destination: "Rancho Las Palmas",
    eta: "16:15 (2h 30m)",
    status: "recogida",
  },
  {
    id: "TRK-4422",
    driverName: "Sofia Garcia",
    driverInitials: "SG",
    destination: "Bodega Central",
    eta: "15:00 (1h 15m)",
    status: "entrega",
  },
];

export const branches: Branch[] = [
  {
    id: "gurabo",
    name: "Gurabo (Central)",
    address: "Av. Agrícola 450",
    capacityPercent: 88,
    currentVolume: 142,
    status: "online",
  },
  {
    id: "san-lorenzo",
    name: "San Lorenzo",
    address: "Km 12 Carretera Federal",
    capacityPercent: 42,
    currentVolume: 68,
    status: "online",
    lastPingSent: "ENVIADO HACE 2m",
  },
  {
    id: "navarro",
    name: "Ferretería Navarro",
    address: "Zona Industrial Lote 9",
    capacityPercent: 95,
    currentVolume: 210,
    status: "warning",
  },
];

export const notificationLogs: NotificationLog[] = [
  {
    id: "log-1",
    time: "14:22:10",
    source: "SISTEMA",
    message:
      "Ping de gerente enviado a San Lorenzo por Admin_Solá.",
    accent: "primary",
  },
  {
    id: "log-2",
    time: "13:45:02",
    source: "Conductor",
    message: "Conductor M. Angel confirmó entrega #TRK-5510.",
  },
  {
    id: "log-3",
    time: "13:10:44",
    source: "SISTEMA",
    message:
      "Alerta automática de inventario: Ferretería Navarro alcanzando límite de capacidad.",
  },
  {
    id: "log-4",
    time: "12:55:18",
    source: "Propietario",
    message:
      'Mensaje de difusión enviado a todo el personal de entrega: "Cierre de carretera en la Hwy 45".',
    accent: "primary",
  },
];

export const catalogProducts: Product[] = [
  {
    id: "prod-1",
    name: "Fertilizante Premium NPK (50kg)",
    sku: "AG-9901-FERT",
    unitPrice: 45,
  },
  {
    id: "prod-2",
    name: "Fungicida Herbal (5L)",
    sku: "AG-2342-SOL",
    unitPrice: 120,
  },
];
