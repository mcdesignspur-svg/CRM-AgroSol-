export interface LoyverseMerchant {
  id?: string;
  business_name?: string;
  name?: string;
}

export interface LoyverseVariant {
  variant_id: string;
  sku?: string | null;
  default_price?: number | null;
  option1_value?: string | null;
  option2_value?: string | null;
  option3_value?: string | null;
  deleted_at?: string | null;
}

export interface LoyverseItem {
  id: string;
  item_name?: string;
  name?: string;
  deleted_at?: string | null;
  variants?: LoyverseVariant[];
}

export type LoyversePaginated<TKey extends string, TItem> = {
  cursor?: string | null;
} & Record<TKey, TItem[]>;

export interface LoyverseStatus {
  configured: boolean;
  connected: boolean;
  merchantName?: string;
  message: string;
}

export interface LoyverseSyncResult {
  created: number;
  updated: number;
  skipped: number;
  total: number;
}
