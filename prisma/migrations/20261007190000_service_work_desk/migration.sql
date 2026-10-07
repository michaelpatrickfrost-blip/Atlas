-- AlterTable
ALTER TABLE "service_cases" ADD COLUMN     "context" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "firstResponseDueAt" TIMESTAMP(3),
ADD COLUMN     "investigation" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "mergedIntoId" TEXT,
ADD COLUMN     "pausedAt" TIMESTAMP(3),
ADD COLUMN     "resolutionDueAt" TIMESTAMP(3),
ADD COLUMN     "sla" JSONB NOT NULL DEFAULT '{}';

-- AlterTable
ALTER TABLE "service_entries" ADD COLUMN     "sourceKey" TEXT;

-- AlterTable
ALTER TABLE "service_queues" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "configuration" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "restricted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "csat_responses" ADD COLUMN     "commentSubmittedAt" TIMESTAMP(3),
ADD COLUMN     "deliveryStatus" TEXT NOT NULL DEFAULT 'LEGACY',
ADD COLUMN     "emailMessageId" TEXT,
ADD COLUMN     "invalidReason" TEXT,
ADD COLUMN     "invalidatedAt" TIMESTAMP(3),
ADD COLUMN     "invalidatedBy" TEXT,
ADD COLUMN     "serviceContext" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "sourceKey" TEXT;

-- CreateTable
CREATE TABLE "service_work_items" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "type" TEXT NOT NULL DEFAULT 'SERVICE_REQUEST',
    "category" TEXT NOT NULL DEFAULT '',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "severity" TEXT NOT NULL DEFAULT 'MODERATE',
    "impact" TEXT NOT NULL DEFAULT 'INDIVIDUAL',
    "urgency" TEXT NOT NULL DEFAULT 'NORMAL',
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "queueId" TEXT NOT NULL,
    "requesterUserId" TEXT NOT NULL,
    "requestedForUserId" TEXT,
    "ownerUserId" TEXT,
    "watcherIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "parentCaseId" TEXT,
    "parentId" TEXT,
    "mergedIntoId" TEXT,
    "context" JSONB NOT NULL DEFAULT '{}',
    "definition" JSONB NOT NULL DEFAULT '{}',
    "sla" JSONB NOT NULL DEFAULT '{}',
    "firstResponseDueAt" TIMESTAMP(3),
    "resolutionDueAt" TIMESTAMP(3),
    "firstResponseAt" TIMESTAMP(3),
    "pausedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "reopenCount" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "approvalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_work_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_work_entries" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "workId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'INTERNAL',
    "body" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_work_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_files" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "caseId" TEXT,
    "workId" TEXT,
    "name" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'INTERNAL',
    "actorUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_recoveries" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PROPOSED',
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "value" INTEGER NOT NULL,
    "maximum" INTEGER,
    "minimumOrder" INTEGER NOT NULL DEFAULT 0,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usageLimit" INTEGER NOT NULL DEFAULT 1,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "eligibleProductIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "excludedProductIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "reason" TEXT NOT NULL,
    "creatorUserId" TEXT NOT NULL,
    "approvalId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_recoveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_redemptions" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "recoveryId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_knowledge" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT '',
    "content" TEXT NOT NULL,
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "productIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "visibility" TEXT NOT NULL DEFAULT 'INTERNAL',
    "queueId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "previousId" TEXT,
    "ownerUserId" TEXT NOT NULL,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_knowledge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "service_work_items_organisationId_queueId_status_resolution_idx" ON "service_work_items"("organisationId", "queueId", "status", "resolutionDueAt");

-- CreateIndex
CREATE INDEX "service_work_items_organisationId_requesterUserId_status_idx" ON "service_work_items"("organisationId", "requesterUserId", "status");

-- CreateIndex
CREATE INDEX "service_work_items_organisationId_parentCaseId_idx" ON "service_work_items"("organisationId", "parentCaseId");

-- CreateIndex
CREATE INDEX "service_work_items_organisationId_parentId_idx" ON "service_work_items"("organisationId", "parentId");

