-- CreateEnum
CREATE TYPE "OpportunityStatus" AS ENUM ('OPEN', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "ForecastCategory" AS ENUM ('PIPELINE', 'BEST_CASE', 'COMMIT', 'CLOSED', 'OMITTED');

-- CreateEnum
CREATE TYPE "RecurringPeriod" AS ENUM ('MONTHLY', 'QUARTERLY', 'ANNUAL');

-- CreateEnum
CREATE TYPE "OpportunityStakeholderRole" AS ENUM ('DECISION_MAKER', 'ECONOMIC_BUYER', 'CHAMPION', 'TECHNICAL_BUYER', 'USER', 'PROCUREMENT', 'LEGAL', 'INFLUENCER', 'BLOCKER', 'OTHER');

-- CreateEnum
CREATE TYPE "MilestoneStatus" AS ENUM ('PENDING', 'DONE');

-- CreateEnum
CREATE TYPE "OpportunityChangeType" AS ENUM ('STAGE', 'VALUE', 'CLOSE_DATE', 'OWNER', 'FORECAST_CATEGORY');

-- CreateEnum
CREATE TYPE "ProspectLifecycleStage" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'NURTURE', 'DISQUALIFIED', 'CONVERTED');

-- CreateEnum
CREATE TYPE "SalesActivityType" AS ENUM ('CALL', 'EMAIL', 'MEETING', 'TASK', 'FOLLOW_UP', 'DEMO', 'SITE_VISIT', 'PROPOSAL', 'OTHER');

-- DropIndex
DROP INDEX "sales_opportunities_organisationId_stage_idx";

-- AlterTable
ALTER TABLE "sales_opportunities" DROP COLUMN "stage",
ADD COLUMN     "actualCloseDate" TIMESTAMP(3),
ADD COLUMN     "campaign" TEXT,
ADD COLUMN     "competitor" TEXT,
ADD COLUMN     "expectedCloseDate" TIMESTAMP(3),
ADD COLUMN     "forecastCategory" "ForecastCategory" NOT NULL DEFAULT 'PIPELINE',
ADD COLUMN     "lossNotes" TEXT,
ADD COLUMN     "lossReasonId" TEXT,
ADD COLUMN     "nextActionAt" TIMESTAMP(3),
ADD COLUMN     "nextActionNote" TEXT,
ADD COLUMN     "ownerUserId" TEXT NOT NULL,
ADD COLUMN     "painPoint" TEXT,
ADD COLUMN     "pipelineId" TEXT NOT NULL,
ADD COLUMN     "primaryContactId" TEXT,
ADD COLUMN     "probability" INTEGER,
ADD COLUMN     "prospectId" TEXT,
ADD COLUMN     "qualificationNotes" JSONB,
ADD COLUMN     "recurringPeriod" "RecurringPeriod",
ADD COLUMN     "recurringValueAmount" INTEGER,
ADD COLUMN     "source" TEXT,
ADD COLUMN     "stageEnteredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "stageId" TEXT NOT NULL,
ADD COLUMN     "status" "OpportunityStatus" NOT NULL DEFAULT 'OPEN',
ADD COLUMN     "teamId" TEXT,
ADD COLUMN     "territory" TEXT,
ADD COLUMN     "useCase" TEXT;

-- DropEnum
DROP TYPE "OpportunityStage";

-- CreateTable
CREATE TABLE "sales_teams" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "managerUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_team_members" (
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "sales_team_members_pkey" PRIMARY KEY ("teamId","userId")
);

-- CreateTable
CREATE TABLE "sales_pipelines" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_pipelines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_pipeline_stages" (
    "id" TEXT NOT NULL,
    "pipelineId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "defaultProbability" INTEGER NOT NULL DEFAULT 0,
    "guidance" TEXT,
    "typicalDurationDays" INTEGER,

    CONSTRAINT "sales_pipeline_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_loss_reasons" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_loss_reasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_opportunity_stakeholders" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "roles" "OpportunityStakeholderRole"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_opportunity_stakeholders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_opportunity_milestones" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "status" "MilestoneStatus" NOT NULL DEFAULT 'PENDING',
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_opportunity_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_opportunity_change_events" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "type" "OpportunityChangeType" NOT NULL,
    "fromValue" TEXT,
    "toValue" TEXT,
    "changedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_opportunity_change_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_prospects" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "partyId" TEXT,
    "companyName" TEXT NOT NULL,
    "contactFirstName" TEXT,
    "contactSurname" TEXT,
    "jobTitle" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "country" TEXT,
    "ownerUserId" TEXT,
    "teamId" TEXT,
    "territory" TEXT,
    "source" TEXT,
    "sourceDetail" TEXT,
    "campaign" TEXT,
    "referrer" TEXT,
    "originalSource" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmContent" TEXT,
    "utmTerm" TEXT,
    "lifecycleStage" "ProspectLifecycleStage" NOT NULL DEFAULT 'NEW',
    "fitScore" INTEGER,
    "fitFactors" JSONB,
    "engagementScore" INTEGER,
    "engagementFactors" JSONB,
    "intentScore" INTEGER,
    "intentFactors" JSONB,
    "priorityScore" INTEGER,
    "estimatedValueAmount" INTEGER,
    "estimatedValueCurrency" TEXT DEFAULT 'GBP',
    "timeframe" TEXT,
    "notes" TEXT,
    "isTargetAccount" BOOLEAN NOT NULL DEFAULT false,
    "accountTier" TEXT,
    "disqualifiedReason" TEXT,
    "nurtureReason" TEXT,
    "nextReviewAt" TIMESTAMP(3),
    "nextActivityAt" TIMESTAMP(3),
    "firstContactedAt" TIMESTAMP(3),
    "lastContactedAt" TIMESTAMP(3),
    "assignedAt" TIMESTAMP(3),
    "convertedAt" TIMESTAMP(3),
    "disqualifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_prospects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_activities" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "type" "SalesActivityType" NOT NULL,
    "subject" TEXT NOT NULL,
    "notes" TEXT,
    "ownerUserId" TEXT NOT NULL,
    "partyId" TEXT,
    "prospectId" TEXT,
    "opportunityId" TEXT,
    "dueAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "outcome" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sales_pipelines_organisationId_key_key" ON "sales_pipelines"("organisationId", "key");

