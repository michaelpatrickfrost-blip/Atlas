-- Additive reviewed publication receipt. No existing rows/backfill/native changes.
CREATE TABLE studio_field_migration_publications (
 "preparationId" UUID PRIMARY KEY,
 "organisationId" TEXT NOT NULL,
 "definitionId" UUID NOT NULL,
 "reviewChecksum" CHAR(64) NOT NULL,
 "sourceGenerationId" UUID NOT NULL,
 "targetGenerationId" UUID NOT NULL,
 "targetVersionId" UUID NOT NULL,
 "targetVersionNumber" INTEGER NOT NULL,
 "targetChecksum" CHAR(64) NOT NULL,
 "publisherUserId" TEXT NOT NULL,
 "acknowledgedLoss" BOOLEAN NOT NULL,
 state TEXT NOT NULL DEFAULT 'PUBLISHED',
 revision INTEGER NOT NULL DEFAULT 0,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT studio_publication_tenant_key UNIQUE ("preparationId","definitionId","organisationId"),
 CONSTRAINT studio_publication_target_key UNIQUE ("targetGenerationId","definitionId","organisationId"),
 CONSTRAINT studio_publication_review_fk FOREIGN KEY ("preparationId","definitionId","organisationId") REFERENCES studio_field_migration_reviews(id,"definitionId","organisationId") ON DELETE RESTRICT ON UPDATE NO ACTION,
 CONSTRAINT studio_publication_source_fk FOREIGN KEY ("sourceGenerationId","definitionId","organisationId") REFERENCES studio_field_generations(id,"definitionId","organisationId") ON DELETE RESTRICT ON UPDATE NO ACTION,
 CONSTRAINT studio_publication_target_fk FOREIGN KEY ("targetGenerationId","definitionId","organisationId") REFERENCES studio_field_generations(id,"definitionId","organisationId") ON DELETE RESTRICT ON UPDATE NO ACTION,
 CONSTRAINT studio_publication_version_fk FOREIGN KEY ("targetVersionId","definitionId","organisationId") REFERENCES studio_definition_versions(id,"definitionId","organisationId") ON DELETE RESTRICT ON UPDATE NO ACTION,
 CONSTRAINT studio_publication_state CHECK (state IN ('PUBLISHED','CANCELLED') AND revision>=0 AND "targetVersionNumber">0),
 CONSTRAINT studio_publication_hashes CHECK ("reviewChecksum" ~ '^[a-f0-9]{64}$' AND "targetChecksum" ~ '^[a-f0-9]{64}$'),
 CONSTRAINT studio_publication_generations CHECK ("sourceGenerationId"<>"targetGenerationId")
);
CREATE INDEX studio_publication_field_state_idx ON studio_field_migration_publications("organisationId","definitionId",state);
CREATE UNIQUE INDEX studio_publication_one_open ON studio_field_migration_publications("organisationId","definitionId") WHERE state='PUBLISHED';

-- Keep preparation freshness unchanged. This explicit receipt proves only its
-- own exact post-publication metadata transition; callers still prove source,
-- native/reference coverage and refreshed authority before replay/execution.
CREATE FUNCTION atlas_studio_publication_fresh(pub studio_field_migration_publications) RETURNS boolean LANGUAGE sql AS $$
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
   AND NOT EXISTS (SELECT 1 FROM studio_field_slots WHERE "organisationId"=pub."organisationId" AND "definitionId"=pub."definitionId" AND "generationId"=pub."targetGenerationId")
  FOR SHARE OF p,r,d,draft,origin,v,g
 );
