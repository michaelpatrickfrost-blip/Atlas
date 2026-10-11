-- Additive bounded representation operation. No existing/native rows/backfill/reset.
ALTER TABLE studio_field_migration_observations ADD CONSTRAINT studio_observation_outcome_key UNIQUE (id,"preparationId","definitionId","organisationId");
CREATE TABLE studio_field_migration_executions (
 "preparationId" UUID PRIMARY KEY, "organisationId" TEXT NOT NULL, "definitionId" UUID NOT NULL, "entityId" TEXT NOT NULL,
 pin JSONB NOT NULL, "pinChecksum" CHAR(64) NOT NULL, state TEXT NOT NULL DEFAULT 'RUNNING', revision INTEGER NOT NULL DEFAULT 0,
 cursor TEXT, "processedCount" INTEGER NOT NULL DEFAULT 0, "failureCode" TEXT,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT studio_execution_tenant_key UNIQUE ("preparationId","definitionId","organisationId"),
 CONSTRAINT studio_execution_publication_fk FOREIGN KEY ("preparationId","definitionId","organisationId") REFERENCES studio_field_migration_publications("preparationId","definitionId","organisationId") ON DELETE RESTRICT ON UPDATE NO ACTION,
 CONSTRAINT studio_execution_shape CHECK (state IN ('RUNNING','READY','FAILED','CANCELLED') AND revision>=0 AND "processedCount">=0
  AND ("processedCount"=0)=(cursor IS NULL) AND (cursor IS NULL OR cursor ~ '^[a-zA-Z0-9_-]{1,100}$')
  AND ((state='FAILED')=("failureCode" IS NOT NULL)) AND ("failureCode" IS NULL OR "failureCode" IN ('REVIEW_CHANGED','ACCESS_CHANGED','INTEGRITY_CHANGED','WRITE_FAILED'))
  AND "pinChecksum" ~ '^[a-f0-9]{64}$' AND jsonb_typeof(pin)='object')
);
CREATE INDEX studio_execution_field_state_idx ON studio_field_migration_executions("organisationId","definitionId",state);
CREATE TABLE studio_field_migration_outcomes (
 "observationId" UUID PRIMARY KEY, "preparationId" UUID NOT NULL, "organisationId" TEXT NOT NULL, "definitionId" UUID NOT NULL,
 "entityId" TEXT NOT NULL, "recordId" TEXT NOT NULL, "nativeRevision" INTEGER NOT NULL,
 "sourceGenerationId" UUID NOT NULL, "targetGenerationId" UUID NOT NULL, "targetVersionId" UUID NOT NULL,
 "executionChecksum" CHAR(64) NOT NULL, "observationChecksum" CHAR(64) NOT NULL,
 "extensionId" UUID NOT NULL, "extensionRevision" INTEGER NOT NULL, "targetSlotId" UUID NOT NULL, "targetValueId" UUID NOT NULL,
 "targetFingerprint" CHAR(64) NOT NULL, "targetIsNull" BOOLEAN NOT NULL, outcome JSONB NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT studio_outcome_observation_key UNIQUE ("observationId","preparationId","definitionId","organisationId"),
 CONSTRAINT studio_outcome_record_key UNIQUE ("preparationId","recordId"),
 CONSTRAINT studio_outcome_slot_key UNIQUE ("targetSlotId"), CONSTRAINT studio_outcome_value_key UNIQUE ("targetValueId"),
 CONSTRAINT studio_outcome_execution_fk FOREIGN KEY ("preparationId","definitionId","organisationId") REFERENCES studio_field_migration_executions("preparationId","definitionId","organisationId") ON DELETE RESTRICT ON UPDATE NO ACTION,
 CONSTRAINT studio_outcome_observation_fk FOREIGN KEY ("observationId","preparationId","definitionId","organisationId") REFERENCES studio_field_migration_observations(id,"preparationId","definitionId","organisationId") ON DELETE RESTRICT ON UPDATE NO ACTION,
 CONSTRAINT studio_outcome_extension_fk FOREIGN KEY ("extensionId","organisationId","entityId") REFERENCES studio_extension_records(id,"organisationId","entityId") ON DELETE NO ACTION ON UPDATE NO ACTION DEFERRABLE INITIALLY DEFERRED,
 CONSTRAINT studio_outcome_slot_fk FOREIGN KEY ("targetSlotId","definitionId","targetGenerationId","organisationId") REFERENCES studio_field_slots(id,"definitionId","generationId","organisationId") ON DELETE NO ACTION ON UPDATE NO ACTION DEFERRABLE INITIALLY DEFERRED,
 CONSTRAINT studio_outcome_value_fk FOREIGN KEY ("targetValueId","targetSlotId","organisationId") REFERENCES studio_field_values(id,"slotId","organisationId") ON DELETE NO ACTION ON UPDATE NO ACTION DEFERRABLE INITIALLY DEFERRED,
 CONSTRAINT studio_outcome_shape CHECK ("nativeRevision">0 AND "extensionRevision">0 AND "sourceGenerationId"<>"targetGenerationId"
  AND "recordId" ~ '^[a-zA-Z0-9_-]{1,100}$' AND "executionChecksum" ~ '^[a-f0-9]{64}$'
  AND "observationChecksum" ~ '^[a-f0-9]{64}$' AND "targetFingerprint" ~ '^[a-f0-9]{64}$' AND jsonb_typeof(outcome)='object')
);
CREATE INDEX studio_outcome_scope_idx ON studio_field_migration_outcomes("organisationId","definitionId","preparationId");

