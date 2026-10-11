-- Additive configuration pins. Registry contract dependencies retain their
-- original table and historic compiled plans remain byte-for-byte unchanged.
CREATE TABLE studio_configuration_dependencies (
  id uuid NOT NULL PRIMARY KEY,
  "organisationId" text NOT NULL,
  "definitionId" uuid NOT NULL,
  "versionId" uuid NOT NULL,
  "targetDefinitionId" uuid NOT NULL,
  "targetVersionId" uuid NOT NULL,
  "targetKind" text NOT NULL,
  "targetSchemaVersion" integer NOT NULL,
  "targetChecksum" text NOT NULL,
  CONSTRAINT studio_configuration_source_fk FOREIGN KEY ("versionId","definitionId","organisationId")
    REFERENCES studio_definition_versions(id,"definitionId","organisationId") ON DELETE RESTRICT ON UPDATE NO ACTION,
  CONSTRAINT studio_configuration_target_fk FOREIGN KEY ("targetVersionId","targetDefinitionId","organisationId")
    REFERENCES studio_definition_versions(id,"definitionId","organisationId") ON DELETE RESTRICT ON UPDATE NO ACTION,
  CONSTRAINT studio_configuration_pin_valid CHECK (
    "definitionId"<>"targetDefinitionId" AND "targetSchemaVersion">0
    AND "targetChecksum"~'^[a-f0-9]{64}$'
    AND "targetKind" IN ('entityProfile','recordType','page','customField','process','decision'))
);
CREATE UNIQUE INDEX "studio_configuration_version_target_key"
  ON studio_configuration_dependencies("versionId","targetDefinitionId");
CREATE INDEX "studio_configuration_target_idx"
  ON studio_configuration_dependencies("organisationId","targetDefinitionId","targetVersionId");
CREATE TRIGGER studio_configuration_history BEFORE UPDATE OR DELETE ON studio_configuration_dependencies
  FOR EACH ROW EXECUTE FUNCTION atlas_studio_history_guard();

CREATE FUNCTION atlas_studio_configuration_pin_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM studio_definition_versions source
    JOIN studio_definition_versions target ON target.id=NEW."targetVersionId"
      AND target."definitionId"=NEW."targetDefinitionId" AND target."organisationId"=NEW."organisationId"
    JOIN studio_definitions definition ON definition.id=target."definitionId" AND definition."organisationId"=target."organisationId"
    WHERE source.id=NEW."versionId" AND source."definitionId"=NEW."definitionId" AND source."organisationId"=NEW."organisationId"
      AND jsonb_typeof(source."compiledPlan"->'configurationDependencies')='array'
      AND source."compiledPlan"->'configurationDependencies' @> jsonb_build_array(jsonb_build_object(
        'kind',NEW."targetKind",'definitionId',NEW."targetDefinitionId"::text,'versionId',NEW."targetVersionId"::text,
        'schemaVersion',NEW."targetSchemaVersion",'checksum',NEW."targetChecksum"))
      AND definition.kind=NEW."targetKind" AND target."schemaVersion"=NEW."targetSchemaVersion" AND target.checksum=NEW."targetChecksum"
    FOR SHARE OF source,target,definition
  ) THEN RAISE EXCEPTION 'Studio configuration pin is not its exact sealed tenant-owned target'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER studio_configuration_pin BEFORE INSERT ON studio_configuration_dependencies
  FOR EACH ROW EXECUTE FUNCTION atlas_studio_configuration_pin_guard();

-- The entire edge set must exist in the original publication transaction.
-- Empty/absent legacy metadata stays valid; no old version is rewritten.
CREATE FUNCTION atlas_studio_configuration_complete_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  source studio_definition_versions%ROWTYPE;
  expected jsonb;
  edge jsonb;
  pin_count integer;
BEGIN
  IF TG_TABLE_NAME='studio_definition_versions' THEN source:=NEW;
  ELSE SELECT * INTO source FROM studio_definition_versions WHERE id=NEW."versionId" AND "organisationId"=NEW."organisationId";
  END IF;
  expected:=source."compiledPlan"->'configurationDependencies';
  IF expected IS NULL THEN expected:='[]'::jsonb; END IF;
  IF jsonb_typeof(expected) IS DISTINCT FROM 'array' OR jsonb_array_length(expected)>202 THEN
    RAISE EXCEPTION 'Studio configuration dependencies need a bounded sealed array';
  END IF;
  SELECT count(*) INTO pin_count FROM studio_configuration_dependencies
    WHERE "versionId"=source.id AND "definitionId"=source."definitionId" AND "organisationId"=source."organisationId";
  IF pin_count<>jsonb_array_length(expected) THEN RAISE EXCEPTION 'Studio configuration dependency set is incomplete'; END IF;
  FOR edge IN SELECT value FROM jsonb_array_elements(expected) LOOP
    IF jsonb_typeof(edge) IS DISTINCT FROM 'object'
      OR (edge-ARRAY['kind','definitionId','versionId','schemaVersion','checksum'])<>'{}'::jsonb
      OR (SELECT count(*) FROM jsonb_object_keys(edge))<>5 THEN
      RAISE EXCEPTION 'Studio configuration pin shape is invalid';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM studio_configuration_dependencies p
      WHERE p."versionId"=source.id AND p."definitionId"=source."definitionId" AND p."organisationId"=source."organisationId"
        AND edge=jsonb_build_object('kind',p."targetKind",'definitionId',p."targetDefinitionId"::text,
          'versionId',p."targetVersionId"::text,'schemaVersion',p."targetSchemaVersion",'checksum',p."targetChecksum")) THEN
      RAISE EXCEPTION 'Studio configuration dependency differs from its sealed plan';
    END IF;
  END LOOP;
  IF EXISTS (
    WITH RECURSIVE graph AS (
      SELECT p."targetVersionId" AS version_id, p."targetDefinitionId" AS definition_id,
        ARRAY[source."definitionId",p."targetDefinitionId"] AS visited, 1 AS depth,
        p."targetDefinitionId"=source."definitionId" AS cyclic
      FROM studio_configuration_dependencies p WHERE p."versionId"=source.id AND p."organisationId"=source."organisationId"
      UNION ALL
      SELECT p."targetVersionId",p."targetDefinitionId",g.visited||p."targetDefinitionId",g.depth+1,
        p."targetDefinitionId"=ANY(g.visited)
      FROM graph g JOIN studio_configuration_dependencies p ON p."versionId"=g.version_id AND p."organisationId"=source."organisationId"
      WHERE NOT g.cyclic AND g.depth<=4
    ), bounded AS MATERIALIZED (SELECT * FROM graph LIMIT 501)
    SELECT 1 FROM bounded HAVING count(*)>500 OR bool_or(cyclic OR depth>4)
  ) THEN RAISE EXCEPTION 'Studio configuration graph is cyclic or exceeds its shallow limit'; END IF;
  RETURN NEW;
END $$;
CREATE CONSTRAINT TRIGGER studio_configuration_version_complete AFTER INSERT ON studio_definition_versions
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION atlas_studio_configuration_complete_guard();
CREATE CONSTRAINT TRIGGER studio_configuration_edges_complete AFTER INSERT ON studio_configuration_dependencies
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION atlas_studio_configuration_complete_guard();
