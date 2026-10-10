-- Forward integrity guards only. No data conversion, schema/backfill/reset or
-- domain permission grant. Applied 0005/6/7 and exact cutover/settlement proof stay.
CREATE FUNCTION atlas_studio_field_cosmetic_compatible(a JSONB,b JSONB) RETURNS BOOLEAN LANGUAGE sql IMMUTABLE AS $$
 SELECT coalesce(jsonb_typeof(a)='object' AND jsonb_typeof(b)='object'
  AND jsonb_typeof(a->'field')='object' AND jsonb_typeof(b->'field')='object'
  AND (a-'field')=(b-'field') AND ((a->'field')-ARRAY['label','help'])=((b->'field')-ARRAY['label','help']),false);
$$;
CREATE FUNCTION atlas_studio_field_generation_active(org TEXT,def UUID,gen UUID,ver UUID) RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
 SELECT EXISTS (SELECT 1 FROM studio_definitions d JOIN studio_definition_versions a ON a.id=d."activeVersionId" AND a."organisationId"=d."organisationId" AND a."definitionId"=d.id
  WHERE d.id=def AND d."organisationId"=org AND d.kind='customField' AND d."retiredAt" IS NULL AND a.payload->>'storageGeneration'=gen::text
   AND (ver IS NULL OR EXISTS (SELECT 1 FROM studio_definition_versions v WHERE v.id=ver AND v."definitionId"=def AND v."organisationId"=org
    AND atlas_studio_field_cosmetic_compatible(a.payload,v.payload))));
$$;
CREATE OR REPLACE FUNCTION atlas_studio_cutover_source_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 -- Share the definition lock with publication/activation; a new freeze cannot
 -- race this decision. It confers no native/field access permission.
 PERFORM id FROM studio_definitions WHERE id=NEW."definitionId" AND "organisationId"=NEW."organisationId" FOR UPDATE;
 PERFORM "preparationId" FROM studio_field_migration_publications WHERE "organisationId"=NEW."organisationId" AND "definitionId"=NEW."definitionId"
  AND "sourceGenerationId"=NEW."generationId" AND state IN ('CUTOVER','COMPLETED') FOR SHARE;
 IF FOUND THEN RAISE EXCEPTION 'Cutover source representation is retained history'; END IF;
 RETURN NEW;
END $$;
CREATE OR REPLACE FUNCTION atlas_studio_publication_value_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE pub studio_field_migration_publications; done studio_field_migration_outcomes; ver UUID;
BEGIN
 PERFORM id FROM studio_definitions WHERE id=NEW."definitionId" AND "organisationId"=NEW."organisationId" FOR UPDATE;
 -- Check every open source first. An older COMPLETED target for this same
 -- generation must never mask a newer reviewed publication's source freeze.
 PERFORM "preparationId" FROM studio_field_migration_publications WHERE "organisationId"=NEW."organisationId" AND "definitionId"=NEW."definitionId"
  AND "sourceGenerationId"=NEW."generationId" AND state='PUBLISHED' FOR SHARE;
 IF FOUND THEN RAISE EXCEPTION 'An open field migration freezes normal source saves; target writes require reviewed execution'; END IF;
 SELECT * INTO pub FROM studio_field_migration_publications WHERE "organisationId"=NEW."organisationId" AND "definitionId"=NEW."definitionId" AND "targetGenerationId"=NEW."generationId" FOR SHARE;
 IF NOT FOUND OR pub.state='COMPLETED' THEN
  IF NOT FOUND AND NOT EXISTS (SELECT 1 FROM studio_field_migration_publications WHERE "organisationId"=NEW."organisationId" AND "definitionId"=NEW."definitionId" AND "sourceGenerationId"=NEW."generationId") THEN RETURN NEW; END IF;
  IF TG_TABLE_NAME='studio_field_values' THEN ver := NEW."versionId";
  ELSIF NEW."activeValueId" IS NOT NULL THEN
   SELECT "versionId" INTO ver FROM studio_field_values WHERE id=NEW."activeValueId" AND "organisationId"=NEW."organisationId" AND "definitionId"=NEW."definitionId" AND "generationId"=NEW."generationId";
   IF NOT FOUND THEN RAISE EXCEPTION 'Resumed field writes require the approved active schema'; END IF;
  END IF;
  IF NOT atlas_studio_field_generation_active(NEW."organisationId",NEW."definitionId",NEW."generationId",ver) THEN RAISE EXCEPTION 'Resumed field writes require the approved active schema'; END IF;
  RETURN NEW;
 END IF;
 IF pub.state<>'PUBLISHED' THEN RAISE EXCEPTION 'An open field migration freezes normal source saves; target writes require reviewed execution'; END IF;
 SELECT o.* INTO done FROM studio_field_migration_outcomes o JOIN studio_field_migration_executions x ON x."preparationId"=o."preparationId" AND x."organisationId"=o."organisationId" AND x."definitionId"=o."definitionId"
 WHERE o."preparationId"=pub."preparationId" AND o."organisationId"=pub."organisationId" AND o."definitionId"=pub."definitionId" AND o."targetGenerationId"=pub."targetGenerationId"
  AND x.state='RUNNING' AND o."executionChecksum"=x."pinChecksum"
  AND CASE WHEN TG_TABLE_NAME='studio_field_slots' THEN o."targetSlotId"=NEW.id ELSE o."targetValueId"=NEW.id END;
 IF NOT FOUND THEN RAISE EXCEPTION 'An open field migration freezes normal source saves; target writes require reviewed execution'; END IF;
 IF TG_TABLE_NAME='studio_field_slots' THEN
  IF NEW."extensionId"<>done."extensionId" OR (
   (TG_OP='INSERT' AND NEW.revision=0 AND NEW."activeValueId" IS NULL AND NEW."uniqueToken" IS NULL)
   OR (TG_OP='UPDATE' AND OLD.revision=0 AND NEW.revision=1 AND NEW."activeValueId"=done."targetValueId")) IS NOT TRUE
   THEN RAISE EXCEPTION 'Target slot must commit its exact initial reviewed value'; END IF;
 ELSE
  IF NEW."slotId"<>done."targetSlotId" OR NEW."versionId"<>done."targetVersionId" OR NEW.revision<>1
   OR NEW.fingerprint<>done."targetFingerprint" OR NEW."isNull"<>done."targetIsNull" OR NEW."createdBy"<>pub."publisherUserId"
   THEN RAISE EXCEPTION 'Target value must match its exact reviewed outcome'; END IF;
 END IF;
 RETURN NEW;
