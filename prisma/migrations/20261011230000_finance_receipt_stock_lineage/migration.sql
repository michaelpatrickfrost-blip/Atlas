-- Finance receipts and Logistics receipts have separate canonical owners.
-- Keep existing Logistics links intact; new purchase movements use Finance.
BEGIN;
ALTER TABLE "inventory_movements" ADD COLUMN "financeReceiptId" TEXT;
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_financeReceiptId_organisationId_fkey"
  FOREIGN KEY ("financeReceiptId", "organisationId") REFERENCES "finance_documents" ("id", "organisationId")
  ON UPDATE CASCADE ON DELETE NO ACTION;
CREATE INDEX "inventory_movements_finance_receipt_idx" ON "inventory_movements" ("organisationId", "financeReceiptId");
ALTER TABLE "inventory_movements" DROP CONSTRAINT "inventory_movements_one_source";
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_one_source"
  CHECK (num_nonnulls("shipmentId", "receiptId", "financeReceiptId", "manufacturingOrderId") <= 1);
COMMIT;
