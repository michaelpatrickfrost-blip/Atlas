-- Additive cutover storage proof only. No native rows/backfill/reset. The
-- authorised activation/rollback services follow in subsequent workstreams.
CREATE TABLE studio_field_migration_cutovers (
 "preparationId" UUID PRIMARY KEY, "organisationId" TEXT NOT NULL, "definitionId" UUID NOT NULL,
 "sourceVersionId" UUID NOT NULL, "targetVersionId" UUID NOT NULL,
 pin JSONB NOT NULL, "pinChecksum" CHAR(64) NOT NULL,
 state TEXT NOT NULL DEFAULT 'ACTIVATED', revision INTEGER NOT NULL DEFAULT 0,
 "createdBy" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT studio_cutover_tenant_key UNIQUE ("preparationId","definitionId","organisationId"),
 CONSTRAINT studio_cutover_execution_fk FOREIGN KEY ("preparationId","definitionId","organisationId") REFERENCES studio_field_migration_executions("preparationId","definitionId","organisationId") ON DELETE RESTRICT ON UPDATE NO ACTION,
 CONSTRAINT studio_cutover_source_fk FOREIGN KEY ("sourceVersionId","definitionId","organisationId") REFERENCES studio_definition_versions(id,"definitionId","organisationId") ON DELETE RESTRICT ON UPDATE NO ACTION,
 CONSTRAINT studio_cutover_target_fk FOREIGN KEY ("targetVersionId","definitionId","organisationId") REFERENCES studio_definition_versions(id,"definitionId","organisationId") ON DELETE RESTRICT ON UPDATE NO ACTION,
 CONSTRAINT studio_cutover_shape CHECK (state='ACTIVATED' AND revision=0 AND "sourceVersionId"<>"targetVersionId"
  AND jsonb_typeof(pin)='object' AND "pinChecksum" ~ '^[a-f0-9]{64}$')
);
CREATE INDEX studio_cutover_field_state_idx ON studio_field_migration_cutovers("organisationId","definitionId",state);
ALTER TABLE studio_field_migration_publications DROP CONSTRAINT studio_publication_state;
ALTER TABLE studio_field_migration_publications ADD CONSTRAINT studio_publication_state CHECK (state IN ('PUBLISHED','CUTOVER','CANCELLED') AND revision>=0 AND "targetVersionNumber">0);

-- Source-active predicates remain strict and unchanged. Only a freshly inspected
-- READY operation can claim its closed immutable cutover identity.
CREATE FUNCTION atlas_studio_cutover_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE pub studio_field_migration_publications; x studio_field_migration_executions; d studio_definitions; review JSONB; expected JSONB;
BEGIN
 SELECT * INTO pub FROM studio_field_migration_publications WHERE "preparationId"=NEW."preparationId" AND "organisationId"=NEW."organisationId" AND "definitionId"=NEW."definitionId" FOR UPDATE;
 IF NOT FOUND OR pub.state<>'PUBLISHED' THEN RAISE EXCEPTION 'Cutover requires its unchanged published operation'; END IF;
 SELECT * INTO x FROM studio_field_migration_executions WHERE "preparationId"=pub."preparationId" AND "organisationId"=pub."organisationId" AND "definitionId"=pub."definitionId" FOR UPDATE;
 IF NOT FOUND OR x.state<>'READY' OR NOT atlas_studio_execution_fresh(x) THEN RAISE EXCEPTION 'Cutover requires complete unchanged READY execution'; END IF;
 SELECT * INTO d FROM studio_definitions WHERE id=pub."definitionId" AND "organisationId"=pub."organisationId" FOR UPDATE;
 SELECT r.review INTO review FROM studio_field_migration_reviews r WHERE r.id=pub."preparationId" AND r."definitionId"=pub."definitionId" AND r."organisationId"=pub."organisationId";
 expected := jsonb_build_object('schemaVersion',1,'publication',jsonb_build_object(
  'preparationId',pub."preparationId",'organisationId',pub."organisationId",'definitionId',pub."definitionId",'reviewChecksum',pub."reviewChecksum",
  'sourceGenerationId',pub."sourceGenerationId",'targetGenerationId',pub."targetGenerationId",'targetVersionId',pub."targetVersionId",'targetVersionNumber',pub."targetVersionNumber",
  'targetChecksum',pub."targetChecksum",'publisherUserId',pub."publisherUserId",'acknowledgedLoss',pub."acknowledgedLoss",'revision',pub.revision),
  'execution',jsonb_build_object('checksum',x."pinChecksum",'revision',x.revision),
  'source',jsonb_build_object('versionId',review->'source'->'versionId','checksum',review->'source'->'versionChecksum'),
  'definitionRevision',d.revision,'rollbackPolicy','unchanged_reviewed_representation');
 IF NEW.state<>'ACTIVATED' OR NEW.revision<>0 OR NEW."createdBy" IS DISTINCT FROM pub."publisherUserId"
  OR NEW."sourceVersionId"::text IS DISTINCT FROM review->'source'->>'versionId' OR NEW."targetVersionId" IS DISTINCT FROM pub."targetVersionId"
  OR NEW.pin IS DISTINCT FROM expected OR NEW."pinChecksum" IS DISTINCT FROM encode(sha256(convert_to(atlas_studio_canonical_metadata(NEW.pin),'UTF8')),'hex')
  OR d.revision>2147483645 OR pub.revision>2147483645
  THEN RAISE EXCEPTION 'Cutover identity must match its exact READY review publication and definition CAS'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER studio_cutover_guard BEFORE INSERT ON studio_field_migration_cutovers FOR EACH ROW EXECUTE FUNCTION atlas_studio_cutover_guard();
