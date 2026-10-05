-- Additive: expected monthly usage for Inventory forecasting.
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "monthlyUsage" INTEGER;
