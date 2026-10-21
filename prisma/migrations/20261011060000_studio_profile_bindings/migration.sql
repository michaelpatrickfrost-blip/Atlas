-- Additive ownership metadata; no business rows, assignment or backfill.
CREATE TABLE studio_profile_bindings (
  "definitionId" uuid NOT NULL PRIMARY KEY,
  "organisationId" text NOT NULL,
  "entityId" text NOT NULL,
  kind text NOT NULL,
  "originVersionId" uuid NOT NULL,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT studio_profile_definition_fk FOREIGN KEY ("definitionId","organisationId")
    REFERENCES studio_definitions(id,"organisationId") ON DELETE RESTRICT ON UPDATE NO ACTION,
  CONSTRAINT studio_profile_origin_fk FOREIGN KEY ("originVersionId","definitionId","organisationId")
    REFERENCES studio_definition_versions(id,"definitionId","organisationId") ON DELETE RESTRICT ON UPDATE NO ACTION,
  CONSTRAINT studio_profile_kind CHECK (kind IN ('entityProfile','recordType')),
  CONSTRAINT studio_profile_entity CHECK ("entityId"~'^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$')
);
CREATE UNIQUE INDEX studio_profile_identity_key ON studio_profile_bindings("definitionId","organisationId","entityId");
CREATE UNIQUE INDEX studio_profile_definition_key ON studio_profile_bindings("definitionId","organisationId");
CREATE INDEX studio_profile_entity_idx ON studio_profile_bindings("organisationId","entityId",kind);
CREATE UNIQUE INDEX studio_profile_single_base ON studio_profile_bindings("organisationId","entityId") WHERE kind='entityProfile';
CREATE TRIGGER studio_profile_history BEFORE UPDATE OR DELETE ON studio_profile_bindings
  FOR EACH ROW EXECUTE FUNCTION atlas_studio_history_guard();
CREATE FUNCTION atlas_studio_profile_binding_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM studio_definitions d JOIN studio_definition_versions v ON v.id=NEW."originVersionId"
      AND v."definitionId"=d.id AND v."organisationId"=d."organisationId"
    WHERE d.id=NEW."definitionId" AND d."organisationId"=NEW."organisationId"
      AND d.kind=NEW.kind AND d."retiredAt" IS NULL AND v."schemaVersion"=1
      AND v.payload->'entity'->>'id'=NEW."entityId"
      AND v."compiledPlan"->>'kind'=NEW.kind
      AND v."compiledPlan"->'payload'=v.payload
      AND v."compiledPlan"->'schemaVersion'='1'::jsonb
      AND jsonb_typeof(v."compiledPlan"->'resolvedProfile')='object'
      AND (NEW.kind<>'entityProfile' OR d.key=NEW."entityId"||'.base_profile')
    FOR SHARE OF d,v
  ) THEN RAISE EXCEPTION 'Studio profile binding needs its exact tenant-owned published origin'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER studio_profile_binding BEFORE INSERT ON studio_profile_bindings
  FOR EACH ROW EXECUTE FUNCTION atlas_studio_profile_binding_guard();

-- Later publications retain the permanent owner identity. Schema versions remain
-- immutable and the original version/pin guards still apply independently.
CREATE FUNCTION atlas_studio_profile_version_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE b studio_profile_bindings%ROWTYPE;
BEGIN
  SELECT * INTO b FROM studio_profile_bindings WHERE "definitionId"=NEW."definitionId" AND "organisationId"=NEW."organisationId";
  IF FOUND AND (NEW."compiledPlan"->>'kind' IS DISTINCT FROM b.kind
    OR NEW.payload->'entity'->>'id' IS DISTINCT FROM b."entityId") THEN
    RAISE EXCEPTION 'Published Studio profile cannot change its canonical owner identity';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER studio_profile_version BEFORE INSERT ON studio_definition_versions
  FOR EACH ROW EXECUTE FUNCTION atlas_studio_profile_version_guard();