-- New pins contain metadata integers/strings/booleans only. Match Node canonical
-- JSON exactly, without altering the existing v1 observation archive digest.
CREATE FUNCTION atlas_studio_canonical_metadata(value JSONB) RETURNS TEXT LANGUAGE plpgsql IMMUTABLE STRICT AS $$
DECLARE result TEXT;
BEGIN
 CASE jsonb_typeof(value)
 WHEN 'object' THEN
  SELECT '{'||coalesce(string_agg(to_json(key)::text||':'||atlas_studio_canonical_metadata(item),',' ORDER BY key COLLATE "C"),'')||'}'
   INTO result FROM jsonb_each(value) AS entries(key,item);
 WHEN 'array' THEN
  SELECT '['||coalesce(string_agg(atlas_studio_canonical_metadata(item),',' ORDER BY position),'')||']'
   INTO result FROM jsonb_array_elements(value) WITH ORDINALITY AS entries(item,position);
 ELSE result := value::text;
 END CASE;
 RETURN result;
END $$;

-- Execution proves the same exact metadata transition; targets require separate lineage proof below.
CREATE FUNCTION atlas_studio_execution_metadata_fresh(pub studio_field_migration_publications) RETURNS boolean LANGUAGE sql AS $$
 SELECT EXISTS (
  SELECT 1 FROM studio_field_migration_preparations p
  JOIN studio_field_migration_reviews r ON r.id=p.id AND r."definitionId"=p."definitionId" AND r."organisationId"=p."organisationId"
  JOIN studio_definitions d ON d.id=p."definitionId" AND d."organisationId"=p."organisationId"
  JOIN studio_drafts draft ON draft.id=p."draftId" AND draft."definitionId"=p."definitionId" AND draft."organisationId"=p."organisationId"
  JOIN studio_definition_versions origin ON origin.id=p."sourceVersionId" AND origin."definitionId"=p."definitionId" AND origin."organisationId"=p."organisationId"
  JOIN studio_definition_versions v ON v.id=pub."targetVersionId" AND v."definitionId"=p."definitionId" AND v."organisationId"=p."organisationId"
  JOIN studio_field_generations g ON g.id=pub."targetGenerationId" AND g."definitionId"=p."definitionId" AND g."organisationId"=p."organisationId"
  WHERE p.id=pub."preparationId" AND p."definitionId"=pub."definitionId" AND p."organisationId"=pub."organisationId"
   AND pub.state='PUBLISHED' AND p.state='REVIEWED' AND d.kind='customField' AND d."retiredAt" IS NULL
   AND pub."reviewChecksum"=r.checksum AND (r.review-ARRAY['cohort','summary'])=p.intent
   AND pub."publisherUserId"=r.review->'principal'->>'userId' AND v."createdBy"=pub."publisherUserId"
   AND pub."sourceGenerationId"=p."sourceGenerationId" AND pub."targetGenerationId"=p."targetGenerationId"
   AND d."activeVersionId"=origin.id AND d.revision=((r.review->>'definitionRevision')::integer+1)
   AND draft.revision=((r.review->'target'->>'draftRevision')::integer+1) AND draft."baseVersionId"=v.id
   AND d."latestVersion"=v.version AND pub."targetVersionNumber"=v.version
   AND pub."targetChecksum"=v.checksum AND v.checksum=r.review->'target'->>'compiledChecksum'
   AND draft.payload=r.review->'target'->'payload' AND v.payload=r.review->'target'->'payload'
   AND r.review->'source'=jsonb_build_object('versionId',origin.id,'versionChecksum',origin.checksum,'payload',origin.payload)
   AND g."originVersionId"=v.id AND g.id::text=v.payload->>'storageGeneration'
   AND g."entityId"=p."entityId" AND g."valueType"=v.payload->'field'->'storage'->>'type'
   AND r.review->'summary'->>'invalidCount'='0'
   AND ((r.review->'summary'->>'lossyCount')::bigint=0 OR pub."acknowledgedLoss")
  FOR SHARE OF p,r,d,draft,origin,v,g
 );
