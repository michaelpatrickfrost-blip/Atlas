-- CreateTable
CREATE TABLE "marketing_profiles" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "lifecycle" TEXT NOT NULL DEFAULT 'SUBSCRIBER',
    "source" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT '',
    "brand" TEXT NOT NULL DEFAULT 'DEFAULT',
    "score" INTEGER NOT NULL DEFAULT 0,
    "fitScore" INTEGER NOT NULL DEFAULT 0,
    "engagementScore" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_permissions" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "legalEntity" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "evidence" TEXT NOT NULL,
    "textVersion" TEXT NOT NULL,
    "noticeVersion" TEXT NOT NULL,
    "lawfulBasis" TEXT NOT NULL,
    "recordedBy" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_suppressions" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'ALL',
    "reason" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_suppressions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_events" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "campaignId" TEXT,
    "properties" JSONB NOT NULL DEFAULT '{}',
    "scoreDelta" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_audiences" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'DYNAMIC',
    "rules" JSONB NOT NULL DEFAULT '{}',
    "source" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "permissionBasis" TEXT NOT NULL,
    "evidence" TEXT NOT NULL,
    "acquiredAt" TIMESTAMP(3) NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_audiences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_audience_members" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "audienceId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_audience_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_campaigns" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "type" TEXT NOT NULL DEFAULT 'CUSTOM',
    "status" TEXT NOT NULL DEFAULT 'PLANNING',
    "ownerUserId" TEXT NOT NULL,
    "parentId" TEXT,
    "audienceId" TEXT,
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "budgetMinor" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "goal" TEXT NOT NULL DEFAULT '',
    "goalTarget" INTEGER NOT NULL DEFAULT 0,
    "projectId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_content" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "brand" TEXT NOT NULL DEFAULT 'DEFAULT',
    "campaignId" TEXT,
    "ownerUserId" TEXT NOT NULL,
    "approvedBy" TEXT,
    "rights" TEXT NOT NULL DEFAULT '',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_messages" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'EMAIL',
    "classification" TEXT NOT NULL DEFAULT 'PROMOTIONAL',
    "purpose" TEXT NOT NULL,
    "brand" TEXT NOT NULL DEFAULT 'DEFAULT',
    "country" TEXT NOT NULL,
    "legalEntity" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_send_jobs" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'LOCKED',
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "snapshot" JSONB NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "approvedBy" TEXT NOT NULL,
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_send_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_deliveries" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "exclusionReason" TEXT,
    "providerId" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_journeys" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "trigger" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "publishedVersion" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_journeys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_journey_versions" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "nodes" JSONB NOT NULL,
    "exitRule" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_journey_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_journey_enrolments" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "currentNode" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "nextExecutionAt" TIMESTAMP(3) NOT NULL,
    "state" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_journey_enrolments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_leads" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "campaignId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'MQL',
    "explanation" JSONB NOT NULL,
    "ownerUserId" TEXT,
    "prospectId" TEXT,
    "feedback" TEXT,
    "dueAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_programs" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "campaignId" TEXT,
    "ownerUserId" TEXT NOT NULL,
    "definition" JSONB NOT NULL,
    "startsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_touches" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_touches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_experiments" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "audienceId" TEXT NOT NULL,
    "control" INTEGER NOT NULL,
    "variant" INTEGER NOT NULL,
    "holdout" INTEGER NOT NULL,
    "metric" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_experiments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_experiment_assignments" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "experimentId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_experiment_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "marketing_profiles_contactId_key" ON "marketing_profiles"("contactId");

