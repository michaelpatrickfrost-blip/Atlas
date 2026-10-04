-- AlterTable
ALTER TABLE "marketing_campaigns" ADD COLUMN     "brand" TEXT NOT NULL DEFAULT 'DEFAULT',
ADD COLUMN     "brief" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "businessGoal" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "channels" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "cta" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "dependencies" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "isProgramme" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'en',
ADD COLUMN     "launchedAt" TIMESTAMP(3),
ADD COLUMN     "message" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "objective" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "offer" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "persona" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "positioning" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "productId" TEXT,
ADD COLUMN     "region" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "risks" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "targetCustomers" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "targetLeads" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "targetMarket" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "targetPipelineMinor" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "targetRevenueMinor" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "teamName" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "utmCampaign" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "marketing_content" ADD COLUMN     "brief" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "copyrightOwner" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "downloads" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "dueAt" TIMESTAMP(3),
ADD COLUMN     "journeyStage" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'en',
ADD COLUMN     "licence" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "parentId" TEXT,
ADD COLUMN     "permittedUse" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "persona" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "productId" TEXT,
ADD COLUMN     "requiresTechnicalApproval" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "restrictions" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "reviewAt" TIMESTAMP(3),
ADD COLUMN     "summary" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "technicalApprovedBy" TEXT,
ADD COLUMN     "territory" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "topic" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "url" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "views" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "marketing_leads" ADD COLUMN     "assignedAt" TIMESTAMP(3),
ADD COLUMN     "firstActionAt" TIMESTAMP(3),
ADD COLUMN     "mqlAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "recycleReason" TEXT;

-- AlterTable
ALTER TABLE "marketing_touches" ADD COLUMN     "activityId" TEXT,
ADD COLUMN     "channel" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "contentId" TEXT,
ADD COLUMN     "kind" TEXT NOT NULL DEFAULT 'INTERACTION',
ADD COLUMN     "utm" JSONB NOT NULL DEFAULT '{}';

