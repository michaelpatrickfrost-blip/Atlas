ALTER TABLE "contract_documents"
 ADD COLUMN "opportunityId" TEXT, ADD COLUMN "sourceModule" TEXT, ADD COLUMN "sourceType" TEXT,
 ADD COLUMN "sourceId" TEXT, ADD COLUMN "templateId" TEXT, ADD COLUMN "templateVersion" INTEGER,
 ADD COLUMN "templateSnapshot" JSONB, ADD COLUMN "signingMode" TEXT NOT NULL DEFAULT 'BOTH',
 ADD COLUMN "completionMethod" TEXT;
CREATE INDEX "contract_documents_organisationId_opportunityId_idx" ON "contract_documents"("organisationId","opportunityId");
CREATE INDEX "contract_documents_organisationId_sourceModule_sourceType_sou_idx" ON "contract_documents"("organisationId","sourceModule","sourceType","sourceId");
CREATE TABLE "document_templates" (
 "id" TEXT NOT NULL PRIMARY KEY, "organisationId" TEXT NOT NULL, "name" TEXT NOT NULL,
 "description" TEXT NOT NULL DEFAULT '', "category" TEXT NOT NULL DEFAULT 'Contract',
 "targetModules" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[], "titleTemplate" TEXT NOT NULL,
 "blocks" JSONB NOT NULL, "status" TEXT NOT NULL DEFAULT 'DRAFT', "version" INTEGER NOT NULL DEFAULT 1,
 "createdBy" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "document_templates_organisationId_status_idx" ON "document_templates"("organisationId","status");
CREATE TABLE "contract_returns" (
 "id" TEXT NOT NULL PRIMARY KEY, "organisationId" TEXT NOT NULL, "contractId" TEXT NOT NULL,
 "fileName" TEXT NOT NULL, "fileSize" INTEGER NOT NULL, "fileContent" BYTEA NOT NULL,
 "contentHash" TEXT NOT NULL, "signerName" TEXT NOT NULL, "signerIp" TEXT, "signerUserAgent" TEXT,
 "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "status" TEXT NOT NULL DEFAULT 'PENDING',
 "reviewedBy" TEXT, "reviewedAt" TIMESTAMP(3), "reviewNote" TEXT,
 CONSTRAINT "contract_returns_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contract_documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "contract_returns_organisationId_contractId_submittedAt_idx" ON "contract_returns"("organisationId","contractId","submittedAt");
-- Templates is a companion to CRM, retaining the same contract capability checks.
INSERT INTO "module_states" ("id","organisationId","moduleId","enabled","entitled","installedAt","updatedAt")
 SELECT 'templates-' || "organisationId", "organisationId", 'templates', "enabled", "entitled", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
 FROM "module_states" WHERE "moduleId"='crm'
 ON CONFLICT ("organisationId","moduleId") DO NOTHING;
