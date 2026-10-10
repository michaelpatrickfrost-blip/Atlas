-- CreateTable
CREATE TABLE "studio_field_migration_preparations" (
    "id" UUID NOT NULL,
    "organisationId" TEXT NOT NULL,
    "definitionId" UUID NOT NULL,
    "entityId" TEXT NOT NULL,
    "sourceVersionId" UUID NOT NULL,
    "sourceGenerationId" UUID NOT NULL,
    "draftId" UUID NOT NULL,
    "targetGenerationId" UUID NOT NULL,
    "intent" JSONB NOT NULL,
    "intentChecksum" CHAR(64) NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'PREPARING',
    "revision" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "studio_field_migration_preparations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "studio_field_migration_reviews" (
    "id" UUID NOT NULL,
    "organisationId" TEXT NOT NULL,
    "definitionId" UUID NOT NULL,
    "review" JSONB NOT NULL,
    "checksum" CHAR(64) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "studio_field_migration_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "studio_field_migration_observations" (
    "id" UUID NOT NULL,
    "preparationId" UUID NOT NULL,
    "organisationId" TEXT NOT NULL,
    "definitionId" UUID NOT NULL,
    "entityId" TEXT NOT NULL,
    "sourceGenerationId" UUID NOT NULL,
    "recordId" TEXT NOT NULL,
    "nativeRevision" INTEGER NOT NULL,
    "extensionId" UUID,
    "extensionRevision" INTEGER,
    "slotId" UUID,
    "slotRevision" INTEGER,
    "valueId" UUID,
    "observation" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "studio_field_migration_observations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "studio_field_migration_preparations_organisationId_definiti_idx" ON "studio_field_migration_preparations"("organisationId", "definitionId", "state");

-- CreateIndex
CREATE UNIQUE INDEX "studio_migration_preparation_tenant_key" ON "studio_field_migration_preparations"("id", "definitionId", "organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "studio_migration_preparation_source_key" ON "studio_field_migration_preparations"("id", "definitionId", "organisationId", "entityId", "sourceGenerationId");

-- CreateIndex
CREATE INDEX "studio_field_migration_reviews_organisationId_definitionId_idx" ON "studio_field_migration_reviews"("organisationId", "definitionId");

-- CreateIndex
CREATE UNIQUE INDEX "studio_migration_review_tenant_key" ON "studio_field_migration_reviews"("id", "definitionId", "organisationId");

-- CreateIndex
CREATE INDEX "studio_field_migration_observations_organisationId_definiti_idx" ON "studio_field_migration_observations"("organisationId", "definitionId", "preparationId");

-- CreateIndex
CREATE UNIQUE INDEX "studio_field_migration_observations_preparationId_recordId_key" ON "studio_field_migration_observations"("preparationId", "recordId");

-- CreateIndex
CREATE UNIQUE INDEX "studio_drafts_id_definitionId_organisationId_key" ON "studio_drafts"("id", "definitionId", "organisationId");

-- AddForeignKey
ALTER TABLE "studio_field_migration_preparations" ADD CONSTRAINT "studio_field_migration_preparations_sourceVersionId_defini_fkey" FOREIGN KEY ("sourceVersionId", "definitionId", "organisationId") REFERENCES "studio_definition_versions"("id", "definitionId", "organisationId") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "studio_field_migration_preparations" ADD CONSTRAINT "studio_field_migration_preparations_sourceGenerationId_def_fkey" FOREIGN KEY ("sourceGenerationId", "definitionId", "organisationId", "entityId") REFERENCES "studio_field_generations"("id", "definitionId", "organisationId", "entityId") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "studio_field_migration_preparations" ADD CONSTRAINT "studio_field_migration_preparations_draftId_definitionId_o_fkey" FOREIGN KEY ("draftId", "definitionId", "organisationId") REFERENCES "studio_drafts"("id", "definitionId", "organisationId") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "studio_field_migration_reviews" ADD CONSTRAINT "studio_field_migration_reviews_id_definitionId_organisatio_fkey" FOREIGN KEY ("id", "definitionId", "organisationId") REFERENCES "studio_field_migration_preparations"("id", "definitionId", "organisationId") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "studio_field_migration_observations" ADD CONSTRAINT "studio_field_migration_observations_preparationId_definiti_fkey" FOREIGN KEY ("preparationId", "definitionId", "organisationId", "entityId", "sourceGenerationId") REFERENCES "studio_field_migration_preparations"("id", "definitionId", "organisationId", "entityId", "sourceGenerationId") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "studio_field_migration_observations" ADD CONSTRAINT "studio_field_migration_observations_extensionId_organisati_fkey" FOREIGN KEY ("extensionId", "organisationId", "entityId") REFERENCES "studio_extension_records"("id", "organisationId", "entityId") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "studio_field_migration_observations" ADD CONSTRAINT "studio_field_migration_observations_slotId_definitionId_so_fkey" FOREIGN KEY ("slotId", "definitionId", "sourceGenerationId", "organisationId") REFERENCES "studio_field_slots"("id", "definitionId", "generationId", "organisationId") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "studio_field_migration_observations" ADD CONSTRAINT "studio_field_migration_observations_valueId_slotId_organis_fkey" FOREIGN KEY ("valueId", "slotId", "organisationId") REFERENCES "studio_field_values"("id", "slotId", "organisationId") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- Additive preparation/archive only. No conversion worker or target publication.
ALTER TABLE studio_field_migration_preparations ADD CONSTRAINT studio_migration_preparation_shape CHECK (
 revision >= 0 AND state IN ('PREPARING','REVIEWED','CANCELLED')
 AND "sourceGenerationId" <> "targetGenerationId" AND "intentChecksum" ~ '^[a-f0-9]{64}$'
 AND jsonb_typeof(intent) = 'object');
ALTER TABLE studio_field_migration_reviews ADD CONSTRAINT studio_migration_review_shape CHECK (
 checksum ~ '^[a-f0-9]{64}$' AND jsonb_typeof(review) = 'object');
ALTER TABLE studio_field_migration_observations ADD CONSTRAINT studio_migration_observation_shape CHECK (
 "recordId" ~ '^[a-zA-Z0-9_-]{1,100}$' AND "nativeRevision" > 0
 AND (("extensionId" IS NULL AND "extensionRevision" IS NULL AND "slotId" IS NULL AND "slotRevision" IS NULL AND "valueId" IS NULL)
  OR ("extensionId" IS NOT NULL AND "extensionRevision" IS NOT NULL AND "extensionRevision" >= 0
   AND (("slotId" IS NULL AND "slotRevision" IS NULL AND "valueId" IS NULL)
    OR ("slotId" IS NOT NULL AND "slotRevision" IS NOT NULL AND "slotRevision" >= 0))))
 AND jsonb_typeof(observation) = 'object');

CREATE FUNCTION atlas_studio_migration_fresh(p studio_field_migration_preparations) RETURNS boolean LANGUAGE sql AS $$
 SELECT EXISTS (
  SELECT 1 FROM studio_definitions d JOIN studio_definition_versions v
   ON v.id=p."sourceVersionId" AND v."definitionId"=d.id AND v."organisationId"=d."organisationId"
  JOIN studio_drafts draft ON draft.id=p."draftId" AND draft."definitionId"=d.id AND draft."organisationId"=d."organisationId"
  WHERE d.id=p."definitionId" AND d."organisationId"=p."organisationId" AND d.kind='customField' AND d."retiredAt" IS NULL
   AND d."activeVersionId"=v.id AND d.revision::text=p.intent->>'definitionRevision'
   AND draft.revision::text=p.intent->'target'->>'draftRevision' AND draft.payload=p.intent->'target'->'payload'
   AND p.intent->'source'=jsonb_build_object('versionId',v.id,'versionChecksum',v.checksum,'payload',v.payload)
  FOR SHARE OF d,draft
 );
$$;

CREATE FUNCTION atlas_studio_migration_preparation_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='INSERT' THEN
  -- Identity mirrors the closed server intent. Integrity hashes are checked by
  -- the server library; stored JSON or this archive grants no record authority.
  IF NEW.state <> 'PREPARING' OR NEW.revision <> 0
   OR NEW.intent->>'schemaVersion' IS DISTINCT FROM '1'
   OR NEW.intent->>'id' IS DISTINCT FROM NEW.id::text
   OR NEW.intent->>'organisationId' IS DISTINCT FROM NEW."organisationId"
   OR NEW.intent->>'definitionId' IS DISTINCT FROM NEW."definitionId"::text
   OR NEW.intent->'principal'->>'organisationId' IS DISTINCT FROM NEW."organisationId"
   OR NEW.intent->'source'->>'versionId' IS DISTINCT FROM NEW."sourceVersionId"::text
   OR NEW.intent->'source'->'payload'->>'storageGeneration' IS DISTINCT FROM NEW."sourceGenerationId"::text
   OR NEW.intent->'target'->>'draftId' IS DISTINCT FROM NEW."draftId"::text
   OR NEW.intent->'target'->'payload'->>'storageGeneration' IS DISTINCT FROM NEW."targetGenerationId"::text
   OR NEW.intent->'source'->'payload'->'entity'->>'id' IS DISTINCT FROM NEW."entityId"
   OR NEW.intent->'target'->'payload'->'entity'->>'id' IS DISTINCT FROM NEW."entityId"
   OR NEW.intent->'source'->'payload'->'field'->>'key' IS DISTINCT FROM NEW.intent->'target'->'payload'->'field'->>'key'
   OR NOT atlas_studio_migration_fresh(NEW)
   THEN RAISE EXCEPTION 'Field migration preparation must pin a fresh tenant-owned source and draft'; END IF;
 ELSE
  IF (to_jsonb(NEW)-ARRAY['state','revision','updatedAt']) IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['state','revision','updatedAt'])
   OR NEW.revision <> OLD.revision+1
   OR NOT ((OLD.state='PREPARING' AND NEW.state IN ('PREPARING','REVIEWED','CANCELLED'))
    OR (OLD.state='REVIEWED' AND NEW.state='CANCELLED'))
   THEN RAISE EXCEPTION 'Field migration intent is immutable; state changes require CAS and a permitted transition'; END IF;
  IF NEW.state='REVIEWED' AND (NOT atlas_studio_migration_fresh(NEW) OR NOT EXISTS (
    SELECT 1 FROM studio_field_migration_reviews r WHERE r.id=NEW.id AND r."definitionId"=NEW."definitionId" AND r."organisationId"=NEW."organisationId"))
   THEN RAISE EXCEPTION 'A field migration requires a fresh sealed review'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER studio_migration_preparation_guard BEFORE INSERT OR UPDATE ON studio_field_migration_preparations FOR EACH ROW EXECUTE FUNCTION atlas_studio_migration_preparation_guard();
CREATE TRIGGER studio_migration_preparation_retained BEFORE DELETE ON studio_field_migration_preparations FOR EACH ROW EXECUTE FUNCTION atlas_studio_history_guard();

CREATE FUNCTION atlas_studio_migration_observation_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE p studio_field_migration_preparations; e studio_extension_records; s studio_field_slots; v studio_field_values;
 expected_extension jsonb := 'null'::jsonb; expected_slot jsonb := 'null'::jsonb; expected_value jsonb := 'null'::jsonb; result jsonb;
BEGIN
 SELECT * INTO p FROM studio_field_migration_preparations WHERE id=NEW."preparationId" AND "organisationId"=NEW."organisationId"
  AND "definitionId"=NEW."definitionId" AND "entityId"=NEW."entityId" AND "sourceGenerationId"=NEW."sourceGenerationId" FOR UPDATE;
 IF NOT FOUND OR p.state <> 'PREPARING' OR EXISTS (SELECT 1 FROM studio_field_migration_reviews WHERE id=p.id)
  THEN RAISE EXCEPTION 'Field migration observations require an unsealed tenant-owned preparation'; END IF;
 IF NEW."extensionId" IS NOT NULL THEN
  SELECT * INTO e FROM studio_extension_records WHERE id=NEW."extensionId" AND "organisationId"=NEW."organisationId" AND "entityId"=NEW."entityId" AND "recordId"=NEW."recordId" AND revision=NEW."extensionRevision" FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Field migration source observation changed'; END IF;
 ELSE
  IF EXISTS (SELECT 1 FROM studio_extension_records WHERE "organisationId"=NEW."organisationId" AND "entityId"=NEW."entityId" AND "recordId"=NEW."recordId") THEN RAISE EXCEPTION 'Field migration source observation changed'; END IF;
 END IF;
 IF NEW."slotId" IS NOT NULL THEN
  SELECT * INTO s FROM studio_field_slots WHERE id=NEW."slotId" AND "extensionId"=NEW."extensionId" AND "organisationId"=NEW."organisationId"
   AND "definitionId"=NEW."definitionId" AND "generationId"=NEW."sourceGenerationId" AND revision=NEW."slotRevision" AND "activeValueId" IS NOT DISTINCT FROM NEW."valueId" FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Field migration source observation changed'; END IF;
  IF NEW."valueId" IS NOT NULL THEN
   SELECT * INTO v FROM studio_field_values WHERE id=NEW."valueId" AND "slotId"=s.id AND "organisationId"=NEW."organisationId" AND revision=s.revision;
   IF NOT FOUND THEN RAISE EXCEPTION 'Field migration source observation changed'; END IF;
   expected_value := jsonb_build_object('id',v.id,'revision',v.revision,'versionId',v."versionId",'fingerprint',v.fingerprint);
  ELSIF s.revision <> 0 THEN RAISE EXCEPTION 'Field migration source observation changed'; END IF;
  expected_slot := jsonb_build_object('id',s.id,'revision',s.revision,'value',expected_value);
 ELSIF NEW."extensionId" IS NOT NULL AND EXISTS (SELECT 1 FROM studio_field_slots WHERE "extensionId"=NEW."extensionId" AND "definitionId"=NEW."definitionId" AND "generationId"=NEW."sourceGenerationId" AND "organisationId"=NEW."organisationId") THEN RAISE EXCEPTION 'Field migration source observation changed'; END IF;
 IF NEW."extensionId" IS NOT NULL THEN expected_extension := jsonb_build_object('id',e.id,'revision',e.revision,'slot',expected_slot); END IF;
 IF NEW.observation-'result' IS DISTINCT FROM jsonb_build_object('recordId',NEW."recordId",'nativeRevision',NEW."nativeRevision",'extension',expected_extension)
  THEN RAISE EXCEPTION 'Field migration observation must match exact immutable source references'; END IF;
 result := NEW.observation->'result';
 IF result->>'kind'='valid' THEN
  IF (result-ARRAY['kind','targetFingerprint','isNull','lossy']) IS DISTINCT FROM '{}'::jsonb
   OR (result->>'targetFingerprint' ~ '^[a-f0-9]{64}$') IS NOT TRUE
   OR jsonb_typeof(result->'isNull') IS DISTINCT FROM 'boolean' OR jsonb_typeof(result->'lossy') IS DISTINCT FROM 'boolean'
   THEN RAISE EXCEPTION 'Field migration preview result is invalid'; END IF;
 ELSIF result->>'kind'='invalid' THEN
  IF (result-ARRAY['kind','code']) IS DISTINCT FROM '{}'::jsonb
   OR (result->>'code' IN ('INVALID_SOURCE','INVALID_TARGET','UNMAPPED_VALUE','LOSS_REQUIRES_REVIEW','FIELD_STORAGE_INVALID')) IS NOT TRUE
   THEN RAISE EXCEPTION 'Field migration preview result is invalid'; END IF;
 ELSE RAISE EXCEPTION 'Field migration preview result is invalid'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER studio_migration_observation_guard BEFORE INSERT ON studio_field_migration_observations FOR EACH ROW EXECUTE FUNCTION atlas_studio_migration_observation_guard();
CREATE TRIGGER studio_migration_observation_immutable BEFORE UPDATE OR DELETE ON studio_field_migration_observations FOR EACH ROW EXECUTE FUNCTION atlas_studio_history_guard();

CREATE FUNCTION atlas_studio_migration_review_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE p studio_field_migration_preparations; total bigint; valid bigint; invalid bigint; lossy bigint;
BEGIN
 SELECT * INTO p FROM studio_field_migration_preparations WHERE id=NEW.id AND "definitionId"=NEW."definitionId" AND "organisationId"=NEW."organisationId" FOR UPDATE;
 IF NOT FOUND OR p.state <> 'PREPARING' OR NOT atlas_studio_migration_fresh(p)
  OR NEW.review-ARRAY['cohort','summary'] IS DISTINCT FROM p.intent
  THEN RAISE EXCEPTION 'A field migration review must seal its fresh tenant-owned intent'; END IF;
 SELECT count(*),count(*) FILTER (WHERE observation->'result'->>'kind'='valid'),count(*) FILTER (WHERE observation->'result'->>'kind'='invalid'),count(*) FILTER (WHERE observation->'result'->>'lossy'='true')
  INTO total,valid,invalid,lossy FROM studio_field_migration_observations WHERE "preparationId"=p.id AND "organisationId"=p."organisationId";
 IF NEW.review->'cohort'->>'recordCount' IS DISTINCT FROM total::text
  OR NEW.review->'summary' IS DISTINCT FROM jsonb_build_object('validCount',valid,'invalidCount',invalid,'lossyCount',lossy)
  OR (NEW.review->'cohort'->>'observationDigest' ~ '^[a-f0-9]{64}$') IS NOT TRUE
  THEN RAISE EXCEPTION 'A field migration review must account for all stored observations'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER studio_migration_review_guard BEFORE INSERT ON studio_field_migration_reviews FOR EACH ROW EXECUTE FUNCTION atlas_studio_migration_review_guard();
CREATE TRIGGER studio_migration_review_immutable BEFORE UPDATE OR DELETE ON studio_field_migration_reviews FOR EACH ROW EXECUTE FUNCTION atlas_studio_history_guard();
