-- DropForeignKey
ALTER TABLE "inventory_balances" DROP CONSTRAINT "inventory_balances_productId_fkey";

-- DropForeignKey
ALTER TABLE "inventory_movements" DROP CONSTRAINT "inventory_movements_productId_fkey";

-- AlterTable
ALTER TABLE "meetings" ADD COLUMN     "agenda" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "endsAt" TIMESTAMP(3),
ADD COLUMN     "joinUrl" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "microsoftCalendarId" TEXT,
ADD COLUMN     "microsoftEventId" TEXT,
ADD COLUMN     "microsoftOwnerUserId" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'Europe/London',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "visibility" TEXT NOT NULL DEFAULT 'COMPANY';

-- CreateTable
CREATE TABLE "meeting_entries" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "ownerUserId" TEXT,
    "dueAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "version" INTEGER NOT NULL DEFAULT 1,
    "authorUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "meeting_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "microsoft_calendar_connections" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "calendarId" TEXT NOT NULL DEFAULT 'primary',
    "calendarName" TEXT NOT NULL DEFAULT 'My Outlook calendar',
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSyncAt" TIMESTAMP(3),

    CONSTRAINT "microsoft_calendar_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meeting_oauth_states" (
    "stateHash" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "verifier" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meeting_oauth_states_pkey" PRIMARY KEY ("stateHash")
);

