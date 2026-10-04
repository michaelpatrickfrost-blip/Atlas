-- Atlas Plan. Separate from Production Planning (planning_plans).
CREATE TABLE "plan_plans" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "purpose" TEXT NOT NULL DEFAULT '',
  "planType" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "ownerUserId" TEXT NOT NULL,
  "ownerName" TEXT NOT NULL DEFAULT '',
  "teamName" TEXT NOT NULL DEFAULT '',
  "periodLabel" TEXT NOT NULL,
  "periodStart" DATE NOT NULL,
  "periodEnd" DATE NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'GBP',
  "sensitive" BOOLEAN NOT NULL DEFAULT false,
  "locked" BOOLEAN NOT NULL DEFAULT false,
  "lockedPeriods" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "parentPlanId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "plan_plans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "plan_versions" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "shared" BOOLEAN NOT NULL DEFAULT true,
  "ownerUserId" TEXT NOT NULL,
  "basedOnId" TEXT,
  "note" TEXT NOT NULL DEFAULT '',
  "approvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "plan_versions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "plan_measures" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "metricKey" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "plan_measures_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "plan_cells" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "versionId" TEXT NOT NULL,
  "metricKey" TEXT NOT NULL,
  "periodKey" TEXT NOT NULL,
  "dimensionKey" TEXT NOT NULL DEFAULT '',
  "dimensionLabel" TEXT NOT NULL DEFAULT '',
  "kind" TEXT NOT NULL,
  "value" DECIMAL(20,4) NOT NULL,
  "updatedByName" TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "plan_cells_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "plan_assumptions" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "versionId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "valueText" TEXT NOT NULL DEFAULT '',
  "effectiveOn" DATE,
  "note" TEXT NOT NULL DEFAULT '',
  "series" JSONB NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "plan_assumptions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "plan_drivers" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "versionId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "outputLabel" TEXT NOT NULL,
  "outputUnit" TEXT NOT NULL DEFAULT 'count',
  "inputs" JSONB NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "plan_drivers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "plan_blocks" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "width" TEXT NOT NULL DEFAULT 'full',
  "config" JSONB NOT NULL DEFAULT '{}',
  CONSTRAINT "plan_blocks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "plan_goals" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "parentId" TEXT,
  "title" TEXT NOT NULL,
  "ownerName" TEXT NOT NULL DEFAULT '',
  "targetText" TEXT NOT NULL DEFAULT '',
  "metricKey" TEXT,
  "qualitative" BOOLEAN NOT NULL DEFAULT false,
  "status" TEXT NOT NULL DEFAULT 'active',
  CONSTRAINT "plan_goals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "plan_initiatives" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "goalId" TEXT,
  "title" TEXT NOT NULL,
  "projectId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'open',
  CONSTRAINT "plan_initiatives_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "plan_actions" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "initiativeId" TEXT,
  "title" TEXT NOT NULL,
  "ownerName" TEXT NOT NULL DEFAULT '',
  "dueOn" DATE,
  "status" TEXT NOT NULL DEFAULT 'open',
  CONSTRAINT "plan_actions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "plan_risks" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "impactText" TEXT NOT NULL DEFAULT '',
  "metricKey" TEXT,
  "severity" TEXT NOT NULL DEFAULT 'watch',
  CONSTRAINT "plan_risks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "plan_dependencies" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "dependsOnPlanId" TEXT,
  "note" TEXT NOT NULL DEFAULT '',
  CONSTRAINT "plan_dependencies_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "plan_decisions" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "decidedOn" DATE NOT NULL,
  "ownerName" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "impact" TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "plan_decisions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "plan_comments" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "targetType" TEXT NOT NULL,
  "targetKey" TEXT NOT NULL DEFAULT '',
  "body" TEXT NOT NULL,
  "authorName" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "plan_comments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "plan_reviews" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "scheduledFor" DATE,
  "status" TEXT NOT NULL DEFAULT 'scheduled',
  "agenda" JSONB NOT NULL DEFAULT '[]',
  "snapshot" JSONB,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "plan_reviews_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "plan_updates" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "tone" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "actionsText" TEXT NOT NULL DEFAULT '',
  "authorName" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "plan_updates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "plan_lenses" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "audience" TEXT NOT NULL,
  "ownerUserId" TEXT,
  "sections" JSONB NOT NULL DEFAULT '[]',
  CONSTRAINT "plan_lenses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "plan_model_links" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "fromKey" TEXT NOT NULL,
  "toKey" TEXT NOT NULL,
  "passthrough" DECIMAL(8,4) NOT NULL,
  "note" TEXT NOT NULL DEFAULT '',
  CONSTRAINT "plan_model_links_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "plan_source_links" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "sourceModule" TEXT NOT NULL,
  "sourceId" TEXT NOT NULL,
  "sourceLabel" TEXT NOT NULL,
  "mode" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "plan_source_links_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "plan_plans_organisationId_status_idx" ON "plan_plans"("organisationId", "status");
