-- Department and personal goals. Performance-plan rows gain the people who may see them.
ALTER TABLE "kpis" ADD COLUMN "scope" TEXT NOT NULL DEFAULT 'TEAM';
ALTER TABLE "kpis" ADD COLUMN "visibility" TEXT NOT NULL DEFAULT 'COMPANY';
ALTER TABLE "kpis" ADD COLUMN "department" TEXT NOT NULL DEFAULT '';
ALTER TABLE "kpis" ADD COLUMN "metricId" TEXT NOT NULL DEFAULT '';
ALTER TABLE "kpis" ADD COLUMN "breakdown" TEXT NOT NULL DEFAULT '';
ALTER TABLE "kpis" ADD COLUMN "sliceLabel" TEXT NOT NULL DEFAULT '';
ALTER TABLE "kpis" ADD COLUMN "employeeId" TEXT;
ALTER TABLE "kpis" ADD COLUMN "planId" TEXT;
ALTER TABLE "kpis" ADD COLUMN "personName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "kpis" ADD COLUMN "planTitle" TEXT NOT NULL DEFAULT '';
ALTER TABLE "kpis" ADD COLUMN "planKind" TEXT NOT NULL DEFAULT '';
ALTER TABLE "kpis" ADD COLUMN "support" TEXT NOT NULL DEFAULT '';
ALTER TABLE "kpis" ADD COLUMN "reviewOn" TIMESTAMP(3);
ALTER TABLE "kpis" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "kpis" ADD COLUMN "leadUserIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "kpis" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "kpis" ADD CONSTRAINT "kpis_scope_check" CHECK ("scope" IN ('COMPANY', 'DEPARTMENT', 'TEAM', 'PERSONAL', 'PIP', 'DEVELOPMENT'));
ALTER TABLE "kpis" ADD CONSTRAINT "kpis_visibility_check" CHECK ("visibility" IN ('COMPANY', 'PRIVATE'));
ALTER TABLE "kpis" ADD CONSTRAINT "kpis_status_check" CHECK ("status" IN ('ACTIVE', 'CLOSED'));

CREATE INDEX "kpis_organisationId_visibility_idx" ON "kpis"("organisationId", "visibility");
CREATE INDEX "kpis_organisationId_employeeId_idx" ON "kpis"("organisationId", "employeeId");
CREATE INDEX "kpis_planId_idx" ON "kpis"("planId");
CREATE INDEX "kpis_leadUserIds_idx" ON "kpis" USING GIN ("leadUserIds");

ALTER TABLE "kpis" ADD CONSTRAINT "kpis_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "hr_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "kpis" ADD CONSTRAINT "kpis_planId_fkey" FOREIGN KEY ("planId") REFERENCES "hr_performance_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "hr_performance_plans" ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'PIP';
ALTER TABLE "hr_performance_plans" ADD COLUMN "personName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "hr_performance_plans" ADD COLUMN "leadUserIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "hr_performance_plans" ADD CONSTRAINT "hr_performance_plans_kind_check" CHECK ("kind" IN ('PIP', 'DEVELOPMENT', 'PERSONAL'));
CREATE INDEX "hr_performance_plans_leadUserIds_idx" ON "hr_performance_plans" USING GIN ("leadUserIds");
