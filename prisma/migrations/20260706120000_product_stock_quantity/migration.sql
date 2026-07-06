-- AlterTable
ALTER TABLE "products" ADD COLUMN "stock_quantity" INTEGER;

-- AlterTable
ALTER TABLE "loyverse_integrations" ADD COLUMN "last_inventory_sync_at" TIMESTAMP(3);
