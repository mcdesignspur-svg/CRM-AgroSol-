-- Pickup flow: branch phones, order tokens, arrival tracking, Telegram
ALTER TABLE "branches" ADD COLUMN "phone" TEXT;

UPDATE "branches" SET "phone" = '+17877504500' WHERE "id" = 'gurabo';
UPDATE "branches" SET "phone" = '+17877504501' WHERE "id" = 'san-lorenzo';
UPDATE "branches" SET "phone" = '+17877504502' WHERE "id" = 'navarro';

ALTER TABLE "orders" ADD COLUMN "pickup_token" TEXT;
ALTER TABLE "orders" ADD COLUMN "telegram_chat_id" TEXT;
ALTER TABLE "orders" ADD COLUMN "arrived_at" TIMESTAMP(3);
ALTER TABLE "orders" ADD COLUMN "confirmation_notified_at" TIMESTAMP(3);
ALTER TABLE "orders" ADD COLUMN "ready_notified_at" TIMESTAMP(3);

CREATE UNIQUE INDEX "orders_pickup_token_key" ON "orders"("pickup_token");
