-- Plans are private to the owner until shared. Plans that already exist stay visible to the company.
ALTER TABLE "plan_plans" ADD COLUMN "audience" TEXT NOT NULL DEFAULT 'private';
ALTER TABLE "plan_plans" ADD COLUMN "brief" JSONB NOT NULL DEFAULT '{}';
UPDATE "plan_plans" SET "audience" = 'company';

ALTER TABLE "plan_goals" ADD COLUMN "detail" TEXT NOT NULL DEFAULT '';
ALTER TABLE "plan_goals" ADD COLUMN "progressNote" TEXT NOT NULL DEFAULT '';
ALTER TABLE "plan_goals" ADD COLUMN "startsOn" DATE;
ALTER TABLE "plan_goals" ADD COLUMN "endsOn" DATE;

ALTER TABLE "plan_initiatives" ADD COLUMN "detail" TEXT NOT NULL DEFAULT '';
ALTER TABLE "plan_initiatives" ADD COLUMN "ownerName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "plan_initiatives" ADD COLUMN "startsOn" DATE;
ALTER TABLE "plan_initiatives" ADD COLUMN "endsOn" DATE;

ALTER TABLE "plan_actions" ADD COLUMN "detail" TEXT NOT NULL DEFAULT '';
ALTER TABLE "plan_actions" ADD COLUMN "startsOn" DATE;

ALTER TABLE "plan_updates" ADD COLUMN "detail" TEXT NOT NULL DEFAULT '';

CREATE TABLE "plan_shares" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "access" TEXT NOT NULL DEFAULT 'view',
  "sharedByUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "plan_shares_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "plan_notes" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "authorUserId" TEXT NOT NULL,
  "authorName" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "plan_notes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "plan_shares_planId_userId_key" ON "plan_shares"("planId", "userId");
CREATE INDEX "plan_shares_organisationId_userId_idx" ON "plan_shares"("organisationId", "userId");
CREATE INDEX "plan_notes_organisationId_planId_createdAt_idx" ON "plan_notes"("organisationId", "planId", "createdAt");

ALTER TABLE "plan_shares" ADD CONSTRAINT "plan_shares_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "plan_shares" ADD CONSTRAINT "plan_shares_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plan_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "plan_notes" ADD CONSTRAINT "plan_notes_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "plan_notes" ADD CONSTRAINT "plan_notes_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plan_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