CREATE INDEX "plan_plans_organisationId_planType_idx" ON "plan_plans"("organisationId", "planType");
CREATE INDEX "plan_versions_organisationId_planId_kind_idx" ON "plan_versions"("organisationId", "planId", "kind");
CREATE UNIQUE INDEX "plan_measures_planId_metricKey_key" ON "plan_measures"("planId", "metricKey");
CREATE INDEX "plan_measures_organisationId_planId_idx" ON "plan_measures"("organisationId", "planId");
CREATE UNIQUE INDEX "plan_cells_versionId_metricKey_periodKey_dimensionKey_kind_key" ON "plan_cells"("versionId", "metricKey", "periodKey", "dimensionKey", "kind");
CREATE INDEX "plan_cells_organisationId_planId_idx" ON "plan_cells"("organisationId", "planId");
CREATE INDEX "plan_assumptions_organisationId_planId_idx" ON "plan_assumptions"("organisationId", "planId");
CREATE INDEX "plan_drivers_organisationId_planId_idx" ON "plan_drivers"("organisationId", "planId");
CREATE INDEX "plan_blocks_organisationId_planId_sortOrder_idx" ON "plan_blocks"("organisationId", "planId", "sortOrder");
CREATE INDEX "plan_goals_organisationId_planId_idx" ON "plan_goals"("organisationId", "planId");
CREATE INDEX "plan_initiatives_organisationId_planId_idx" ON "plan_initiatives"("organisationId", "planId");
CREATE INDEX "plan_actions_organisationId_planId_status_idx" ON "plan_actions"("organisationId", "planId", "status");
CREATE INDEX "plan_risks_organisationId_planId_idx" ON "plan_risks"("organisationId", "planId");
CREATE INDEX "plan_dependencies_organisationId_planId_idx" ON "plan_dependencies"("organisationId", "planId");
CREATE INDEX "plan_decisions_organisationId_planId_idx" ON "plan_decisions"("organisationId", "planId");
CREATE INDEX "plan_comments_organisationId_planId_createdAt_idx" ON "plan_comments"("organisationId", "planId", "createdAt");
CREATE INDEX "plan_reviews_organisationId_planId_status_idx" ON "plan_reviews"("organisationId", "planId", "status");
CREATE INDEX "plan_updates_organisationId_planId_createdAt_idx" ON "plan_updates"("organisationId", "planId", "createdAt");
CREATE INDEX "plan_lenses_organisationId_planId_idx" ON "plan_lenses"("organisationId", "planId");
CREATE UNIQUE INDEX "plan_model_links_planId_fromKey_toKey_key" ON "plan_model_links"("planId", "fromKey", "toKey");
CREATE INDEX "plan_model_links_organisationId_planId_idx" ON "plan_model_links"("organisationId", "planId");
CREATE INDEX "plan_source_links_organisationId_planId_idx" ON "plan_source_links"("organisationId", "planId");

