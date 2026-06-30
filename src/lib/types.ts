export type BranchId = "gurabo" | "san-lorenzo" | "navarro";

export type OrderType = "entrega" | "retiro";

export type OrderStatus =
  | "pendiente"
  | "en-transito"
  | "listo"
  | "atrasado"
  | "completado";

export type PingPriority = "urgente" | "sistema" | "advertencia";

export interface Branch {
  id: BranchId;
  name: string;
  address: string;
  capacityPercent: number;
  currentVolume: number;
  status: "online" | "offline" | "warning";
  lastPingSent?: string;
}

export interface Order {
  id: string;
  customerName: string;
  type: OrderType;
  branchId: BranchId;
  status: OrderStatus;
  elapsedTime: string;
  createdAt: string;
}

export interface OrderLineItemSnapshot {
  id: string;
  productId?: string;
  name: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderDetail extends Order {
  customerPhone?: string;
  deliveryAddress?: string;
  fulfillment: "pickup" | "delivery";
  smsNotify: boolean;
  subtotal: number;
  taxes: number;
  deliveryFee: number;
  total: number;
  lineItems: OrderLineItemSnapshot[];
  allowedTransitions: OrderStatus[];
  updatedAt: string;
}

export interface Delivery {
  id: string;
  driverName: string;
  driverInitials: string;
  destination: string;
  eta: string;
  status: "recogida" | "entrega";
  branchId?: BranchId;
  orderId?: string;
}

export interface Ping {
  id: string;
  priority: PingPriority;
  title: string;
  description: string;
  timeAgo: string;
}

export interface NotificationLog {
  id: string;
  time: string;
  source: string;
  message: string;
  accent?: "primary" | "default";
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  unitPrice: number;
}

export interface OrderLineItem extends Product {
  quantity: number;
}

export interface DashboardMetrics {
  totalOrders: number;
  totalOrdersChange: string;
  pendingDeliveries: number;
  activePickups: number;
  activePickupsLocation: string;
  systemAlerts: number;
}