$$;

-- Own target writes explain exactly one extension revision increment per observed
-- record. Source slots/immutable values never change. This is not native coverage.
CREATE FUNCTION atlas_studio_execution_source_fresh(pub studio_field_migration_publications) RETURNS boolean LANGUAGE sql AS $$
 SELECT NOT EXISTS (
  SELECT 1 FROM studio_field_migration_observations o
  LEFT JOIN studio_field_migration_outcomes done ON done."observationId"=o.id AND done."preparationId"=o."preparationId" AND done."organisationId"=o."organisationId"
  LEFT JOIN studio_extension_records e ON e."organisationId"=o."organisationId" AND e."entityId"=o."entityId" AND e."recordId"=o."recordId"
  LEFT JOIN studio_field_slots s ON s."organisationId"=o."organisationId" AND s."extensionId"=e.id AND s."definitionId"=o."definitionId" AND s."generationId"=o."sourceGenerationId"
  LEFT JOIN studio_field_values v ON v.id=s."activeValueId" AND v."slotId"=s.id AND v."organisationId"=s."organisationId"
  WHERE o."preparationId"=pub."preparationId" AND o."organisationId"=pub."organisationId" AND (
   e.id IS DISTINCT FROM coalesce(done."extensionId",o."extensionId") OR e.revision IS DISTINCT FROM coalesce(done."extensionRevision",o."extensionRevision")
   OR s.id IS DISTINCT FROM o."slotId" OR s.revision IS DISTINCT FROM o."slotRevision" OR s."activeValueId" IS DISTINCT FROM o."valueId"
   OR (o."valueId" IS NOT NULL AND (v.id IS NULL OR v.revision IS DISTINCT FROM o."slotRevision"
     OR v."definitionId" IS DISTINCT FROM o."definitionId" OR v."generationId" IS DISTINCT FROM o."sourceGenerationId"
     OR v."versionId"::text IS DISTINCT FROM o.observation->'extension'->'slot'->'value'->>'versionId'
     OR v.fingerprint IS DISTINCT FROM o.observation->'extension'->'slot'->'value'->>'fingerprint'))
  )
 );
$$;
CREATE FUNCTION atlas_studio_execution_targets_fresh(pub studio_field_migration_publications) RETURNS boolean LANGUAGE sql AS $$
 SELECT NOT EXISTS (
  SELECT 1 FROM studio_field_migration_outcomes done
  LEFT JOIN studio_field_slots s ON s.id=done."targetSlotId" AND s."organisationId"=done."organisationId" AND s."definitionId"=done."definitionId" AND s."generationId"=done."targetGenerationId"
  LEFT JOIN studio_field_values v ON v.id=done."targetValueId" AND v."slotId"=s.id AND v."organisationId"=done."organisationId"
  WHERE done."preparationId"=pub."preparationId" AND done."organisationId"=pub."organisationId" AND (
   done."targetGenerationId" IS DISTINCT FROM pub."targetGenerationId" OR done."targetVersionId" IS DISTINCT FROM pub."targetVersionId"
   OR s.id IS NULL OR s."extensionId" IS DISTINCT FROM done."extensionId" OR s.revision<>1 OR s."activeValueId" IS DISTINCT FROM done."targetValueId"
   OR v.id IS NULL OR v.revision<>1 OR v."definitionId" IS DISTINCT FROM done."definitionId" OR v."generationId" IS DISTINCT FROM done."targetGenerationId"
   OR v."versionId" IS DISTINCT FROM done."targetVersionId" OR v.fingerprint IS DISTINCT FROM done."targetFingerprint" OR v."isNull" IS DISTINCT FROM done."targetIsNull"
  )
 ) AND NOT EXISTS (
  SELECT 1 FROM studio_field_slots s WHERE s."organisationId"=pub."organisationId" AND s."definitionId"=pub."definitionId" AND s."generationId"=pub."targetGenerationId"
  AND NOT EXISTS (SELECT 1 FROM studio_field_migration_outcomes done WHERE done."preparationId"=pub."preparationId" AND done."organisationId"=s."organisationId" AND done."targetSlotId"=s.id)
 );
