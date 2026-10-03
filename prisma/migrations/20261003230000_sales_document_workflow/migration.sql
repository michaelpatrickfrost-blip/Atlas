ALTER TYPE "OrderLineType" ADD VALUE IF NOT EXISTS 'SECTION';
ALTER TYPE "OrderLineType" ADD VALUE IF NOT EXISTS 'NOTE';
ALTER TABLE sales_quotes ADD COLUMN revision INTEGER NOT NULL DEFAULT 1, ADD COLUMN "customerNotes" TEXT, ADD COLUMN "externalReference" TEXT;
ALTER TABLE sales_quote_lines ADD COLUMN "lineNumber" INTEGER NOT NULL DEFAULT 0, ADD COLUMN type "OrderLineType" NOT NULL DEFAULT 'PRODUCT', ADD COLUMN optional BOOLEAN NOT NULL DEFAULT false, ADD COLUMN "unitOfMeasure" TEXT NOT NULL DEFAULT 'each', ADD COLUMN "taxCategory" TEXT, ADD COLUMN "priceSource" TEXT;
ALTER TABLE sales_order_lines ALTER COLUMN "discountPercent" TYPE DOUBLE PRECISION;
CREATE TABLE sales_quotation_templates (id TEXT PRIMARY KEY, "organisationId" TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE, name TEXT NOT NULL, notes TEXT, "validityDays" INTEGER NOT NULL DEFAULT 30, lines JSONB NOT NULL, active BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL);
CREATE UNIQUE INDEX sales_quotation_templates_organisation_name_key ON sales_quotation_templates("organisationId",name);
