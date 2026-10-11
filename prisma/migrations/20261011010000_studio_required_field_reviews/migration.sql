-- Additive migration protocol2 archive guards. No records/tables/columns removed,
-- no resets/backfills. Original FKs/state CAS/history/retention remain in place.
-- These guards validate metadata integrity only; server owner/tenant/access/full
-- condition/native/value/coverage checks remain mandatory before execution.
-- Keep exact saved draft equality in atlas_studio_migration_fresh, unchanged.

CREATE OR REPLACE FUNCTION atlas_studio_migration_preparation_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='INSERT' THEN
  -- Explicit2 metadata shape. Legacy1 branch/transition behavior stays exact.
  IF NEW.intent->'schemaVersion' = '2'::jsonb THEN
   IF jsonb_typeof(NEW.intent) IS DISTINCT FROM 'object'
    OR (NEW.intent-ARRAY['schemaVersion','id','organisationId','definitionId','definitionRevision','principal','source','target','conversion','ownerQuery']) IS DISTINCT FROM '{}'::jsonb
    OR NOT (NEW.intent ?& ARRAY['schemaVersion','id','organisationId','definitionId','definitionRevision','principal','source','target','conversion','ownerQuery'])
    OR (NEW.intent->'source'-ARRAY['versionId','versionChecksum','payload']) IS DISTINCT FROM '{}'::jsonb
    OR (NEW.intent->'target'-ARRAY['draftId','draftRevision','compiledChecksum','payload']) IS DISTINCT FROM '{}'::jsonb
    OR jsonb_typeof(NEW.intent->'source'->'versionChecksum') IS DISTINCT FROM 'string'
    OR (NEW.intent->'source'->>'versionChecksum' ~ '^[a-f0-9]{64}$') IS NOT TRUE
    OR jsonb_typeof(NEW.intent->'target'->'compiledChecksum') IS DISTINCT FROM 'string'
    OR (NEW.intent->'target'->>'compiledChecksum' ~ '^[a-f0-9]{64}$') IS NOT TRUE
    OR ((NEW.intent->'source'->'payload'->'schemaVersion') IN ('1'::jsonb,'2'::jsonb)) IS NOT TRUE
    OR ((NEW.intent->'target'->'payload'->'schemaVersion') IN ('1'::jsonb,'2'::jsonb)) IS NOT TRUE
    OR (NEW.intent->'source'->'payload'->'schemaVersion' = '2'::jsonb OR NEW.intent->'target'->'payload'->'schemaVersion' = '2'::jsonb) IS NOT TRUE
    THEN RAISE EXCEPTION 'Conditional field migration intent metadata is invalid'; END IF;
  ELSIF NEW.intent->>'schemaVersion' IS DISTINCT FROM '1' THEN
   RAISE EXCEPTION 'Field migration intent format is unsupported';
  END IF;
  -- Identity mirrors the closed server intent. Integrity hashes are checked by
  -- the server library; stored JSON or this archive grants no record authority.
  IF NEW.state <> 'PREPARING' OR NEW.revision <> 0
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

CREATE OR REPLACE FUNCTION atlas_studio_migration_observation_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE p studio_field_migration_preparations; e studio_extension_records; s studio_field_slots; v studio_field_values;
 expected_extension jsonb := 'null'::jsonb; expected_slot jsonb := 'null'::jsonb; expected_value jsonb := 'null'::jsonb; result jsonb; requirement jsonb; conditional boolean := false;
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
 IF p.intent->'schemaVersion' = '2'::jsonb THEN
  conditional := true;
  IF NEW.observation-ARRAY['result','requirement'] IS DISTINCT FROM jsonb_build_object('recordId',NEW."recordId",'nativeRevision',NEW."nativeRevision",'extension',expected_extension)
   THEN RAISE EXCEPTION 'Field migration observation must match exact immutable source references'; END IF;
  requirement := NEW.observation->'requirement';
  IF jsonb_typeof(requirement) IS DISTINCT FROM 'object'
   OR (requirement-ARRAY['sourceEvaluationChecksum','targetEvaluationChecksum','targetRequired']) IS DISTINCT FROM '{}'::jsonb
   OR jsonb_typeof(requirement->'sourceEvaluationChecksum') IS DISTINCT FROM 'string'
   OR (requirement->>'sourceEvaluationChecksum' ~ '^[a-f0-9]{64}$') IS NOT TRUE
   OR jsonb_typeof(requirement->'targetEvaluationChecksum') IS DISTINCT FROM 'string'
   OR (requirement->>'targetEvaluationChecksum' ~ '^[a-f0-9]{64}$') IS NOT TRUE
   OR jsonb_typeof(requirement->'targetRequired') IS DISTINCT FROM 'boolean'
   THEN RAISE EXCEPTION 'Conditional field migration requirement evidence is invalid'; END IF;
 ELSIF p.intent->>'schemaVersion' = '1' THEN
  -- Exact retained v1 reference check: no requirement fields can leak into it.
  IF NEW.observation-'result' IS DISTINCT FROM jsonb_build_object('recordId',NEW."recordId",'nativeRevision',NEW."nativeRevision",'extension',expected_extension)
   THEN RAISE EXCEPTION 'Field migration observation must match exact immutable source references'; END IF;
 ELSE RAISE EXCEPTION 'Field migration intent format is unsupported'; END IF;
 result := NEW.observation->'result';
 IF result->>'kind'='valid' THEN
  IF (result-ARRAY['kind','targetFingerprint','isNull','lossy']) IS DISTINCT FROM '{}'::jsonb
   OR (result->>'targetFingerprint' ~ '^[a-f0-9]{64}$') IS NOT TRUE
   OR (conditional AND jsonb_typeof(result->'targetFingerprint') IS DISTINCT FROM 'string')
   OR jsonb_typeof(result->'isNull') IS DISTINCT FROM 'boolean' OR jsonb_typeof(result->'lossy') IS DISTINCT FROM 'boolean'
   OR (conditional AND requirement->'targetRequired' = 'true'::jsonb AND result->'isNull' = 'true'::jsonb)
   THEN RAISE EXCEPTION 'Field migration preview result is invalid'; END IF;
 ELSIF result->>'kind'='invalid' THEN
  IF (result-ARRAY['kind','code']) IS DISTINCT FROM '{}'::jsonb
   OR (result->>'code' IN ('INVALID_SOURCE','INVALID_TARGET','UNMAPPED_VALUE','LOSS_REQUIRES_REVIEW','FIELD_STORAGE_INVALID')
     OR (conditional AND result->>'code'='FIELD_REQUIRED' AND requirement->'targetRequired'='true'::jsonb)) IS NOT TRUE
   THEN RAISE EXCEPTION 'Field migration preview result is invalid'; END IF;
 ELSE RAISE EXCEPTION 'Field migration preview result is invalid'; END IF;
 RETURN NEW;
END $$;
