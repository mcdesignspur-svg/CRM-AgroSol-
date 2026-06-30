-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "loyverse_customer_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "branches" ADD COLUMN "loyverse_store_id" TEXT;

-- AlterTable
ALTER TABLE "products" ADD COLUMN "loyverse_item_id" TEXT,
ADD COLUMN "loyverse_variant_id" TEXT,
ADD COLUMN "category_name" TEXT,
ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN "customer_id" TEXT,
ADD COLUMN "loyverse_receipt_number" TEXT,
ADD COLUMN "loyverse_source" TEXT,
ADD COLUMN "loyverse_synced_at" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "branches_loyverse_store_id_key" ON "branches"("loyverse_store_id");

-- CreateIndex
CREATE UNIQUE INDEX "customers_loyverse_customer_id_key" ON "customers"("loyverse_customer_id");

-- CreateIndex
CREATE INDEX "customers_phone_idx" ON "customers"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "products_loyverse_variant_id_key" ON "products"("loyverse_variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "orders_loyverse_receipt_number_key" ON "orders"("loyverse_receipt_number");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
