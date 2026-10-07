-- Additive connected planning and immutable S&OP snapshots. No existing records are changed.
ALTER TABLE "plan_plans" ADD COLUMN "revision" INTEGER NOT NULL DEFAULT 1;
CREATE TABLE "plan_inputs" (
 "id" TEXT NOT NULL PRIMARY KEY, "organisationId" TEXT NOT NULL, "planId" TEXT NOT NULL,
 "sourceModule" TEXT NOT NULL DEFAULT 'plan', "sourceType" TEXT NOT NULL DEFAULT 'manual', "sourceId" TEXT NOT NULL DEFAULT '',
 "label" TEXT NOT NULL, "productId" TEXT, "metricKey" TEXT NOT NULL, "periodKey" TEXT NOT NULL,
 "value" DECIMAL(20,4) NOT NULL, "probability" DECIMAL(8,4) NOT NULL DEFAULT 100, "probabilityOverride" BOOLEAN NOT NULL DEFAULT false,
 "unitPriceMinor" INTEGER, "note" TEXT NOT NULL, "included" BOOLEAN NOT NULL DEFAULT true,
 "revision" INTEGER NOT NULL DEFAULT 1, "createdByUserId" TEXT NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "plan_inputs_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plan_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 CONSTRAINT "plan_inputs_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
 CONSTRAINT "plan_inputs_probability_check" CHECK ("probability" >= 0 AND "probability" <= 100)
);
CREATE INDEX "plan_inputs_organisationId_planId_periodKey_idx" ON "plan_inputs"("organisationId","planId","periodKey");
CREATE INDEX "plan_inputs_organisationId_sourceModule_sourceType_sourceId_idx" ON "plan_inputs"("organisationId","sourceModule","sourceType","sourceId");
CREATE TABLE "sop_cycles" (
 "id" TEXT NOT NULL PRIMARY KEY, "organisationId" TEXT NOT NULL, "name" TEXT NOT NULL,
 "startsOn" DATE NOT NULL, "endsOn" DATE NOT NULL, "currency" TEXT NOT NULL DEFAULT 'GBP', "ownerUserId" TEXT NOT NULL,
 "companyVisible" BOOLEAN NOT NULL DEFAULT false, "sourcePlanIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
 "settings" JSONB NOT NULL DEFAULT '{}', "workflow" JSONB NOT NULL DEFAULT '[]',
 "risks" JSONB NOT NULL DEFAULT '[]', "actions" JSONB NOT NULL DEFAULT '[]', "decisions" JSONB NOT NULL DEFAULT '[]',
 "revision" INTEGER NOT NULL DEFAULT 1, "inputRevision" INTEGER NOT NULL DEFAULT 1,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "sop_cycles_dates_check" CHECK ("endsOn" >= "startsOn")
);
CREATE INDEX "sop_cycles_organisationId_ownerUserId_startsOn_idx" ON "sop_cycles"("organisationId","ownerUserId","startsOn");
CREATE TABLE "sop_versions" (
 "id" TEXT NOT NULL PRIMARY KEY, "organisationId" TEXT NOT NULL, "cycleId" TEXT NOT NULL, "name" TEXT NOT NULL,
 "kind" TEXT NOT NULL DEFAULT 'consensus', "status" TEXT NOT NULL DEFAULT 'draft', "sourceRevision" INTEGER NOT NULL,
 "basedOnId" TEXT, "payload" JSONB NOT NULL, "requiredCapabilities" TEXT[] NOT NULL, "requiredModules" TEXT[] NOT NULL,
 "createdByUserId" TEXT NOT NULL, "approvedByUserId" TEXT, "approvedAt" TIMESTAMP(3), "publishedAt" TIMESTAMP(3), "publicationId" TEXT,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "sop_versions_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "sop_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "sop_versions_publicationId_key" ON "sop_versions"("publicationId");
CREATE INDEX "sop_versions_organisationId_cycleId_createdAt_idx" ON "sop_versions"("organisationId","cycleId","createdAt");
ALTER TABLE "manufacturing_demand_forecasts" ADD COLUMN "sourceSopVersionId" TEXT;
ALTER TABLE "manufacturing_demand_forecasts" ADD CONSTRAINT "manufacturing_demand_forecasts_sourceSopVersionId_fkey" FOREIGN KEY ("sourceSopVersionId") REFERENCES "sop_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Calculated evidence is append-only; approval/publication may change metadata only.
CREATE FUNCTION atlas_sop_version_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF ROW(NEW."organisationId",NEW."cycleId",NEW."kind",NEW."sourceRevision",NEW."basedOnId",NEW."payload",NEW."requiredCapabilities",NEW."requiredModules",NEW."createdByUserId",NEW."createdAt")
 IS DISTINCT FROM ROW(OLD."organisationId",OLD."cycleId",OLD."kind",OLD."sourceRevision",OLD."basedOnId",OLD."payload",OLD."requiredCapabilities",OLD."requiredModules",OLD."createdByUserId",OLD."createdAt") THEN
  RAISE EXCEPTION 'S&OP calculated evidence is immutable; create a new version';
 END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER sop_versions_immutable BEFORE UPDATE ON "sop_versions" FOR EACH ROW EXECUTE FUNCTION atlas_sop_version_immutable();
