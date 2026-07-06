-- AlterTable
ALTER TABLE "orders" ADD COLUMN "delivery_token" TEXT;
ALTER TABLE "orders" ADD COLUMN "dispatched_at" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "orders_delivery_token_key" ON "orders"("delivery_token");
