-- AlterTable
ALTER TABLE "sales_quote_lines" ADD COLUMN     "discountPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "netAmount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "productId" TEXT,
ADD COLUMN     "taxAmount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "sales_quotes" ADD COLUMN     "customerPoReference" TEXT,
ADD COLUMN     "expiryDate" TIMESTAMP(3),
ADD COLUMN     "netAmount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "paymentTermId" TEXT,
ADD COLUMN     "priceListId" TEXT,
ADD COLUMN     "taxAmount" INTEGER NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE "sales_quotes" ADD CONSTRAINT "sales_quotes_priceListId_fkey" FOREIGN KEY ("priceListId") REFERENCES "price_lists"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_quotes" ADD CONSTRAINT "sales_quotes_paymentTermId_fkey" FOREIGN KEY ("paymentTermId") REFERENCES "payment_terms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_quote_lines" ADD CONSTRAINT "sales_quote_lines_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

UPDATE "sales_quotes" SET "netAmount"="totalAmount";
UPDATE "sales_quote_lines" SET "netAmount"="quantity"*"unitAmount";
