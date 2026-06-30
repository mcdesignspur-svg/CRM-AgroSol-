export interface LoyverseListResponse<TKey extends string, TItem> {
  cursor?: string;
  [key: string]: TItem[] | string | undefined;
}

export interface LoyverseStore {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  phone_number?: string;
  deleted_at?: string | null;
}

export interface LoyverseVariant {
  variant_id: string;
  item_id: string;
  sku?: string;
  default_price?: number | null;
  default_pricing_type?: "FIXED" | "VARIABLE";
  deleted_at?: string | null;
}

export interface LoyverseItem {
  id: string;
  item_name: string;
  description?: string;
  category_id?: string;
  deleted_at?: string | null;
  variants: LoyverseVariant[];
}

export interface LoyverseCustomer {
  id: string;
  name: string;
  email?: string;
  phone_number?: string;
  address?: string;
  deleted_at?: string | null;
}

export interface LoyverseReceiptLineItem {
  item_id?: string;
  variant_id?: string;
  item_name: string;
  sku?: string;
  quantity: number;
  price: number;
  total_money?: number;
}

export interface LoyverseReceipt {
  receipt_number: string;
  receipt_type: "SALE" | "REFUND";
  order?: string;
  source?: string;
  note?: string;
  store_id: string;
  customer_id?: string;
  total_money: number;
  total_tax: number;
  created_at: string;
  updated_at: string;
  cancelled_at?: string | null;
  line_items: LoyverseReceiptLineItem[];
}

export interface LoyverseInventoryLevel {
  variant_id: string;
  store_id: string;
  in_stock: number;
  updated_at: string;
}

export interface LoyversePaymentType {
  id: string;
  name: string;
  type: string;
}

export type LoyverseWebhookType =
  | "inventory_levels.update"
  | "items.update"
  | "customers.update"
  | "receipts.update"
  | "shifts.create";

export interface LoyverseWebhookPayload {
  merchant_id: string;
  type: LoyverseWebhookType;
  created_at: string;
  [key: string]: unknown;
}

export interface LoyverseSyncResult {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}

export interface LoyverseStatus {
  configured: boolean;
  connected: boolean;
  receiptSource: string;
  mappedStores: number;
  syncedProducts: number;
  syncedCustomers: number;
  lastError?: string;
}
