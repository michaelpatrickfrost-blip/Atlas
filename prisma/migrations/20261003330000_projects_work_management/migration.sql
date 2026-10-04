-- DropForeignKey
ALTER TABLE "projects" DROP CONSTRAINT "projects_partyId_fkey";

-- AlterTable
ALTER TABLE "audit_entries" ADD COLUMN     "workDocumentId" TEXT,
ADD COLUMN     "workProjectId" TEXT,
ADD COLUMN     "workTaskId" TEXT;

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "health" TEXT NOT NULL DEFAULT 'ON_TRACK',
ADD COLUMN     "leadUserId" TEXT,
ADD COLUMN     "manualProgress" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "ownerUserId" TEXT,
ADD COLUMN     "progressMethod" TEXT NOT NULL DEFAULT 'TASK_COUNT',
ADD COLUMN     "projectType" TEXT NOT NULL DEFAULT 'TEAM',
ADD COLUMN     "startAt" TIMESTAMP(3),
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "targetAt" TIMESTAMP(3),
ADD COLUMN     "teamId" TEXT,
ADD COLUMN     "updateCadenceDays" INTEGER NOT NULL DEFAULT 7,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "visibility" TEXT NOT NULL DEFAULT 'COMPANY',
ALTER COLUMN "partyId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "project_tasks" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "contributorUserIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "creatorUserId" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "description" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "estimatedMinutes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "milestoneId" TEXT,
ADD COLUMN     "parentTaskId" TEXT,
ADD COLUMN     "position" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "recurrence" TEXT,
ADD COLUMN     "reference" TEXT,
ADD COLUMN     "startAt" TIMESTAMP(3),
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "taskType" TEXT NOT NULL DEFAULT 'TASK',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "visibility" TEXT NOT NULL DEFAULT 'COMPANY',
ADD COLUMN     "waitingReason" TEXT,
ADD COLUMN     "waitingUntil" TIMESTAMP(3),
ADD COLUMN     "weight" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "projects_members" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',

    CONSTRAINT "projects_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects_milestones" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "targetAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "ownerUserId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "projects_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects_checklist_items" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "projects_checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects_dependencies" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "predecessorId" TEXT NOT NULL,
    "successorId" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'FINISH_TO_START',
    "lagDays" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "projects_dependencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects_documents" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "projectId" TEXT,
    "ownerUserId" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'NOTE',
    "visibility" TEXT NOT NULL DEFAULT 'PRIVATE',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects_document_revisions" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "body" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projects_document_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects_decisions" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "alternatives" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'PROPOSED',
    "ownerUserId" TEXT NOT NULL,
    "supersedesId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "projects_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects_updates" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "health" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "next" TEXT NOT NULL,
    "risks" TEXT NOT NULL,
    "decisionsNeeded" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projects_updates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects_risks" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'RISK',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "probability" INTEGER NOT NULL DEFAULT 3,
    "impact" INTEGER NOT NULL DEFAULT 3,
    "mitigation" TEXT NOT NULL DEFAULT '',
    "ownerUserId" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projects_risks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects_approvals" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "requesterUserId" TEXT NOT NULL,
    "approverUserId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "subjectVersion" INTEGER NOT NULL,
    "response" TEXT,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projects_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects_requests" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "creatorUserId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'TRIAGE',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "dueAt" TIMESTAMP(3),
    "taskId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projects_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects_comments" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "projectId" TEXT,
    "taskId" TEXT,
    "authorUserId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "mentionUserIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projects_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects_time_entries" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "minutes" INTEGER NOT NULL,
    "workedAt" TIMESTAMP(3) NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projects_time_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects_personal_plans" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "day" TIMESTAMP(3) NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "projects_personal_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects_inbox" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT,
    "taskId" TEXT,
    "label" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "dismissedAt" TIMESTAMP(3),
    "snoozedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projects_inbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects_saved_views" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "definition" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_saved_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects_portfolios" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'PORTFOLIO',
    "ownerUserId" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "targetValue" DOUBLE PRECISION,
    "currentValue" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projects_portfolios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects_portfolio_links" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "portfolioId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,

    CONSTRAINT "projects_portfolio_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects_baselines" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projects_baselines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects_budget_lines" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "amountMinorUnits" INTEGER NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "projects_budget_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects_work_links" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "projectId" TEXT,
    "taskId" TEXT,
    "relationship" TEXT NOT NULL DEFAULT 'RELATES_TO',
    "targetEntity" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "targetVersion" INTEGER,
    "anchorStart" INTEGER,
    "anchorEnd" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projects_work_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects_templates" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "definition" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projects_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects_automation_rules" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "creatorUserId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "taskType" TEXT,
    "action" TEXT NOT NULL,
    "followUpTitle" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projects_automation_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects_automation_executions" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projects_automation_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects_timers" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projects_timers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects_preferences" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "favourite" BOOLEAN NOT NULL DEFAULT false,
    "notificationMode" TEXT NOT NULL DEFAULT 'IMPORTANT',
    "lastViewedAt" TIMESTAMP(3),

    CONSTRAINT "projects_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects_files" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mediaType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "content" BYTEA NOT NULL,
    "uploadedByUserId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projects_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects_properties" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "options" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "projects_properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects_property_values" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "projects_property_values_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "projects_members_organisationId_userId_idx" ON "projects_members"("organisationId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "projects_members_projectId_userId_key" ON "projects_members"("projectId", "userId");

