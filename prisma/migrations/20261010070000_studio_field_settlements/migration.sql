-- Additive one-time settlement of an unchanged cutover window. No native/value
-- conversion, backfill or deletion. Original 0006 insertion proof stays intact.
ALTER TABLE studio_field_migration_cutovers ADD COLUMN "settlementPin" JSONB,
 ADD COLUMN "settlementChecksum" CHAR(64), ADD COLUMN "settledBy" TEXT, ADD COLUMN "settledAt" TIMESTAMP(3);
ALTER TABLE studio_field_migration_cutovers DROP CONSTRAINT studio_cutover_shape;
ALTER TABLE studio_field_migration_cutovers ADD CONSTRAINT studio_cutover_shape CHECK (
 "sourceVersionId"<>"targetVersionId" AND jsonb_typeof(pin)='object' AND "pinChecksum" ~ '^[a-f0-9]{64}$'
 AND ((state='ACTIVATED' AND revision=0 AND "settlementPin" IS NULL AND "settlementChecksum" IS NULL AND "settledBy" IS NULL AND "settledAt" IS NULL)
  OR (state IN ('ROLLED_BACK','FINALIZED') AND revision=1 AND "settlementPin" IS NOT NULL AND jsonb_typeof("settlementPin")='object'
   AND "settlementChecksum" IS NOT NULL AND "settlementChecksum" ~ '^[a-f0-9]{64}$' AND "settledBy" IS NOT NULL AND "settledAt" IS NOT NULL)));
CREATE UNIQUE INDEX studio_cutover_one_open ON studio_field_migration_cutovers("organisationId","definitionId") WHERE state='ACTIVATED';
ALTER TABLE studio_field_migration_publications DROP CONSTRAINT studio_publication_state;
ALTER TABLE studio_field_migration_publications ADD CONSTRAINT studio_publication_state CHECK (state IN ('PUBLISHED','CUTOVER','CANCELLED','ROLLED_BACK','COMPLETED') AND revision>=0 AND "targetVersionNumber">0);

-- Identity shape only, never membership/capability/native authority. Actual
-- current authority must still be refreshed by the owning server operation.
CREATE FUNCTION atlas_studio_settlement_principal_valid(p JSONB, org TEXT, actor TEXT) RETURNS BOOLEAN LANGUAGE sql IMMUTABLE AS $$
 SELECT coalesce(jsonb_typeof(p)='object' AND p->>'organisationId'=org AND p->>'userId'=actor
  AND (p-ARRAY['organisationId','userId','membershipId','sessionVersion','authVersion','authority','auditId'])='{}'::jsonb
  AND jsonb_typeof(p->'organisationId')='string' AND length(p->>'organisationId') BETWEEN 1 AND 100
  AND jsonb_typeof(p->'userId')='string' AND length(p->>'userId') BETWEEN 1 AND 100
  AND jsonb_typeof(p->'membershipId')='string' AND length(p->>'membershipId') BETWEEN 1 AND 100
  AND jsonb_typeof(p->'sessionVersion')='number' AND (p->>'sessionVersion') ~ '^(0|[1-9][0-9]*)$'
  AND (p->>'sessionVersion')::numeric<=9007199254740991
  AND jsonb_typeof(p->'authVersion')='number' AND (p->>'authVersion') ~ '^(0|[1-9][0-9]*)$'
  AND (p->>'authVersion')::numeric<=9007199254740991
  AND ((p->>'authority'='customer' AND NOT p ? 'auditId') OR (p->>'authority'='staff_support'
   AND jsonb_typeof(p->'auditId')='string' AND length(p->>'auditId') BETWEEN 1 AND 100)), false);
