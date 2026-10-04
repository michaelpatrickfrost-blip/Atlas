-- §25-27 man-hours/shift calendars, §33 forecast demand, §46-49 lead-time-aware
-- suggested start date. Written by hand, scoped to new tables/columns only.

-- AlterTable
ALTER TABLE "manufacturing_supply_suggestions" ADD COLUMN "startBy" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "manufacturing_shifts" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "workCentreId" TEXT NOT NULL,
    "resourceId" TEXT,
    "label" TEXT NOT NULL DEFAULT '',
    "daysOfWeek" INTEGER[] NOT NULL DEFAULT ARRAY[1,2,3,4,5]::INTEGER[],
    "startMinute" INTEGER NOT NULL,
    "endMinute" INTEGER NOT NULL,
    "crewCount" INTEGER NOT NULL DEFAULT 1,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manufacturing_shifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manufacturing_demand_forecasts" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "periodStart" DATE NOT NULL,
    "quantity" DECIMAL(18,6) NOT NULL,
    "notes" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manufacturing_demand_forecasts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "manufacturing_shifts_organisationId_workCentreId_active_idx" ON "manufacturing_shifts"("organisationId", "workCentreId", "active");

-- CreateIndex
CREATE INDEX "manufacturing_shifts_organisationId_resourceId_active_idx" ON "manufacturing_shifts"("organisationId", "resourceId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "manufacturing_demand_forecasts_organisationId_productId_period_key" ON "manufacturing_demand_forecasts"("organisationId", "productId", "periodStart");

-- CreateIndex
CREATE INDEX "manufacturing_demand_forecasts_organisationId_periodStart_idx" ON "manufacturing_demand_forecasts"("organisationId", "periodStart");

-- AddForeignKey
ALTER TABLE "manufacturing_shifts" ADD CONSTRAINT "manufacturing_shifts_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manufacturing_shifts" ADD CONSTRAINT "manufacturing_shifts_workCentreId_fkey" FOREIGN KEY ("workCentreId") REFERENCES "manufacturing_work_centres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manufacturing_shifts" ADD CONSTRAINT "manufacturing_shifts_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "manufacturing_resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manufacturing_demand_forecasts" ADD CONSTRAINT "manufacturing_demand_forecasts_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manufacturing_demand_forecasts" ADD CONSTRAINT "manufacturing_demand_forecasts_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
