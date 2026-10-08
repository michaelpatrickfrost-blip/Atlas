-- AlterTable
ALTER TABLE "hr_employee_documents" ADD COLUMN     "expiresOn" DATE,
ADD COLUMN     "issuedOn" DATE,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "hr_vacancies" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "department" TEXT,
    "location" TEXT,
    "employmentType" "EmploymentType" NOT NULL DEFAULT 'FULL_TIME',
    "description" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "targetStartOn" DATE,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_vacancies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_applications" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "vacancyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "source" TEXT,
    "evidenceUrl" TEXT,
    "notes" TEXT,
    "stage" TEXT NOT NULL DEFAULT 'APPLIED',
    "interviewOn" TIMESTAMP(3),
    "employeeId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_employee_training" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "provider" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "dueOn" DATE,
    "completedOn" DATE,
    "expiresOn" DATE,
    "evidenceUrl" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_employee_training_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "hr_vacancies_organisationId_status_idx" ON "hr_vacancies"("organisationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "hr_vacancies_id_organisationId_key" ON "hr_vacancies"("id", "organisationId");

-- CreateIndex
CREATE INDEX "hr_applications_organisationId_stage_idx" ON "hr_applications"("organisationId", "stage");

-- CreateIndex
CREATE UNIQUE INDEX "hr_applications_vacancyId_email_key" ON "hr_applications"("vacancyId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "hr_applications_employeeId_organisationId_key" ON "hr_applications"("employeeId", "organisationId");

-- CreateIndex
CREATE INDEX "hr_employee_training_organisationId_status_dueOn_idx" ON "hr_employee_training"("organisationId", "status", "dueOn");

-- CreateIndex
CREATE INDEX "hr_employee_training_organisationId_employeeId_idx" ON "hr_employee_training"("organisationId", "employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "hr_employees_id_organisationId_key" ON "hr_employees"("id", "organisationId");

-- AddForeignKey
ALTER TABLE "hr_vacancies" ADD CONSTRAINT "hr_vacancies_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_applications" ADD CONSTRAINT "hr_applications_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_applications" ADD CONSTRAINT "hr_applications_vacancyId_organisationId_fkey" FOREIGN KEY ("vacancyId", "organisationId") REFERENCES "hr_vacancies"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_applications" ADD CONSTRAINT "hr_applications_employeeId_organisationId_fkey" FOREIGN KEY ("employeeId", "organisationId") REFERENCES "hr_employees"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_employee_training" ADD CONSTRAINT "hr_employee_training_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_employee_training" ADD CONSTRAINT "hr_employee_training_employeeId_organisationId_fkey" FOREIGN KEY ("employeeId", "organisationId") REFERENCES "hr_employees"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Defensive lifecycle invariants; no existing records are deleted or reclassified.
ALTER TABLE "hr_vacancies" ADD CONSTRAINT "hr_vacancies_status_check" CHECK ("status" IN ('OPEN','ON_HOLD','CLOSED'));
ALTER TABLE "hr_applications" ADD CONSTRAINT "hr_applications_stage_check" CHECK ("stage" IN ('APPLIED','SCREENING','INTERVIEW','OFFER','HIRED','REJECTED','WITHDRAWN'));
ALTER TABLE "hr_applications" ADD CONSTRAINT "hr_applications_handover_check" CHECK (("stage" = 'HIRED') = ("employeeId" IS NOT NULL));
ALTER TABLE "hr_employee_training" ADD CONSTRAINT "hr_employee_training_status_check" CHECK ("status" IN ('PLANNED','IN_PROGRESS','COMPLETED','CANCELLED'));
ALTER TABLE "hr_employee_training" ADD CONSTRAINT "hr_employee_training_completion_check" CHECK (("status" = 'COMPLETED' AND "completedOn" IS NOT NULL AND ("expiresOn" IS NULL OR "expiresOn" >= "completedOn")) OR ("status" <> 'COMPLETED' AND "completedOn" IS NULL AND "expiresOn" IS NULL));
ALTER TABLE "hr_employee_documents" ADD CONSTRAINT "hr_employee_documents_dates_check" CHECK ("issuedOn" IS NULL OR "expiresOn" IS NULL OR "expiresOn" >= "issuedOn");