$$;
CREATE FUNCTION atlas_studio_execution_fresh(execution studio_field_migration_executions) RETURNS boolean LANGUAGE sql AS $$
 SELECT EXISTS (SELECT 1 FROM studio_field_migration_publications pub
  WHERE pub."preparationId"=execution."preparationId" AND pub."organisationId"=execution."organisationId" AND pub."definitionId"=execution."definitionId"
  AND pub.state='PUBLISHED' AND atlas_studio_execution_metadata_fresh(pub)
  AND atlas_studio_execution_source_fresh(pub) AND atlas_studio_execution_targets_fresh(pub) FOR SHARE OF pub);
$$;

CREATE FUNCTION atlas_studio_execution_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE pub studio_field_migration_publications; review JSONB; expected JSONB; approved JSONB; total BIGINT; last_id TEXT;
BEGIN
 SELECT * INTO pub FROM studio_field_migration_publications WHERE "preparationId"=NEW."preparationId" AND "organisationId"=NEW."organisationId" AND "definitionId"=NEW."definitionId" FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Execution requires its tenant-owned publication'; END IF;
 IF TG_OP='INSERT' THEN
  IF pub.state<>'PUBLISHED' OR NEW.state<>'RUNNING' OR NEW.revision<>0 OR NEW."processedCount"<>0 OR NEW.cursor IS NOT NULL OR NEW."failureCode" IS NOT NULL
    OR NOT atlas_studio_publication_fresh(pub) THEN RAISE EXCEPTION 'Execution requires an unchanged source-active reviewed publication'; END IF;
  SELECT r.review INTO review FROM studio_field_migration_reviews r WHERE r.id=pub."preparationId" AND r."organisationId"=pub."organisationId" AND r."definitionId"=pub."definitionId";
  expected := jsonb_build_object('schemaVersion',1,'publication',jsonb_build_object(
   'preparationId',pub."preparationId",'organisationId',pub."organisationId",'definitionId',pub."definitionId",'reviewChecksum',pub."reviewChecksum",
   'sourceGenerationId',pub."sourceGenerationId",'targetGenerationId',pub."targetGenerationId",'targetVersionId',pub."targetVersionId",'targetVersionNumber',pub."targetVersionNumber",
   'targetChecksum',pub."targetChecksum",'publisherUserId',pub."publisherUserId",'acknowledgedLoss',pub."acknowledgedLoss"),
   'sourceVersionId',review->'source'->'versionId','sourceChecksum',review->'source'->'versionChecksum','entity',review->'target'->'payload'->'entity','cohort',review->'cohort');
  approved := NEW.pin->'ownerApproval';
  IF (NEW.pin-'ownerApproval') IS DISTINCT FROM expected OR NEW."entityId" IS DISTINCT FROM review->'target'->'payload'->'entity'->>'id'
    OR NEW."pinChecksum" IS DISTINCT FROM encode(sha256(convert_to(atlas_studio_canonical_metadata(NEW.pin),'UTF8')),'hex')
    OR jsonb_typeof(approved) IS DISTINCT FROM 'object' OR (approved-ARRAY['id','version','schemaHash','contractHash'])<>'{}'::jsonb
    OR (approved->>'id' ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$') IS NOT TRUE
    OR split_part(approved->>'id','.',1) IS DISTINCT FROM split_part(NEW."entityId",'.',1)
    OR jsonb_typeof(approved->'version') IS DISTINCT FROM 'number' OR (approved->>'version' ~ '^[1-9][0-9]*$') IS NOT TRUE
    OR (approved->>'schemaHash' ~ '^[a-f0-9]{64}$') IS NOT TRUE OR (approved->>'contractHash' ~ '^[a-f0-9]{64}$') IS NOT TRUE
    THEN RAISE EXCEPTION 'Execution pin must match its exact immutable reviewed metadata'; END IF;
 ELSE
  IF (to_jsonb(NEW)-ARRAY['state','revision','cursor','processedCount','failureCode','updatedAt']) IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['state','revision','cursor','processedCount','failureCode','updatedAt'])
   OR NEW.revision<>OLD.revision+1 OR OLD.state='CANCELLED'
   OR (OLD.state='READY' AND NEW.state<>'CANCELLED')
   OR (OLD.state='FAILED' AND NEW.state NOT IN ('RUNNING','CANCELLED'))
   OR NEW."processedCount"<OLD."processedCount" OR NEW."processedCount"-OLD."processedCount">50
   THEN RAISE EXCEPTION 'Execution identity is immutable and bounded progress requires CAS'; END IF;
  IF NEW.state IN ('FAILED','CANCELLED') AND (NEW.cursor,NEW."processedCount") IS DISTINCT FROM (OLD.cursor,OLD."processedCount")
   THEN RAISE EXCEPTION 'Stopped execution must retain its last committed prefix'; END IF;
  IF NEW.state='CANCELLED' THEN
   IF pub.state<>'CANCELLED' THEN RAISE EXCEPTION 'Execution cancellation requires its cancelled publication'; END IF;
  ELSIF pub.state<>'PUBLISHED' OR (NEW.state IN ('RUNNING','READY') AND NOT atlas_studio_execution_fresh(NEW))
   THEN RAISE EXCEPTION 'Execution source or target lineage changed'; END IF;
 END IF;
 SELECT count(*),max("recordId" COLLATE "C") INTO total,last_id FROM studio_field_migration_outcomes WHERE "preparationId"=NEW."preparationId" AND "organisationId"=NEW."organisationId";
 IF NEW."processedCount"<>total OR NEW.cursor IS DISTINCT FROM last_id
  OR (NEW.state='READY' AND NEW."processedCount"<>(NEW.pin->'cohort'->>'recordCount')::bigint)
  OR EXISTS (SELECT 1 FROM studio_field_migration_observations o WHERE o."preparationId"=NEW."preparationId" AND o."organisationId"=NEW."organisationId" AND o."recordId" COLLATE "C"<=NEW.cursor COLLATE "C"
    AND NOT EXISTS (SELECT 1 FROM studio_field_migration_outcomes done WHERE done."observationId"=o.id AND done."organisationId"=o."organisationId"))
  THEN RAISE EXCEPTION 'Execution progress must be its exact completed observation prefix'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER studio_execution_guard BEFORE INSERT OR UPDATE ON studio_field_migration_executions FOR EACH ROW EXECUTE FUNCTION atlas_studio_execution_guard();
