-- Keep the existing production-order foreign key. Buy proposals use their own
-- tenant-bound Finance relation, committed with the purchase draft.
ALTER TABLE "manufacturing_supply_suggestions"
  ADD COLUMN "resultingPurchaseDocumentId" TEXT;

CREATE INDEX "manufacturing_supply_suggestions_org_purchase_idx"
  ON "manufacturing_supply_suggestions" ("organisationId", "resultingPurchaseDocumentId");

ALTER TABLE "manufacturing_supply_suggestions"
  ADD CONSTRAINT "manufacturing_supply_suggestions_purchase_document_fkey"
  FOREIGN KEY ("resultingPurchaseDocumentId", "organisationId")
  REFERENCES "finance_documents" ("id", "organisationId")
  ON DELETE RESTRICT ON UPDATE CASCADE;