CREATE TRIGGER studio_cutover_retained BEFORE UPDATE OR DELETE ON studio_field_migration_cutovers FOR EACH ROW EXECUTE FUNCTION atlas_studio_history_guard();

-- Keep existing insertion/cancellation behaviour. CUTOVER closes the conversion
-- only when its exact receipt exists; cancellation after cutover is not rollback.
CREATE OR REPLACE FUNCTION atlas_studio_publication_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE x studio_field_migration_executions; c studio_field_migration_cutovers;
BEGIN
 IF TG_OP='UPDATE' THEN
  IF (to_jsonb(NEW)-ARRAY['state','revision','updatedAt']) IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['state','revision','updatedAt'])
   OR OLD.state<>'PUBLISHED' OR NEW.revision<>OLD.revision+1
   THEN RAISE EXCEPTION 'Reviewed field publication identity is immutable; transition requires CAS'; END IF;
  SELECT * INTO c FROM studio_field_migration_cutovers WHERE "preparationId"=OLD."preparationId" AND "organisationId"=OLD."organisationId" AND "definitionId"=OLD."definitionId" FOR SHARE;
  IF NEW.state='CANCELLED' THEN
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

-- Narrow exception for one stored atomic source->exact target transition. It
-- does not open ordinary target/descendant activation or historical source saves.
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

-- Closing PUBLISHED must not silently permit old source writes. Normal target
-- writes remain denied by the unchanged reviewed-execution guard until f4/2B4.
CREATE FUNCTION atlas_studio_cutover_source_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 PERFORM "preparationId" FROM studio_field_migration_publications WHERE "organisationId"=NEW."organisationId" AND "definitionId"=NEW."definitionId"
  AND "sourceGenerationId"=NEW."generationId" AND state='CUTOVER' FOR SHARE;
 IF FOUND THEN RAISE EXCEPTION 'Cutover source representation is retained history'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER studio_cutover_source_slot_guard BEFORE INSERT OR UPDATE ON studio_field_slots FOR EACH ROW EXECUTE FUNCTION atlas_studio_cutover_source_guard();
CREATE TRIGGER studio_cutover_source_value_guard BEFORE INSERT ON studio_field_values FOR EACH ROW EXECUTE FUNCTION atlas_studio_cutover_source_guard();

-- Check current rows at commit, not trigger-time snapshots: none of the three
-- components can commit alone or with a substituted/revised target.
CREATE FUNCTION atlas_studio_cutover_committed_guard() RETURNS trigger LANGUAGE plpgsql AS $$
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
   IF NEW.state='CUTOVER' THEN RAISE EXCEPTION 'Cutover publication has no receipt'; END IF;
  END IF;
  RETURN NULL;
 END IF;
 SELECT * INTO pub FROM studio_field_migration_publications WHERE "preparationId"=c."preparationId" AND "organisationId"=c."organisationId" AND "definitionId"=c."definitionId";
 SELECT * INTO x FROM studio_field_migration_executions WHERE "preparationId"=c."preparationId" AND "organisationId"=c."organisationId" AND "definitionId"=c."definitionId";
 SELECT * INTO d FROM studio_definitions WHERE id=c."definitionId" AND "organisationId"=c."organisationId";
 SELECT r.review INTO review FROM studio_field_migration_reviews r WHERE r.id=c."preparationId" AND r."organisationId"=c."organisationId" AND r."definitionId"=c."definitionId";
 SELECT * INTO draft FROM studio_drafts WHERE id=(review->'target'->>'draftId')::uuid AND "definitionId"=c."definitionId" AND "organisationId"=c."organisationId";
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
CREATE CONSTRAINT TRIGGER studio_cutover_committed AFTER INSERT ON studio_field_migration_cutovers DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION atlas_studio_cutover_committed_guard();
CREATE CONSTRAINT TRIGGER studio_cutover_publication_committed AFTER INSERT OR UPDATE ON studio_field_migration_publications DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION atlas_studio_cutover_committed_guard();
CREATE CONSTRAINT TRIGGER studio_cutover_definition_committed AFTER UPDATE ON studio_definitions DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION atlas_studio_cutover_committed_guard();
