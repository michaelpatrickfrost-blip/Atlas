CREATE TABLE "crm_industries" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "crm_industries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "crm_industries_organisationId_name_key" ON "crm_industries"("organisationId", "name");
CREATE INDEX "crm_industries_organisationId_idx" ON "crm_industries"("organisationId");

ALTER TABLE "crm_industries" ADD CONSTRAINT "crm_industries_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sales_prospects" ADD COLUMN "industryId" TEXT;
ALTER TABLE "sales_prospects" ADD COLUMN "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
CREATE INDEX "sales_prospects_organisationId_industryId_idx" ON "sales_prospects"("organisationId", "industryId");
ALTER TABLE "sales_prospects" ADD CONSTRAINT "sales_prospects_industryId_fkey" FOREIGN KEY ("industryId") REFERENCES "crm_industries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "sales_opportunities" ADD COLUMN "industryId" TEXT;
ALTER TABLE "sales_opportunities" ADD COLUMN "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "sales_opportunities" ADD CONSTRAINT "sales_opportunities_industryId_fkey" FOREIGN KEY ("industryId") REFERENCES "crm_industries"("id") ON DELETE SET NULL ON UPDATE CASCADE;
