-- Out-of-stock quotation lines can be confirmed and invoiced when stock covers them.
ALTER TABLE "sales_quote_lines" ADD COLUMN IF NOT EXISTS "invoiceWhenInStock" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "sales_order_lines" ADD COLUMN IF NOT EXISTS "invoiceWhenInStock" BOOLEAN NOT NULL DEFAULT false;
