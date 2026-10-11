-- AlterTable
ALTER TABLE "product_operations" ADD COLUMN     "loadPerUnit" DECIMAL(18,6),
ADD COLUMN     "loadUnit" TEXT,
ADD COLUMN     "processProfile" TEXT;

-- AlterTable
ALTER TABLE "inventory_movements" ADD COLUMN     "productionReportId" TEXT,
ADD COLUMN     "requestFingerprint" TEXT;

-- AlterTable
ALTER TABLE "manufacturing_resources" ADD COLUMN     "loadCapacity" DECIMAL(18,6),
ADD COLUMN     "loadUnit" TEXT,
ADD COLUMN     "processProfiles" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "manufacturing_work_orders" ADD COLUMN     "batchCapacity" DECIMAL(18,6),
ADD COLUMN     "coolingMinutes" DECIMAL(18,6),
ADD COLUMN     "cycleMinutes" DECIMAL(18,6),
ADD COLUMN     "loadPerUnit" DECIMAL(18,6),
ADD COLUMN     "loadUnit" TEXT,
ADD COLUMN     "machineLoadId" TEXT,
ADD COLUMN     "processProfile" TEXT;

-- CreateTable
CREATE TABLE "manufacturing_production_reports" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "productionOrderId" TEXT NOT NULL,
    "requestKey" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "goodQuantity" DECIMAL(18,6) NOT NULL,
    "scrapQuantity" DECIMAL(18,6) NOT NULL,
    "enteredUnit" TEXT NOT NULL,
    "enteredGoodQuantity" DECIMAL(18,6) NOT NULL,
    "enteredScrapQuantity" DECIMAL(18,6) NOT NULL,
    "final" BOOLEAN NOT NULL,
    "lotCode" TEXT,
    "serials" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "shortCloseReason" TEXT,
    "actorUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "manufacturing_production_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movement_allocations" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "movementId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "lotId" TEXT NOT NULL DEFAULT '',
    "serials" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "direction" TEXT NOT NULL,
    "quantity" DECIMAL(18,6) NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "stock_movement_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manufacturing_machine_loads" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "processProfile" TEXT NOT NULL,
    "capacity" DECIMAL(18,6) NOT NULL,
    "unitOfMeasure" TEXT NOT NULL,
    "occupiedCapacity" DECIMAL(18,6) NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "version" INTEGER NOT NULL DEFAULT 1,
    "actorUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "manufacturing_machine_loads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manufacturing_material_uses" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "stockAllocationId" TEXT,
    "componentProductId" TEXT NOT NULL,
    "quantity" DECIMAL(18,6) NOT NULL,

    CONSTRAINT "manufacturing_material_uses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "manufacturing_production_reports_organisationId_productionO_idx" ON "manufacturing_production_reports"("organisationId", "productionOrderId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "manufacturing_production_reports_organisationId_requestKey_key" ON "manufacturing_production_reports"("organisationId", "requestKey");

-- CreateIndex
CREATE UNIQUE INDEX "manufacturing_production_reports_id_organisationId_key" ON "manufacturing_production_reports"("id", "organisationId");

-- CreateIndex
CREATE INDEX "stock_movement_allocations_organisationId_lotId_idx" ON "stock_movement_allocations"("organisationId", "lotId");

-- CreateIndex
CREATE INDEX "stock_movement_allocations_organisationId_movementId_idx" ON "stock_movement_allocations"("organisationId", "movementId");

-- CreateIndex
CREATE UNIQUE INDEX "stock_movement_allocations_id_organisationId_key" ON "stock_movement_allocations"("id", "organisationId");