-- CreateIndex
CREATE INDEX "marketing_profiles_organisationId_idx" ON "marketing_profiles"("organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_profiles_id_organisationId_key" ON "marketing_profiles"("id", "organisationId");

-- CreateIndex
CREATE INDEX "marketing_permissions_organisationId_profileId_channel_purp_idx" ON "marketing_permissions"("organisationId", "profileId", "channel", "purpose", "occurredAt");

-- CreateIndex
CREATE INDEX "marketing_permissions_organisationId_idx" ON "marketing_permissions"("organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_permissions_id_organisationId_key" ON "marketing_permissions"("id", "organisationId");

-- CreateIndex
CREATE INDEX "marketing_suppressions_organisationId_profileId_idx" ON "marketing_suppressions"("organisationId", "profileId");

-- CreateIndex
CREATE INDEX "marketing_suppressions_organisationId_idx" ON "marketing_suppressions"("organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_suppressions_id_organisationId_key" ON "marketing_suppressions"("id", "organisationId");

-- CreateIndex
CREATE INDEX "marketing_events_organisationId_profileId_type_occurredAt_idx" ON "marketing_events"("organisationId", "profileId", "type", "occurredAt");

-- CreateIndex
CREATE INDEX "marketing_events_organisationId_campaignId_occurredAt_idx" ON "marketing_events"("organisationId", "campaignId", "occurredAt");

-- CreateIndex
CREATE INDEX "marketing_events_organisationId_idx" ON "marketing_events"("organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_events_organisationId_idempotencyKey_key" ON "marketing_events"("organisationId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_events_id_organisationId_key" ON "marketing_events"("id", "organisationId");

-- CreateIndex
CREATE INDEX "marketing_audiences_organisationId_idx" ON "marketing_audiences"("organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_audiences_id_organisationId_key" ON "marketing_audiences"("id", "organisationId");

-- CreateIndex
CREATE INDEX "marketing_audience_members_organisationId_idx" ON "marketing_audience_members"("organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_audience_members_audienceId_profileId_key" ON "marketing_audience_members"("audienceId", "profileId");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_audience_members_id_organisationId_key" ON "marketing_audience_members"("id", "organisationId");

-- CreateIndex
CREATE INDEX "marketing_campaigns_organisationId_idx" ON "marketing_campaigns"("organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_campaigns_organisationId_code_key" ON "marketing_campaigns"("organisationId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_campaigns_id_organisationId_key" ON "marketing_campaigns"("id", "organisationId");

-- CreateIndex
CREATE INDEX "marketing_content_organisationId_idx" ON "marketing_content"("organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_content_id_organisationId_key" ON "marketing_content"("id", "organisationId");

-- CreateIndex
CREATE INDEX "marketing_messages_organisationId_idx" ON "marketing_messages"("organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_messages_id_organisationId_key" ON "marketing_messages"("id", "organisationId");

-- CreateIndex
CREATE INDEX "marketing_send_jobs_organisationId_idx" ON "marketing_send_jobs"("organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_send_jobs_organisationId_idempotencyKey_key" ON "marketing_send_jobs"("organisationId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_send_jobs_id_organisationId_key" ON "marketing_send_jobs"("id", "organisationId");

-- CreateIndex
CREATE INDEX "marketing_deliveries_organisationId_profileId_sentAt_idx" ON "marketing_deliveries"("organisationId", "profileId", "sentAt");

-- CreateIndex
CREATE INDEX "marketing_deliveries_organisationId_idx" ON "marketing_deliveries"("organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_deliveries_jobId_profileId_key" ON "marketing_deliveries"("jobId", "profileId");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_deliveries_id_organisationId_key" ON "marketing_deliveries"("id", "organisationId");

-- CreateIndex
CREATE INDEX "marketing_journeys_organisationId_idx" ON "marketing_journeys"("organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_journeys_id_organisationId_key" ON "marketing_journeys"("id", "organisationId");

-- CreateIndex
CREATE INDEX "marketing_journey_versions_organisationId_idx" ON "marketing_journey_versions"("organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_journey_versions_journeyId_number_key" ON "marketing_journey_versions"("journeyId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_journey_versions_id_organisationId_key" ON "marketing_journey_versions"("id", "organisationId");

-- CreateIndex
CREATE INDEX "marketing_journey_enrolments_organisationId_status_nextExec_idx" ON "marketing_journey_enrolments"("organisationId", "status", "nextExecutionAt");

-- CreateIndex
CREATE INDEX "marketing_journey_enrolments_organisationId_idx" ON "marketing_journey_enrolments"("organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_journey_enrolments_versionId_profileId_key" ON "marketing_journey_enrolments"("versionId", "profileId");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_journey_enrolments_id_organisationId_key" ON "marketing_journey_enrolments"("id", "organisationId");

-- CreateIndex
CREATE INDEX "marketing_leads_organisationId_idx" ON "marketing_leads"("organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_leads_organisationId_profileId_key" ON "marketing_leads"("organisationId", "profileId");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_leads_id_organisationId_key" ON "marketing_leads"("id", "organisationId");

-- CreateIndex
CREATE INDEX "marketing_programs_organisationId_idx" ON "marketing_programs"("organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_programs_id_organisationId_key" ON "marketing_programs"("id", "organisationId");

-- CreateIndex
CREATE INDEX "marketing_touches_organisationId_idx" ON "marketing_touches"("organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_touches_organisationId_idempotencyKey_key" ON "marketing_touches"("organisationId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_touches_id_organisationId_key" ON "marketing_touches"("id", "organisationId");

-- CreateIndex
CREATE INDEX "marketing_experiments_organisationId_idx" ON "marketing_experiments"("organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_experiments_id_organisationId_key" ON "marketing_experiments"("id", "organisationId");

-- CreateIndex
CREATE INDEX "marketing_experiment_assignments_organisationId_idx" ON "marketing_experiment_assignments"("organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_experiment_assignments_experimentId_profileId_key" ON "marketing_experiment_assignments"("experimentId", "profileId");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_experiment_assignments_id_organisationId_key" ON "marketing_experiment_assignments"("id", "organisationId");

-- AddForeignKey
ALTER TABLE "marketing_profiles" ADD CONSTRAINT "marketing_profiles_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_profiles" ADD CONSTRAINT "marketing_profiles_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_profiles" ADD CONSTRAINT "marketing_profiles_partyId_organisationId_fkey" FOREIGN KEY ("partyId", "organisationId") REFERENCES "parties"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_permissions" ADD CONSTRAINT "marketing_permissions_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_permissions" ADD CONSTRAINT "marketing_permissions_profileId_organisationId_fkey" FOREIGN KEY ("profileId", "organisationId") REFERENCES "marketing_profiles"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_suppressions" ADD CONSTRAINT "marketing_suppressions_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_suppressions" ADD CONSTRAINT "marketing_suppressions_profileId_organisationId_fkey" FOREIGN KEY ("profileId", "organisationId") REFERENCES "marketing_profiles"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_events" ADD CONSTRAINT "marketing_events_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_events" ADD CONSTRAINT "marketing_events_profileId_organisationId_fkey" FOREIGN KEY ("profileId", "organisationId") REFERENCES "marketing_profiles"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_audiences" ADD CONSTRAINT "marketing_audiences_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_audience_members" ADD CONSTRAINT "marketing_audience_members_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_audience_members" ADD CONSTRAINT "marketing_audience_members_audienceId_organisationId_fkey" FOREIGN KEY ("audienceId", "organisationId") REFERENCES "marketing_audiences"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_campaigns" ADD CONSTRAINT "marketing_campaigns_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_campaigns" ADD CONSTRAINT "marketing_campaigns_audienceId_organisationId_fkey" FOREIGN KEY ("audienceId", "organisationId") REFERENCES "marketing_audiences"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_content" ADD CONSTRAINT "marketing_content_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_messages" ADD CONSTRAINT "marketing_messages_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_messages" ADD CONSTRAINT "marketing_messages_campaignId_organisationId_fkey" FOREIGN KEY ("campaignId", "organisationId") REFERENCES "marketing_campaigns"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_send_jobs" ADD CONSTRAINT "marketing_send_jobs_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_send_jobs" ADD CONSTRAINT "marketing_send_jobs_messageId_organisationId_fkey" FOREIGN KEY ("messageId", "organisationId") REFERENCES "marketing_messages"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_deliveries" ADD CONSTRAINT "marketing_deliveries_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_deliveries" ADD CONSTRAINT "marketing_deliveries_jobId_organisationId_fkey" FOREIGN KEY ("jobId", "organisationId") REFERENCES "marketing_send_jobs"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_journeys" ADD CONSTRAINT "marketing_journeys_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_journey_versions" ADD CONSTRAINT "marketing_journey_versions_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_journey_versions" ADD CONSTRAINT "marketing_journey_versions_journeyId_organisationId_fkey" FOREIGN KEY ("journeyId", "organisationId") REFERENCES "marketing_journeys"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_journey_enrolments" ADD CONSTRAINT "marketing_journey_enrolments_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_journey_enrolments" ADD CONSTRAINT "marketing_journey_enrolments_versionId_organisationId_fkey" FOREIGN KEY ("versionId", "organisationId") REFERENCES "marketing_journey_versions"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_leads" ADD CONSTRAINT "marketing_leads_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_leads" ADD CONSTRAINT "marketing_leads_profileId_organisationId_fkey" FOREIGN KEY ("profileId", "organisationId") REFERENCES "marketing_profiles"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_programs" ADD CONSTRAINT "marketing_programs_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_touches" ADD CONSTRAINT "marketing_touches_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_experiments" ADD CONSTRAINT "marketing_experiments_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_experiment_assignments" ADD CONSTRAINT "marketing_experiment_assignments_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_experiment_assignments" ADD CONSTRAINT "marketing_experiment_assignments_experimentId_organisation_fkey" FOREIGN KEY ("experimentId", "organisationId") REFERENCES "marketing_experiments"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;
