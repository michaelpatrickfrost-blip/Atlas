-- CreateEnum
CREATE TYPE "ExpenseClaimStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "hr_appraisals" ADD COLUMN     "answers" JSONB,
ADD COLUMN     "templateId" TEXT;

-- CreateTable
CREATE TABLE "hr_appraisal_templates" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "questions" TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_appraisal_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_expense_claims" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "amountMinorUnits" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "incurredOn" TIMESTAMP(3) NOT NULL,
    "status" "ExpenseClaimStatus" NOT NULL DEFAULT 'PENDING',
    "approverUserId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_expense_claims_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "hr_appraisal_templates_organisationId_name_key" ON "hr_appraisal_templates"("organisationId", "name");

-- CreateIndex
CREATE INDEX "hr_expense_claims_organisationId_employeeId_status_idx" ON "hr_expense_claims"("organisationId", "employeeId", "status");

-- AddForeignKey
ALTER TABLE "hr_appraisal_templates" ADD CONSTRAINT "hr_appraisal_templates_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_appraisals" ADD CONSTRAINT "hr_appraisals_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "hr_appraisal_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_expense_claims" ADD CONSTRAINT "hr_expense_claims_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_expense_claims" ADD CONSTRAINT "hr_expense_claims_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "hr_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

