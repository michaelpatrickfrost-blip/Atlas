-- Additive compatibility for the first deployed work-management schema.
-- Keep applied historical migrations intact.
ALTER TABLE "audit_entries" ADD COLUMN "workProjectId" TEXT, ADD COLUMN "workTaskId" TEXT, ADD COLUMN "workDocumentId" TEXT;

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

CREATE TABLE "projects_automation_executions" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projects_automation_executions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "projects_timers" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projects_timers_pkey" PRIMARY KEY ("id")
);

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

CREATE TABLE "projects_properties" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "options" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "projects_properties_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "projects_property_values" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "projects_property_values_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "projects_templates_organisationId_ownerUserId_idx" ON "projects_templates"("organisationId", "ownerUserId");

CREATE INDEX "projects_automation_rules_organisationId_projectId_enabled_idx" ON "projects_automation_rules"("organisationId", "projectId", "enabled");

CREATE UNIQUE INDEX "projects_automation_executions_ruleId_eventKey_key" ON "projects_automation_executions"("ruleId", "eventKey");

CREATE UNIQUE INDEX "projects_timers_organisationId_userId_key" ON "projects_timers"("organisationId", "userId");

CREATE UNIQUE INDEX "projects_preferences_organisationId_userId_projectId_key" ON "projects_preferences"("organisationId", "userId", "projectId");

CREATE INDEX "projects_files_organisationId_projectId_idx" ON "projects_files"("organisationId", "projectId");

CREATE UNIQUE INDEX "projects_properties_projectId_name_key" ON "projects_properties"("projectId", "name");

CREATE UNIQUE INDEX "projects_property_values_propertyId_taskId_key" ON "projects_property_values"("propertyId", "taskId");

ALTER TABLE "audit_entries" ADD CONSTRAINT "audit_entries_workProjectId_fkey" FOREIGN KEY ("workProjectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "audit_entries" ADD CONSTRAINT "audit_entries_workTaskId_fkey" FOREIGN KEY ("workTaskId") REFERENCES "project_tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "audit_entries" ADD CONSTRAINT "audit_entries_workDocumentId_fkey" FOREIGN KEY ("workDocumentId") REFERENCES "projects_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "projects_automation_rules" ADD CONSTRAINT "projects_automation_rules_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "projects_automation_executions" ADD CONSTRAINT "projects_automation_executions_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "projects_automation_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "projects_timers" ADD CONSTRAINT "projects_timers_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "project_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "projects_preferences" ADD CONSTRAINT "projects_preferences_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "projects_files" ADD CONSTRAINT "projects_files_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "projects_properties" ADD CONSTRAINT "projects_properties_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "projects_property_values" ADD CONSTRAINT "projects_property_values_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "projects_properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "projects_property_values" ADD CONSTRAINT "projects_property_values_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "project_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "projects_files" ADD CONSTRAINT "projects_file_size" CHECK (size BETWEEN 1 AND 2097152);
