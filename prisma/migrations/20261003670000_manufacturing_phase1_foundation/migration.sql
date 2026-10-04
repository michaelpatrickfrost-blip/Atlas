-- Manufacturing Phase 1 domain foundation (docs/modules/MANUFACTURING_SOURCE_REQUIREMENTS.md
-- sections 17-22, 57-68): work centres, resources, Production Orders, Work Orders.
-- Not yet applied to the dev database: a pre-existing migration-ordering drift blocks
-- `prisma migrate dev`'s shadow-database replay before this one (see CURRENT_STATE.md).
-- Written by hand against the schema so it is ready to apply once that is resolved.

-- CreateEnum
CREATE TYPE "ManufacturingResourceType" AS ENUM ('MACHINE', 'PRODUCTION_LINE', 'LABOUR_TEAM', 'WORKSTATION', 'CELL', 'SUBCONTRACT');

-- CreateEnum
CREATE TYPE "ManufacturingOrderStatus" AS ENUM ('PLANNED', 'READY', 'RELEASED', 'RUNNING', 'COMPLETE', 'CLOSED');

-- CreateEnum
CREATE TYPE "ManufacturingWorkOrderStatus" AS ENUM ('WAITING', 'READY', 'RUNNING', 'PAUSED', 'BLOCKED', 'COMPLETE');

-- CreateTable
CREATE TABLE "manufacturing_counters" (
    "organisationId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "manufacturing_counters_pkey" PRIMARY KEY ("organisationId","kind")
);

-- AddForeignKey
ALTER TABLE "manufacturing_counters" ADD CONSTRAINT "manufacturing_counters_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "manufacturing_work_centres" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manufacturing_work_centres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manufacturing_resources" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "workCentreId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ManufacturingResourceType" NOT NULL DEFAULT 'MACHINE',
    "nominalUnitsPerHour" DECIMAL(18,6),
    "planningEfficiencyPercent" DECIMAL(8,4) NOT NULL DEFAULT 100,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manufacturing_resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manufacturing_orders" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "definitionId" TEXT,
    "quantity" DECIMAL(18,6) NOT NULL,
    "unitOfMeasure" TEXT NOT NULL DEFAULT 'each',
    "status" "ManufacturingOrderStatus" NOT NULL DEFAULT 'PLANNED',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "requiredDate" TIMESTAMP(3),
    "plannedStart" TIMESTAMP(3),
    "plannedFinish" TIMESTAMP(3),
    "actualStart" TIMESTAMP(3),
    "actualFinish" TIMESTAMP(3),
    "sourceSalesOrderLineId" TEXT,
    "notes" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manufacturing_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manufacturing_work_orders" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "productionOrderId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "operationName" TEXT NOT NULL,
    "workCentreId" TEXT,
    "resourceId" TEXT,
    "status" "ManufacturingWorkOrderStatus" NOT NULL DEFAULT 'WAITING',
    "scheduledStart" TIMESTAMP(3),
    "scheduledEnd" TIMESTAMP(3),
    "actualStart" TIMESTAMP(3),
    "actualEnd" TIMESTAMP(3),
    "producedQuantity" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "scrapQuantity" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "pauseReason" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "lastRequestKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manufacturing_work_orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "manufacturing_work_centres_organisationId_code_key" ON "manufacturing_work_centres"("organisationId", "code");

-- CreateIndex
CREATE INDEX "manufacturing_work_centres_organisationId_active_idx" ON "manufacturing_work_centres"("organisationId", "active");

-- CreateIndex
CREATE INDEX "manufacturing_resources_organisationId_workCentreId_active_idx" ON "manufacturing_resources"("organisationId", "workCentreId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "manufacturing_orders_organisationId_orderNumber_key" ON "manufacturing_orders"("organisationId", "orderNumber");

-- CreateIndex
CREATE INDEX "manufacturing_orders_organisationId_status_requiredDate_idx" ON "manufacturing_orders"("organisationId", "status", "requiredDate");

-- CreateIndex
CREATE INDEX "manufacturing_orders_organisationId_productId_idx" ON "manufacturing_orders"("organisationId", "productId");

-- CreateIndex
CREATE INDEX "manufacturing_orders_organisationId_sourceSalesOrderLineId_idx" ON "manufacturing_orders"("organisationId", "sourceSalesOrderLineId");

-- CreateIndex
CREATE INDEX "manufacturing_work_orders_organisationId_productionOrderId_sequence_idx" ON "manufacturing_work_orders"("organisationId", "productionOrderId", "sequence");

-- CreateIndex
CREATE INDEX "manufacturing_work_orders_organisationId_workCentreId_status_idx" ON "manufacturing_work_orders"("organisationId", "workCentreId", "status");

-- AddForeignKey
ALTER TABLE "manufacturing_work_centres" ADD CONSTRAINT "manufacturing_work_centres_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manufacturing_resources" ADD CONSTRAINT "manufacturing_resources_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manufacturing_resources" ADD CONSTRAINT "manufacturing_resources_workCentreId_fkey" FOREIGN KEY ("workCentreId") REFERENCES "manufacturing_work_centres"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manufacturing_orders" ADD CONSTRAINT "manufacturing_orders_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manufacturing_orders" ADD CONSTRAINT "manufacturing_orders_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manufacturing_orders" ADD CONSTRAINT "manufacturing_orders_definitionId_fkey" FOREIGN KEY ("definitionId") REFERENCES "product_definitions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manufacturing_orders" ADD CONSTRAINT "manufacturing_orders_sourceSalesOrderLineId_fkey" FOREIGN KEY ("sourceSalesOrderLineId") REFERENCES "sales_order_lines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manufacturing_work_orders" ADD CONSTRAINT "manufacturing_work_orders_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manufacturing_work_orders" ADD CONSTRAINT "manufacturing_work_orders_productionOrderId_fkey" FOREIGN KEY ("productionOrderId") REFERENCES "manufacturing_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manufacturing_work_orders" ADD CONSTRAINT "manufacturing_work_orders_workCentreId_fkey" FOREIGN KEY ("workCentreId") REFERENCES "manufacturing_work_centres"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manufacturing_work_orders" ADD CONSTRAINT "manufacturing_work_orders_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "manufacturing_resources"("id") ON DELETE SET NULL ON UPDATE CASCADE;
