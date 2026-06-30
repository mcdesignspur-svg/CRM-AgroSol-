import type { BranchId } from "@/lib/types";

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
  updated_at?: string | null;
  variants?: LoyverseVariant[];
}

export type LoyversePaginated<TKey extends string, TItem> = {
  cursor?: string | null;
} & Record<TKey, TItem[]>;

export interface LoyverseStatus {
  branchId: BranchId;
  configured: boolean;
  connected: boolean;
  merchantName?: string;
  message: string;
  cachedProductCount?: number;
  lastSyncAt?: string | null;
}

export interface LoyverseSyncResult {
  branchId: BranchId;
  mode: "full" | "incremental";
  created: number;
  updated: number;
  skipped: number;
  total: number;
}
