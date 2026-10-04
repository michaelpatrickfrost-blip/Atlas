CREATE TYPE "HrPolicyAudience" AS ENUM ('EVERYONE', 'MANAGERS', 'HR');
CREATE TYPE "HrPolicyStatus" AS ENUM ('PUBLISHED', 'ARCHIVED');
CREATE TYPE "PerformancePlanStatus" AS ENUM ('DRAFT', 'ACTIVE', 'REVIEW', 'EXTENDED', 'ACHIEVED', 'NOT_MET', 'CLOSED');
CREATE TYPE "DisciplinaryStage" AS ENUM ('INFORMAL', 'INVESTIGATION', 'HEARING', 'FIRST_WARNING', 'FINAL_WARNING', 'DISMISSAL', 'NO_ACTION');
CREATE TYPE "DisciplinaryStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'DECIDED', 'APPEAL', 'CLOSED');
CREATE TYPE "DisciplinaryEventKind" AS ENUM ('NOTE', 'MEETING', 'WARNING', 'APPEAL', 'OUTCOME');

CREATE TABLE "hr_policies" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "summary" TEXT,
  "audience" "HrPolicyAudience" NOT NULL DEFAULT 'EVERYONE',
  "status" "HrPolicyStatus" NOT NULL DEFAULT 'PUBLISHED',
  "effectiveOn" DATE NOT NULL,
  "reviewOn" DATE,
  "fileName" TEXT NOT NULL,
  "checksum" TEXT NOT NULL,
  "content" BYTEA NOT NULL,
  "uploadedByUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "hr_policies_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "hr_policies_organisationId_status_idx" ON "hr_policies"("organisationId", "status");
ALTER TABLE "hr_policies" ADD CONSTRAINT "hr_policies_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "hr_performance_plans" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "ownerUserId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "support" TEXT,
  "startOn" DATE NOT NULL,
  "reviewOn" DATE NOT NULL,
  "endOn" DATE NOT NULL,
  "status" "PerformancePlanStatus" NOT NULL DEFAULT 'DRAFT',
  "objectives" JSONB NOT NULL,
  "employeeComment" TEXT,
  "outcome" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "hr_performance_plans_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "hr_performance_plans_organisationId_employeeId_status_idx" ON "hr_performance_plans"("organisationId", "employeeId", "status");
ALTER TABLE "hr_performance_plans" ADD CONSTRAINT "hr_performance_plans_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "hr_performance_plans" ADD CONSTRAINT "hr_performance_plans_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "hr_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "hr_performance_reviews" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "heldOn" DATE NOT NULL,
  "progress" TEXT NOT NULL,
  "managerNotes" TEXT,
  "employeeNotes" TEXT,
  "authorUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "hr_performance_reviews_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "hr_performance_reviews_organisationId_planId_idx" ON "hr_performance_reviews"("organisationId", "planId");
ALTER TABLE "hr_performance_reviews" ADD CONSTRAINT "hr_performance_reviews_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "hr_performance_reviews" ADD CONSTRAINT "hr_performance_reviews_planId_fkey" FOREIGN KEY ("planId") REFERENCES "hr_performance_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "hr_disciplinary_cases" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "ownerUserId" TEXT NOT NULL,
  "planId" TEXT,
  "reference" TEXT NOT NULL,
  "stage" "DisciplinaryStage" NOT NULL DEFAULT 'INFORMAL',
  "status" "DisciplinaryStatus" NOT NULL DEFAULT 'OPEN',
  "allegation" TEXT NOT NULL,
  "facts" TEXT,
  "employeeResponse" TEXT,
  "hearingOn" TIMESTAMP(3),
  "outcome" TEXT,
  "sanction" TEXT,
  "appealBy" DATE,
  "confidentialNotes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "hr_disciplinary_cases_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "hr_disciplinary_cases_organisationId_reference_key" ON "hr_disciplinary_cases"("organisationId", "reference");
CREATE INDEX "hr_disciplinary_cases_organisationId_employeeId_status_idx" ON "hr_disciplinary_cases"("organisationId", "employeeId", "status");
ALTER TABLE "hr_disciplinary_cases" ADD CONSTRAINT "hr_disciplinary_cases_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "hr_disciplinary_cases" ADD CONSTRAINT "hr_disciplinary_cases_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "hr_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "hr_disciplinary_cases" ADD CONSTRAINT "hr_disciplinary_cases_planId_fkey" FOREIGN KEY ("planId") REFERENCES "hr_performance_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "hr_disciplinary_events" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "caseId" TEXT NOT NULL,
  "kind" "DisciplinaryEventKind" NOT NULL,
  "occurredOn" DATE NOT NULL,
  "summary" TEXT NOT NULL,
  "detail" TEXT,
  "shared" BOOLEAN NOT NULL DEFAULT false,
  "authorUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "hr_disciplinary_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "hr_disciplinary_events_organisationId_caseId_idx" ON "hr_disciplinary_events"("organisationId", "caseId");
ALTER TABLE "hr_disciplinary_events" ADD CONSTRAINT "hr_disciplinary_events_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "hr_disciplinary_events" ADD CONSTRAINT "hr_disciplinary_events_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "hr_disciplinary_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

UPDATE "roles"
SET "capabilities" = ARRAY(SELECT DISTINCT unnest("capabilities" || ARRAY['people.holiday.self', 'people.policy.read']::text[]));

UPDATE "roles"
SET "capabilities" = ARRAY(SELECT DISTINCT unnest("capabilities" || ARRAY['people.policy.manage', 'people.conduct.read', 'people.conduct.manage']::text[]))
WHERE "key" IN ('admin', 'hr_manager');

UPDATE "roles"
SET "capabilities" = ARRAY(SELECT DISTINCT unnest("capabilities" || ARRAY['people.conduct.read', 'people.conduct.manage']::text[]))
WHERE "key" = 'team_manager';

INSERT INTO "roles" ("id", "organisationId", "key", "name", "capabilities", "createdAt")
SELECT 'role_staff_' || o."id", o."id", 'staff', 'Staff',
  ARRAY['people.holiday.self', 'people.policy.read', 'scheduling.read', 'core.chat.read', 'core.chat.write']::text[],
  CURRENT_TIMESTAMP
FROM "organisations" o
WHERE NOT EXISTS (SELECT 1 FROM "roles" r WHERE r."organisationId" = o."id" AND r."key" = 'staff');
