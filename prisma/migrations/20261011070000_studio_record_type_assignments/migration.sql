-- Additive canonical association history only. No Ticket copy, backfill, value
-- rewrite or public dispatch. Existing extension identity/revision guards remain.
ALTER TABLE studio_extension_records ADD COLUMN "recordTypeAssignmentId" uuid;
CREATE TABLE studio_record_type_assignments (
  id uuid PRIMARY KEY,
  "organisationId" text NOT NULL, "entityId" text NOT NULL, "recordId" text NOT NULL,
  "extensionId" uuid NOT NULL, "previousAssignmentId" uuid,
  "extensionRevision" integer NOT NULL, "nativeRevision" integer NOT NULL,
  "recordTypeDefinitionId" uuid, "recordTypeVersionId" uuid,
  "baseProfileDefinitionId" uuid, "baseProfileVersionId" uuid,
  provenance jsonb NOT NULL, checksum char(64) NOT NULL, "requestChecksum" char(64) NOT NULL,
  "createdBy" text NOT NULL, "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT studio_assignment_extension_fk FOREIGN KEY ("extensionId","organisationId","entityId")
    REFERENCES studio_extension_records(id,"organisationId","entityId") ON DELETE RESTRICT ON UPDATE NO ACTION,
  CONSTRAINT studio_assignment_type_binding_fk FOREIGN KEY ("recordTypeDefinitionId","organisationId","entityId")
    REFERENCES studio_profile_bindings("definitionId","organisationId","entityId") ON DELETE RESTRICT ON UPDATE NO ACTION,
  CONSTRAINT studio_assignment_base_binding_fk FOREIGN KEY ("baseProfileDefinitionId","organisationId","entityId")
    REFERENCES studio_profile_bindings("definitionId","organisationId","entityId") ON DELETE RESTRICT ON UPDATE NO ACTION,
  CONSTRAINT studio_assignment_type_version_fk FOREIGN KEY ("recordTypeVersionId","recordTypeDefinitionId","organisationId")
    REFERENCES studio_definition_versions(id,"definitionId","organisationId") ON DELETE RESTRICT ON UPDATE NO ACTION,
  CONSTRAINT studio_assignment_base_version_fk FOREIGN KEY ("baseProfileVersionId","baseProfileDefinitionId","organisationId")
    REFERENCES studio_definition_versions(id,"definitionId","organisationId") ON DELETE RESTRICT ON UPDATE NO ACTION,
  CONSTRAINT studio_assignment_shape CHECK (
    "extensionRevision">0 AND "nativeRevision">0 AND "previousAssignmentId" IS DISTINCT FROM id
    AND ("recordTypeDefinitionId" IS NULL)=("recordTypeVersionId" IS NULL)
    AND ("baseProfileDefinitionId" IS NULL)=("baseProfileVersionId" IS NULL)
    AND ("recordTypeDefinitionId" IS NULL OR "baseProfileDefinitionId" IS NOT NULL)
    AND checksum~'^[a-f0-9]{64}$' AND "requestChecksum"~'^[a-f0-9]{64}$')
);
CREATE UNIQUE INDEX studio_assignment_head_key ON studio_record_type_assignments(id,"extensionId","organisationId","entityId");
CREATE UNIQUE INDEX studio_assignment_revision_key ON studio_record_type_assignments("extensionId","extensionRevision");
CREATE INDEX studio_assignment_type_idx ON studio_record_type_assignments("organisationId","entityId","recordTypeDefinitionId","extensionId");
ALTER TABLE studio_record_type_assignments ADD CONSTRAINT studio_assignment_previous_fk
  FOREIGN KEY ("previousAssignmentId","extensionId","organisationId","entityId")
  REFERENCES studio_record_type_assignments(id,"extensionId","organisationId","entityId") ON DELETE RESTRICT ON UPDATE NO ACTION;
ALTER TABLE studio_extension_records ADD CONSTRAINT studio_record_type_head_fk
  FOREIGN KEY ("recordTypeAssignmentId",id,"organisationId","entityId")
  REFERENCES studio_record_type_assignments(id,"extensionId","organisationId","entityId")
  ON DELETE NO ACTION ON UPDATE NO ACTION DEFERRABLE INITIALLY DEFERRED;
CREATE TRIGGER studio_assignment_history BEFORE UPDATE OR DELETE ON studio_record_type_assignments
  FOR EACH ROW EXECUTE FUNCTION atlas_studio_history_guard();

CREATE FUNCTION atlas_studio_assignment_insert_guard() RETURNS trigger LANGUAGE plpgsql AS $$
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
    OR (p->'entity'-ARRAY['id','version','schemaHash','contractHash'])<>'{}'::jsonb
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
CREATE TRIGGER studio_assignment_insert BEFORE INSERT ON studio_record_type_assignments
  FOR EACH ROW EXECUTE FUNCTION atlas_studio_assignment_insert_guard();

