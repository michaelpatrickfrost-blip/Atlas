-- CreateEnum
CREATE TYPE "PayFrequency" AS ENUM ('MONTHLY', 'WEEKLY');

-- CreateEnum
CREATE TYPE "StarterDeclaration" AS ENUM ('A', 'B', 'C');

-- CreateEnum
CREATE TYPE "StudentLoanPlan" AS ENUM ('PLAN_1', 'PLAN_2', 'PLAN_4', 'POSTGRADUATE');

-- CreateEnum
CREATE TYPE "StatutoryPayType" AS ENUM ('SSP', 'SMP');

-- CreateEnum
CREATE TYPE "PayrollDocumentType" AS ENUM ('P45', 'P60');

-- AlterTable
ALTER TABLE "hr_employees" ADD COLUMN     "bankAccountName" TEXT,
ADD COLUMN     "bankAccountNumber" TEXT,
ADD COLUMN     "bankSortCode" TEXT,
ADD COLUMN     "niCategory" TEXT NOT NULL DEFAULT 'A',
ADD COLUMN     "niNumber" TEXT,
ADD COLUMN     "payFrequency" "PayFrequency" NOT NULL DEFAULT 'MONTHLY',
ADD COLUMN     "pensionOptOut" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "starterDeclaration" "StarterDeclaration",
ADD COLUMN     "studentLoanPlan" "StudentLoanPlan",
ADD COLUMN     "taxCode" TEXT;

-- AlterTable
ALTER TABLE "hr_payslips" ADD COLUMN     "employeeNiMinorUnits" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "employeePensionMinorUnits" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "employerNiMinorUnits" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "employerPensionMinorUnits" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "statutoryPayMinorUnits" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "studentLoanMinorUnits" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "taxMinorUnits" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "payroll_settings" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "payeReference" TEXT,
    "accountsOfficeReference" TEXT,
    "currentTaxYear" TEXT NOT NULL,
    "pensionSchemeName" TEXT,
    "employerPensionPercent" DOUBLE PRECISION NOT NULL DEFAULT 3,
    "employeePensionPercent" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_tax_year_to_dates" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "taxYear" TEXT NOT NULL,
    "grossToDateMinorUnits" INTEGER NOT NULL DEFAULT 0,
    "taxToDateMinorUnits" INTEGER NOT NULL DEFAULT 0,
    "niToDateMinorUnits" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_tax_year_to_dates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_statutory_pay_records" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "absenceRecordId" TEXT NOT NULL,
    "type" "StatutoryPayType" NOT NULL,
    "weeklyRateMinorUnits" INTEGER NOT NULL,
    "qualifyingDays" INTEGER NOT NULL,
    "totalMinorUnits" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payroll_statutory_pay_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_documents" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "type" "PayrollDocumentType" NOT NULL,
    "taxYear" TEXT NOT NULL,
    "figures" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payroll_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payroll_settings_organisationId_key" ON "payroll_settings"("organisationId");

-- CreateIndex
CREATE INDEX "payroll_tax_year_to_dates_organisationId_idx" ON "payroll_tax_year_to_dates"("organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_tax_year_to_dates_employeeId_taxYear_key" ON "payroll_tax_year_to_dates"("employeeId", "taxYear");

-- CreateIndex
CREATE INDEX "payroll_statutory_pay_records_organisationId_employeeId_idx" ON "payroll_statutory_pay_records"("organisationId", "employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_statutory_pay_records_absenceRecordId_key" ON "payroll_statutory_pay_records"("absenceRecordId");

-- CreateIndex
CREATE INDEX "payroll_documents_organisationId_employeeId_idx" ON "payroll_documents"("organisationId", "employeeId");

-- AddForeignKey
ALTER TABLE "payroll_settings" ADD CONSTRAINT "payroll_settings_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_tax_year_to_dates" ADD CONSTRAINT "payroll_tax_year_to_dates_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_tax_year_to_dates" ADD CONSTRAINT "payroll_tax_year_to_dates_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "hr_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_statutory_pay_records" ADD CONSTRAINT "payroll_statutory_pay_records_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_statutory_pay_records" ADD CONSTRAINT "payroll_statutory_pay_records_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "hr_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_statutory_pay_records" ADD CONSTRAINT "payroll_statutory_pay_records_absenceRecordId_fkey" FOREIGN KEY ("absenceRecordId") REFERENCES "hr_absence_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_documents" ADD CONSTRAINT "payroll_documents_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_documents" ADD CONSTRAINT "payroll_documents_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "hr_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Payroll becomes its own module/capability namespace, replacing people.payroll.*.
-- Anyone who could manage HR payroll before gets the full new payroll namespace;
-- anyone who could only read it gets payroll.run.read; the self-service cohort
-- (holiday.self) gains payroll.payslip.self so a person can see their own payslips/P60/P45.
UPDATE "roles"
SET "capabilities" = ARRAY(
  SELECT DISTINCT unnest(
    array_remove(array_remove("capabilities", 'people.payroll.manage'), 'people.payroll.read')
    || ARRAY['payroll.run.manage', 'payroll.employee.manage', 'payroll.settings.manage', 'payroll.run.read']::text[]
  )
)
WHERE 'people.payroll.manage' = ANY("capabilities");

UPDATE "roles"
SET "capabilities" = ARRAY(
  SELECT DISTINCT unnest(
    array_remove("capabilities", 'people.payroll.read') || ARRAY['payroll.run.read']::text[]
  )
)
WHERE 'people.payroll.read' = ANY("capabilities") AND NOT ('people.payroll.manage' = ANY("capabilities"));

UPDATE "roles"
SET "capabilities" = ARRAY(SELECT DISTINCT unnest("capabilities" || ARRAY['payroll.payslip.self']::text[]))
WHERE 'people.holiday.self' = ANY("capabilities");
