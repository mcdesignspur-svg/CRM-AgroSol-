-- CreateIndex
CREATE INDEX IF NOT EXISTS "orders_branch_id_idx" ON "orders"("branch_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "orders_fulfillment_idx" ON "orders"("fulfillment");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "order_line_items_order_id_idx" ON "order_line_items"("order_id");