$$;
CREATE FUNCTION atlas_studio_cutover_settlement_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE pub studio_field_migration_publications; d studio_definitions; x studio_field_migration_executions; draft studio_drafts; review JSONB; expected JSONB;
BEGIN
 IF OLD.state<>'ACTIVATED' OR OLD.revision<>0 OR NEW.state NOT IN ('ROLLED_BACK','FINALIZED') OR NEW.revision<>1
  OR (to_jsonb(NEW)-ARRAY['state','revision','updatedAt','settlementPin','settlementChecksum','settledBy','settledAt'])
   IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['state','revision','updatedAt','settlementPin','settlementChecksum','settledBy','settledAt'])
  THEN RAISE EXCEPTION 'Cutover original identity is immutable; settlement is one-time CAS'; END IF;
 SELECT * INTO pub FROM studio_field_migration_publications WHERE "preparationId"=OLD."preparationId" AND "organisationId"=OLD."organisationId" AND "definitionId"=OLD."definitionId" FOR UPDATE;
 SELECT * INTO d FROM studio_definitions WHERE id=OLD."definitionId" AND "organisationId"=OLD."organisationId" FOR UPDATE;
 SELECT * INTO x FROM studio_field_migration_executions WHERE "preparationId"=OLD."preparationId" AND "organisationId"=OLD."organisationId" AND "definitionId"=OLD."definitionId" FOR SHARE;
 SELECT r.review INTO review FROM studio_field_migration_reviews r WHERE r.id=OLD."preparationId" AND r."organisationId"=OLD."organisationId" AND r."definitionId"=OLD."definitionId";
 SELECT * INTO draft FROM studio_drafts WHERE id=(review->'target'->>'draftId')::uuid AND "definitionId"=OLD."definitionId" AND "organisationId"=OLD."organisationId" FOR SHARE;
 expected := jsonb_build_object('schemaVersion',1,'cutoverChecksum',OLD."pinChecksum",'preparationId',OLD."preparationId",'organisationId',OLD."organisationId",'definitionId',OLD."definitionId",
  'sourceVersionId',OLD."sourceVersionId",'targetVersionId',OLD."targetVersionId",'definitionRevision',(OLD.pin->>'definitionRevision')::integer+1,
  'publicationRevision',(OLD.pin->'publication'->>'revision')::integer+1,'principal',NEW."settlementPin"->'principal','disposition',NEW.state);
 IF NEW."settlementPin" IS DISTINCT FROM expected OR NEW."settlementChecksum" IS DISTINCT FROM encode(sha256(convert_to(atlas_studio_canonical_metadata(expected),'UTF8')),'hex')
  OR NOT atlas_studio_settlement_principal_valid(NEW."settlementPin"->'principal',OLD."organisationId",NEW."settledBy") OR NEW."settledAt" IS NULL
  OR pub.state IS DISTINCT FROM 'CUTOVER' OR pub.revision IS DISTINCT FROM (expected->>'publicationRevision')::integer
  OR d."activeVersionId" IS DISTINCT FROM OLD."targetVersionId" OR d.revision IS DISTINCT FROM (expected->>'definitionRevision')::integer
  OR d."latestVersion" IS DISTINCT FROM pub."targetVersionNumber" OR d."retiredAt" IS NOT NULL OR d.kind IS DISTINCT FROM 'customField'
  OR x.state IS DISTINCT FROM 'READY' OR x."pinChecksum" IS DISTINCT FROM OLD.pin->'execution'->>'checksum'
  OR x.revision IS DISTINCT FROM (OLD.pin->'execution'->>'revision')::integer OR x."processedCount" IS DISTINCT FROM (x.pin->'cohort'->>'recordCount')::integer
  OR draft.revision IS DISTINCT FROM (review->'target'->>'draftRevision')::integer+1 OR draft."baseVersionId" IS DISTINCT FROM OLD."targetVersionId"
  OR draft.payload IS DISTINCT FROM review->'target'->'payload'
  OR (NEW.state='ROLLED_BACK' AND (NOT atlas_studio_execution_source_fresh(pub) OR NOT atlas_studio_execution_targets_fresh(pub)))
  THEN RAISE EXCEPTION 'Settlement requires its exact unchanged cutover configuration and closed current actor identity'; END IF;
 RETURN NEW;
END $$;
DROP TRIGGER studio_cutover_retained ON studio_field_migration_cutovers;
CREATE TRIGGER studio_cutover_retained BEFORE DELETE ON studio_field_migration_cutovers FOR EACH ROW EXECUTE FUNCTION atlas_studio_history_guard();
CREATE TRIGGER studio_cutover_settlement_guard BEFORE UPDATE ON studio_field_migration_cutovers FOR EACH ROW EXECUTE FUNCTION atlas_studio_cutover_settlement_guard();