CREATE TRIGGER studio_execution_retained BEFORE DELETE ON studio_field_migration_executions FOR EACH ROW EXECUTE FUNCTION atlas_studio_history_guard();

CREATE FUNCTION atlas_studio_outcome_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE execution studio_field_migration_executions; pub studio_field_migration_publications; o studio_field_migration_observations; expected JSONB; e studio_extension_records; s studio_field_slots;
BEGIN
 SELECT * INTO execution FROM studio_field_migration_executions WHERE "preparationId"=NEW."preparationId" AND "organisationId"=NEW."organisationId" AND "definitionId"=NEW."definitionId" FOR UPDATE;
 IF NOT FOUND OR execution.state<>'RUNNING' OR NEW."executionChecksum" IS DISTINCT FROM execution."pinChecksum" THEN RAISE EXCEPTION 'Outcome requires its current running execution'; END IF;
 SELECT * INTO pub FROM studio_field_migration_publications WHERE "preparationId"=NEW."preparationId" AND "organisationId"=NEW."organisationId" AND "definitionId"=NEW."definitionId" FOR SHARE;
 IF NOT FOUND OR pub.state<>'PUBLISHED' OR NOT atlas_studio_execution_metadata_fresh(pub) THEN RAISE EXCEPTION 'Outcome requires unchanged source-active publication'; END IF;
 SELECT * INTO o FROM studio_field_migration_observations WHERE id=NEW."observationId" AND "preparationId"=NEW."preparationId" AND "organisationId"=NEW."organisationId" AND "definitionId"=NEW."definitionId" FOR SHARE;
 IF NOT FOUND OR NEW."entityId" IS DISTINCT FROM o."entityId" OR NEW."entityId" IS DISTINCT FROM execution."entityId" OR NEW."recordId" IS DISTINCT FROM o."recordId" OR NEW."nativeRevision" IS DISTINCT FROM o."nativeRevision"
  OR NEW."sourceGenerationId" IS DISTINCT FROM o."sourceGenerationId" OR NEW."sourceGenerationId" IS DISTINCT FROM pub."sourceGenerationId"
  OR NEW."targetGenerationId" IS DISTINCT FROM pub."targetGenerationId" OR NEW."targetVersionId" IS DISTINCT FROM pub."targetVersionId"
  OR o.observation->'result'->>'kind' IS DISTINCT FROM 'valid' OR NEW."targetFingerprint" IS DISTINCT FROM o.observation->'result'->>'targetFingerprint'
  OR to_jsonb(NEW."targetIsNull") IS DISTINCT FROM o.observation->'result'->'isNull'
  OR NEW."observationChecksum" IS DISTINCT FROM encode(sha256(convert_to(atlas_studio_canonical_metadata(o.observation),'UTF8')),'hex')
  THEN RAISE EXCEPTION 'Outcome must match its exact authorised source observation and target'; END IF;
 SELECT * INTO e FROM studio_extension_records WHERE "organisationId"=o."organisationId" AND "entityId"=o."entityId" AND "recordId"=o."recordId" FOR UPDATE;
 IF o."extensionId" IS NULL THEN
  IF FOUND OR NEW."extensionRevision"<>1 THEN RAISE EXCEPTION 'Unanchored source changed'; END IF;
 ELSE
  IF NOT FOUND OR e.id IS DISTINCT FROM o."extensionId" OR e.id IS DISTINCT FROM NEW."extensionId" OR e.revision IS DISTINCT FROM o."extensionRevision" OR NEW."extensionRevision"<>e.revision+1
   THEN RAISE EXCEPTION 'Observed source extension changed'; END IF;
 END IF;
 SELECT * INTO s FROM studio_field_slots WHERE "extensionId"=o."extensionId" AND "organisationId"=o."organisationId" AND "definitionId"=o."definitionId" AND "generationId"=o."sourceGenerationId" FOR SHARE;
 IF s.id IS DISTINCT FROM o."slotId" OR s.revision IS DISTINCT FROM o."slotRevision" OR s."activeValueId" IS DISTINCT FROM o."valueId"
  OR NEW."targetSlotId" IS NOT DISTINCT FROM o."slotId" OR NEW."targetValueId" IS NOT DISTINCT FROM o."valueId"
  THEN RAISE EXCEPTION 'Observed source pointer changed'; END IF;
 expected := jsonb_build_object('schemaVersion',1,'executionChecksum',NEW."executionChecksum",'preparationId',NEW."preparationId",'organisationId',NEW."organisationId",'definitionId',NEW."definitionId",'entityId',NEW."entityId",
  'sourceGenerationId',NEW."sourceGenerationId",'targetGenerationId',NEW."targetGenerationId",'targetVersionId',NEW."targetVersionId",'observationId',NEW."observationId",'observationChecksum',NEW."observationChecksum",'recordId',NEW."recordId",'nativeRevision',NEW."nativeRevision",
  'target',jsonb_build_object('extensionId',NEW."extensionId",'extensionRevision',NEW."extensionRevision",'slotId',NEW."targetSlotId",'valueId',NEW."targetValueId",'valueRevision',1,'fingerprint',NEW."targetFingerprint",'isNull',NEW."targetIsNull"));
 IF NEW.outcome IS DISTINCT FROM expected THEN RAISE EXCEPTION 'Outcome must match its closed immutable lineage'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER studio_outcome_guard BEFORE INSERT ON studio_field_migration_outcomes FOR EACH ROW EXECUTE FUNCTION atlas_studio_outcome_guard();