-- CreateTable
CREATE TABLE "automation_events" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "automation_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automations" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "triggerType" TEXT NOT NULL DEFAULT 'EVENT',
    "triggerEvent" TEXT,
    "schedule" JSONB NOT NULL DEFAULT '{}',
    "conditions" JSONB NOT NULL DEFAULT '[]',
    "steps" JSONB NOT NULL DEFAULT '[]',
    "ownerUserId" TEXT NOT NULL,
    "templateKey" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "lastRunAt" TIMESTAMP(3),
    "runCount" INTEGER NOT NULL DEFAULT 0,
    "failCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "automations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation_runs" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "automationId" TEXT NOT NULL,
    "eventId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "dryRun" BOOLEAN NOT NULL DEFAULT false,
    "cursor" INTEGER NOT NULL DEFAULT 0,
    "context" JSONB NOT NULL DEFAULT '{}',
    "results" JSONB NOT NULL DEFAULT '[]',
    "error" TEXT,
    "resumeAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "automation_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_accounts" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'COMPANY',
    "ownerUserId" TEXT,
    "label" TEXT NOT NULL,
    "fromName" TEXT NOT NULL DEFAULT '',
    "fromEmail" TEXT NOT NULL,
    "replyTo" TEXT NOT NULL DEFAULT '',
    "smtpHost" TEXT NOT NULL,
    "smtpPort" INTEGER NOT NULL DEFAULT 587,
    "smtpSecurity" TEXT NOT NULL DEFAULT 'STARTTLS',
    "smtpUser" TEXT NOT NULL,
    "passwordEnc" TEXT NOT NULL,
    "imapHost" TEXT NOT NULL DEFAULT '',
    "imapPort" INTEGER NOT NULL DEFAULT 993,
    "imapSecurity" TEXT NOT NULL DEFAULT 'SSL',
    "signatureHtml" TEXT NOT NULL DEFAULT '',
    "dailyLimit" INTEGER NOT NULL DEFAULT 500,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'UNVERIFIED',
    "lastError" TEXT,
    "lastVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_templates" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "subject" TEXT NOT NULL,
    "preheader" TEXT NOT NULL DEFAULT '',
    "blocks" JSONB NOT NULL DEFAULT '[]',
    "brand" TEXT NOT NULL DEFAULT 'DEFAULT',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_messages" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "accountId" TEXT,
    "templateId" TEXT,
    "messageClass" TEXT NOT NULL DEFAULT 'TRANSACTIONAL',
    "toEmail" TEXT NOT NULL,
    "toName" TEXT NOT NULL DEFAULT '',
    "cc" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "subject" TEXT NOT NULL,
    "html" TEXT NOT NULL,
    "text" TEXT NOT NULL DEFAULT '',
    "attachments" JSONB NOT NULL DEFAULT '[]',
    "calendar" JSONB,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "scheduledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "error" TEXT,
    "providerMessageId" TEXT,
    "partyId" TEXT,
    "contactId" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "campaignId" TEXT,
    "automationRunId" TEXT,
    "createdByUserId" TEXT,
    "openToken" TEXT NOT NULL,
    "openedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_accounts" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "credentialsEnc" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UNVERIFIED',
    "lastError" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_documents" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "bodyHtml" TEXT NOT NULL,
    "partyId" TEXT,
    "contactId" TEXT,
    "quoteId" TEXT,
    "orderId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "viewedAt" TIMESTAMP(3),
    "signedAt" TIMESTAMP(3),
    "signerName" TEXT,
    "signerEmail" TEXT,
    "signerIp" TEXT,
    "declinedReason" TEXT,
    "contentHash" TEXT NOT NULL DEFAULT '',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contract_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "csat_surveys" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "followUpQuestion" TEXT NOT NULL DEFAULT 'Anything we could do better?',
    "thanksText" TEXT NOT NULL DEFAULT 'Thank you for your feedback.',
    "scale" INTEGER NOT NULL DEFAULT 5,
    "context" TEXT NOT NULL DEFAULT 'GENERAL',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "csat_surveys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "csat_responses" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "surveyId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "partyId" TEXT,
    "contactId" TEXT,
    "email" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "score" INTEGER,
    "comment" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "automationRunId" TEXT,

    CONSTRAINT "csat_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_settings" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_budget_lines" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT '',
    "month" TEXT NOT NULL DEFAULT '',
    "plannedMinor" INTEGER NOT NULL DEFAULT 0,
    "committedMinor" INTEGER NOT NULL DEFAULT 0,
    "actualMinor" INTEGER NOT NULL DEFAULT 0,
    "forecastMinor" INTEGER NOT NULL DEFAULT 0,
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "sourceRef" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_budget_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_activities" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT '',
    "kind" TEXT NOT NULL DEFAULT 'TASK',
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "phase" TEXT NOT NULL DEFAULT '',
    "ownerUserId" TEXT,
    "contentId" TEXT,
    "messageId" TEXT,
    "socialPostId" TEXT,
    "eventId" TEXT,
    "notes" TEXT NOT NULL DEFAULT '',
    "costMinor" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_segments" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "mode" TEXT NOT NULL DEFAULT 'DYNAMIC',
    "entity" TEXT NOT NULL DEFAULT 'PEOPLE',
    "rules" JSONB NOT NULL DEFAULT '{}',
    "purpose" TEXT NOT NULL DEFAULT '',
    "ownerUserId" TEXT NOT NULL,
    "lastCount" INTEGER NOT NULL DEFAULT 0,
    "lastAccountCount" INTEGER NOT NULL DEFAULT 0,
    "lastCountAt" TIMESTAMP(3),
    "staticPartyIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_segments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_segment_snapshots" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "segmentId" TEXT NOT NULL,
    "takenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "partyIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "contactCount" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "marketing_segment_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_target_accounts" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "listName" TEXT NOT NULL DEFAULT 'Target accounts',
    "tier" TEXT NOT NULL DEFAULT 'B',
    "strategicValue" TEXT NOT NULL DEFAULT '',
    "ownerUserId" TEXT,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_target_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_brand_kits" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "brand" TEXT NOT NULL DEFAULT 'DEFAULT',
    "displayName" TEXT NOT NULL DEFAULT '',
    "colours" JSONB NOT NULL DEFAULT '{}',
    "typography" TEXT NOT NULL DEFAULT '',
    "tone" TEXT NOT NULL DEFAULT '',
    "boilerplate" TEXT NOT NULL DEFAULT '',
    "legalCopy" TEXT NOT NULL DEFAULT '',
    "dos" TEXT NOT NULL DEFAULT '',
    "donts" TEXT NOT NULL DEFAULT '',
    "senderName" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_brand_kits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_forms" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "campaignId" TEXT,
    "fields" JSONB NOT NULL DEFAULT '[]',
    "consentText" TEXT NOT NULL DEFAULT '',
    "routing" JSONB NOT NULL DEFAULT '{}',
    "thanksMessage" TEXT NOT NULL DEFAULT 'Thank you, we will be in touch.',
    "redirectUrl" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "views" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_form_submissions" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "utm" JSONB NOT NULL DEFAULT '{}',
    "email" TEXT,
    "partyId" TEXT,
    "contactId" TEXT,
    "prospectId" TEXT,
    "outcome" TEXT NOT NULL DEFAULT 'RECEIVED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketing_form_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_landing_pages" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "campaignId" TEXT,
    "formId" TEXT,
    "brand" TEXT NOT NULL DEFAULT 'DEFAULT',
    "blocks" JSONB NOT NULL DEFAULT '[]',
    "seoTitle" TEXT NOT NULL DEFAULT '',
    "seoDescription" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "views" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_landing_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_links" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "campaignId" TEXT,
    "activityId" TEXT,
    "contentId" TEXT,
    "source" TEXT NOT NULL,
    "medium" TEXT NOT NULL,
    "campaignName" TEXT NOT NULL,
    "utmContent" TEXT NOT NULL DEFAULT '',
    "utmTerm" TEXT NOT NULL DEFAULT '',
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketing_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_event_plans" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'WEBINAR',
    "campaignId" TEXT,
    "venue" TEXT NOT NULL DEFAULT '',
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "capacity" INTEGER NOT NULL DEFAULT 0,
    "agenda" TEXT NOT NULL DEFAULT '',
    "speakers" TEXT NOT NULL DEFAULT '',
    "sponsors" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "budgetMinor" INTEGER NOT NULL DEFAULT 0,
    "actualCostMinor" INTEGER NOT NULL DEFAULT 0,
    "checkInCode" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_event_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_event_attendees" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL DEFAULT '',
    "company" TEXT NOT NULL DEFAULT '',
    "partyId" TEXT,
    "contactId" TEXT,
    "prospectId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'REGISTERED',
    "checkedInAt" TIMESTAMP(3),
    "interest" TEXT NOT NULL DEFAULT '',
    "productId" TEXT,
    "notes" TEXT NOT NULL DEFAULT '',
    "ownerUserId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'REGISTRATION',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketing_event_attendees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_knowledge" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "productId" TEXT,
    "body" TEXT NOT NULL DEFAULT '',
    "data" JSONB NOT NULL DEFAULT '{}',
    "source" TEXT NOT NULL DEFAULT '',
    "reviewedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_knowledge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_attribution_models" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rules" JSONB NOT NULL DEFAULT '{}',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketing_attribution_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_campaign_snapshots" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "takenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "model" TEXT NOT NULL DEFAULT '',
    "metrics" JSONB NOT NULL DEFAULT '{}',
    "note" TEXT NOT NULL DEFAULT '',
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "marketing_campaign_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_paid_spend" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "campaignId" TEXT,
    "provider" TEXT NOT NULL,
    "account" TEXT NOT NULL DEFAULT '',
    "externalCampaign" TEXT NOT NULL DEFAULT '',
    "day" TIMESTAMP(3) NOT NULL,
    "spendMinor" INTEGER NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "importedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketing_paid_spend_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_social_posts" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "campaignId" TEXT,
    "contentId" TEXT,
    "caption" TEXT NOT NULL,
    "linkUrl" TEXT,
    "mediaUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "hashtags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "scheduledAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_social_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_social_post_targets" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "accountId" TEXT,
    "publishMode" TEXT NOT NULL DEFAULT 'api',
    "captionOverride" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "externalId" TEXT,
    "permalink" TEXT,
    "lastError" TEXT,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "marketing_social_post_targets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "automation_events_organisationId_name_occurredAt_idx" ON "automation_events"("organisationId", "name", "occurredAt");

