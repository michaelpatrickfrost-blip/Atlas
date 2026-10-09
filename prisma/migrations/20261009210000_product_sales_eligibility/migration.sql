-- Preserve all existing sales and product behaviour; eligibility changes are explicit and audited.
ALTER TABLE "products" ADD COLUMN "sellable" BOOLEAN NOT NULL DEFAULT true;
