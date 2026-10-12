-- Select the entity JSON object before subtracting its permitted keys. Binary
-- subtraction binds more tightly than JSON extraction in PostgreSQL. Preserve
-- the applied070 migration and every existing assignment guard; no data, table,
-- trigger, permission or retention changes and no backfill/reset.

CREATE OR REPLACE FUNCTION atlas_studio_assignment_insert_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE e studio_extension_records%ROWTYPE; p jsonb:=NEW.provenance; type_version studio_definition_versions%ROWTYPE;
  base_version studio_definition_versions%ROWTYPE; expected_profile jsonb; expected_request jsonb;
BEGIN
  IF jsonb_typeof(p) IS DISTINCT FROM 'object'
    OR (p-ARRAY['schemaVersion','operationId','organisationId','entity','recordId','nativeRevision','extensionId','extensionRevision',
      'previousExtensionRevision','previousAssignmentId','recordType','baseProfile','resolvedProfileChecksum','requestChecksum','createdBy'])<>'{}'::jsonb
    OR (SELECT count(*) FROM jsonb_object_keys(p))<>15
    OR p->'schemaVersion' IS DISTINCT FROM '1'::jsonb
    OR p->>'operationId' IS DISTINCT FROM NEW.id::text OR p->>'organisationId' IS DISTINCT FROM NEW."organisationId"
    OR p->>'recordId' IS DISTINCT FROM NEW."recordId" OR p->>'extensionId' IS DISTINCT FROM NEW."extensionId"::text
    OR p->'extensionRevision' IS DISTINCT FROM to_jsonb(NEW."extensionRevision")
    OR p->'nativeRevision' IS DISTINCT FROM to_jsonb(NEW."nativeRevision")
    OR p->'previousAssignmentId' IS DISTINCT FROM coalesce(to_jsonb(NEW."previousAssignmentId"::text),'null'::jsonb)
    OR p->>'createdBy' IS DISTINCT FROM NEW."createdBy" OR p->>'requestChecksum' IS DISTINCT FROM NEW."requestChecksum"
    OR jsonb_typeof(p->'entity') IS DISTINCT FROM 'object' OR p->'entity'->>'id' IS DISTINCT FROM NEW."entityId"
    OR ((p->'entity')-ARRAY['id','version','schemaHash','contractHash'])<>'{}'::jsonb
    OR (SELECT count(*) FROM jsonb_object_keys(p->'entity'))<>4
    OR jsonb_typeof(p->'entity'->'version') IS DISTINCT FROM 'number'
    OR jsonb_typeof(p->'entity'->'id') IS DISTINCT FROM 'string'
    OR jsonb_typeof(p->'entity'->'schemaHash') IS DISTINCT FROM 'string' OR jsonb_typeof(p->'entity'->'contractHash') IS DISTINCT FROM 'string'
    OR coalesce(p->'entity'->>'version','') !~ '^[1-9][0-9]*$'
    OR (p->'entity'->>'version')::numeric NOT BETWEEN 2 AND 9
    OR coalesce(p->'entity'->>'schemaHash','') !~ '^[a-f0-9]{64}$' OR coalesce(p->'entity'->>'contractHash','') !~ '^[a-f0-9]{64}$'
    OR NEW.checksum IS DISTINCT FROM encode(sha256(convert_to(atlas_studio_canonical_metadata(p),'UTF8')),'hex') THEN
    RAISE EXCEPTION 'Record type assignment provenance is invalid';
  END IF;
  -- Current implementation is explicitly the canonical Tickets owner. Future
  -- owners require their own approved native pairing instead of a neutral grant.
  IF NEW."entityId"<>'tickets.ticket' OR NOT EXISTS (SELECT 1 FROM service_work_items w
    WHERE w.id=NEW."recordId" AND w."organisationId"=NEW."organisationId" AND w.kind='TICKET' AND w.version=NEW."nativeRevision" FOR SHARE OF w)
    OR NOT EXISTS (SELECT 1 FROM memberships m JOIN users u ON u.id=m."userId" JOIN organisations o ON o.id=m."organisationId"
      WHERE m."organisationId"=NEW."organisationId" AND m."userId"=NEW."createdBy" AND m.active
        AND o.kind='CUSTOMER' AND o.status='ACTIVE' AND o."archivedAt" IS NULL FOR SHARE OF m,u,o) THEN
    RAISE EXCEPTION 'Record type assignment needs its actual current canonical owner';
  END IF;
  SELECT * INTO e FROM studio_extension_records WHERE id=NEW."extensionId" AND "organisationId"=NEW."organisationId" AND "entityId"=NEW."entityId" FOR UPDATE;
  IF NOT FOUND OR e."recordId"<>NEW."recordId" OR e.revision<>NEW."extensionRevision"-1
    OR e."recordTypeAssignmentId" IS DISTINCT FROM NEW."previousAssignmentId"
    OR (p->'previousExtensionRevision'<>'null'::jsonb AND p->'previousExtensionRevision' IS DISTINCT FROM to_jsonb(e.revision))
    OR (p->'previousExtensionRevision'='null'::jsonb AND (e.revision<>0 OR NOT EXISTS (SELECT 1 FROM studio_extension_records original
      WHERE original.id=e.id AND original.xmin::text=(pg_current_xact_id()::text::numeric % 4294967296)::text))) THEN
    RAISE EXCEPTION 'Record type assignment source head changed';
  END IF;
  IF NEW."recordTypeDefinitionId" IS NOT NULL THEN
    SELECT v.* INTO type_version FROM studio_definition_versions v JOIN studio_definitions d ON d.id=v."definitionId" AND d."organisationId"=v."organisationId"
      JOIN studio_profile_bindings b ON b."definitionId"=d.id AND b."organisationId"=d."organisationId" AND b.kind='recordType' AND b."entityId"=NEW."entityId"
      WHERE v.id=NEW."recordTypeVersionId" AND v."definitionId"=NEW."recordTypeDefinitionId" AND v."organisationId"=NEW."organisationId"
        AND d.kind='recordType' AND d."retiredAt" IS NULL AND d."activeVersionId"=v.id AND v."schemaVersion"=1 FOR SHARE OF v,d,b;
    IF NOT FOUND OR p->'recordType' IS DISTINCT FROM jsonb_build_object('kind','recordType','definitionId',type_version."definitionId"::text,
      'versionId',type_version.id::text,'schemaVersion',1,'checksum',type_version.checksum)
      OR type_version.payload->'entity'->>'id' IS DISTINCT FROM NEW."entityId" THEN RAISE EXCEPTION 'Record type assignment target is not active'; END IF;
    expected_profile:=type_version."compiledPlan"->'resolvedProfile';
  ELSIF p->'recordType' IS DISTINCT FROM 'null'::jsonb THEN RAISE EXCEPTION 'Record type assignment contains a partial type pin';
  END IF;
  IF NEW."baseProfileDefinitionId" IS NOT NULL THEN
    SELECT v.* INTO base_version FROM studio_definition_versions v JOIN studio_definitions d ON d.id=v."definitionId" AND d."organisationId"=v."organisationId"
      JOIN studio_profile_bindings b ON b."definitionId"=d.id AND b."organisationId"=d."organisationId" AND b.kind='entityProfile' AND b."entityId"=NEW."entityId"
      WHERE v.id=NEW."baseProfileVersionId" AND v."definitionId"=NEW."baseProfileDefinitionId" AND v."organisationId"=NEW."organisationId"
        AND d.kind='entityProfile' AND d."retiredAt" IS NULL AND v."schemaVersion"=1
        AND (NEW."recordTypeDefinitionId" IS NOT NULL OR d."activeVersionId"=v.id) FOR SHARE OF v,d,b;
    IF NOT FOUND OR p->'baseProfile' IS DISTINCT FROM jsonb_build_object('kind','entityProfile','definitionId',base_version."definitionId"::text,
      'versionId',base_version.id::text,'schemaVersion',1,'checksum',base_version.checksum)
      OR base_version.payload->'entity'->>'id' IS DISTINCT FROM NEW."entityId"
      OR (NEW."recordTypeDefinitionId" IS NOT NULL AND type_version.payload->'baseProfile' IS DISTINCT FROM p->'baseProfile') THEN
      RAISE EXCEPTION 'Record type assignment has no exact retained base pin';
    END IF;
    IF NEW."recordTypeDefinitionId" IS NULL THEN expected_profile:=base_version."compiledPlan"->'resolvedProfile'; END IF;
    IF p->>'resolvedProfileChecksum' IS DISTINCT FROM encode(sha256(convert_to(atlas_studio_canonical_metadata(expected_profile),'UTF8')),'hex') THEN
      RAISE EXCEPTION 'Record type assignment resolved profile changed'; END IF;
  ELSIF p->'baseProfile' IS DISTINCT FROM 'null'::jsonb OR p->'resolvedProfileChecksum' IS DISTINCT FROM 'null'::jsonb
    OR EXISTS (SELECT 1 FROM studio_profile_bindings b JOIN studio_definitions d ON d.id=b."definitionId" AND d."organisationId"=b."organisationId"
      WHERE b."organisationId"=NEW."organisationId" AND b."entityId"=NEW."entityId" AND b.kind='entityProfile' AND d."retiredAt" IS NULL AND d."activeVersionId" IS NOT NULL) THEN
    RAISE EXCEPTION 'Record type unassignment cannot omit its active base provenance';
  END IF;
  expected_request:=jsonb_build_object('operationId',NEW.id::text,'entity',p->'entity','recordId',NEW."recordId",'recordRevision',NEW."nativeRevision",
    'extensionRevision',p->'previousExtensionRevision','recordType',p->'recordType');
  IF NEW."requestChecksum" IS DISTINCT FROM encode(sha256(convert_to(atlas_studio_canonical_metadata(expected_request),'UTF8')),'hex') THEN
    RAISE EXCEPTION 'Record type assignment request identity changed'; END IF;
  RETURN NEW;
END $$;
