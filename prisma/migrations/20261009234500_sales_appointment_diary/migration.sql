-- Additive extension of canonical SalesActivity: existing activities and history stay intact.
ALTER TABLE "sales_activities"
  ADD COLUMN "endsAt" TIMESTAMP(3),
  ADD COLUMN "location" TEXT,
  ADD COLUMN "cancelledAt" TIMESTAMP(3),
  ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "requestKey" TEXT;
CREATE UNIQUE INDEX "sales_activities_organisationId_requestKey_key" ON "sales_activities"("organisationId", "requestKey");
ALTER TABLE "sales_activities" ADD CONSTRAINT "sales_appointment_time_check"
  CHECK ("endsAt" IS NULL OR ("dueAt" IS NOT NULL AND "endsAt" > "dueAt"));