CREATE OR REPLACE FUNCTION atlas_studio_publication_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE x studio_field_migration_executions; c studio_field_migration_cutovers;
BEGIN
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
DECLARE allowed BOOLEAN := false;
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
   IF NOT allowed AND EXISTS (SELECT 1 FROM studio_definition_versions v JOIN studio_field_migration_publications p
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

CREATE OR REPLACE FUNCTION atlas_studio_cutover_committed_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE c studio_field_migration_cutovers; pub studio_field_migration_publications; x studio_field_migration_executions; d studio_definitions; draft studio_drafts; review JSONB;
BEGIN
 IF TG_TABLE_NAME='studio_definitions' THEN
  SELECT * INTO c FROM studio_field_migration_cutovers WHERE "definitionId"=NEW.id AND "organisationId"=NEW."organisationId" AND state='ACTIVATED';
 ELSE
  SELECT * INTO c FROM studio_field_migration_cutovers WHERE "preparationId"=NEW."preparationId" AND "organisationId"=NEW."organisationId" AND "definitionId"=NEW."definitionId";
 END IF;
 IF NOT FOUND THEN
  IF TG_TABLE_NAME='studio_field_migration_cutovers' THEN RAISE EXCEPTION 'Cutover receipt history is missing'; END IF;
  IF TG_TABLE_NAME='studio_field_migration_publications' THEN
   IF NEW.state IN ('CUTOVER','ROLLED_BACK','COMPLETED') THEN RAISE EXCEPTION 'Cutover publication has no receipt'; END IF;
  END IF;
  RETURN NULL;
 END IF;
 SELECT * INTO pub FROM studio_field_migration_publications WHERE "preparationId"=c."preparationId" AND "organisationId"=c."organisationId" AND "definitionId"=c."definitionId";
 SELECT * INTO x FROM studio_field_migration_executions WHERE "preparationId"=c."preparationId" AND "organisationId"=c."organisationId" AND "definitionId"=c."definitionId";
 SELECT * INTO d FROM studio_definitions WHERE id=c."definitionId" AND "organisationId"=c."organisationId";
 SELECT r.review INTO review FROM studio_field_migration_reviews r WHERE r.id=c."preparationId" AND r."organisationId"=c."organisationId" AND r."definitionId"=c."definitionId";
 SELECT * INTO draft FROM studio_drafts WHERE id=(review->'target'->>'draftId')::uuid AND "definitionId"=c."definitionId" AND "organisationId"=c."organisationId";
 IF c.state IN ('ROLLED_BACK','FINALIZED') THEN
  IF c.revision<>1 OR pub.state IS DISTINCT FROM (CASE WHEN c.state='ROLLED_BACK' THEN 'ROLLED_BACK' ELSE 'COMPLETED' END)
   OR pub.revision IS DISTINCT FROM (c."settlementPin"->>'publicationRevision')::integer+1
   OR d."activeVersionId" IS DISTINCT FROM (CASE WHEN c.state='ROLLED_BACK' THEN c."sourceVersionId" ELSE c."targetVersionId" END)
   OR d.revision IS DISTINCT FROM (c."settlementPin"->>'definitionRevision')::integer+(CASE WHEN c.state='ROLLED_BACK' THEN 1 ELSE 0 END)
   OR d."latestVersion" IS DISTINCT FROM pub."targetVersionNumber" OR d."retiredAt" IS NOT NULL
   OR draft.revision IS DISTINCT FROM (review->'target'->>'draftRevision')::integer+1 OR draft."baseVersionId" IS DISTINCT FROM c."targetVersionId"
   OR draft.payload IS DISTINCT FROM review->'target'->'payload'
   OR (c.state='ROLLED_BACK' AND (NOT atlas_studio_execution_source_fresh(pub) OR NOT atlas_studio_execution_targets_fresh(pub)))
   THEN RAISE EXCEPTION 'Settlement receipt publication and exact settled pointer must commit together'; END IF;
  RETURN NULL;
 END IF;
 IF c.state<>'ACTIVATED' OR c.revision<>0 OR pub.state IS DISTINCT FROM 'CUTOVER'
  OR pub.revision IS DISTINCT FROM (c.pin->'publication'->>'revision')::integer+1
  OR x.state IS DISTINCT FROM 'READY' OR x."pinChecksum" IS DISTINCT FROM c.pin->'execution'->>'checksum'
  OR x.revision IS DISTINCT FROM (c.pin->'execution'->>'revision')::integer
  OR x."processedCount" IS DISTINCT FROM (x.pin->'cohort'->>'recordCount')::integer
  OR d."activeVersionId" IS DISTINCT FROM c."targetVersionId" OR d.revision IS DISTINCT FROM (c.pin->>'definitionRevision')::integer+1
  OR d."latestVersion" IS DISTINCT FROM pub."targetVersionNumber" OR d."retiredAt" IS NOT NULL
  OR draft.revision IS DISTINCT FROM (review->'target'->>'draftRevision')::integer+1 OR draft."baseVersionId" IS DISTINCT FROM c."targetVersionId"
  OR draft.payload IS DISTINCT FROM review->'target'->'payload'
  OR NOT atlas_studio_execution_source_fresh(pub) OR NOT atlas_studio_execution_targets_fresh(pub)
  THEN RAISE EXCEPTION 'Cutover receipt publication and exact active pointer must commit together'; END IF;
 RETURN NULL;
END $$;
-- Existing insertion/publication/definition constraint triggers use this updated
-- function. Settled receipts remain immutable history; later definition events
-- select only the still-ACTIVATED window rather than pin every earlier operation.
CREATE CONSTRAINT TRIGGER studio_cutover_settlement_committed AFTER UPDATE ON studio_field_migration_cutovers DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION atlas_studio_cutover_committed_guard();