CREATE FUNCTION atlas_studio_assignment_complete_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE a studio_record_type_assignments%ROWTYPE; e studio_extension_records%ROWTYPE;
BEGIN
  -- Preserve the original narrowly authorised Test wipe: only queued evidence
  -- genuinely removed from an actual Test customer under the existing setting.
  IF current_setting('atlas.test_wipe',true)='on' AND EXISTS (SELECT 1 FROM organisations
    WHERE id=NEW."organisationId" AND "isTest" AND kind='CUSTOMER') THEN
    IF TG_TABLE_NAME='studio_record_type_assignments' AND NOT EXISTS (SELECT 1 FROM studio_record_type_assignments
      WHERE id=NEW.id AND "organisationId"=NEW."organisationId") THEN RETURN NEW; END IF;
    IF TG_TABLE_NAME='studio_extension_records' AND NOT EXISTS (SELECT 1 FROM studio_extension_records
      WHERE id=NEW.id AND "organisationId"=NEW."organisationId") THEN RETURN NEW; END IF;
  END IF;
  IF TG_TABLE_NAME='studio_record_type_assignments' THEN a:=NEW;
  ELSE
    IF NEW."recordTypeAssignmentId" IS NULL THEN
      IF TG_OP='UPDATE' AND OLD."recordTypeAssignmentId" IS NOT NULL THEN RAISE EXCEPTION 'Record type changes need explicit retained unassignment evidence'; END IF;
      RETURN NEW;
    END IF;
    SELECT * INTO a FROM studio_record_type_assignments WHERE id=NEW."recordTypeAssignmentId" AND "organisationId"=NEW."organisationId";
    IF NOT FOUND OR a."extensionId"<>NEW.id OR a."entityId"<>NEW."entityId" OR a."recordId"<>NEW."recordId" OR a."extensionRevision">NEW.revision THEN
      RAISE EXCEPTION 'Record type head has no matching canonical assignment'; END IF;
    IF TG_OP='INSERT' OR NEW."recordTypeAssignmentId" IS DISTINCT FROM OLD."recordTypeAssignmentId" THEN
      IF a."extensionRevision"<>NEW.revision OR (TG_OP='UPDATE' AND a."previousAssignmentId" IS DISTINCT FROM OLD."recordTypeAssignmentId") THEN
        RAISE EXCEPTION 'Record type head change must advance from its actual previous assignment'; END IF;
    ELSE RETURN NEW;
    END IF;
  END IF;
  SELECT * INTO e FROM studio_extension_records WHERE id=a."extensionId" AND "organisationId"=a."organisationId" AND "entityId"=a."entityId";
  IF NOT FOUND OR e."recordId"<>a."recordId" OR e."recordTypeAssignmentId" IS DISTINCT FROM a.id OR e.revision<a."extensionRevision"
    OR (SELECT count(*) FROM audit_entries audit WHERE audit."organisationId"=a."organisationId" AND audit."actorUserId"=a."createdBy"
      AND audit.action='studio.record_type.assigned' AND audit."entityType"='StudioRecordTypeAssignment' AND audit."entityId"=a.id::text
      AND audit.after=a.provenance||jsonb_build_object('checksum',a.checksum)
      AND audit.before=jsonb_build_object('extensionRevision',a."extensionRevision"-1,'assignmentId',a."previousAssignmentId"::text))<>1 THEN
    RAISE EXCEPTION 'Record type assignment, canonical head and exact Audit must commit together';
  END IF;
  RETURN NEW;
END $$;
CREATE CONSTRAINT TRIGGER studio_assignment_complete AFTER INSERT ON studio_record_type_assignments
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION atlas_studio_assignment_complete_guard();
CREATE CONSTRAINT TRIGGER studio_assignment_head_complete AFTER INSERT OR UPDATE ON studio_extension_records
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION atlas_studio_assignment_complete_guard();

CREATE UNIQUE INDEX studio_assignment_audit_key ON audit_entries("organisationId","entityId")
  WHERE action='studio.record_type.assigned' OR "entityType"='StudioRecordTypeAssignment';

-- Only this reserved association evidence is immutable. Ordinary Audit privacy
-- scrubbing remains allowed, including Party/Contact history.
CREATE FUNCTION atlas_studio_assignment_audit_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP='DELETE' THEN
    IF current_setting('atlas.test_wipe',true)='on' AND EXISTS (SELECT 1 FROM organisations
      WHERE id=OLD."organisationId" AND "isTest" AND kind='CUSTOMER') THEN RETURN OLD; END IF;
    IF OLD.action='studio.record_type.assigned' OR OLD."entityType"='StudioRecordTypeAssignment' THEN RAISE EXCEPTION 'Record type assignment Audit is immutable'; END IF;
    RETURN OLD;
  ELSIF TG_OP='UPDATE' THEN
    IF OLD.action='studio.record_type.assigned' OR NEW.action='studio.record_type.assigned'
      OR OLD."entityType"='StudioRecordTypeAssignment' OR NEW."entityType"='StudioRecordTypeAssignment' THEN RAISE EXCEPTION 'Record type assignment Audit is immutable'; END IF;
    RETURN NEW;
  END IF;
  IF NEW.action='studio.record_type.assigned' OR NEW."entityType"='StudioRecordTypeAssignment' THEN
    IF NEW.action IS DISTINCT FROM 'studio.record_type.assigned' OR NEW."entityType" IS DISTINCT FROM 'StudioRecordTypeAssignment'
      OR NOT EXISTS (SELECT 1 FROM studio_record_type_assignments a WHERE a.id::text=NEW."entityId" AND a."organisationId"=NEW."organisationId"
        AND a."createdBy"=NEW."actorUserId" AND NEW.after=a.provenance||jsonb_build_object('checksum',a.checksum)
        AND NEW.before=jsonb_build_object('extensionRevision',a."extensionRevision"-1,'assignmentId',a."previousAssignmentId"::text)) THEN
      RAISE EXCEPTION 'Record type assignment Audit must match its actual evidence'; END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER studio_assignment_audit BEFORE INSERT OR UPDATE OR DELETE ON audit_entries
  FOR EACH ROW EXECUTE FUNCTION atlas_studio_assignment_audit_guard();
