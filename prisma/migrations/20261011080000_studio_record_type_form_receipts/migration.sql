-- Forward-only receipt2 for the actual owning Ticket INSERT/type association.
-- Depends on 070 assignment history; no table, backfill or business data rewrite.
-- Original receipt1/field origins/defaults and immutable Audit namespace retained.
CREATE OR REPLACE FUNCTION atlas_ticket_form_receipt_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  receipt jsonb;
  field jsonb;
  operation_id text;
  previous_definition text := '';
  previous_extension integer;
  extension_id text;
  operations text[];
  type_anchor jsonb;
  type_selection jsonb;
  type_row studio_record_type_assignments%ROWTYPE;
  type_hash text;
  uuid_pattern constant text := '^([0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$';
  hash_pattern constant text := '^[0-9a-f]{64}$';
BEGIN
  IF TG_OP='DELETE' THEN
    IF OLD.action='tickets.form.completed' OR OLD."entityType"='TicketFormReceipt' OR OLD.id LIKE 'studio-ticket-form:%' THEN
      RAISE EXCEPTION 'Ticket form receipts are immutable';
    END IF;
    RETURN OLD;
  ELSIF TG_OP='UPDATE' THEN
    -- BOTH sides: no alteration, reclassification into/out of, or namespace
    -- renaming can make an already committed operation eligible to run again.
    IF OLD.action='tickets.form.completed' OR NEW.action='tickets.form.completed'
      OR OLD."entityType"='TicketFormReceipt' OR NEW."entityType"='TicketFormReceipt'
      OR OLD.id LIKE 'studio-ticket-form:%' OR NEW.id LIKE 'studio-ticket-form:%' THEN
      RAISE EXCEPTION 'Ticket form receipts are immutable';
    END IF;
    RETURN NEW;
  END IF;
  IF NEW.action<>'tickets.form.completed' AND NEW."entityType"<>'TicketFormReceipt' AND NEW.id NOT LIKE 'studio-ticket-form:%' THEN RETURN NEW; END IF;
  receipt := NEW.after;
  IF NEW.action IS DISTINCT FROM 'tickets.form.completed' OR NEW."entityType" IS DISTINCT FROM 'TicketFormReceipt'
    OR receipt IS NULL OR jsonb_typeof(receipt) IS DISTINCT FROM 'object' OR NEW.before IS NOT NULL
    OR (receipt-ARRAY['schemaVersion','organisationId','actorUserId','operationId','operation','recordId','recordRevision',
      'requestRecordRevision','fieldRecordRevision','nativeRequestChecksum','packetChecksum','fields','typeSelection','typeAssignment'])<>'{}'::jsonb
    OR receipt->'schemaVersion' NOT IN ('1'::jsonb,'2'::jsonb)
    OR receipt->'schemaVersion' IS NULL
    OR (receipt->'schemaVersion'='1'::jsonb AND (receipt?'typeSelection' OR receipt?'typeAssignment'))
    OR (receipt->'schemaVersion'='2'::jsonb AND (receipt->>'operation'<>'create'
      OR (SELECT count(*) FROM jsonb_object_keys(receipt))<>14))
    OR EXISTS (SELECT 1 FROM unnest(ARRAY['organisationId','actorUserId','operationId','operation','recordId','nativeRequestChecksum','packetChecksum']) k
      WHERE jsonb_typeof(receipt->k) IS DISTINCT FROM 'string')
    OR receipt->>'organisationId' IS DISTINCT FROM NEW."organisationId"
    OR receipt->>'actorUserId' IS DISTINCT FROM NEW."actorUserId" OR NEW."actorUserId" IS NULL
    OR receipt->>'recordId' IS DISTINCT FROM NEW."entityId"
    OR COALESCE(receipt->>'recordId','') !~ '^[a-zA-Z0-9_-]{1,100}$'
    OR COALESCE(receipt->>'operationId','') !~ uuid_pattern
    OR NEW.id IS DISTINCT FROM 'studio-ticket-form:'||(receipt->>'operationId')
    OR COALESCE(receipt->>'operation','') NOT IN ('create','update')
    OR COALESCE(receipt->>'nativeRequestChecksum','') !~ hash_pattern OR COALESCE(receipt->>'packetChecksum','') !~ hash_pattern
    OR jsonb_typeof(receipt->'fields') IS DISTINCT FROM 'array'
    OR jsonb_typeof(receipt->'recordRevision') IS DISTINCT FROM 'number'
    OR jsonb_typeof(receipt->'requestRecordRevision') IS DISTINCT FROM 'number'
    OR jsonb_typeof(receipt->'fieldRecordRevision') IS DISTINCT FROM 'number'
    OR COALESCE(receipt->>'recordRevision','') !~ '^[1-9][0-9]*$'
    OR COALESCE(receipt->>'requestRecordRevision','') !~ '^[1-9][0-9]*$'
    OR COALESCE(receipt->>'fieldRecordRevision','') !~ '^[1-9][0-9]*$' THEN
    RAISE EXCEPTION 'Ticket form receipt identity or shape is invalid';
  END IF;
  IF jsonb_array_length(receipt->'fields')>100
    OR (receipt->>'recordRevision')::numeric>2147483647 OR (receipt->>'requestRecordRevision')::numeric>2147483647
    OR (receipt->>'fieldRecordRevision')::numeric>2147483647
    OR (receipt->>'operation'='create' AND (receipt->>'recordRevision'<>'1' OR receipt->>'requestRecordRevision'<>'1' OR receipt->>'fieldRecordRevision'<>'1'))
    OR (receipt->>'operation'='update' AND ((receipt->>'recordRevision')::numeric<>(receipt->>'requestRecordRevision')::numeric+1
      OR (receipt->>'fieldRecordRevision')::numeric NOT IN ((receipt->>'requestRecordRevision')::numeric,(receipt->>'recordRevision')::numeric))) THEN
    RAISE EXCEPTION 'Ticket form receipt revision baseline is invalid';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM service_work_items w WHERE w.id=NEW."entityId" AND w."organisationId"=NEW."organisationId"
    AND w.kind='TICKET' AND w.version=(receipt->>'recordRevision')::integer
    AND (receipt->>'operation'<>'create' OR w."requesterUserId"=NEW."actorUserId") FOR SHARE OF w) THEN
    RAISE EXCEPTION 'Ticket form receipt needs its actual owning result';
  END IF;
  operations := ARRAY[receipt->>'operationId'];
  IF receipt->'schemaVersion'='2'::jsonb THEN
    type_anchor:=receipt->'typeAssignment'; type_selection:=receipt->'typeSelection';
    IF jsonb_typeof(type_anchor) IS DISTINCT FROM 'object' OR jsonb_typeof(type_selection) IS DISTINCT FROM 'object'
      OR (type_anchor-ARRAY['operationId','extensionId','extensionRevision','requestChecksum','checksum','selectionChecksum'])<>'{}'::jsonb
      OR (SELECT count(*) FROM jsonb_object_keys(type_anchor))<>6
      OR (type_selection-ARRAY['schemaVersion','manifestChecksum','definitionId'])<>'{}'::jsonb
      OR (SELECT count(*) FROM jsonb_object_keys(type_selection))<>3 OR type_selection->'schemaVersion' IS DISTINCT FROM '1'::jsonb
      OR jsonb_typeof(type_selection->'manifestChecksum') IS DISTINCT FROM 'string'
      OR COALESCE(type_selection->>'manifestChecksum','') !~ hash_pattern
      OR (type_selection->'definitionId' IS DISTINCT FROM 'null'::jsonb AND COALESCE(type_selection->>'definitionId','') !~ uuid_pattern)
      OR jsonb_typeof(type_anchor->'operationId') IS DISTINCT FROM 'string' OR jsonb_typeof(type_anchor->'extensionId') IS DISTINCT FROM 'string'
      OR COALESCE(type_anchor->>'operationId','') !~ uuid_pattern OR COALESCE(type_anchor->>'extensionId','') !~ uuid_pattern
      OR EXISTS(SELECT 1 FROM unnest(ARRAY['requestChecksum','checksum','selectionChecksum']) k
        WHERE jsonb_typeof(type_anchor->k) IS DISTINCT FROM 'string' OR COALESCE(type_anchor->>k,'') !~ hash_pattern)
      OR jsonb_typeof(type_anchor->'extensionRevision') IS DISTINCT FROM 'number'
      OR COALESCE(type_anchor->>'extensionRevision','') !~ '^[1-9][0-9]*$'
      OR (type_anchor->>'extensionRevision')::numeric<>jsonb_array_length(receipt->'fields')+1
      OR type_anchor->>'operationId'=ANY(operations)
      OR type_anchor->>'selectionChecksum' IS DISTINCT FROM encode(sha256(convert_to(atlas_studio_canonical_metadata(type_selection),'UTF8')),'hex') THEN
      RAISE EXCEPTION 'Ticket business type receipt shape or baseline is invalid';
    END IF;
    SELECT a.* INTO type_row FROM studio_record_type_assignments a
      JOIN studio_extension_records e ON e.id=a."extensionId" AND e."organisationId"=a."organisationId" AND e."entityId"=a."entityId"
      JOIN service_work_items w ON w.id=a."recordId" AND w."organisationId"=a."organisationId"
      WHERE a.id=(type_anchor->>'operationId')::uuid AND a."organisationId"=NEW."organisationId" AND a."createdBy"=NEW."actorUserId"
        AND a."entityId"='tickets.ticket' AND a."recordId"=NEW."entityId" AND a."nativeRevision"=1 AND a."previousAssignmentId" IS NULL
        AND a."extensionId"=(type_anchor->>'extensionId')::uuid AND a."extensionRevision"=(type_anchor->>'extensionRevision')::integer
        AND a."requestChecksum"=type_anchor->>'requestChecksum' AND a.checksum=type_anchor->>'checksum'
        AND e."recordId"=NEW."entityId" AND e.revision=a."extensionRevision" AND e."recordTypeAssignmentId"=a.id
        AND a."recordTypeDefinitionId"::text IS NOT DISTINCT FROM type_selection->>'definitionId'
        AND a.provenance->'previousExtensionRevision' IS NOT DISTINCT FROM
          CASE WHEN jsonb_array_length(receipt->'fields')=0 THEN 'null'::jsonb ELSE to_jsonb(jsonb_array_length(receipt->'fields')) END
        AND w.kind='TICKET' AND w.version=1 AND w."requesterUserId"=NEW."actorUserId"
        AND w.xmin::text=(pg_current_xact_id()::text::numeric % 4294967296)::text
        AND a.xmin::text=(pg_current_xact_id()::text::numeric % 4294967296)::text
      FOR SHARE OF a,e,w;
    IF NOT FOUND THEN RAISE EXCEPTION 'Ticket business type receipt needs its actual INSERT and association'; END IF;
    type_hash:=encode(sha256(convert_to(encode(sha256(convert_to(atlas_studio_canonical_metadata(jsonb_build_object(
      'purpose','tickets.create.business_type.v1','wholeOperationId',receipt->>'operationId',
      'pin',CASE WHEN type_row.provenance->'recordType'='null'::jsonb THEN type_row.provenance->'baseProfile' ELSE type_row.provenance->'recordType' END
      )),'UTF8')),'hex'),'UTF8')),'hex');
    IF type_row.id::text IS DISTINCT FROM substr(type_hash,1,8)||'-'||substr(type_hash,9,4)||'-4'||substr(type_hash,14,3)
      ||'-8'||substr(type_hash,18,3)||'-'||substr(type_hash,21,12)
      OR NOT EXISTS(SELECT 1 FROM audit_entries a WHERE a."organisationId"=NEW."organisationId" AND a."actorUserId"=NEW."actorUserId"
        AND a.action='studio.record_type.assigned' AND a."entityType"='StudioRecordTypeAssignment' AND a."entityId"=type_row.id::text
        AND a.after-'checksum'=type_row.provenance AND a.after->>'checksum'=type_row.checksum
        AND a.before=jsonb_build_object('extensionRevision',type_row."extensionRevision"-1,'assignmentId',NULL)
        FOR SHARE OF a) THEN RAISE EXCEPTION 'Ticket business type receipt needs its deterministic paired Audit'; END IF;
    operations:=array_append(operations,type_anchor->>'operationId');
    extension_id:=type_anchor->>'extensionId';
  END IF;
  FOR field IN SELECT value FROM jsonb_array_elements(receipt->'fields') LOOP
    IF jsonb_typeof(field) IS DISTINCT FROM 'object'
      OR (field-ARRAY['operationId','definitionId','definitionRevision','versionId','generationId','fingerprint','requestChecksum',
        'extensionId','extensionRevision','slotId','slotRevision','valueRevision','defaulted'])<>'{}'::jsonb
      OR EXISTS (SELECT 1 FROM unnest(ARRAY['operationId','definitionId','versionId','generationId','fingerprint','requestChecksum','extensionId','slotId']) k
        WHERE jsonb_typeof(field->k) IS DISTINCT FROM 'string')
      OR COALESCE(field->>'operationId','') !~ uuid_pattern OR COALESCE(field->>'definitionId','') !~ uuid_pattern
      OR COALESCE(field->>'versionId','') !~ uuid_pattern OR COALESCE(field->>'generationId','') !~ uuid_pattern
      OR COALESCE(field->>'extensionId','') !~ uuid_pattern OR COALESCE(field->>'slotId','') !~ uuid_pattern
      OR COALESCE(field->>'fingerprint','') !~ hash_pattern OR COALESCE(field->>'requestChecksum','') !~ hash_pattern
      OR jsonb_typeof(field->'definitionRevision') IS DISTINCT FROM 'number' OR COALESCE(field->>'definitionRevision','') !~ '^(0|[1-9][0-9]*)$'
      OR jsonb_typeof(field->'extensionRevision') IS DISTINCT FROM 'number' OR COALESCE(field->>'extensionRevision','') !~ '^[1-9][0-9]*$'
      OR jsonb_typeof(field->'slotRevision') IS DISTINCT FROM 'number' OR COALESCE(field->>'slotRevision','') !~ '^[1-9][0-9]*$'
      OR jsonb_typeof(field->'valueRevision') IS DISTINCT FROM 'number' OR COALESCE(field->>'valueRevision','') !~ '^[1-9][0-9]*$'
      OR (field ? 'defaulted' AND (field->'defaulted' IS DISTINCT FROM 'true'::jsonb OR receipt->>'operation'<>'create'))
      OR field->'slotRevision' IS DISTINCT FROM field->'valueRevision'
      OR (field->>'definitionId') COLLATE "C"<=previous_definition COLLATE "C"
      OR field->>'operationId'=ANY(operations)
      OR (previous_extension IS NOT NULL AND (field->>'extensionRevision')::numeric<>previous_extension+1)
      OR (extension_id IS NOT NULL AND field->>'extensionId'<>extension_id) THEN
      RAISE EXCEPTION 'Ticket form receipt field shape or order is invalid';
    END IF;
    IF (field->>'definitionRevision')::numeric>2147483646 OR (field->>'extensionRevision')::numeric>2147483647
      OR (field->>'slotRevision')::numeric>2147483647 THEN RAISE EXCEPTION 'Ticket form receipt field revision is invalid'; END IF;
    IF NOT EXISTS (SELECT 1 FROM studio_field_values v JOIN studio_field_slots s
        ON s.id=v."slotId" AND s."organisationId"=v."organisationId"
      JOIN studio_extension_records e ON e.id=s."extensionId" AND e."organisationId"=s."organisationId"
      JOIN studio_definitions d ON d.id=v."definitionId" AND d."organisationId"=v."organisationId"
      JOIN studio_definition_versions written ON written.id=v."versionId" AND written."definitionId"=v."definitionId" AND written."organisationId"=v."organisationId"
      JOIN audit_entries a ON a."organisationId"=v."organisationId" AND a."actorUserId"=v."createdBy"
        AND a.action='studio.field.value.saved' AND a."entityType"='StudioFieldValue' AND a."entityId"=v.id::text
      WHERE v.id=(field->>'operationId')::uuid AND v."organisationId"=NEW."organisationId" AND v."createdBy"=NEW."actorUserId"
        AND v."definitionId"=(field->>'definitionId')::uuid AND v."versionId"=(field->>'versionId')::uuid
        AND v."generationId"=(field->>'generationId')::uuid AND v."slotId"=(field->>'slotId')::uuid
        AND v.fingerprint=field->>'fingerprint' AND v.revision=(field->>'valueRevision')::integer
        AND s."definitionId"=v."definitionId" AND s."generationId"=v."generationId" AND s."activeValueId"=v.id AND s.revision=v.revision
        AND s."extensionId"=(field->>'extensionId')::uuid AND s."entityId"='tickets.ticket'
        AND e."entityId"='tickets.ticket' AND e."recordId"=NEW."entityId"
        AND d.kind='customField' AND d."retiredAt" IS NULL AND d."activeVersionId"=v."versionId" AND d.revision=(field->>'definitionRevision')::integer
        -- Literal origin is server-only and valid solely on the actual initial
        -- INSERT baseline. Existing receipts retain their exact absent shape.
        AND (NOT (field ? 'defaulted') OR (
          receipt->>'operation'='create' AND v.revision=1 AND NOT v."isNull"
          AND written.payload->'field'->'defaultValue'->>'type'=v."valueType"
          AND CASE v."valueType"
            WHEN 'integer' THEN (written.payload#>>'{field,defaultValue,value}')::numeric=v."integerValue"
            WHEN 'duration' THEN (written.payload#>>'{field,defaultValue,value}')::numeric=v."integerValue"
            WHEN 'decimal' THEN (written.payload#>>'{field,defaultValue,value}')::numeric=v."decimalValue"
            WHEN 'money' THEN (written.payload#>>'{field,defaultValue,value,amount}')::numeric=v."decimalValue"
              AND (written.payload#>>'{field,defaultValue,value,currency}')=v.currency::text
            WHEN 'boolean' THEN (written.payload#>'{field,defaultValue,value}')=to_jsonb(v."booleanValue")
            WHEN 'date' THEN (written.payload#>>'{field,defaultValue,value}')=to_char(v."dateValue",'YYYY-MM-DD')
            WHEN 'datetime' THEN (written.payload#>>'{field,defaultValue,value}')::timestamptz=v."instantValue"
            WHEN 'reference' THEN (written.payload#>>'{field,defaultValue,value}')=v."referenceValue"
            WHEN 'multi_enum' THEN (written.payload#>'{field,defaultValue,value}')=v."jsonValue"
            WHEN 'address' THEN (written.payload#>'{field,defaultValue,value}')=v."jsonValue"
            ELSE (written.payload#>>'{field,defaultValue,value}')=v."textValue"
          END))
        AND a.after->>'requestChecksum'=field->>'requestChecksum' AND a.after->>'fingerprint'=v.fingerprint
        AND a.after->>'versionId'=v."versionId"::text AND a.after->>'generationId'=v."generationId"::text
        AND a.after->>'extensionId'=e.id::text AND a.after->'extensionRevision'=field->'extensionRevision'
        AND a.after->>'slotId'=s.id::text AND a.after->'slotRevision'=field->'slotRevision' AND a.after->'valueRevision'=field->'valueRevision'
        AND a.before->'definitionRevision'=field->'definitionRevision' AND a.before->'recordRevision'=receipt->'fieldRecordRevision'
        AND e.revision=CASE WHEN receipt->'schemaVersion'='2'::jsonb THEN (type_anchor->>'extensionRevision')::integer
          ELSE (receipt->'fields'->(jsonb_array_length(receipt->'fields')-1)->>'extensionRevision')::integer END
      FOR SHARE OF v,s,e,d,a) THEN RAISE EXCEPTION 'Ticket form receipt needs its actual staged field anchors'; END IF;
    operation_id := field->>'operationId'; operations := array_append(operations,operation_id);
    previous_definition := field->>'definitionId'; previous_extension := (field->>'extensionRevision')::integer;
    extension_id := field->>'extensionId';
  END LOOP;
  RETURN NEW;
END;
$$;
