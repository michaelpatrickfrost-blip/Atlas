-- Overall discount on a quotation or sales order, taken off before VAT.
ALTER TABLE "sales_quotes" ADD COLUMN "headerDiscountPercent" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "sales_orders" ADD COLUMN "headerDiscountPercent" DOUBLE PRECISION NOT NULL DEFAULT 0;