END $$;


-- Publication insertion/state changes share the definition lock with ordinary
-- storage eligibility; preserve original exact READY/receipt/terminal checks.
CREATE OR REPLACE FUNCTION atlas_studio_publication_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE x studio_field_migration_executions; c studio_field_migration_cutovers;
BEGIN
 PERFORM id FROM studio_definitions WHERE id=NEW."definitionId" AND "organisationId"=NEW."organisationId" FOR UPDATE;
 IF TG_OP='UPDATE' THEN
  IF (to_jsonb(NEW)-ARRAY['state','revision','updatedAt']) IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['state','revision','updatedAt'])
   OR OLD.state NOT IN ('PUBLISHED','CUTOVER') OR NEW.revision<>OLD.revision+1
   THEN RAISE EXCEPTION 'Reviewed field publication identity is immutable; transition requires CAS'; END IF;
  SELECT * INTO c FROM studio_field_migration_cutovers WHERE "preparationId"=OLD."preparationId" AND "organisationId"=OLD."organisationId" AND "definitionId"=OLD."definitionId" FOR SHARE;
  IF OLD.state='CUTOVER' THEN
   IF NOT FOUND OR c.revision<>1 OR c.state NOT IN ('ROLLED_BACK','FINALIZED')
    OR NEW.state IS DISTINCT FROM (CASE WHEN c.state='ROLLED_BACK' THEN 'ROLLED_BACK' ELSE 'COMPLETED' END)
    OR OLD.revision::text IS DISTINCT FROM c."settlementPin"->>'publicationRevision'
    THEN RAISE EXCEPTION 'Settled publication requires its exact one-time retained settlement'; END IF;
  ELSIF NEW.state='CANCELLED' THEN
   IF FOUND THEN RAISE EXCEPTION 'A cutover receipt cannot be bypassed by cancellation'; END IF;
  ELSIF NEW.state='CUTOVER' THEN
   IF NOT FOUND OR c.state<>'ACTIVATED' OR c.pin->'publication'->>'revision' IS DISTINCT FROM OLD.revision::text
    THEN RAISE EXCEPTION 'Cutover publication requires its exact retained receipt'; END IF;
   SELECT * INTO x FROM studio_field_migration_executions WHERE "preparationId"=OLD."preparationId" AND "organisationId"=OLD."organisationId" AND "definitionId"=OLD."definitionId" FOR SHARE;
   IF NOT FOUND OR x.state<>'READY' OR NOT atlas_studio_execution_fresh(x) THEN RAISE EXCEPTION 'Cutover publication requires unchanged READY execution'; END IF;
  ELSE RAISE EXCEPTION 'Unsupported reviewed publication transition'; END IF;
 ELSE
  IF NEW.state<>'PUBLISHED' OR NEW.revision<>0 OR NOT atlas_studio_publication_fresh(NEW)
   THEN RAISE EXCEPTION 'Reviewed field publication must match the exact source-active target transition'; END IF;
 END IF;
 RETURN NEW;
END $$;


