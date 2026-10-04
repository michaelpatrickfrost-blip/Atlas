CREATE TYPE "QuoteKind" AS ENUM ('STANDARD', 'BLANKET');
CREATE TYPE "AgreementStatus" AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED', 'CANCELLED');

ALTER TABLE "sales_quotes" ADD COLUMN "kind" "QuoteKind" NOT NULL DEFAULT 'STANDARD';
ALTER TABLE "sales_orders" ADD COLUMN "projectId" TEXT;
ALTER TABLE "sales_orders" ADD COLUMN "agreementId" TEXT;
ALTER TABLE "projects" ADD COLUMN "opportunityId" TEXT;
ALTER TABLE "sales_order_lines" ADD COLUMN "agreementLineId" TEXT;

CREATE TABLE "sales_agreements" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "partyId" TEXT NOT NULL,
  "pricingPartyId" TEXT,
  "opportunityId" TEXT,
  "quoteId" TEXT,
  "projectId" TEXT,
  "reference" TEXT NOT NULL,
  "status" "AgreementStatus" NOT NULL DEFAULT 'DRAFT',
  "currency" TEXT NOT NULL DEFAULT 'GBP',
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3) NOT NULL,
  "paymentTermId" TEXT,
  "customerPoReference" TEXT,
  "notes" TEXT,
  "ownerUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "sales_agreements_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sales_agreement_lines" (
  "id" TEXT NOT NULL,
  "agreementId" TEXT NOT NULL,
  "lineNumber" INTEGER NOT NULL,
  "productId" TEXT,
  "description" TEXT NOT NULL,
  "committedQuantity" INTEGER NOT NULL,
  "unitPriceAmount" INTEGER NOT NULL,
  "unitOfMeasure" TEXT NOT NULL DEFAULT 'each',
  "currency" TEXT NOT NULL DEFAULT 'GBP',
  CONSTRAINT "sales_agreement_lines_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "sales_agreements_quoteId_key" ON "sales_agreements"("quoteId");
CREATE UNIQUE INDEX "sales_agreements_organisationId_reference_key" ON "sales_agreements"("organisationId", "reference");
CREATE INDEX "sales_agreements_organisationId_partyId_status_idx" ON "sales_agreements"("organisationId", "partyId", "status");
CREATE UNIQUE INDEX "sales_agreement_lines_agreementId_lineNumber_key" ON "sales_agreement_lines"("agreementId", "lineNumber");
CREATE INDEX "sales_orders_organisationId_agreementId_idx" ON "sales_orders"("organisationId", "agreementId");
CREATE INDEX "sales_orders_organisationId_projectId_idx" ON "sales_orders"("organisationId", "projectId");
CREATE INDEX "projects_organisationId_opportunityId_idx" ON "projects"("organisationId", "opportunityId");

ALTER TABLE "sales_agreements" ADD CONSTRAINT "sales_agreements_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sales_agreements" ADD CONSTRAINT "sales_agreements_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "parties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sales_agreements" ADD CONSTRAINT "sales_agreements_pricingPartyId_fkey" FOREIGN KEY ("pricingPartyId") REFERENCES "parties"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "sales_agreements" ADD CONSTRAINT "sales_agreements_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "sales_opportunities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sales_agreements" ADD CONSTRAINT "sales_agreements_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "sales_quotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sales_agreements" ADD CONSTRAINT "sales_agreements_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sales_agreements" ADD CONSTRAINT "sales_agreements_paymentTermId_fkey" FOREIGN KEY ("paymentTermId") REFERENCES "payment_terms"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sales_agreement_lines" ADD CONSTRAINT "sales_agreement_lines_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "sales_agreements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sales_agreement_lines" ADD CONSTRAINT "sales_agreement_lines_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "sales_agreements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sales_order_lines" ADD CONSTRAINT "sales_order_lines_agreementLineId_fkey" FOREIGN KEY ("agreementLineId") REFERENCES "sales_agreement_lines"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "projects" ADD CONSTRAINT "projects_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "sales_opportunities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