CREATE TRIGGER studio_outcome_retained BEFORE UPDATE OR DELETE ON studio_field_migration_outcomes FOR EACH ROW EXECUTE FUNCTION atlas_studio_history_guard();

-- Ordinary source writes stay frozen. Target writes require an exact outcome
-- claim under RUNNING state; no client boolean or privileged runtime bypass.
CREATE OR REPLACE FUNCTION atlas_studio_publication_value_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE pub studio_field_migration_publications; done studio_field_migration_outcomes;
BEGIN
 SELECT * INTO pub FROM studio_field_migration_publications WHERE "organisationId"=NEW."organisationId" AND "definitionId"=NEW."definitionId"
  AND ("targetGenerationId"=NEW."generationId" OR (state='PUBLISHED' AND "sourceGenerationId"=NEW."generationId")) FOR SHARE;
 IF NOT FOUND THEN RETURN NEW; END IF;
 IF pub."targetGenerationId"<>NEW."generationId" OR pub.state<>'PUBLISHED' THEN RAISE EXCEPTION 'An open field migration freezes normal source saves; target writes require reviewed execution'; END IF;
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

CREATE FUNCTION atlas_studio_outcome_committed_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE done studio_field_migration_outcomes; pub studio_field_migration_publications; e studio_extension_records;
BEGIN
 SELECT * INTO done FROM studio_field_migration_outcomes WHERE "observationId"=NEW."observationId" AND "organisationId"=NEW."organisationId";
 IF NOT FOUND THEN
  IF current_setting('atlas.test_wipe',true)='on' AND EXISTS (SELECT 1 FROM organisations WHERE id=NEW."organisationId" AND "isTest" AND kind='CUSTOMER') THEN RETURN NULL; END IF;
  RAISE EXCEPTION 'Conversion outcome history is missing';
 END IF;
 SELECT * INTO pub FROM studio_field_migration_publications WHERE "preparationId"=done."preparationId" AND "organisationId"=done."organisationId";
 SELECT * INTO e FROM studio_extension_records WHERE id=done."extensionId" AND "organisationId"=done."organisationId" AND "entityId"=done."entityId";
 IF NOT FOUND OR e."recordId"<>done."recordId" OR e.revision<>done."extensionRevision" OR NOT atlas_studio_execution_targets_fresh(pub)
   THEN RAISE EXCEPTION 'A conversion outcome must commit its exact target extension slot and immutable value'; END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER studio_outcome_committed AFTER INSERT ON studio_field_migration_outcomes DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION atlas_studio_outcome_committed_guard();