ALTER TABLE "plan_plans" ADD CONSTRAINT "plan_plans_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "plan_plans" ADD CONSTRAINT "plan_plans_parentPlanId_fkey" FOREIGN KEY ("parentPlanId") REFERENCES "plan_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "plan_versions" ADD CONSTRAINT "plan_versions_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "plan_versions" ADD CONSTRAINT "plan_versions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plan_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "plan_versions" ADD CONSTRAINT "plan_versions_basedOnId_fkey" FOREIGN KEY ("basedOnId") REFERENCES "plan_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "plan_measures" ADD CONSTRAINT "plan_measures_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "plan_measures" ADD CONSTRAINT "plan_measures_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plan_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "plan_cells" ADD CONSTRAINT "plan_cells_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "plan_cells" ADD CONSTRAINT "plan_cells_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plan_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "plan_cells" ADD CONSTRAINT "plan_cells_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "plan_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "plan_assumptions" ADD CONSTRAINT "plan_assumptions_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "plan_assumptions" ADD CONSTRAINT "plan_assumptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plan_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "plan_assumptions" ADD CONSTRAINT "plan_assumptions_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "plan_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "plan_drivers" ADD CONSTRAINT "plan_drivers_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "plan_drivers" ADD CONSTRAINT "plan_drivers_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plan_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "plan_drivers" ADD CONSTRAINT "plan_drivers_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "plan_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "plan_blocks" ADD CONSTRAINT "plan_blocks_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "plan_blocks" ADD CONSTRAINT "plan_blocks_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plan_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "plan_goals" ADD CONSTRAINT "plan_goals_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "plan_goals" ADD CONSTRAINT "plan_goals_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plan_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "plan_goals" ADD CONSTRAINT "plan_goals_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "plan_goals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "plan_initiatives" ADD CONSTRAINT "plan_initiatives_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "plan_initiatives" ADD CONSTRAINT "plan_initiatives_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plan_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "plan_initiatives" ADD CONSTRAINT "plan_initiatives_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "plan_goals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "plan_actions" ADD CONSTRAINT "plan_actions_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "plan_actions" ADD CONSTRAINT "plan_actions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plan_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "plan_actions" ADD CONSTRAINT "plan_actions_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "plan_initiatives"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "plan_risks" ADD CONSTRAINT "plan_risks_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "plan_risks" ADD CONSTRAINT "plan_risks_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plan_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "plan_dependencies" ADD CONSTRAINT "plan_dependencies_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "plan_dependencies" ADD CONSTRAINT "plan_dependencies_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plan_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "plan_dependencies" ADD CONSTRAINT "plan_dependencies_dependsOnPlanId_fkey" FOREIGN KEY ("dependsOnPlanId") REFERENCES "plan_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "plan_decisions" ADD CONSTRAINT "plan_decisions_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "plan_decisions" ADD CONSTRAINT "plan_decisions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plan_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "plan_comments" ADD CONSTRAINT "plan_comments_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "plan_comments" ADD CONSTRAINT "plan_comments_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plan_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "plan_reviews" ADD CONSTRAINT "plan_reviews_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "plan_reviews" ADD CONSTRAINT "plan_reviews_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plan_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "plan_updates" ADD CONSTRAINT "plan_updates_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "plan_updates" ADD CONSTRAINT "plan_updates_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plan_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "plan_lenses" ADD CONSTRAINT "plan_lenses_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "plan_lenses" ADD CONSTRAINT "plan_lenses_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plan_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "plan_model_links" ADD CONSTRAINT "plan_model_links_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "plan_model_links" ADD CONSTRAINT "plan_model_links_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plan_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "plan_source_links" ADD CONSTRAINT "plan_source_links_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "plan_source_links" ADD CONSTRAINT "plan_source_links_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plan_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
