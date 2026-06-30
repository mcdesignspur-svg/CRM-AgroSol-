-- AlterTable
ALTER TABLE "products" ADD COLUMN "branch_id" TEXT NOT NULL DEFAULT 'gurabo';
ALTER TABLE "products" ADD COLUMN "loyverse_item_id" TEXT;
ALTER TABLE "products" ADD COLUMN "loyverse_variant_id" TEXT;
ALTER TABLE "products" ADD COLUMN "synced_at" TIMESTAMP(3);

-- DropIndex
DROP INDEX IF EXISTS "products_sku_key";

-- CreateIndex
CREATE INDEX "products_branch_id_name_idx" ON "products"("branch_id", "name");
CREATE INDEX "products_branch_id_active_idx" ON "products"("branch_id", "active");
CREATE UNIQUE INDEX "products_branch_id_sku_key" ON "products"("branch_id", "sku");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "loyverse_integrations" (
    "branch_id" TEXT NOT NULL,
    "merchant_name" TEXT,
    "product_count" INTEGER NOT NULL DEFAULT 0,
    "last_full_sync_at" TIMESTAMP(3),
    "last_incremental_sync_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loyverse_integrations_pkey" PRIMARY KEY ("branch_id")
);

-- AddForeignKey
ALTER TABLE "loyverse_integrations" ADD CONSTRAINT "loyverse_integrations_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
