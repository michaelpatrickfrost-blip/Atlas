ALTER TABLE "product_operations"
 ADD COLUMN "timingMode" TEXT NOT NULL DEFAULT 'PER_UNIT',
 ADD COLUMN "batchCapacity" DECIMAL(18,6) NOT NULL DEFAULT 1,
 ADD COLUMN "cycleMinutes" DECIMAL(18,6) NOT NULL DEFAULT 0,
 ADD COLUMN "coolingMinutes" DECIMAL(18,6) NOT NULL DEFAULT 0,
 ADD COLUMN "waitMinutes" DECIMAL(18,6) NOT NULL DEFAULT 0,
 ADD COLUMN "eligibleResourceIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "manufacturing_resources"
 ADD COLUMN "processKind" TEXT NOT NULL DEFAULT 'GENERAL',
 ADD COLUMN "calendarMode" TEXT NOT NULL DEFAULT 'CONTINUOUS',
 ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'Europe/London';
CREATE UNIQUE INDEX "manufacturing_resources_id_organisationId_key" ON "manufacturing_resources"("id","organisationId");
ALTER TABLE "manufacturing_work_orders"
 ADD COLUMN "timingMode" TEXT NOT NULL DEFAULT 'PER_UNIT',
 ADD COLUMN "waitMinutes" INTEGER NOT NULL DEFAULT 0,
 ADD COLUMN "eligibleResourceIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
CREATE TABLE "manufacturing_downtime" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "organisationId" TEXT NOT NULL,
 "resourceId" TEXT NOT NULL,
 "startsAt" TIMESTAMP(3) NOT NULL,
 "endsAt" TIMESTAMP(3) NOT NULL,
 "reason" TEXT NOT NULL,
 "active" BOOLEAN NOT NULL DEFAULT true,
 "createdByUserId" TEXT NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "manufacturing_downtime_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 CONSTRAINT "manufacturing_downtime_resourceId_organisationId_fkey" FOREIGN KEY ("resourceId","organisationId") REFERENCES "manufacturing_resources"("id","organisationId") ON DELETE CASCADE ON UPDATE CASCADE,
 CONSTRAINT "manufacturing_downtime_positive_window" CHECK ("endsAt" > "startsAt")
);
CREATE INDEX "manufacturing_downtime_org_resource_active_start_idx" ON "manufacturing_downtime"("organisationId","resourceId","active","startsAt");
