CREATE INDEX "promocodes_active_status_idx" ON "promocodes" USING btree ("status") WHERE status = 'active';--> statement-breakpoint
CREATE INDEX "promocodes_active_store_idx" ON "promocodes" USING btree ("store_id","expires_at") WHERE status = 'active';--> statement-breakpoint
CREATE INDEX "promocodes_active_category_idx" ON "promocodes" USING btree ("category_id","expires_at") WHERE status = 'active';--> statement-breakpoint
CREATE INDEX "promocodes_active_brand_idx" ON "promocodes" USING btree ("brand_id","expires_at") WHERE status = 'active';