-- CreateIndex
CREATE INDEX "manufacturing_machine_loads_organisationId_resourceId_statu_idx" ON "manufacturing_machine_loads"("organisationId", "resourceId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "manufacturing_machine_loads_id_organisationId_key" ON "manufacturing_machine_loads"("id", "organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "manufacturing_machine_loads_organisationId_reference_key" ON "manufacturing_machine_loads"("organisationId", "reference");

-- CreateIndex
CREATE INDEX "manufacturing_material_uses_organisationId_reportId_idx" ON "manufacturing_material_uses"("organisationId", "reportId");

-- CreateIndex
CREATE INDEX "manufacturing_material_uses_organisationId_stockAllocationI_idx" ON "manufacturing_material_uses"("organisationId", "stockAllocationId");

-- CreateIndex

-- CreateIndex
CREATE UNIQUE INDEX "inventory_movements_id_organisationId_key" ON "inventory_movements"("id", "organisationId");

-- CreateIndex

-- CreateIndex
CREATE UNIQUE INDEX "manufacturing_work_orders_id_organisationId_key" ON "manufacturing_work_orders"("id", "organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "stock_locations_id_organisationId_key" ON "stock_locations"("id", "organisationId");

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_productionReportId_organisationId_fkey" FOREIGN KEY ("productionReportId", "organisationId") REFERENCES "manufacturing_production_reports"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manufacturing_work_orders" ADD CONSTRAINT "manufacturing_work_orders_machineLoadId_organisationId_fkey" FOREIGN KEY ("machineLoadId", "organisationId") REFERENCES "manufacturing_machine_loads"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manufacturing_production_reports" ADD CONSTRAINT "manufacturing_production_reports_productionOrderId_organis_fkey" FOREIGN KEY ("productionOrderId", "organisationId") REFERENCES "manufacturing_orders"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manufacturing_production_reports" ADD CONSTRAINT "manufacturing_production_reports_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manufacturing_production_reports" ADD CONSTRAINT "manufacturing_production_reports_workOrderId_organisationI_fkey" FOREIGN KEY ("workOrderId", "organisationId") REFERENCES "manufacturing_work_orders"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movement_allocations" ADD CONSTRAINT "stock_movement_allocations_warehouseId_organisationId_fkey" FOREIGN KEY ("warehouseId", "organisationId") REFERENCES "warehouses"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movement_allocations" ADD CONSTRAINT "stock_movement_allocations_productId_organisationId_fkey" FOREIGN KEY ("productId", "organisationId") REFERENCES "products"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movement_allocations" ADD CONSTRAINT "stock_movement_allocations_locationId_organisationId_fkey" FOREIGN KEY ("locationId", "organisationId") REFERENCES "stock_locations"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movement_allocations" ADD CONSTRAINT "stock_movement_allocations_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movement_allocations" ADD CONSTRAINT "stock_movement_allocations_movementId_organisationId_fkey" FOREIGN KEY ("movementId", "organisationId") REFERENCES "inventory_movements"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manufacturing_machine_loads" ADD CONSTRAINT "manufacturing_machine_loads_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manufacturing_machine_loads" ADD CONSTRAINT "manufacturing_machine_loads_resourceId_organisationId_fkey" FOREIGN KEY ("resourceId", "organisationId") REFERENCES "manufacturing_resources"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manufacturing_material_uses" ADD CONSTRAINT "manufacturing_material_uses_componentProductId_organisatio_fkey" FOREIGN KEY ("componentProductId", "organisationId") REFERENCES "products"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manufacturing_material_uses" ADD CONSTRAINT "manufacturing_material_uses_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manufacturing_material_uses" ADD CONSTRAINT "manufacturing_material_uses_reportId_organisationId_fkey" FOREIGN KEY ("reportId", "organisationId") REFERENCES "manufacturing_production_reports"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manufacturing_material_uses" ADD CONSTRAINT "manufacturing_material_uses_stockAllocationId_organisation_fkey" FOREIGN KEY ("stockAllocationId", "organisationId") REFERENCES "stock_movement_allocations"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;


ALTER TABLE "manufacturing_work_orders" ADD COLUMN "loadedQuantity" DECIMAL(18,6);
ALTER TABLE "manufacturing_orders" ADD COLUMN "originOrderId" TEXT;
ALTER TABLE "manufacturing_orders" ADD CONSTRAINT "manufacturing_orders_originOrderId_organisationId_fkey" FOREIGN KEY ("originOrderId","organisationId") REFERENCES "manufacturing_orders"("id","organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "manufacturing_orders" ADD COLUMN "originRequestKey" TEXT, ADD COLUMN "originFingerprint" TEXT;
CREATE UNIQUE INDEX "manufacturing_orders_organisationId_originRequestKey_key" ON "manufacturing_orders"("organisationId","originRequestKey");

-- Protect physical facts even when a future caller bypasses application forms.
ALTER TABLE "manufacturing_production_reports" ADD CONSTRAINT "production_report_quantities_check" CHECK ("goodQuantity">=0 AND "scrapQuantity">=0 AND "enteredGoodQuantity">=0 AND "enteredScrapQuantity">=0 AND ("final" OR "goodQuantity"+"scrapQuantity">0));
ALTER TABLE "stock_movement_allocations" ADD CONSTRAINT "stock_allocation_quantity_check" CHECK ("quantity">0 AND "direction" IN ('IN','OUT'));
ALTER TABLE "manufacturing_material_uses" ADD CONSTRAINT "manufacturing_material_use_quantity_check" CHECK ("quantity">0);
ALTER TABLE "manufacturing_machine_loads" ADD CONSTRAINT "machine_load_capacity_check" CHECK ("capacity">0 AND "occupiedCapacity">0 AND "occupiedCapacity"<="capacity" AND "startsAt"<"endsAt" AND "status" IN ('PLANNED','RUNNING','COMPLETE','CANCELLED'));
ALTER TABLE "manufacturing_work_orders" ADD CONSTRAINT "work_order_loaded_quantity_check" CHECK ("loadedQuantity" IS NULL OR "loadedQuantity">=0);

-- One physical holding batch per output report; retain all earlier handoff records.
ALTER TABLE "stock_production_batches" ADD COLUMN "requestKey" TEXT, ADD COLUMN "productionReportId" TEXT, ADD COLUMN "serials" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
-- The legacy one-batch-per-order index is retained until the Decimal-capable rollback runtime is live.
CREATE INDEX "stock_production_batches_manufacturingOrderId_organisationI_idx" ON "stock_production_batches"("manufacturingOrderId","organisationId");
CREATE UNIQUE INDEX "stock_production_batches_organisationId_requestKey_key" ON "stock_production_batches"("organisationId","requestKey");
ALTER TABLE "stock_production_batches" ADD CONSTRAINT "stock_production_batches_productionReportId_organisationId_fkey" FOREIGN KEY ("productionReportId","organisationId") REFERENCES "manufacturing_production_reports"("id","organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stock_production_batches" ADD CONSTRAINT "production_batch_collection_quantity_check" CHECK ("quantity">0 AND "collectedQuantity">=0 AND "collectedQuantity"<="quantity");
ALTER TABLE "stock_production_collections" ADD CONSTRAINT "production_collection_quantity_check" CHECK ("quantity">0);

ALTER TABLE "stock_production_collections" ADD COLUMN "serials" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Completed operational history is immutable, including through the central data service.
CREATE FUNCTION atlas_guard_manufacturing_evidence() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='DELETE' AND current_setting('atlas.test_wipe',true)='on'
   AND EXISTS (SELECT 1 FROM organisations WHERE id=OLD."organisationId" AND "isTest" AND kind='CUSTOMER') THEN RETURN OLD; END IF;
 RAISE EXCEPTION 'Manufacturing evidence is immutable; retain the original report and allocations.';
END $$;
CREATE TRIGGER manufacturing_report_history_guard BEFORE UPDATE OR DELETE ON manufacturing_production_reports FOR EACH ROW EXECUTE FUNCTION atlas_guard_manufacturing_evidence();
CREATE TRIGGER manufacturing_material_history_guard BEFORE UPDATE OR DELETE ON manufacturing_material_uses FOR EACH ROW EXECUTE FUNCTION atlas_guard_manufacturing_evidence();
CREATE TRIGGER stock_allocation_history_guard BEFORE UPDATE OR DELETE ON stock_movement_allocations FOR EACH ROW EXECUTE FUNCTION atlas_guard_manufacturing_evidence();