-- CreateIndex
CREATE INDEX "automation_events_organisationId_occurredAt_idx" ON "automation_events"("organisationId", "occurredAt");

-- CreateIndex
CREATE INDEX "automations_organisationId_enabled_triggerEvent_idx" ON "automations"("organisationId", "enabled", "triggerEvent");

-- CreateIndex
CREATE UNIQUE INDEX "automations_id_organisationId_key" ON "automations"("id", "organisationId");

-- CreateIndex
CREATE INDEX "automation_runs_organisationId_status_resumeAt_idx" ON "automation_runs"("organisationId", "status", "resumeAt");

-- CreateIndex
CREATE INDEX "automation_runs_organisationId_automationId_startedAt_idx" ON "automation_runs"("organisationId", "automationId", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "automation_runs_organisationId_idempotencyKey_key" ON "automation_runs"("organisationId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "email_accounts_organisationId_scope_ownerUserId_idx" ON "email_accounts"("organisationId", "scope", "ownerUserId");

-- CreateIndex
CREATE UNIQUE INDEX "email_accounts_id_organisationId_key" ON "email_accounts"("id", "organisationId");

-- CreateIndex
CREATE INDEX "email_templates_organisationId_category_idx" ON "email_templates"("organisationId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "email_templates_id_organisationId_key" ON "email_templates"("id", "organisationId");

-- CreateIndex
CREATE INDEX "email_messages_organisationId_status_scheduledAt_idx" ON "email_messages"("organisationId", "status", "scheduledAt");

-- CreateIndex
CREATE INDEX "email_messages_organisationId_partyId_createdAt_idx" ON "email_messages"("organisationId", "partyId", "createdAt");

-- CreateIndex
CREATE INDEX "email_messages_organisationId_entityType_entityId_idx" ON "email_messages"("organisationId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "social_accounts_organisationId_platform_idx" ON "social_accounts"("organisationId", "platform");

-- CreateIndex
CREATE UNIQUE INDEX "social_accounts_id_organisationId_key" ON "social_accounts"("id", "organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "contract_documents_tokenHash_key" ON "contract_documents"("tokenHash");

-- CreateIndex
CREATE INDEX "contract_documents_organisationId_status_idx" ON "contract_documents"("organisationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "contract_documents_organisationId_reference_key" ON "contract_documents"("organisationId", "reference");

-- CreateIndex
CREATE UNIQUE INDEX "csat_surveys_id_organisationId_key" ON "csat_surveys"("id", "organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "csat_responses_token_key" ON "csat_responses"("token");

-- CreateIndex
CREATE INDEX "csat_responses_organisationId_surveyId_respondedAt_idx" ON "csat_responses"("organisationId", "surveyId", "respondedAt");

-- CreateIndex
CREATE INDEX "csat_responses_organisationId_partyId_idx" ON "csat_responses"("organisationId", "partyId");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_settings_organisationId_key" ON "marketing_settings"("organisationId");

-- CreateIndex
CREATE INDEX "marketing_budget_lines_organisationId_campaignId_idx" ON "marketing_budget_lines"("organisationId", "campaignId");

-- CreateIndex
CREATE INDEX "marketing_activities_organisationId_campaignId_idx" ON "marketing_activities"("organisationId", "campaignId");

-- CreateIndex
CREATE INDEX "marketing_activities_organisationId_startAt_idx" ON "marketing_activities"("organisationId", "startAt");

-- CreateIndex
CREATE INDEX "marketing_segments_organisationId_idx" ON "marketing_segments"("organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_segments_id_organisationId_key" ON "marketing_segments"("id", "organisationId");

-- CreateIndex
CREATE INDEX "marketing_segment_snapshots_organisationId_segmentId_idx" ON "marketing_segment_snapshots"("organisationId", "segmentId");

-- CreateIndex
CREATE INDEX "marketing_target_accounts_organisationId_listName_idx" ON "marketing_target_accounts"("organisationId", "listName");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_target_accounts_organisationId_partyId_listName_key" ON "marketing_target_accounts"("organisationId", "partyId", "listName");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_brand_kits_organisationId_brand_key" ON "marketing_brand_kits"("organisationId", "brand");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_forms_slug_key" ON "marketing_forms"("slug");

-- CreateIndex
CREATE INDEX "marketing_forms_organisationId_idx" ON "marketing_forms"("organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_forms_id_organisationId_key" ON "marketing_forms"("id", "organisationId");

-- CreateIndex
CREATE INDEX "marketing_form_submissions_organisationId_formId_createdAt_idx" ON "marketing_form_submissions"("organisationId", "formId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_landing_pages_slug_key" ON "marketing_landing_pages"("slug");

-- CreateIndex
CREATE INDEX "marketing_landing_pages_organisationId_idx" ON "marketing_landing_pages"("organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_links_code_key" ON "marketing_links"("code");

-- CreateIndex
CREATE INDEX "marketing_links_organisationId_campaignId_idx" ON "marketing_links"("organisationId", "campaignId");

-- CreateIndex
CREATE INDEX "marketing_event_plans_organisationId_startsAt_idx" ON "marketing_event_plans"("organisationId", "startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_event_plans_id_organisationId_key" ON "marketing_event_plans"("id", "organisationId");

-- CreateIndex
CREATE INDEX "marketing_event_attendees_organisationId_eventId_idx" ON "marketing_event_attendees"("organisationId", "eventId");

-- CreateIndex
CREATE INDEX "marketing_knowledge_organisationId_kind_idx" ON "marketing_knowledge"("organisationId", "kind");

-- CreateIndex
CREATE INDEX "marketing_attribution_models_organisationId_active_idx" ON "marketing_attribution_models"("organisationId", "active");

-- CreateIndex
CREATE INDEX "marketing_campaign_snapshots_organisationId_campaignId_take_idx" ON "marketing_campaign_snapshots"("organisationId", "campaignId", "takenAt");

-- CreateIndex
CREATE INDEX "marketing_paid_spend_organisationId_campaignId_day_idx" ON "marketing_paid_spend"("organisationId", "campaignId", "day");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_paid_spend_organisationId_provider_externalCampai_key" ON "marketing_paid_spend"("organisationId", "provider", "externalCampaign", "day");

-- CreateIndex
CREATE INDEX "marketing_social_posts_organisationId_status_scheduledAt_idx" ON "marketing_social_posts"("organisationId", "status", "scheduledAt");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_social_posts_id_organisationId_key" ON "marketing_social_posts"("id", "organisationId");

-- CreateIndex
CREATE INDEX "marketing_social_post_targets_organisationId_status_idx" ON "marketing_social_post_targets"("organisationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_social_post_targets_postId_platform_key" ON "marketing_social_post_targets"("postId", "platform");

-- AddForeignKey
ALTER TABLE "automation_runs" ADD CONSTRAINT "automation_runs_automationId_organisationId_fkey" FOREIGN KEY ("automationId", "organisationId") REFERENCES "automations"("id", "organisationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "csat_responses" ADD CONSTRAINT "csat_responses_surveyId_organisationId_fkey" FOREIGN KEY ("surveyId", "organisationId") REFERENCES "csat_surveys"("id", "organisationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_segment_snapshots" ADD CONSTRAINT "marketing_segment_snapshots_segmentId_organisationId_fkey" FOREIGN KEY ("segmentId", "organisationId") REFERENCES "marketing_segments"("id", "organisationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_form_submissions" ADD CONSTRAINT "marketing_form_submissions_formId_organisationId_fkey" FOREIGN KEY ("formId", "organisationId") REFERENCES "marketing_forms"("id", "organisationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_event_attendees" ADD CONSTRAINT "marketing_event_attendees_eventId_organisationId_fkey" FOREIGN KEY ("eventId", "organisationId") REFERENCES "marketing_event_plans"("id", "organisationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_social_post_targets" ADD CONSTRAINT "marketing_social_post_targets_postId_organisationId_fkey" FOREIGN KEY ("postId", "organisationId") REFERENCES "marketing_social_posts"("id", "organisationId") ON DELETE CASCADE ON UPDATE CASCADE;