$$;
CREATE FUNCTION atlas_studio_publication_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='UPDATE' THEN
  IF (to_jsonb(NEW)-ARRAY['state','revision','updatedAt']) IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['state','revision','updatedAt'])
   OR OLD.state<>'PUBLISHED' OR NEW.state<>'CANCELLED' OR NEW.revision<>OLD.revision+1
   THEN RAISE EXCEPTION 'Reviewed field publication identity is immutable; cancellation requires CAS'; END IF;
 ELSE
  IF NEW.state<>'PUBLISHED' OR NEW.revision<>0 OR NOT atlas_studio_publication_fresh(NEW)
   THEN RAISE EXCEPTION 'Reviewed field publication must match the exact source-active target transition'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER studio_publication_guard BEFORE INSERT OR UPDATE ON studio_field_migration_publications FOR EACH ROW EXECUTE FUNCTION atlas_studio_publication_guard();
CREATE TRIGGER studio_publication_retained BEFORE DELETE ON studio_field_migration_publications FOR EACH ROW EXECUTE FUNCTION atlas_studio_history_guard();

-- Freeze metadata only for an open operation. Pending/cancelled target versions
-- cannot activate through the normal metadata API, even cosmetic descendants.
-- Cutover/target-write proofs belong to subsequent 2B3e/f migrations.
CREATE FUNCTION atlas_studio_publication_metadata_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_TABLE_NAME='studio_definitions' THEN
  IF NEW."activeVersionId" IS DISTINCT FROM OLD."activeVersionId" AND EXISTS (
   SELECT 1 FROM studio_definition_versions v JOIN studio_field_migration_publications p
    ON p."organisationId"=v."organisationId" AND p."definitionId"=v."definitionId" AND p."targetGenerationId"::text=v.payload->>'storageGeneration'
   WHERE v.id=NEW."activeVersionId" AND v."organisationId"=NEW."organisationId" AND v."definitionId"=NEW.id)
   THEN RAISE EXCEPTION 'Reviewed target generation requires completed conversion and explicit cutover'; END IF;
  IF (NEW."activeVersionId",NEW."latestVersion",NEW."retiredAt") IS DISTINCT FROM (OLD."activeVersionId",OLD."latestVersion",OLD."retiredAt") THEN
   PERFORM "preparationId" FROM studio_field_migration_publications WHERE "organisationId"=NEW."organisationId" AND "definitionId"=NEW.id AND state='PUBLISHED' FOR SHARE;
   IF FOUND THEN RAISE EXCEPTION 'An open field migration freezes publication activation and retirement'; END IF;
  END IF;
 ELSE
  IF (NEW.payload,NEW.revision,NEW."baseVersionId") IS DISTINCT FROM (OLD.payload,OLD.revision,OLD."baseVersionId") THEN
   PERFORM "preparationId" FROM studio_field_migration_publications WHERE "organisationId"=NEW."organisationId" AND "definitionId"=NEW."definitionId" AND state='PUBLISHED' FOR SHARE;
   IF FOUND THEN RAISE EXCEPTION 'An open field migration freezes its reviewed draft'; END IF;
  END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER studio_publication_definition_guard BEFORE UPDATE ON studio_definitions FOR EACH ROW EXECUTE FUNCTION atlas_studio_publication_metadata_guard();
CREATE TRIGGER studio_publication_draft_guard BEFORE UPDATE ON studio_drafts FOR EACH ROW EXECUTE FUNCTION atlas_studio_publication_metadata_guard();

CREATE FUNCTION atlas_studio_publication_value_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 PERFORM "preparationId" FROM studio_field_migration_publications WHERE "organisationId"=NEW."organisationId" AND "definitionId"=NEW."definitionId"
  AND ("targetGenerationId"=NEW."generationId" OR (state='PUBLISHED' AND "sourceGenerationId"=NEW."generationId")) FOR SHARE;
 IF FOUND THEN RAISE EXCEPTION 'An open field migration freezes normal source saves; target writes require reviewed execution'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER studio_publication_slot_guard BEFORE INSERT OR UPDATE ON studio_field_slots FOR EACH ROW EXECUTE FUNCTION atlas_studio_publication_value_guard();
CREATE TRIGGER studio_publication_value_guard BEFORE INSERT ON studio_field_values FOR EACH ROW EXECUTE FUNCTION atlas_studio_publication_value_guard();