-- CreateIndex
CREATE INDEX "projects_milestones_organisationId_projectId_idx" ON "projects_milestones"("organisationId", "projectId");

-- CreateIndex
CREATE INDEX "projects_checklist_items_organisationId_taskId_idx" ON "projects_checklist_items"("organisationId", "taskId");

-- CreateIndex
CREATE INDEX "projects_dependencies_organisationId_idx" ON "projects_dependencies"("organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "projects_dependencies_predecessorId_successorId_key" ON "projects_dependencies"("predecessorId", "successorId");

-- CreateIndex
CREATE INDEX "projects_documents_organisationId_projectId_idx" ON "projects_documents"("organisationId", "projectId");

-- CreateIndex
CREATE UNIQUE INDEX "projects_document_revisions_documentId_version_key" ON "projects_document_revisions"("documentId", "version");

-- CreateIndex
CREATE INDEX "projects_decisions_organisationId_projectId_idx" ON "projects_decisions"("organisationId", "projectId");

-- CreateIndex
CREATE INDEX "projects_updates_organisationId_projectId_createdAt_idx" ON "projects_updates"("organisationId", "projectId", "createdAt");

-- CreateIndex
CREATE INDEX "projects_risks_organisationId_projectId_idx" ON "projects_risks"("organisationId", "projectId");

-- CreateIndex
CREATE INDEX "projects_approvals_organisationId_approverUserId_status_idx" ON "projects_approvals"("organisationId", "approverUserId", "status");

-- CreateIndex
CREATE INDEX "projects_requests_organisationId_projectId_idx" ON "projects_requests"("organisationId", "projectId");

-- CreateIndex
CREATE INDEX "projects_comments_organisationId_projectId_taskId_idx" ON "projects_comments"("organisationId", "projectId", "taskId");

-- CreateIndex
CREATE INDEX "projects_time_entries_organisationId_userId_workedAt_idx" ON "projects_time_entries"("organisationId", "userId", "workedAt");

-- CreateIndex
CREATE UNIQUE INDEX "projects_personal_plans_organisationId_userId_taskId_day_key" ON "projects_personal_plans"("organisationId", "userId", "taskId", "day");

-- CreateIndex
CREATE INDEX "projects_inbox_organisationId_userId_createdAt_idx" ON "projects_inbox"("organisationId", "userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "projects_saved_views_organisationId_userId_name_key" ON "projects_saved_views"("organisationId", "userId", "name");

-- CreateIndex
CREATE INDEX "projects_portfolios_organisationId_idx" ON "projects_portfolios"("organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "projects_portfolio_links_portfolioId_projectId_key" ON "projects_portfolio_links"("portfolioId", "projectId");

-- CreateIndex
CREATE INDEX "projects_baselines_organisationId_projectId_idx" ON "projects_baselines"("organisationId", "projectId");

-- CreateIndex
CREATE UNIQUE INDEX "projects_budget_lines_projectId_category_currency_key" ON "projects_budget_lines"("projectId", "category", "currency");

-- CreateIndex
CREATE INDEX "projects_work_links_organisationId_projectId_taskId_idx" ON "projects_work_links"("organisationId", "projectId", "taskId");

-- CreateIndex
CREATE INDEX "projects_templates_organisationId_ownerUserId_idx" ON "projects_templates"("organisationId", "ownerUserId");

-- CreateIndex
CREATE INDEX "projects_automation_rules_organisationId_projectId_enabled_idx" ON "projects_automation_rules"("organisationId", "projectId", "enabled");

-- CreateIndex
CREATE UNIQUE INDEX "projects_automation_executions_ruleId_eventKey_key" ON "projects_automation_executions"("ruleId", "eventKey");

-- CreateIndex
CREATE UNIQUE INDEX "projects_timers_organisationId_userId_key" ON "projects_timers"("organisationId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "projects_preferences_organisationId_userId_projectId_key" ON "projects_preferences"("organisationId", "userId", "projectId");

-- CreateIndex
CREATE INDEX "projects_files_organisationId_projectId_idx" ON "projects_files"("organisationId", "projectId");

-- CreateIndex
CREATE UNIQUE INDEX "projects_properties_projectId_name_key" ON "projects_properties"("projectId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "projects_property_values_propertyId_taskId_key" ON "projects_property_values"("propertyId", "taskId");

-- CreateIndex
CREATE UNIQUE INDEX "project_tasks_reference_key" ON "project_tasks"("reference");

-- CreateIndex
CREATE INDEX "project_tasks_organisationId_assigneeUserId_dueAt_idx" ON "project_tasks"("organisationId", "assigneeUserId", "dueAt");

-- AddForeignKey
ALTER TABLE "audit_entries" ADD CONSTRAINT "audit_entries_workProjectId_fkey" FOREIGN KEY ("workProjectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_entries" ADD CONSTRAINT "audit_entries_workTaskId_fkey" FOREIGN KEY ("workTaskId") REFERENCES "project_tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_entries" ADD CONSTRAINT "audit_entries_workDocumentId_fkey" FOREIGN KEY ("workDocumentId") REFERENCES "projects_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "work_teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "parties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_parentTaskId_fkey" FOREIGN KEY ("parentTaskId") REFERENCES "project_tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "projects_milestones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects_members" ADD CONSTRAINT "projects_members_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects_milestones" ADD CONSTRAINT "projects_milestones_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects_checklist_items" ADD CONSTRAINT "projects_checklist_items_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "project_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects_dependencies" ADD CONSTRAINT "projects_dependencies_predecessorId_fkey" FOREIGN KEY ("predecessorId") REFERENCES "project_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects_dependencies" ADD CONSTRAINT "projects_dependencies_successorId_fkey" FOREIGN KEY ("successorId") REFERENCES "project_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects_documents" ADD CONSTRAINT "projects_documents_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects_document_revisions" ADD CONSTRAINT "projects_document_revisions_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "projects_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects_decisions" ADD CONSTRAINT "projects_decisions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects_updates" ADD CONSTRAINT "projects_updates_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects_risks" ADD CONSTRAINT "projects_risks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects_approvals" ADD CONSTRAINT "projects_approvals_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects_requests" ADD CONSTRAINT "projects_requests_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects_comments" ADD CONSTRAINT "projects_comments_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects_comments" ADD CONSTRAINT "projects_comments_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "project_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects_time_entries" ADD CONSTRAINT "projects_time_entries_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "project_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects_personal_plans" ADD CONSTRAINT "projects_personal_plans_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "project_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects_inbox" ADD CONSTRAINT "projects_inbox_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects_inbox" ADD CONSTRAINT "projects_inbox_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "project_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects_portfolio_links" ADD CONSTRAINT "projects_portfolio_links_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "projects_portfolios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects_portfolio_links" ADD CONSTRAINT "projects_portfolio_links_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects_baselines" ADD CONSTRAINT "projects_baselines_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects_budget_lines" ADD CONSTRAINT "projects_budget_lines_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects_work_links" ADD CONSTRAINT "projects_work_links_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects_work_links" ADD CONSTRAINT "projects_work_links_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "project_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects_automation_rules" ADD CONSTRAINT "projects_automation_rules_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects_automation_executions" ADD CONSTRAINT "projects_automation_executions_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "projects_automation_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects_timers" ADD CONSTRAINT "projects_timers_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "project_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects_preferences" ADD CONSTRAINT "projects_preferences_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects_files" ADD CONSTRAINT "projects_files_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects_properties" ADD CONSTRAINT "projects_properties_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects_property_values" ADD CONSTRAINT "projects_property_values_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "projects_properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects_property_values" ADD CONSTRAINT "projects_property_values_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "project_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Preserve legacy task ownership and attach existing audit entries to the
-- visibility of their source record. No records or attachments are deleted.
UPDATE "project_tasks" SET "creatorUserId" = "assigneeUserId" WHERE "creatorUserId" = '';
UPDATE "audit_entries" SET "workProjectId" = "entityId" WHERE "entityType" = 'Project' AND EXISTS (SELECT 1 FROM "projects" p WHERE p.id = "audit_entries"."entityId");
UPDATE "audit_entries" SET "workTaskId" = "entityId" WHERE "entityType" = 'ProjectTask' AND EXISTS (SELECT 1 FROM "project_tasks" t WHERE t.id = "audit_entries"."entityId");
ALTER TABLE "projects" ADD CONSTRAINT "projects_progress_range" CHECK ("manualProgress" BETWEEN 0 AND 100 AND "version" > 0 AND "updateCadenceDays" BETWEEN 0 AND 366);
ALTER TABLE "projects" ADD CONSTRAINT "projects_date_range" CHECK ("startAt" IS NULL OR "targetAt" IS NULL OR "startAt" <= "targetAt");
ALTER TABLE "project_tasks" ADD CONSTRAINT "projects_task_nonnegative_effort" CHECK ("estimatedMinutes" >= 0 AND "weight" > 0 AND "version" > 0);
ALTER TABLE "project_tasks" ADD CONSTRAINT "projects_task_date_range" CHECK ("startAt" IS NULL OR "dueAt" IS NULL OR "startAt" <= "dueAt");
ALTER TABLE "projects_dependencies" ADD CONSTRAINT "projects_no_self_dependency" CHECK ("predecessorId" <> "successorId");
ALTER TABLE "projects_time_entries" ADD CONSTRAINT "projects_positive_time" CHECK (minutes BETWEEN 1 AND 1440);
ALTER TABLE "projects_risks" ADD CONSTRAINT "projects_risk_matrix" CHECK (probability BETWEEN 1 AND 5 AND impact BETWEEN 1 AND 5);
ALTER TABLE "projects_budget_lines" ADD CONSTRAINT "projects_nonnegative_budget" CHECK ("amountMinorUnits" >= 0);
ALTER TABLE "projects_files" ADD CONSTRAINT "projects_file_size" CHECK (size BETWEEN 1 AND 2097152);
