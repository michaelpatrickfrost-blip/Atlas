CREATE TYPE "SchedulingWorkCategory" AS ENUM ('OFFICE', 'PRODUCTION', 'CONTACT', 'FIELD', 'TRAINING', 'ON_CALL', 'OTHER');

CREATE TABLE "scheduling_work_types" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "category" "SchedulingWorkCategory" NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "breakMinutes" INTEGER NOT NULL DEFAULT 30,
  "weekdays" INTEGER[] DEFAULT ARRAY[1, 2, 3, 4, 5]::INTEGER[],
  "teamId" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "scheduling_work_types_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "scheduling_demands" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "demandDate" DATE NOT NULL,
  "teamId" TEXT NOT NULL DEFAULT '',
  "department" TEXT NOT NULL DEFAULT '',
  "workTypeId" TEXT NOT NULL DEFAULT '',
  "label" TEXT NOT NULL DEFAULT '',
  "forecastVolume" INTEGER,
  "volumeUnit" TEXT NOT NULL DEFAULT 'contacts',
  "minutesPerUnit" INTEGER,
  "shrinkagePercent" INTEGER NOT NULL DEFAULT 0,
  "requiredMinutes" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "scheduling_demands_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "scheduling_calendar_rules" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "startsOn" DATE NOT NULL,
  "endsOn" DATE NOT NULL,
  "teamId" TEXT NOT NULL DEFAULT '',
  "department" TEXT NOT NULL DEFAULT '',
  "maxOffPerDay" INTEGER,
  "blockHolidays" BOOLEAN NOT NULL DEFAULT false,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "scheduling_calendar_rules_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "hr_rota_shifts" ADD COLUMN "workTypeId" TEXT,
ADD COLUMN "teamId" TEXT;

CREATE UNIQUE INDEX "scheduling_work_types_organisationId_name_key" ON "scheduling_work_types"("organisationId", "name");
CREATE INDEX "scheduling_work_types_organisationId_active_idx" ON "scheduling_work_types"("organisationId", "active");
CREATE UNIQUE INDEX "scheduling_demands_day_key" ON "scheduling_demands"("organisationId", "demandDate", "teamId", "department", "workTypeId");
CREATE INDEX "scheduling_demands_organisationId_demandDate_idx" ON "scheduling_demands"("organisationId", "demandDate");
CREATE INDEX "scheduling_calendar_rules_organisationId_startsOn_idx" ON "scheduling_calendar_rules"("organisationId", "startsOn");
CREATE INDEX "hr_rota_shifts_organisationId_workTypeId_idx" ON "hr_rota_shifts"("organisationId", "workTypeId");
CREATE INDEX "hr_rota_shifts_organisationId_teamId_idx" ON "hr_rota_shifts"("organisationId", "teamId");

ALTER TABLE "scheduling_work_types" ADD CONSTRAINT "scheduling_work_types_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "scheduling_work_types" ADD CONSTRAINT "scheduling_work_types_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "work_teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "scheduling_demands" ADD CONSTRAINT "scheduling_demands_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "scheduling_calendar_rules" ADD CONSTRAINT "scheduling_calendar_rules_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "hr_rota_shifts" ADD CONSTRAINT "hr_rota_shifts_workTypeId_fkey" FOREIGN KEY ("workTypeId") REFERENCES "scheduling_work_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "hr_rota_shifts" ADD CONSTRAINT "hr_rota_shifts_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "work_teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "scheduling_work_types" ADD CONSTRAINT "scheduling_work_types_break_check" CHECK ("breakMinutes" >= 0 AND "breakMinutes" < 1440);
ALTER TABLE "scheduling_demands" ADD CONSTRAINT "scheduling_demands_shrinkage_check" CHECK ("shrinkagePercent" >= 0 AND "shrinkagePercent" <= 80);
ALTER TABLE "scheduling_demands" ADD CONSTRAINT "scheduling_demands_volume_check" CHECK ("forecastVolume" IS NULL OR ("forecastVolume" >= 0 AND "forecastVolume" <= 1000000));
ALTER TABLE "scheduling_demands" ADD CONSTRAINT "scheduling_demands_minutes_check" CHECK (("minutesPerUnit" IS NULL OR ("minutesPerUnit" >= 1 AND "minutesPerUnit" <= 1440)) AND ("requiredMinutes" IS NULL OR ("requiredMinutes" >= 0 AND "requiredMinutes" <= 60000000)));
ALTER TABLE "scheduling_calendar_rules" ADD CONSTRAINT "scheduling_calendar_rules_range_check" CHECK ("endsOn" >= "startsOn");
ALTER TABLE "scheduling_calendar_rules" ADD CONSTRAINT "scheduling_calendar_rules_cap_check" CHECK ("maxOffPerDay" IS NULL OR ("maxOffPerDay" >= 0 AND "maxOffPerDay" <= 10000));