-- CreateIndex
CREATE INDEX "sales_pipeline_stages_pipelineId_order_idx" ON "sales_pipeline_stages"("pipelineId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "sales_pipeline_stages_pipelineId_key_key" ON "sales_pipeline_stages"("pipelineId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "sales_loss_reasons_organisationId_key_key" ON "sales_loss_reasons"("organisationId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "sales_opportunity_stakeholders_opportunityId_contactId_key" ON "sales_opportunity_stakeholders"("opportunityId", "contactId");

-- CreateIndex
CREATE INDEX "sales_opportunity_milestones_opportunityId_order_idx" ON "sales_opportunity_milestones"("opportunityId", "order");

-- CreateIndex
CREATE INDEX "sales_opportunity_change_events_opportunityId_createdAt_idx" ON "sales_opportunity_change_events"("opportunityId", "createdAt");

-- CreateIndex
CREATE INDEX "sales_prospects_organisationId_lifecycleStage_idx" ON "sales_prospects"("organisationId", "lifecycleStage");

-- CreateIndex
CREATE INDEX "sales_prospects_organisationId_ownerUserId_idx" ON "sales_prospects"("organisationId", "ownerUserId");

-- CreateIndex
CREATE INDEX "sales_activities_organisationId_ownerUserId_dueAt_idx" ON "sales_activities"("organisationId", "ownerUserId", "dueAt");

-- CreateIndex
CREATE INDEX "sales_activities_organisationId_completedAt_idx" ON "sales_activities"("organisationId", "completedAt");

-- CreateIndex
CREATE UNIQUE INDEX "sales_opportunities_prospectId_key" ON "sales_opportunities"("prospectId");

-- CreateIndex
CREATE INDEX "sales_opportunities_organisationId_status_idx" ON "sales_opportunities"("organisationId", "status");

-- CreateIndex
CREATE INDEX "sales_opportunities_organisationId_pipelineId_stageId_idx" ON "sales_opportunities"("organisationId", "pipelineId", "stageId");

-- CreateIndex
CREATE INDEX "sales_opportunities_organisationId_ownerUserId_idx" ON "sales_opportunities"("organisationId", "ownerUserId");

-- AddForeignKey
ALTER TABLE "sales_teams" ADD CONSTRAINT "sales_teams_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_team_members" ADD CONSTRAINT "sales_team_members_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "sales_teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_pipelines" ADD CONSTRAINT "sales_pipelines_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_pipeline_stages" ADD CONSTRAINT "sales_pipeline_stages_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "sales_pipelines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_loss_reasons" ADD CONSTRAINT "sales_loss_reasons_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_opportunity_stakeholders" ADD CONSTRAINT "sales_opportunity_stakeholders_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "sales_opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_opportunity_stakeholders" ADD CONSTRAINT "sales_opportunity_stakeholders_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_opportunity_milestones" ADD CONSTRAINT "sales_opportunity_milestones_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "sales_opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_opportunity_change_events" ADD CONSTRAINT "sales_opportunity_change_events_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "sales_opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_opportunities" ADD CONSTRAINT "sales_opportunities_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "sales_prospects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_opportunities" ADD CONSTRAINT "sales_opportunities_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "sales_pipelines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_opportunities" ADD CONSTRAINT "sales_opportunities_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "sales_pipeline_stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_opportunities" ADD CONSTRAINT "sales_opportunities_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "sales_teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_opportunities" ADD CONSTRAINT "sales_opportunities_primaryContactId_fkey" FOREIGN KEY ("primaryContactId") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_opportunities" ADD CONSTRAINT "sales_opportunities_lossReasonId_fkey" FOREIGN KEY ("lossReasonId") REFERENCES "sales_loss_reasons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_prospects" ADD CONSTRAINT "sales_prospects_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_prospects" ADD CONSTRAINT "sales_prospects_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "parties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_prospects" ADD CONSTRAINT "sales_prospects_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "sales_teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_activities" ADD CONSTRAINT "sales_activities_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_activities" ADD CONSTRAINT "sales_activities_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "parties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_activities" ADD CONSTRAINT "sales_activities_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "sales_prospects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_activities" ADD CONSTRAINT "sales_activities_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "sales_opportunities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

