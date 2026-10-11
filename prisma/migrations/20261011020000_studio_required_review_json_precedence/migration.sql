-- Correct the conditional JSON-object subtraction precedence. The previous
-- migration is already applied; preserve its immutable history/checksum. Explicit
-- parentheses select the source/target object before subtracting permitted keys.
-- No data/table/column/trigger/state/legacy behavior change or backfill/reset.

CREATE OR REPLACE FUNCTION atlas_studio_migration_preparation_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='INSERT' THEN
  -- Explicit2 metadata shape. Legacy1 branch/transition behavior stays exact.
  IF NEW.intent->'schemaVersion' = '2'::jsonb THEN
   IF jsonb_typeof(NEW.intent) IS DISTINCT FROM 'object'
    OR (NEW.intent-ARRAY['schemaVersion','id','organisationId','definitionId','definitionRevision','principal','source','target','conversion','ownerQuery']) IS DISTINCT FROM '{}'::jsonb
    OR NOT (NEW.intent ?& ARRAY['schemaVersion','id','organisationId','definitionId','definitionRevision','principal','source','target','conversion','ownerQuery'])
    OR ((NEW.intent->'source')-ARRAY['versionId','versionChecksum','payload']) IS DISTINCT FROM '{}'::jsonb
    OR ((NEW.intent->'target')-ARRAY['draftId','draftRevision','compiledChecksum','payload']) IS DISTINCT FROM '{}'::jsonb
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
