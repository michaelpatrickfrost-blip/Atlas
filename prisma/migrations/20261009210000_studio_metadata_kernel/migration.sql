-- CreateTable
CREATE TABLE "studio_definitions" (
    "id" UUID NOT NULL,
    "organisationId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 0,
    "latestVersion" INTEGER NOT NULL DEFAULT 0,
    "activeVersionId" UUID,
    "retiredAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "studio_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "studio_drafts" (
    "id" UUID NOT NULL,
    "organisationId" TEXT NOT NULL,
    "definitionId" UUID NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 0,
    "baseVersionId" UUID,
    "editorUserId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "validation" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "studio_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "studio_definition_versions" (
    "id" UUID NOT NULL,
    "organisationId" TEXT NOT NULL,
    "definitionId" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "semanticVersion" TEXT NOT NULL,
    "schemaVersion" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,
    "compiledPlan" JSONB NOT NULL,
    "checksum" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "studio_definition_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "studio_dependencies" (
    "id" UUID NOT NULL,
    "organisationId" TEXT NOT NULL,
    "definitionId" UUID NOT NULL,
    "versionId" UUID NOT NULL,
    "ownerModuleId" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "contractVersion" INTEGER NOT NULL,
    "schemaHash" TEXT NOT NULL,
    "contractHash" TEXT NOT NULL,

    CONSTRAINT "studio_dependencies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "studio_definitions_organisationId_retiredAt_idx" ON "studio_definitions"("organisationId", "retiredAt");

-- CreateIndex
CREATE UNIQUE INDEX "studio_definitions_id_organisationId_key" ON "studio_definitions"("id", "organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "studio_definitions_organisationId_kind_key_key" ON "studio_definitions"("organisationId", "kind", "key");

-- CreateIndex
CREATE UNIQUE INDEX "studio_drafts_definitionId_key" ON "studio_drafts"("definitionId");

-- CreateIndex
CREATE INDEX "studio_drafts_organisationId_updatedAt_idx" ON "studio_drafts"("organisationId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "studio_drafts_definitionId_organisationId_key" ON "studio_drafts"("definitionId", "organisationId");

-- CreateIndex
CREATE INDEX "studio_definition_versions_organisationId_publishedAt_idx" ON "studio_definition_versions"("organisationId", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "studio_definition_versions_id_definitionId_organisationId_key" ON "studio_definition_versions"("id", "definitionId", "organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "studio_definition_versions_definitionId_organisationId_vers_key" ON "studio_definition_versions"("definitionId", "organisationId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "studio_definition_versions_definitionId_organisationId_sema_key" ON "studio_definition_versions"("definitionId", "organisationId", "semanticVersion");

-- CreateIndex
CREATE INDEX "studio_dependencies_organisationId_ownerModuleId_contractId_idx" ON "studio_dependencies"("organisationId", "ownerModuleId", "contractId");

-- CreateIndex
CREATE UNIQUE INDEX "studio_dependencies_versionId_contractId_contractVersion_key" ON "studio_dependencies"("versionId", "contractId", "contractVersion");

-- AddForeignKey
ALTER TABLE "studio_definitions" ADD CONSTRAINT "studio_definitions_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "studio_definitions" ADD CONSTRAINT "studio_definitions_activeVersionId_id_organisationId_fkey" FOREIGN KEY ("activeVersionId", "id", "organisationId") REFERENCES "studio_definition_versions"("id", "definitionId", "organisationId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "studio_drafts" ADD CONSTRAINT "studio_drafts_definitionId_organisationId_fkey" FOREIGN KEY ("definitionId", "organisationId") REFERENCES "studio_definitions"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "studio_drafts" ADD CONSTRAINT "studio_drafts_baseVersionId_definitionId_organisationId_fkey" FOREIGN KEY ("baseVersionId", "definitionId", "organisationId") REFERENCES "studio_definition_versions"("id", "definitionId", "organisationId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "studio_definition_versions" ADD CONSTRAINT "studio_definition_versions_definitionId_organisationId_fkey" FOREIGN KEY ("definitionId", "organisationId") REFERENCES "studio_definitions"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "studio_dependencies" ADD CONSTRAINT "studio_dependencies_versionId_definitionId_organisationId_fkey" FOREIGN KEY ("versionId", "definitionId", "organisationId") REFERENCES "studio_definition_versions"("id", "definitionId", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Pointers may form a history cycle; defer pointer checks so the existing atomic
-- authorised Test-company cleanup can remove all of that tenant's metadata.
ALTER TABLE "studio_definitions" ALTER CONSTRAINT "studio_definitions_activeVersionId_id_organisationId_fkey" DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "studio_drafts" ALTER CONSTRAINT "studio_drafts_baseVersionId_definitionId_organisationId_fkey" DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "studio_definitions" ADD CONSTRAINT "studio_definition_counters" CHECK (revision >= 0 AND "latestVersion" >= 0);
ALTER TABLE "studio_drafts" ADD CONSTRAINT "studio_draft_revision" CHECK (revision >= 0);
ALTER TABLE "studio_definition_versions" ADD CONSTRAINT "studio_version_valid" CHECK (version > 0 AND "schemaVersion" > 0 AND checksum ~ '^[a-f0-9]{64}$');
ALTER TABLE "studio_dependencies" ADD CONSTRAINT "studio_dependency_valid" CHECK ("contractVersion" > 0 AND "schemaHash" ~ '^[a-f0-9]{64}$' AND "contractHash" ~ '^[a-f0-9]{64}$');

CREATE FUNCTION atlas_studio_history_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP = 'DELETE' AND current_setting('atlas.test_wipe', true) = 'on'
    AND EXISTS (SELECT 1 FROM organisations WHERE id = OLD."organisationId" AND "isTest" AND kind = 'CUSTOMER') THEN
   RETURN OLD;
 END IF;
 RAISE EXCEPTION 'Published Studio history is immutable';
END $$;
CREATE TRIGGER studio_versions_immutable BEFORE UPDATE OR DELETE ON "studio_definition_versions" FOR EACH ROW EXECUTE FUNCTION atlas_studio_history_guard();
CREATE TRIGGER studio_dependencies_immutable BEFORE UPDATE OR DELETE ON "studio_dependencies" FOR EACH ROW EXECUTE FUNCTION atlas_studio_history_guard();

CREATE FUNCTION atlas_studio_identity_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP = 'DELETE' THEN
  IF current_setting('atlas.test_wipe', true) = 'on'
     AND EXISTS (SELECT 1 FROM organisations WHERE id = OLD."organisationId" AND "isTest" AND kind = 'CUSTOMER') THEN RETURN OLD; END IF;
  RAISE EXCEPTION 'Retire Studio definitions; historical keys cannot be recycled';
 END IF;
 IF (NEW.id, NEW."organisationId", NEW.key, NEW.kind) IS DISTINCT FROM (OLD.id, OLD."organisationId", OLD.key, OLD.kind) THEN
  RAISE EXCEPTION 'Studio definition identity is immutable';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER studio_identity_immutable BEFORE UPDATE OR DELETE ON "studio_definitions" FOR EACH ROW EXECUTE FUNCTION atlas_studio_identity_guard();

-- Dependency rows may only describe edges sealed into the immutable plan.
-- This allows nested publication inserts, but prevents later appended edges.
CREATE FUNCTION atlas_studio_dependency_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NOT EXISTS (
  SELECT 1 FROM studio_definition_versions v,
   jsonb_array_elements(v."compiledPlan"->'dependencies') edge
  WHERE v.id = NEW."versionId" AND v."definitionId" = NEW."definitionId"
   AND v."organisationId" = NEW."organisationId"
   AND edge->>'id' = NEW."contractId"
   AND edge->>'version' = NEW."contractVersion"::text
   AND edge->>'ownerModuleId' = NEW."ownerModuleId"
   AND edge->>'schemaHash' = NEW."schemaHash"
   AND edge->>'contractHash' = NEW."contractHash"
 ) THEN RAISE EXCEPTION 'Studio dependency is not part of its sealed plan'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER studio_dependency_sealed BEFORE INSERT ON studio_dependencies FOR EACH ROW EXECUTE FUNCTION atlas_studio_dependency_guard();
