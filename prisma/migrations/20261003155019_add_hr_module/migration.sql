-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('ONBOARDING', 'ACTIVE', 'ON_LEAVE', 'OFFBOARDING', 'LEFT');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('FULL_TIME', 'PART_TIME', 'FIXED_TERM', 'CONTRACTOR', 'APPRENTICE');

-- CreateEnum
CREATE TYPE "EmployeeTaskPhase" AS ENUM ('ONBOARDING', 'OFFBOARDING');

-- CreateEnum
CREATE TYPE "AppraisalStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AppraisalRating" AS ENUM ('EXCEEDS', 'MEETS', 'DEVELOPING', 'UNSATISFACTORY');

-- CreateEnum
CREATE TYPE "OneToOneStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AbsenceType" AS ENUM ('SICKNESS', 'HOLIDAY', 'UNPAID', 'COMPASSIONATE', 'MATERNITY_PATERNITY', 'OTHER');

-- CreateEnum
CREATE TYPE "RotaShiftStatus" AS ENUM ('SCHEDULED', 'CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PayrollRunStatus" AS ENUM ('DRAFT', 'FINALISED', 'PAID');

-- DropForeignKey
ALTER TABLE "domain_outbox" DROP CONSTRAINT "domain_outbox_organisationId_fkey";

-- DropForeignKey
ALTER TABLE "platform_administrators" DROP CONSTRAINT "platform_administrators_userid_fkey";

-- DropForeignKey
ALTER TABLE "sales_order_revisions" DROP CONSTRAINT "sales_order_revisions_orderId_fkey";

-- DropForeignKey
ALTER TABLE "sales_quotation_templates" DROP CONSTRAINT "sales_quotation_templates_organisationId_fkey";

-- CreateTable
CREATE TABLE "hr_employees" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "userId" TEXT,
    "managerId" TEXT,
    "employeeNumber" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "preferredName" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "jobTitle" TEXT NOT NULL,
    "department" TEXT,
    "employmentType" "EmploymentType" NOT NULL DEFAULT 'FULL_TIME',
    "status" "EmployeeStatus" NOT NULL DEFAULT 'ONBOARDING',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "leaveReason" TEXT,
    "annualSalaryMinorUnits" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "annualLeaveDaysEntitlement" INTEGER NOT NULL DEFAULT 25,
    "address" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_employee_tasks" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "phase" "EmployeeTaskPhase" NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT,
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "assignedToUserId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_employee_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_appraisals" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "reviewerUserId" TEXT NOT NULL,
    "cycle" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "status" "AppraisalStatus" NOT NULL DEFAULT 'SCHEDULED',
    "rating" "AppraisalRating",
    "strengths" TEXT,
    "areasForGrowth" TEXT,
    "goals" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_appraisals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_one_to_ones" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "managerUserId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "status" "OneToOneStatus" NOT NULL DEFAULT 'SCHEDULED',
    "talkingPoints" TEXT,
    "actionPoints" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_one_to_ones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_absence_records" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "type" "AbsenceType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "certifiedByDoctor" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_absence_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_rota_shifts" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "role" TEXT,
    "location" TEXT,
    "status" "RotaShiftStatus" NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_rota_shifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_payroll_runs" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "periodLabel" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "status" "PayrollRunStatus" NOT NULL DEFAULT 'DRAFT',
    "finalisedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_payroll_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_payslips" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "payrollRunId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "grossMinorUnits" INTEGER NOT NULL,
    "deductionsMinorUnits" INTEGER NOT NULL DEFAULT 0,
    "netMinorUnits" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_payslips_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "hr_employees_organisationId_idx" ON "hr_employees"("organisationId");

-- CreateIndex
CREATE INDEX "hr_employees_organisationId_status_idx" ON "hr_employees"("organisationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "hr_employees_organisationId_employeeNumber_key" ON "hr_employees"("organisationId", "employeeNumber");

-- CreateIndex
CREATE INDEX "hr_employee_tasks_organisationId_employeeId_phase_idx" ON "hr_employee_tasks"("organisationId", "employeeId", "phase");

-- CreateIndex
CREATE INDEX "hr_appraisals_organisationId_employeeId_idx" ON "hr_appraisals"("organisationId", "employeeId");

-- CreateIndex
CREATE INDEX "hr_one_to_ones_organisationId_employeeId_idx" ON "hr_one_to_ones"("organisationId", "employeeId");

-- CreateIndex
CREATE INDEX "hr_absence_records_organisationId_employeeId_type_idx" ON "hr_absence_records"("organisationId", "employeeId", "type");

-- CreateIndex
CREATE INDEX "hr_rota_shifts_organisationId_startsAt_idx" ON "hr_rota_shifts"("organisationId", "startsAt");

-- CreateIndex
CREATE INDEX "hr_payroll_runs_organisationId_idx" ON "hr_payroll_runs"("organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "hr_payroll_runs_organisationId_periodLabel_key" ON "hr_payroll_runs"("organisationId", "periodLabel");

-- CreateIndex
CREATE INDEX "hr_payslips_organisationId_idx" ON "hr_payslips"("organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "hr_payslips_payrollRunId_employeeId_key" ON "hr_payslips"("payrollRunId", "employeeId");

-- RenameForeignKey
ALTER TABLE "customer_commercial_settings" RENAME CONSTRAINT "customer_commercial_settings_pricelist_fkey" TO "customer_commercial_settings_priceList_fkey";

-- AddForeignKey
ALTER TABLE "platform_administrators" ADD CONSTRAINT "platform_administrators_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_quotation_templates" ADD CONSTRAINT "sales_quotation_templates_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_order_revisions" ADD CONSTRAINT "sales_order_revisions_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "sales_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "domain_outbox" ADD CONSTRAINT "domain_outbox_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_employees" ADD CONSTRAINT "hr_employees_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_employees" ADD CONSTRAINT "hr_employees_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_employees" ADD CONSTRAINT "hr_employees_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "hr_employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_employee_tasks" ADD CONSTRAINT "hr_employee_tasks_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_employee_tasks" ADD CONSTRAINT "hr_employee_tasks_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "hr_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_appraisals" ADD CONSTRAINT "hr_appraisals_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_appraisals" ADD CONSTRAINT "hr_appraisals_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "hr_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_one_to_ones" ADD CONSTRAINT "hr_one_to_ones_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_one_to_ones" ADD CONSTRAINT "hr_one_to_ones_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "hr_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_absence_records" ADD CONSTRAINT "hr_absence_records_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_absence_records" ADD CONSTRAINT "hr_absence_records_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "hr_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_rota_shifts" ADD CONSTRAINT "hr_rota_shifts_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_rota_shifts" ADD CONSTRAINT "hr_rota_shifts_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "hr_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_payroll_runs" ADD CONSTRAINT "hr_payroll_runs_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_payslips" ADD CONSTRAINT "hr_payslips_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_payslips" ADD CONSTRAINT "hr_payslips_payrollRunId_fkey" FOREIGN KEY ("payrollRunId") REFERENCES "hr_payroll_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_payslips" ADD CONSTRAINT "hr_payslips_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "hr_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "domain_outbox_status_created_idx" RENAME TO "domain_outbox_status_createdAt_idx";

-- RenameIndex
ALTER INDEX "sales_order_revisions_order_revision_key" RENAME TO "sales_order_revisions_orderId_revision_key";

-- RenameIndex
ALTER INDEX "sales_quotation_templates_organisation_name_key" RENAME TO "sales_quotation_templates_organisationId_name_key";
