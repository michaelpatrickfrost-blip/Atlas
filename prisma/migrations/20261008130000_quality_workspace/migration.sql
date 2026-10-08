-- Additive only: preserve existing NCR records, references and workflow states.
ALTER TABLE "non_conformances" ADD COLUMN "ownerUserId" TEXT,
ADD COLUMN "dueAt" TIMESTAMP(3), ADD COLUMN "workspace" JSONB NOT NULL DEFAULT '{}';
CREATE INDEX "non_conformances_organisationId_ownerUserId_dueAt_idx"
ON "non_conformances"("organisationId", "ownerUserId", "dueAt");
