-- AlterTable
ALTER TABLE "hr_employees" ADD COLUMN     "appraisalCadenceMonths" INTEGER,
ADD COLUMN     "oneToOneCadenceWeeks" INTEGER,
ADD COLUMN     "skills" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "hr_payslips" ADD COLUMN     "overtimeHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "overtimeMinorUnits" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "unpaidLeaveDays" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "unpaidLeaveDeductionMinorUnits" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "organisations" ADD COLUMN     "hrAppraisalCadenceMonths" INTEGER NOT NULL DEFAULT 6,
ADD COLUMN     "hrOneToOneCadenceWeeks" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "hrOvertimeMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.5,
ADD COLUMN     "hrStandardWeeklyHours" DOUBLE PRECISION NOT NULL DEFAULT 37.5;

-- CreateTable
CREATE TABLE "hr_employee_history_events" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_employee_history_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_employee_documents" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT,
    "url" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_employee_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "hr_employee_history_events_organisationId_employeeId_idx" ON "hr_employee_history_events"("organisationId", "employeeId");

-- CreateIndex
CREATE INDEX "hr_employee_documents_organisationId_employeeId_idx" ON "hr_employee_documents"("organisationId", "employeeId");

-- AddForeignKey
ALTER TABLE "hr_employee_history_events" ADD CONSTRAINT "hr_employee_history_events_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_employee_history_events" ADD CONSTRAINT "hr_employee_history_events_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "hr_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_employee_documents" ADD CONSTRAINT "hr_employee_documents_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_employee_documents" ADD CONSTRAINT "hr_employee_documents_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "hr_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
