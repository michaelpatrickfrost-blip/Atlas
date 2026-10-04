

-- CreateTable
CREATE TABLE "service_cases" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "contactId" TEXT,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "type" TEXT NOT NULL DEFAULT 'QUERY',
    "category" TEXT NOT NULL DEFAULT '',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "severity" TEXT NOT NULL DEFAULT 'SEV3',
    "channel" TEXT NOT NULL DEFAULT 'MANUAL',
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "security" TEXT NOT NULL DEFAULT 'STANDARD',
    "ownerUserId" TEXT NOT NULL,
    "queueId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "reopenCount" INTEGER NOT NULL DEFAULT 0,
    "firstResponseAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "resolutionCode" TEXT,
    "resolutionSummary" TEXT,
    "rootCause" TEXT,
    "customerUpdateDueAt" TIMESTAMP(3),
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_cases_pkey" PRIMARY KEY ("id")
);


-- CreateTable
CREATE TABLE "service_entries" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "ticketId" TEXT,
    "kind" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'INTERNAL',
    "body" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_entries_pkey" PRIMARY KEY ("id")
);


-- CreateTable
CREATE TABLE "service_tickets" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "queueId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "ownerUserId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "dueAt" TIMESTAMP(3) NOT NULL,
    "outcome" TEXT,
    "customerSafeSummary" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_tickets_pkey" PRIMARY KEY ("id")
);


-- CreateTable
CREATE TABLE "service_queues" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_queues_pkey" PRIMARY KEY ("id")
);


-- CreateTable
CREATE TABLE "service_queue_members" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "queueId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "service_queue_members_pkey" PRIMARY KEY ("id")
);


-- CreateTable
CREATE TABLE "service_links" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "relationship" TEXT NOT NULL DEFAULT 'AFFECTS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_links_pkey" PRIMARY KEY ("id")
);


-- CreateTable
CREATE TABLE "service_sequences" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "service_sequences_pkey" PRIMARY KEY ("id")
);


-- CreateIndex
CREATE INDEX "service_cases_organisationId_status_ownerUserId_idx" ON "service_cases"("organisationId", "status", "ownerUserId");


-- CreateIndex
CREATE INDEX "service_cases_organisationId_partyId_idx" ON "service_cases"("organisationId", "partyId");


-- CreateIndex
CREATE UNIQUE INDEX "service_cases_id_organisationId_key" ON "service_cases"("id", "organisationId");


-- CreateIndex
CREATE UNIQUE INDEX "service_cases_organisationId_number_key" ON "service_cases"("organisationId", "number");


-- CreateIndex
CREATE INDEX "service_entries_organisationId_caseId_createdAt_idx" ON "service_entries"("organisationId", "caseId", "createdAt");


-- CreateIndex
CREATE INDEX "service_tickets_organisationId_queueId_status_dueAt_idx" ON "service_tickets"("organisationId", "queueId", "status", "dueAt");


-- CreateIndex
CREATE UNIQUE INDEX "service_tickets_id_organisationId_key" ON "service_tickets"("id", "organisationId");


-- CreateIndex
CREATE UNIQUE INDEX "service_tickets_organisationId_number_key" ON "service_tickets"("organisationId", "number");


-- CreateIndex
CREATE UNIQUE INDEX "service_queues_id_organisationId_key" ON "service_queues"("id", "organisationId");


-- CreateIndex
CREATE UNIQUE INDEX "service_queues_organisationId_name_key" ON "service_queues"("organisationId", "name");


-- CreateIndex
CREATE UNIQUE INDEX "service_queues_organisationId_prefix_key" ON "service_queues"("organisationId", "prefix");


-- CreateIndex
CREATE INDEX "service_queue_members_organisationId_userId_idx" ON "service_queue_members"("organisationId", "userId");


-- CreateIndex
CREATE UNIQUE INDEX "service_queue_members_queueId_userId_key" ON "service_queue_members"("queueId", "userId");


-- CreateIndex
CREATE INDEX "service_links_organisationId_entityType_entityId_idx" ON "service_links"("organisationId", "entityType", "entityId");


-- CreateIndex
CREATE UNIQUE INDEX "service_links_caseId_entityType_entityId_key" ON "service_links"("caseId", "entityType", "entityId");


-- CreateIndex
CREATE UNIQUE INDEX "service_sequences_organisationId_prefix_key" ON "service_sequences"("organisationId", "prefix");


-- CreateIndex
CREATE UNIQUE INDEX "parties_id_organisationId_key" ON "parties"("id", "organisationId");


-- AddForeignKey
ALTER TABLE "service_cases" ADD CONSTRAINT "service_cases_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "service_cases" ADD CONSTRAINT "service_cases_partyId_organisationId_fkey" FOREIGN KEY ("partyId", "organisationId") REFERENCES "parties"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "service_cases" ADD CONSTRAINT "service_cases_queueId_organisationId_fkey" FOREIGN KEY ("queueId", "organisationId") REFERENCES "service_queues"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "service_entries" ADD CONSTRAINT "service_entries_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "service_entries" ADD CONSTRAINT "service_entries_caseId_organisationId_fkey" FOREIGN KEY ("caseId", "organisationId") REFERENCES "service_cases"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "service_entries" ADD CONSTRAINT "service_entries_ticketId_organisationId_fkey" FOREIGN KEY ("ticketId", "organisationId") REFERENCES "service_tickets"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "service_tickets" ADD CONSTRAINT "service_tickets_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "service_tickets" ADD CONSTRAINT "service_tickets_caseId_organisationId_fkey" FOREIGN KEY ("caseId", "organisationId") REFERENCES "service_cases"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "service_tickets" ADD CONSTRAINT "service_tickets_queueId_organisationId_fkey" FOREIGN KEY ("queueId", "organisationId") REFERENCES "service_queues"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "service_queues" ADD CONSTRAINT "service_queues_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "service_queue_members" ADD CONSTRAINT "service_queue_members_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "service_queue_members" ADD CONSTRAINT "service_queue_members_queueId_organisationId_fkey" FOREIGN KEY ("queueId", "organisationId") REFERENCES "service_queues"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "service_links" ADD CONSTRAINT "service_links_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "service_links" ADD CONSTRAINT "service_links_caseId_organisationId_fkey" FOREIGN KEY ("caseId", "organisationId") REFERENCES "service_cases"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "service_sequences" ADD CONSTRAINT "service_sequences_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