CREATE OR REPLACE FUNCTION atlas_studio_publication_metadata_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE allowed BOOLEAN := false; cosmetic BOOLEAN := false;
BEGIN
 IF TG_TABLE_NAME='studio_definitions' THEN
  IF NEW."activeVersionId" IS DISTINCT FROM OLD."activeVersionId" THEN
   SELECT EXISTS (SELECT 1 FROM studio_field_migration_cutovers c JOIN studio_field_migration_publications p
    ON p."preparationId"=c."preparationId" AND p."organisationId"=c."organisationId" AND p."definitionId"=c."definitionId"
    WHERE c."organisationId"=NEW."organisationId" AND c."definitionId"=NEW.id AND c.state='ACTIVATED' AND p.state='CUTOVER'
     AND OLD."activeVersionId"=c."sourceVersionId" AND NEW."activeVersionId"=c."targetVersionId"
     AND OLD.revision::text=c.pin->>'definitionRevision' AND NEW.revision=OLD.revision+1
     AND NEW."latestVersion"=OLD."latestVersion" AND NEW."retiredAt" IS NOT DISTINCT FROM OLD."retiredAt"
     AND NEW."retiredAt" IS NULL AND NEW.kind='customField') INTO allowed;
   IF NOT allowed THEN
    SELECT EXISTS (SELECT 1 FROM studio_field_migration_cutovers c JOIN studio_field_migration_publications p
     ON p."preparationId"=c."preparationId" AND p."organisationId"=c."organisationId" AND p."definitionId"=c."definitionId"
     WHERE c."organisationId"=NEW."organisationId" AND c."definitionId"=NEW.id AND c.state='ROLLED_BACK' AND c.revision=1 AND p.state='ROLLED_BACK'
      AND OLD."activeVersionId"=c."targetVersionId" AND NEW."activeVersionId"=c."sourceVersionId"
      AND OLD.revision::text=c."settlementPin"->>'definitionRevision' AND NEW.revision=OLD.revision+1
      AND NEW."latestVersion"=OLD."latestVersion" AND NEW."retiredAt" IS NOT DISTINCT FROM OLD."retiredAt"
      AND NEW."retiredAt" IS NULL AND NEW.kind='customField') INTO allowed;
   END IF;
   SELECT EXISTS (SELECT 1 FROM studio_definition_versions a JOIN studio_definition_versions v
    ON v."definitionId"=a."definitionId" AND v."organisationId"=a."organisationId"
    WHERE a.id=OLD."activeVersionId" AND v.id=NEW."activeVersionId" AND a."definitionId"=NEW.id AND a."organisationId"=NEW."organisationId"
     AND NEW.revision=OLD.revision+1 AND NEW."latestVersion"=OLD."latestVersion" AND NEW."retiredAt" IS NOT DISTINCT FROM OLD."retiredAt" AND NEW."retiredAt" IS NULL AND NEW.kind='customField'
     AND atlas_studio_field_cosmetic_compatible(a.payload,v.payload)
     AND NOT EXISTS (SELECT 1 FROM studio_field_migration_publications p WHERE p."definitionId"=NEW.id AND p."organisationId"=NEW."organisationId" AND p.state IN ('PUBLISHED','CUTOVER')))
    INTO cosmetic;
   -- A retained completed source cannot become active again, even when it was
   -- the initial generation and never appeared as a publication target.
   IF NOT allowed AND EXISTS (SELECT 1 FROM studio_definition_versions v JOIN studio_field_migration_publications p
     ON p."organisationId"=v."organisationId" AND p."definitionId"=v."definitionId" AND p."sourceGenerationId"::text=v.payload->>'storageGeneration'
     WHERE v.id=NEW."activeVersionId" AND v."organisationId"=NEW."organisationId" AND v."definitionId"=NEW.id AND p.state IN ('CUTOVER','COMPLETED'))
    THEN RAISE EXCEPTION 'Cutover source representation is retained history; explicit cutover required'; END IF;
   IF NOT allowed AND NOT cosmetic AND EXISTS (SELECT 1 FROM studio_definition_versions v JOIN studio_field_migration_publications p
     ON p."organisationId"=v."organisationId" AND p."definitionId"=v."definitionId" AND p."targetGenerationId"::text=v.payload->>'storageGeneration'
     WHERE v.id=NEW."activeVersionId" AND v."organisationId"=NEW."organisationId" AND v."definitionId"=NEW.id)
    THEN RAISE EXCEPTION 'Reviewed target generation requires completed conversion and explicit cutover'; END IF;
  END IF;
  IF (NEW."activeVersionId",NEW."latestVersion",NEW."retiredAt") IS DISTINCT FROM (OLD."activeVersionId",OLD."latestVersion",OLD."retiredAt") THEN
   PERFORM "preparationId" FROM studio_field_migration_publications WHERE "organisationId"=NEW."organisationId" AND "definitionId"=NEW.id AND state IN ('PUBLISHED','CUTOVER') FOR SHARE;
   IF FOUND AND NOT allowed THEN RAISE EXCEPTION 'An open field migration freezes publication activation and retirement'; END IF;
  END IF;
 ELSE
  IF (NEW.payload,NEW.revision,NEW."baseVersionId") IS DISTINCT FROM (OLD.payload,OLD.revision,OLD."baseVersionId") THEN
   PERFORM "preparationId" FROM studio_field_migration_publications WHERE "organisationId"=NEW."organisationId" AND "definitionId"=NEW."definitionId" AND state IN ('PUBLISHED','CUTOVER') FOR SHARE;
   IF FOUND THEN RAISE EXCEPTION 'An open field migration freezes its reviewed draft'; END IF;
  END IF;
 END IF;
 RETURN NEW;
END $$;
