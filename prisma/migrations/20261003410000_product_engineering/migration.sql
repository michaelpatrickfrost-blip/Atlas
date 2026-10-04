-- Versioned product recipes: make, buy or intermediate WIP, with cost rates.
CREATE TABLE "product_definitions" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "supply" TEXT NOT NULL,
    "batchQuantity" DECIMAL(18,6) NOT NULL,
    "yieldPercent" DECIMAL(8,4) NOT NULL,
    "subcontractMinorPerUnit" INTEGER NOT NULL DEFAULT 0,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "product_definitions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "product_definitions_status_check" CHECK ("status" IN ('ACTIVE', 'RETIRED')),
    CONSTRAINT "product_definitions_supply_check" CHECK ("supply" IN ('MAKE', 'BUY', 'WIP', 'SUBCONTRACT')),
    CONSTRAINT "product_definitions_batch_check" CHECK ("batchQuantity" > 0),
    CONSTRAINT "product_definitions_yield_check" CHECK ("yieldPercent" > 0 AND "yieldPercent" <= 100),
    CONSTRAINT "product_definitions_subcontract_check" CHECK ("subcontractMinorPerUnit" >= 0)
);
CREATE UNIQUE INDEX "product_definitions_organisationId_productId_version_key" ON "product_definitions"("organisationId", "productId", "version");
CREATE INDEX "product_definitions_organisationId_productId_status_idx" ON "product_definitions"("organisationId", "productId", "status");
CREATE UNIQUE INDEX "product_definitions_one_active" ON "product_definitions"("organisationId", "productId") WHERE "status" = 'ACTIVE';
ALTER TABLE "product_definitions" ADD CONSTRAINT "product_definitions_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_definitions" ADD CONSTRAINT "product_definitions_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "product_bom_lines" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "definitionId" TEXT NOT NULL,
    "componentProductId" TEXT NOT NULL,
    "quantityPerUnit" DECIMAL(18,6) NOT NULL,
    "scrapPercent" DECIMAL(8,4) NOT NULL DEFAULT 0,
    "position" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "product_bom_lines_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "product_bom_lines_quantity_check" CHECK ("quantityPerUnit" > 0),
    CONSTRAINT "product_bom_lines_scrap_check" CHECK ("scrapPercent" >= 0 AND "scrapPercent" <= 100)
);
CREATE INDEX "product_bom_lines_organisationId_componentProductId_idx" ON "product_bom_lines"("organisationId", "componentProductId");
ALTER TABLE "product_bom_lines" ADD CONSTRAINT "product_bom_lines_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_bom_lines" ADD CONSTRAINT "product_bom_lines_definitionId_fkey" FOREIGN KEY ("definitionId") REFERENCES "product_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_bom_lines" ADD CONSTRAINT "product_bom_lines_componentProductId_fkey" FOREIGN KEY ("componentProductId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "product_operations" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "definitionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "setupMinutes" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "runMinutesPerUnit" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "crewSize" DECIMAL(8,2) NOT NULL DEFAULT 1,
    "machineMinorPerHour" INTEGER NOT NULL DEFAULT 0,
    "labourMinorPerHour" INTEGER NOT NULL DEFAULT 0,
    "logisticsMinorPerBatch" INTEGER NOT NULL DEFAULT 0,
    "machineIncludesLabour" BOOLEAN NOT NULL DEFAULT false,
    "workCentre" TEXT NOT NULL DEFAULT '',
    "overheadMinorPerHour" INTEGER NOT NULL DEFAULT 0,
    "machineIncludesOverhead" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "product_operations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "product_operations_time_check" CHECK ("setupMinutes" >= 0 AND "runMinutesPerUnit" >= 0 AND "crewSize" >= 0),
    CONSTRAINT "product_operations_rate_check" CHECK ("machineMinorPerHour" >= 0 AND "labourMinorPerHour" >= 0 AND "logisticsMinorPerBatch" >= 0 AND "overheadMinorPerHour" >= 0)
);
CREATE INDEX "product_operations_organisationId_definitionId_idx" ON "product_operations"("organisationId", "definitionId");
ALTER TABLE "product_operations" ADD CONSTRAINT "product_operations_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_operations" ADD CONSTRAINT "product_operations_definitionId_fkey" FOREIGN KEY ("definitionId") REFERENCES "product_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