-- CreateIndex
CREATE UNIQUE INDEX "service_work_items_id_organisationId_key" ON "service_work_items"("id", "organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "service_work_items_organisationId_number_key" ON "service_work_items"("organisationId", "number");

-- CreateIndex
CREATE INDEX "service_work_entries_organisationId_workId_createdAt_idx" ON "service_work_entries"("organisationId", "workId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "service_files_storageKey_key" ON "service_files"("storageKey");

-- CreateIndex
CREATE INDEX "service_files_organisationId_caseId_idx" ON "service_files"("organisationId", "caseId");

-- CreateIndex
CREATE INDEX "service_files_organisationId_workId_idx" ON "service_files"("organisationId", "workId");

-- CreateIndex
CREATE INDEX "service_recoveries_organisationId_partyId_status_expiresAt_idx" ON "service_recoveries"("organisationId", "partyId", "status", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "service_recoveries_id_organisationId_key" ON "service_recoveries"("id", "organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "service_recoveries_organisationId_number_key" ON "service_recoveries"("organisationId", "number");

-- CreateIndex
CREATE INDEX "service_redemptions_organisationId_orderId_idx" ON "service_redemptions"("organisationId", "orderId");

-- CreateIndex
CREATE UNIQUE INDEX "service_redemptions_recoveryId_orderId_key" ON "service_redemptions"("recoveryId", "orderId");

-- CreateIndex
CREATE INDEX "service_knowledge_organisationId_status_category_idx" ON "service_knowledge"("organisationId", "status", "category");

-- CreateIndex
CREATE UNIQUE INDEX "service_entries_organisationId_sourceKey_key" ON "service_entries"("organisationId", "sourceKey");

-- CreateIndex
CREATE INDEX "csat_responses_organisationId_entityType_entityId_idx" ON "csat_responses"("organisationId", "entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "csat_responses_organisationId_sourceKey_key" ON "csat_responses"("organisationId", "sourceKey");

-- AddForeignKey
ALTER TABLE "service_cases" ADD CONSTRAINT "service_cases_mergedIntoId_organisationId_fkey" FOREIGN KEY ("mergedIntoId", "organisationId") REFERENCES "service_cases"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_work_items" ADD CONSTRAINT "service_work_items_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_work_items" ADD CONSTRAINT "service_work_items_queueId_organisationId_fkey" FOREIGN KEY ("queueId", "organisationId") REFERENCES "service_queues"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_work_items" ADD CONSTRAINT "service_work_items_parentCaseId_organisationId_fkey" FOREIGN KEY ("parentCaseId", "organisationId") REFERENCES "service_cases"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_work_items" ADD CONSTRAINT "service_work_items_parentId_organisationId_fkey" FOREIGN KEY ("parentId", "organisationId") REFERENCES "service_work_items"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_work_items" ADD CONSTRAINT "service_work_items_mergedIntoId_organisationId_fkey" FOREIGN KEY ("mergedIntoId", "organisationId") REFERENCES "service_work_items"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_work_entries" ADD CONSTRAINT "service_work_entries_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_work_entries" ADD CONSTRAINT "service_work_entries_workId_organisationId_fkey" FOREIGN KEY ("workId", "organisationId") REFERENCES "service_work_items"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_files" ADD CONSTRAINT "service_files_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_files" ADD CONSTRAINT "service_files_caseId_organisationId_fkey" FOREIGN KEY ("caseId", "organisationId") REFERENCES "service_cases"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_files" ADD CONSTRAINT "service_files_workId_organisationId_fkey" FOREIGN KEY ("workId", "organisationId") REFERENCES "service_work_items"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_recoveries" ADD CONSTRAINT "service_recoveries_caseId_organisationId_fkey" FOREIGN KEY ("caseId", "organisationId") REFERENCES "service_cases"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_redemptions" ADD CONSTRAINT "service_redemptions_recoveryId_organisationId_fkey" FOREIGN KEY ("recoveryId", "organisationId") REFERENCES "service_recoveries"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Preserve historical comments as already submitted; agents cannot rewrite originals.
UPDATE "csat_responses" SET "commentSubmittedAt" = COALESCE("respondedAt", "sentAt") WHERE "comment" IS NOT NULL;
ALTER TABLE "service_work_items" ADD CONSTRAINT "service_work_kind" CHECK ("kind" IN ('TICKET','QUERY'));
ALTER TABLE "service_files" ADD CONSTRAINT "service_file_one_parent" CHECK (("caseId" IS NULL) <> ("workId" IS NULL));
ALTER TABLE "service_files" ADD CONSTRAINT "service_file_size" CHECK ("size" > 0 AND "size" <= 8388608);
ALTER TABLE "service_recoveries" ADD CONSTRAINT "service_recovery_limits" CHECK ("value" > 0 AND "minimumOrder" >= 0 AND ("maximum" IS NULL OR "maximum" > 0) AND "usageLimit" > 0 AND "usedCount" >= 0 AND "usedCount" <= "usageLimit");
ALTER TABLE "service_redemptions" ADD CONSTRAINT "service_redemption_amount" CHECK ("amount" > 0);
