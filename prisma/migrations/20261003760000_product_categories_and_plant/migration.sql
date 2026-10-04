-- Catalogue groups, bill-of-material notes, and the link from a recipe step to a plant machine.

CREATE TABLE "product_categories" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "itemClass" TEXT NOT NULL DEFAULT 'OTHER',
    "parentId" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "product_categories_organisationId_code_key" ON "product_categories"("organisationId", "code");
CREATE INDEX "product_categories_organisationId_active_idx" ON "product_categories"("organisationId", "active");

ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "product_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "product_bom_lines" ADD COLUMN "notes" TEXT NOT NULL DEFAULT '';

ALTER TABLE "product_operations" ADD COLUMN "workCentreId" TEXT;
ALTER TABLE "product_operations" ADD COLUMN "resourceId" TEXT;

CREATE INDEX "product_operations_organisationId_workCentreId_idx" ON "product_operations"("organisationId", "workCentreId");
CREATE INDEX "product_operations_organisationId_resourceId_idx" ON "product_operations"("organisationId", "resourceId");

ALTER TABLE "product_operations" ADD CONSTRAINT "product_operations_workCentreId_fkey" FOREIGN KEY ("workCentreId") REFERENCES "manufacturing_work_centres"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "product_operations" ADD CONSTRAINT "product_operations_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "manufacturing_resources"("id") ON DELETE SET NULL ON UPDATE CASCADE;