CREATE FUNCTION atlas_studio_execution_committed_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE x studio_field_migration_executions; total BIGINT; last_id TEXT;
BEGIN
 SELECT * INTO x FROM studio_field_migration_executions WHERE "preparationId"=NEW."preparationId" AND "organisationId"=NEW."organisationId";
 IF NOT FOUND THEN
  IF current_setting('atlas.test_wipe',true)='on' AND EXISTS (SELECT 1 FROM organisations WHERE id=NEW."organisationId" AND "isTest" AND kind='CUSTOMER') THEN RETURN NULL; END IF;
  RAISE EXCEPTION 'Execution history is missing';
 END IF;
 SELECT count(*),max("recordId" COLLATE "C") INTO total,last_id FROM studio_field_migration_outcomes WHERE "preparationId"=x."preparationId" AND "organisationId"=x."organisationId";
 IF x."processedCount"<>total OR x.cursor IS DISTINCT FROM last_id THEN RAISE EXCEPTION 'Target outcomes and execution progress must commit together'; END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER studio_execution_committed AFTER INSERT OR UPDATE ON studio_field_migration_executions DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION atlas_studio_execution_committed_guard();
-- Outcome inserts also schedule progress verification: failing to update execution
-- cannot commit a target behind a stale durable cursor.
CREATE CONSTRAINT TRIGGER studio_outcome_progress AFTER INSERT ON studio_field_migration_outcomes DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION atlas_studio_execution_committed_guard();

-- Existing current-publisher cancellation remains sparse and atomic. Never retain
-- a runnable conversion after its publication has been cancelled.
CREATE FUNCTION atlas_studio_cancel_execution() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 UPDATE studio_field_migration_executions SET state='CANCELLED',revision=revision+1,"failureCode"=NULL,"updatedAt"=CURRENT_TIMESTAMP
 WHERE "preparationId"=NEW."preparationId" AND "organisationId"=NEW."organisationId" AND "definitionId"=NEW."definitionId" AND state<>'CANCELLED';
 RETURN NULL;
END $$;
CREATE TRIGGER studio_publication_cancel_execution AFTER UPDATE ON studio_field_migration_publications FOR EACH ROW WHEN (OLD.state='PUBLISHED' AND NEW.state='CANCELLED') EXECUTE FUNCTION atlas_studio_cancel_execution();
