import { isLoyverseConfigured, LOYVERSE_RECEIPT_SOURCE } from "./config";
import { checkLoyverseConnection } from "./client";
import { getSyncedCustomerCount } from "./sync-customers";
import { getSyncedProductCount } from "./sync-items";
import { getMappedStoreCount } from "./sync-stores";
import type { LoyverseStatus } from "./types";

export async function getLoyverseStatus(): Promise<LoyverseStatus> {
  const configured = isLoyverseConfigured();

  if (!configured) {
    return {
      configured: false,
      connected: false,
      receiptSource: LOYVERSE_RECEIPT_SOURCE,
      mappedStores: 0,
      syncedProducts: 0,
      syncedCustomers: 0,
    };
  }

  let connected = false;
  let lastError: string | undefined;

  try {
    connected = await checkLoyverseConnection();
  } catch (error) {
    lastError = error instanceof Error ? error.message : "Error de conexión";
  }

  const [mappedStores, syncedProducts, syncedCustomers] = await Promise.all([
    getMappedStoreCount(),
    getSyncedProductCount(),
    getSyncedCustomerCount(),
  ]);

  return {
    configured,
    connected,
    receiptSource: LOYVERSE_RECEIPT_SOURCE,
    mappedStores,
    syncedProducts,
    syncedCustomers,
    lastError,
  };
}