-- CreateTable
CREATE TABLE "maintenance_equipment" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "serialNumber" TEXT,
    "location" TEXT,
    "manufacturer" TEXT,
    "model" TEXT,
    "criticality" TEXT NOT NULL DEFAULT 'NORMAL',
    "status" TEXT NOT NULL DEFAULT 'OPERATIONAL',
    "serviceIntervalDays" INTEGER,
    "nextServiceAt" TIMESTAMP(3),
    "notes" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maintenance_equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_work_orders" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "equipmentId" TEXT,
    "vehicleId" TEXT,
    "title" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "reportedByUserId" TEXT NOT NULL,
    "assigneeUserId" TEXT,
    "dueAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "downtimeStartedAt" TIMESTAMP(3),
    "downtimeEndedAt" TIMESTAMP(3),
    "findings" TEXT,
    "resolution" TEXT,
    "actualMinutes" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maintenance_work_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_parts" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" DECIMAL(18,4) NOT NULL,
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maintenance_parts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fleet_vehicles" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "registration" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "make" TEXT,
    "model" TEXT,
    "vin" TEXT,
    "fuelType" TEXT NOT NULL DEFAULT 'DIESEL',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "driverUserId" TEXT,
    "odometer" INTEGER NOT NULL DEFAULT 0,
    "motDueAt" TIMESTAMP(3),
    "insuranceDueAt" TIMESTAMP(3),
    "serviceDueAt" TIMESTAMP(3),
    "notes" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fleet_vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fleet_logs" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "odometer" INTEGER NOT NULL,
    "quantity" DECIMAL(18,4),
    "costMinor" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "result" TEXT,
    "notes" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fleet_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "engineering_revisions" (
    "lastEditorUserId" TEXT,
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "revision" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "specification" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "authorUserId" TEXT NOT NULL,
    "reviewerUserId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "engineering_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "engineering_attachments" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "revisionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "engineering_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "field_service_jobs" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "site" TEXT NOT NULL,
    "contactName" TEXT,
    "contactPhone" TEXT,
    "engineerUserId" TEXT,
    "scheduledStart" TIMESTAMP(3) NOT NULL,
    "scheduledEnd" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/London',
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "instructions" TEXT NOT NULL,
    "findings" TEXT,
    "resolution" TEXT,
    "actualMinutes" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "field_service_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "field_service_entries" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "field_service_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "meeting_entries_organisationId_meetingId_idx" ON "meeting_entries"("organisationId", "meetingId");

-- CreateIndex
CREATE UNIQUE INDEX "microsoft_calendar_connections_organisationId_userId_key" ON "microsoft_calendar_connections"("organisationId", "userId");

-- CreateIndex
CREATE INDEX "maintenance_equipment_organisationId_status_idx" ON "maintenance_equipment"("organisationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "maintenance_equipment_id_organisationId_key" ON "maintenance_equipment"("id", "organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "maintenance_equipment_organisationId_code_key" ON "maintenance_equipment"("organisationId", "code");

-- CreateIndex
CREATE INDEX "maintenance_work_orders_organisationId_status_dueAt_idx" ON "maintenance_work_orders"("organisationId", "status", "dueAt");

-- CreateIndex
CREATE UNIQUE INDEX "maintenance_work_orders_id_organisationId_key" ON "maintenance_work_orders"("id", "organisationId");

-- CreateIndex
CREATE INDEX "maintenance_parts_organisationId_workOrderId_idx" ON "maintenance_parts"("organisationId", "workOrderId");

-- CreateIndex
CREATE INDEX "fleet_vehicles_organisationId_status_idx" ON "fleet_vehicles"("organisationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "fleet_vehicles_id_organisationId_key" ON "fleet_vehicles"("id", "organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "fleet_vehicles_organisationId_registration_key" ON "fleet_vehicles"("organisationId", "registration");

-- CreateIndex
CREATE INDEX "fleet_logs_organisationId_vehicleId_occurredAt_idx" ON "fleet_logs"("organisationId", "vehicleId", "occurredAt");

-- CreateIndex
CREATE INDEX "engineering_revisions_organisationId_status_idx" ON "engineering_revisions"("organisationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "engineering_revisions_id_organisationId_key" ON "engineering_revisions"("id", "organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "engineering_revisions_organisationId_productId_revision_key" ON "engineering_revisions"("organisationId", "productId", "revision");

-- CreateIndex
CREATE UNIQUE INDEX "engineering_attachments_storageKey_key" ON "engineering_attachments"("storageKey");

-- CreateIndex
CREATE INDEX "engineering_attachments_organisationId_revisionId_idx" ON "engineering_attachments"("organisationId", "revisionId");

-- CreateIndex
CREATE INDEX "field_service_jobs_organisationId_scheduledStart_status_idx" ON "field_service_jobs"("organisationId", "scheduledStart", "status");

-- CreateIndex
CREATE UNIQUE INDEX "field_service_jobs_id_organisationId_key" ON "field_service_jobs"("id", "organisationId");

-- CreateIndex
CREATE INDEX "field_service_entries_organisationId_jobId_idx" ON "field_service_entries"("organisationId", "jobId");

-- CreateIndex
CREATE UNIQUE INDEX "products_id_organisationId_key" ON "products"("id", "organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "meetings_id_organisationId_key" ON "meetings"("id", "organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "meetings_organisationId_microsoftOwnerUserId_microsoftCalen_key" ON "meetings"("organisationId", "microsoftOwnerUserId", "microsoftCalendarId", "microsoftEventId");

-- AddForeignKey
ALTER TABLE "inventory_balances" ADD CONSTRAINT "inventory_balances_productId_organisationId_fkey" FOREIGN KEY ("productId", "organisationId") REFERENCES "products"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_productId_organisationId_fkey" FOREIGN KEY ("productId", "organisationId") REFERENCES "products"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_entries" ADD CONSTRAINT "meeting_entries_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_entries" ADD CONSTRAINT "meeting_entries_meetingId_organisationId_fkey" FOREIGN KEY ("meetingId", "organisationId") REFERENCES "meetings"("id", "organisationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "microsoft_calendar_connections" ADD CONSTRAINT "microsoft_calendar_connections_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_oauth_states" ADD CONSTRAINT "meeting_oauth_states_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_equipment" ADD CONSTRAINT "maintenance_equipment_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_work_orders" ADD CONSTRAINT "maintenance_work_orders_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_work_orders" ADD CONSTRAINT "maintenance_work_orders_equipmentId_organisationId_fkey" FOREIGN KEY ("equipmentId", "organisationId") REFERENCES "maintenance_equipment"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_work_orders" ADD CONSTRAINT "maintenance_work_orders_vehicleId_organisationId_fkey" FOREIGN KEY ("vehicleId", "organisationId") REFERENCES "fleet_vehicles"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_parts" ADD CONSTRAINT "maintenance_parts_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_parts" ADD CONSTRAINT "maintenance_parts_workOrderId_organisationId_fkey" FOREIGN KEY ("workOrderId", "organisationId") REFERENCES "maintenance_work_orders"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_parts" ADD CONSTRAINT "maintenance_parts_productId_organisationId_fkey" FOREIGN KEY ("productId", "organisationId") REFERENCES "products"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fleet_vehicles" ADD CONSTRAINT "fleet_vehicles_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fleet_logs" ADD CONSTRAINT "fleet_logs_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fleet_logs" ADD CONSTRAINT "fleet_logs_vehicleId_organisationId_fkey" FOREIGN KEY ("vehicleId", "organisationId") REFERENCES "fleet_vehicles"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engineering_revisions" ADD CONSTRAINT "engineering_revisions_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engineering_revisions" ADD CONSTRAINT "engineering_revisions_productId_organisationId_fkey" FOREIGN KEY ("productId", "organisationId") REFERENCES "products"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engineering_attachments" ADD CONSTRAINT "engineering_attachments_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engineering_attachments" ADD CONSTRAINT "engineering_attachments_revisionId_organisationId_fkey" FOREIGN KEY ("revisionId", "organisationId") REFERENCES "engineering_revisions"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_service_jobs" ADD CONSTRAINT "field_service_jobs_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_service_jobs" ADD CONSTRAINT "field_service_jobs_partyId_organisationId_fkey" FOREIGN KEY ("partyId", "organisationId") REFERENCES "parties"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_service_entries" ADD CONSTRAINT "field_service_entries_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_service_entries" ADD CONSTRAINT "field_service_entries_jobId_organisationId_fkey" FOREIGN KEY ("jobId", "organisationId") REFERENCES "field_service_jobs"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Valid operational intervals and positive quantities; legacy meetings may have no end.
ALTER TABLE meetings ADD CONSTRAINT meeting_interval CHECK ("endsAt" IS NULL OR "endsAt">"startsAt");
ALTER TABLE maintenance_work_orders ADD CONSTRAINT maintenance_one_target CHECK (("equipmentId" IS NOT NULL)::int + ("vehicleId" IS NOT NULL)::int = 1);
ALTER TABLE maintenance_work_orders ADD CONSTRAINT maintenance_downtime_interval CHECK ("downtimeEndedAt" IS NULL OR ("downtimeStartedAt" IS NOT NULL AND "downtimeEndedAt">="downtimeStartedAt"));
ALTER TABLE maintenance_parts ADD CONSTRAINT maintenance_positive_parts CHECK(quantity>0);
ALTER TABLE fleet_vehicles ADD CONSTRAINT fleet_nonnegative_odometer CHECK(odometer>=0);
ALTER TABLE fleet_logs ADD CONSTRAINT fleet_nonnegative_log CHECK(odometer>=0 AND (quantity IS NULL OR quantity>0) AND ("costMinor" IS NULL OR "costMinor">=0));
ALTER TABLE field_service_jobs ADD CONSTRAINT field_service_interval CHECK("scheduledEnd">"scheduledStart");
CREATE UNIQUE INDEX engineering_one_released_product ON engineering_revisions("organisationId","productId") WHERE status='RELEASED';
CREATE FUNCTION atlas_engineering_revision_lock() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF NEW.status='APPROVED' AND (NEW."reviewerUserId" IS NULL OR NEW."reviewerUserId"=NEW."authorUserId" OR NEW."reviewerUserId"=NEW."lastEditorUserId") THEN RAISE EXCEPTION 'Engineering approval must be independent'; END IF;
 IF OLD."releasedAt" IS NOT NULL AND (to_jsonb(OLD)-'status'-'version') IS DISTINCT FROM (to_jsonb(NEW)-'status'-'version') THEN RAISE EXCEPTION 'Released engineering content is immutable'; END IF;
 IF OLD."releasedAt" IS NOT NULL AND NEW.status NOT IN ('RELEASED','SUPERSEDED') THEN RAISE EXCEPTION 'Released engineering status is immutable'; END IF;
 RETURN NEW; END $$;
CREATE TRIGGER engineering_revision_lock BEFORE UPDATE ON engineering_revisions FOR EACH ROW EXECUTE FUNCTION atlas_engineering_revision_lock();
CREATE FUNCTION atlas_engineering_drawing_lock() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF TG_OP='INSERT' AND NOT EXISTS(SELECT 1 FROM engineering_revisions WHERE id=NEW."revisionId" AND "organisationId"=NEW."organisationId" AND status='DRAFT') THEN RAISE EXCEPTION 'Only draft revisions accept drawings'; END IF;
 IF TG_OP='UPDATE' THEN RAISE EXCEPTION 'Engineering drawing evidence is immutable'; END IF;
 RETURN NEW; END $$;
CREATE TRIGGER engineering_drawing_lock BEFORE INSERT OR UPDATE ON engineering_attachments FOR EACH ROW EXECUTE FUNCTION atlas_engineering_drawing_lock();

ALTER TABLE meetings ADD COLUMN "microsoftManaged" BOOLEAN NOT NULL DEFAULT false;
