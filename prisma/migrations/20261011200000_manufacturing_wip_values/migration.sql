-- AlterTable
ALTER TABLE "manufacturing_work_orders" ADD COLUMN     "crewSize" DECIMAL(18,6) NOT NULL DEFAULT 0,
ADD COLUMN     "labourMinorPerHour" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "machineIncludesLabour" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "machineIncludesOverhead" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "machineMinorPerHour" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "overheadMinorPerHour" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "finance_document_lines" ADD COLUMN     "priceQuantity" DECIMAL(18,6) NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "finance_manufacturing_profiles" (
    "approvedDefinitionIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "inventoryAccountId" TEXT NOT NULL,
    "wipAccountId" TEXT NOT NULL,
    "cogsAccountId" TEXT NOT NULL,
    "scrapAccountId" TEXT NOT NULL,
    "absorptionAccountId" TEXT NOT NULL,
    "openingAccountId" TEXT NOT NULL,
    "energyMinorPerKwh" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finance_manufacturing_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_stock_values" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "valueMinor" BIGINT NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "finance_stock_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_manufacturing_value_entries" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "productId" TEXT,
    "productionOrderId" TEXT,
    "workOrderId" TEXT,
    "movementId" TEXT,
    "journalId" TEXT,
    "sourceKey" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "quantity" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "inventoryMinor" BIGINT NOT NULL DEFAULT 0,
    "wipMinor" BIGINT NOT NULL DEFAULT 0,
    "expenseMinor" BIGINT NOT NULL DEFAULT 0,
    "machineMinutes" DECIMAL(18,6),
    "personMinutes" DECIMAL(18,6),
    "energyKwh" DECIMAL(18,6),
    "fingerprint" TEXT,
    "actorUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "finance_manufacturing_value_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "finance_manufacturing_profiles_organisationId_warehouseId_key" ON "finance_manufacturing_profiles"("organisationId", "warehouseId");

-- CreateIndex
CREATE INDEX "finance_stock_values_organisationId_entityId_idx" ON "finance_stock_values"("organisationId", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "finance_stock_values_organisationId_warehouseId_productId_key" ON "finance_stock_values"("organisationId", "warehouseId", "productId");

-- CreateIndex
CREATE INDEX "finance_manufacturing_value_entries_organisationId_producti_idx" ON "finance_manufacturing_value_entries"("organisationId", "productionOrderId", "createdAt");

-- CreateIndex
CREATE INDEX "finance_manufacturing_value_entries_organisationId_movement_idx" ON "finance_manufacturing_value_entries"("organisationId", "movementId");

-- CreateIndex
CREATE UNIQUE INDEX "finance_manufacturing_value_entries_organisationId_sourceKe_key" ON "finance_manufacturing_value_entries"("organisationId", "sourceKey");

-- AddForeignKey
ALTER TABLE "finance_manufacturing_profiles" ADD CONSTRAINT "finance_manufacturing_profiles_entityId_organisationId_fkey" FOREIGN KEY ("entityId", "organisationId") REFERENCES "finance_entities"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_manufacturing_profiles" ADD CONSTRAINT "finance_manufacturing_profiles_warehouseId_organisationId_fkey" FOREIGN KEY ("warehouseId", "organisationId") REFERENCES "warehouses"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_manufacturing_profiles" ADD CONSTRAINT "finance_manufacturing_profiles_inventoryAccountId_organisa_fkey" FOREIGN KEY ("inventoryAccountId", "organisationId") REFERENCES "finance_accounts"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_manufacturing_profiles" ADD CONSTRAINT "finance_manufacturing_profiles_wipAccountId_organisationId_fkey" FOREIGN KEY ("wipAccountId", "organisationId") REFERENCES "finance_accounts"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_manufacturing_profiles" ADD CONSTRAINT "finance_manufacturing_profiles_cogsAccountId_organisationI_fkey" FOREIGN KEY ("cogsAccountId", "organisationId") REFERENCES "finance_accounts"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_manufacturing_profiles" ADD CONSTRAINT "finance_manufacturing_profiles_scrapAccountId_organisation_fkey" FOREIGN KEY ("scrapAccountId", "organisationId") REFERENCES "finance_accounts"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_manufacturing_profiles" ADD CONSTRAINT "finance_manufacturing_profiles_absorptionAccountId_organis_fkey" FOREIGN KEY ("absorptionAccountId", "organisationId") REFERENCES "finance_accounts"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_manufacturing_profiles" ADD CONSTRAINT "finance_manufacturing_profiles_openingAccountId_organisati_fkey" FOREIGN KEY ("openingAccountId", "organisationId") REFERENCES "finance_accounts"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_manufacturing_profiles" ADD CONSTRAINT "finance_manufacturing_profiles_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_stock_values" ADD CONSTRAINT "finance_stock_values_entityId_organisationId_fkey" FOREIGN KEY ("entityId", "organisationId") REFERENCES "finance_entities"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_stock_values" ADD CONSTRAINT "finance_stock_values_warehouseId_organisationId_fkey" FOREIGN KEY ("warehouseId", "organisationId") REFERENCES "warehouses"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_stock_values" ADD CONSTRAINT "finance_stock_values_productId_organisationId_fkey" FOREIGN KEY ("productId", "organisationId") REFERENCES "products"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_stock_values" ADD CONSTRAINT "finance_stock_values_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_manufacturing_value_entries" ADD CONSTRAINT "finance_manufacturing_value_entries_entityId_organisationI_fkey" FOREIGN KEY ("entityId", "organisationId") REFERENCES "finance_entities"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_manufacturing_value_entries" ADD CONSTRAINT "finance_manufacturing_value_entries_warehouseId_organisati_fkey" FOREIGN KEY ("warehouseId", "organisationId") REFERENCES "warehouses"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_manufacturing_value_entries" ADD CONSTRAINT "finance_manufacturing_value_entries_productId_organisation_fkey" FOREIGN KEY ("productId", "organisationId") REFERENCES "products"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_manufacturing_value_entries" ADD CONSTRAINT "finance_manufacturing_value_entries_productionOrderId_orga_fkey" FOREIGN KEY ("productionOrderId", "organisationId") REFERENCES "manufacturing_orders"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_manufacturing_value_entries" ADD CONSTRAINT "finance_manufacturing_value_entries_workOrderId_organisati_fkey" FOREIGN KEY ("workOrderId", "organisationId") REFERENCES "manufacturing_work_orders"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_manufacturing_value_entries" ADD CONSTRAINT "finance_manufacturing_value_entries_movementId_organisatio_fkey" FOREIGN KEY ("movementId", "organisationId") REFERENCES "inventory_movements"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_manufacturing_value_entries" ADD CONSTRAINT "finance_manufacturing_value_entries_journalId_organisation_fkey" FOREIGN KEY ("journalId", "organisationId") REFERENCES "finance_journals"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_manufacturing_value_entries" ADD CONSTRAINT "finance_manufacturing_value_entries_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


ALTER TABLE "manufacturing_work_orders" ADD COLUMN "costBasisCaptured" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "finance_stock_values" ADD CONSTRAINT "finance_stock_value_nonnegative_check" CHECK ("quantity">=0 AND "valueMinor">=0 AND ("quantity">0 OR "valueMinor"=0));
ALTER TABLE "finance_manufacturing_profiles" ADD CONSTRAINT "manufacturing_energy_rate_check" CHECK ("energyMinorPerKwh">=0);
ALTER TABLE "finance_document_lines" ADD CONSTRAINT "finance_price_quantity_positive_check" CHECK ("priceQuantity">0);
ALTER TABLE "manufacturing_work_orders" ADD CONSTRAINT "manufacturing_rate_snapshot_check" CHECK ("machineMinorPerHour">=0 AND "labourMinorPerHour">=0 AND "overheadMinorPerHour">=0 AND "crewSize">=0);
CREATE TRIGGER manufacturing_value_history_guard BEFORE UPDATE OR DELETE ON finance_manufacturing_value_entries FOR EACH ROW EXECUTE FUNCTION atlas_guard_manufacturing_evidence();
