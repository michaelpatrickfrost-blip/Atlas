ALTER TYPE "AbsenceRequestStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';
ALTER TABLE "hr_employees" ADD COLUMN "workingDays" INTEGER[] NOT NULL DEFAULT ARRAY[1,2,3,4,5]::INTEGER[];
ALTER TABLE "hr_absence_records" ADD COLUMN "bookedDays" DOUBLE PRECISION;
ALTER TABLE "hr_rota_shifts" ADD COLUMN "breakMinutes" INTEGER NOT NULL DEFAULT 0;
CREATE TABLE "hr_employee_notes" (
 "id" TEXT PRIMARY KEY, "organisationId" TEXT NOT NULL REFERENCES "organisations"("id") ON DELETE CASCADE,
 "employeeId" TEXT NOT NULL REFERENCES "hr_employees"("id") ON DELETE CASCADE,
 "authorUserId" TEXT NOT NULL, "audience" TEXT NOT NULL DEFAULT 'MANAGER_HR', "body" TEXT NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CHECK ("audience" IN ('MANAGER_HR','HR_ONLY'))
);
CREATE INDEX "hr_employee_notes_organisationId_employeeId_createdAt_idx" ON "hr_employee_notes"("organisationId","employeeId","createdAt");
CREATE TABLE "hr_timesheets" (
 "id" TEXT PRIMARY KEY, "organisationId" TEXT NOT NULL REFERENCES "organisations"("id") ON DELETE CASCADE,
 "employeeId" TEXT NOT NULL REFERENCES "hr_employees"("id") ON DELETE CASCADE,
 "weekStart" DATE NOT NULL, "status" TEXT NOT NULL DEFAULT 'DRAFT', "submittedAt" TIMESTAMP(3),
 "submittedByUserId" TEXT, "reviewedAt" TIMESTAMP(3), "reviewedByUserId" TEXT, "reviewNote" TEXT,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
 CHECK ("status" IN ('DRAFT','SUBMITTED','APPROVED','REJECTED'))
);
CREATE UNIQUE INDEX "hr_timesheets_organisationId_employeeId_weekStart_key" ON "hr_timesheets"("organisationId","employeeId","weekStart");
CREATE INDEX "hr_timesheets_organisationId_status_weekStart_idx" ON "hr_timesheets"("organisationId","status","weekStart");
CREATE TABLE "hr_timesheet_entries" (
 "id" TEXT PRIMARY KEY, "organisationId" TEXT NOT NULL REFERENCES "organisations"("id") ON DELETE CASCADE,
 "timesheetId" TEXT NOT NULL REFERENCES "hr_timesheets"("id") ON DELETE CASCADE,
 "workedOn" DATE NOT NULL, "minutes" INTEGER NOT NULL CHECK ("minutes" BETWEEN 1 AND 1440), "description" TEXT
);
CREATE UNIQUE INDEX "hr_timesheet_entries_timesheetId_workedOn_key" ON "hr_timesheet_entries"("timesheetId","workedOn");
CREATE INDEX "hr_timesheet_entries_organisationId_idx" ON "hr_timesheet_entries"("organisationId");
CREATE TABLE "workforce_shift_tasks" (
 "id" TEXT PRIMARY KEY, "organisationId" TEXT NOT NULL REFERENCES "organisations"("id") ON DELETE CASCADE,
 "shiftId" TEXT NOT NULL REFERENCES "hr_rota_shifts"("id") ON DELETE CASCADE, "title" TEXT NOT NULL,
 "completedAt" TIMESTAMP(3), "completedByUserId" TEXT
);
CREATE INDEX "workforce_shift_tasks_organisationId_shiftId_idx" ON "workforce_shift_tasks"("organisationId","shiftId");
