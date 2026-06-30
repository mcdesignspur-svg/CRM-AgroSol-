import { prisma } from "@/lib/prisma";
import { syncItemsFromLoyverse } from "./sync-items";
import { syncStoresFromLoyverse } from "./sync-stores";
import { syncCustomersFromLoyverse } from "./sync-customers";
import { importReceiptFromLoyverse } from "./receipts";
import { createLowStockPing } from "./inventory";
import type { LoyverseReceipt, LoyverseWebhookPayload } from "./types";

export async function runFullLoyverseSync() {
  const stores = await syncStoresFromLoyverse();
  const items = await syncItemsFromLoyverse();
  const customers = await syncCustomersFromLoyverse();

  await prisma.notificationLog.create({
    data: {
      source: "LOYVERSE",
      message: `Sincronización completa: ${stores.created + stores.updated} tiendas, ${items.created + items.updated} productos, ${customers.created + customers.updated} clientes.`,
      accent: "primary",
    },
  });

  return { stores, items, customers };
}

export async function handleLoyverseWebhook(payload: LoyverseWebhookPayload) {
  switch (payload.type) {
    case "items.update": {
      await syncItemsFromLoyverse();
      break;
    }
    case "customers.update": {
      await syncCustomersFromLoyverse();
      break;
    }
    case "receipts.update": {
      const receipts = payload.receipts as LoyverseReceipt[] | undefined;
      if (Array.isArray(receipts)) {
        for (const receipt of receipts) {
          await importReceiptFromLoyverse(receipt);
        }
      }
      break;
    }
    case "inventory_levels.update": {
      const levels = payload.inventory_levels as
        | { variant_id: string; store_id: string; in_stock: number }[]
        | undefined;

      if (Array.isArray(levels)) {
        for (const level of levels) {
          if (level.in_stock <= 5) {
            await createLowStockPing(
              level.variant_id,
              level.store_id,
              level.in_stock,
            );
          }
        }
      }
      break;
    }
    default:
      break;
  }
}
