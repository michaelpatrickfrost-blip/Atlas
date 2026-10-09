-- AlterEnum
ALTER TYPE "StudentLoanPlan" ADD VALUE 'PLAN_5';

-- AlterTable
ALTER TABLE "hr_employees" ADD COLUMN     "hourlyRateMinorUnits" INTEGER,
ADD COLUMN     "payBasis" TEXT NOT NULL DEFAULT 'SALARIED',
ADD COLUMN     "postgraduateLoan" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "hr_rota_shifts" ADD COLUMN     "breakStartsAt" TIMESTAMP(3),
ADD COLUMN     "requiredSkills" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "hr_payroll_runs" ADD COLUMN     "inputDigest" TEXT,
ADD COLUMN     "inputSnapshot" JSONB,
ADD COLUMN     "payFrequency" "PayFrequency",
ADD COLUMN     "taxYear" TEXT,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "hr_payslips" ADD COLUMN     "additionalPayMinorUnits" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "approvedHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "sourceTimesheetIds" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "payroll_tax_year_to_dates" ADD COLUMN     "openingGrossMinorUnits" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "openingReviewNote" TEXT,
ADD COLUMN     "openingReviewed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "openingTaxMinorUnits" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "planner_tasks" ADD COLUMN     "estimatedHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "goalId" TEXT,
ADD COLUMN     "priority" TEXT NOT NULL DEFAULT 'NORMAL',
ADD COLUMN     "startsOn" DATE,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "payroll_period_adjustments" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "statutoryPayMinorUnits" INTEGER NOT NULL DEFAULT 0,
    "additionalPayMinorUnits" INTEGER NOT NULL DEFAULT 0,
    "salaryReductionMinorUnits" INTEGER NOT NULL DEFAULT 0,
    "statutoryReviewed" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT NOT NULL,
    "reviewedByUserId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_period_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kpi_scorecards" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "ownerUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kpi_scorecards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kpi_scorecard_items" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "scorecardId" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,

    CONSTRAINT "kpi_scorecard_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staffing_intervals" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT '',
    "requiredSkills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "volume" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "handlingMinutes" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "shrinkagePercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "occupancyPercent" DOUBLE PRECISION NOT NULL DEFAULT 85,
    "minimumPeople" INTEGER NOT NULL DEFAULT 0,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staffing_intervals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rota_activities" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'WORK',
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rota_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_availability" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "open_rota_shifts" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "location" TEXT NOT NULL DEFAULT '',
    "requiredSkills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "breakMinutes" INTEGER NOT NULL DEFAULT 0,
    "breakStartsAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "assignedShiftId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "open_rota_shifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "open_shift_requests" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "openingId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewedByUserId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "open_shift_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payroll_period_adjustments_organisationId_periodStart_idx" ON "payroll_period_adjustments"("organisationId", "periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_period_adjustments_organisationId_employeeId_period_key" ON "payroll_period_adjustments"("organisationId", "employeeId", "periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "kpi_scorecards_organisationId_idx" ON "kpi_scorecards"("organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "kpi_scorecards_id_organisationId_key" ON "kpi_scorecards"("id", "organisationId");

-- CreateIndex
CREATE INDEX "kpi_scorecard_items_organisationId_idx" ON "kpi_scorecard_items"("organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "kpi_scorecard_items_scorecardId_goalId_key" ON "kpi_scorecard_items"("scorecardId", "goalId");

-- CreateIndex
CREATE INDEX "staffing_intervals_organisationId_startsAt_idx" ON "staffing_intervals"("organisationId", "startsAt");

-- CreateIndex
CREATE INDEX "rota_activities_organisationId_shiftId_startsAt_idx" ON "rota_activities"("organisationId", "shiftId", "startsAt");

-- CreateIndex
CREATE INDEX "employee_availability_organisationId_employeeId_startsAt_idx" ON "employee_availability"("organisationId", "employeeId", "startsAt");

-- CreateIndex
CREATE INDEX "open_rota_shifts_organisationId_status_startsAt_idx" ON "open_rota_shifts"("organisationId", "status", "startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "open_rota_shifts_id_organisationId_key" ON "open_rota_shifts"("id", "organisationId");

-- CreateIndex
CREATE INDEX "open_shift_requests_organisationId_status_idx" ON "open_shift_requests"("organisationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "open_shift_requests_openingId_employeeId_key" ON "open_shift_requests"("openingId", "employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "kpis_id_organisationId_key" ON "kpis"("id", "organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "hr_rota_shifts_id_organisationId_key" ON "hr_rota_shifts"("id", "organisationId");

-- AddForeignKey
ALTER TABLE "payroll_period_adjustments" ADD CONSTRAINT "payroll_period_adjustments_employeeId_organisationId_fkey" FOREIGN KEY ("employeeId", "organisationId") REFERENCES "hr_employees"("id", "organisationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kpi_scorecard_items" ADD CONSTRAINT "kpi_scorecard_items_scorecardId_organisationId_fkey" FOREIGN KEY ("scorecardId", "organisationId") REFERENCES "kpi_scorecards"("id", "organisationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kpi_scorecard_items" ADD CONSTRAINT "kpi_scorecard_items_goalId_organisationId_fkey" FOREIGN KEY ("goalId", "organisationId") REFERENCES "kpis"("id", "organisationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rota_activities" ADD CONSTRAINT "rota_activities_shiftId_organisationId_fkey" FOREIGN KEY ("shiftId", "organisationId") REFERENCES "hr_rota_shifts"("id", "organisationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_availability" ADD CONSTRAINT "employee_availability_employeeId_organisationId_fkey" FOREIGN KEY ("employeeId", "organisationId") REFERENCES "hr_employees"("id", "organisationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "open_shift_requests" ADD CONSTRAINT "open_shift_requests_openingId_organisationId_fkey" FOREIGN KEY ("openingId", "organisationId") REFERENCES "open_rota_shifts"("id", "organisationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "open_shift_requests" ADD CONSTRAINT "open_shift_requests_employeeId_organisationId_fkey" FOREIGN KEY ("employeeId", "organisationId") REFERENCES "hr_employees"("id", "organisationId") ON DELETE CASCADE ON UPDATE CASCADE;

