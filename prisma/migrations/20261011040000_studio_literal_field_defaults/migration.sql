-- Forward-only optional literal-default origin for the SAME reserved Audit guard.
-- No table, backfill, receipt rewrite, default fill or business data mutation.
-- TypeScript independently proves omission, deterministic operation and sealed policy.
-- Additive whole-form receipt in the existing Audit table. Ordinary Audit
-- (including Party/Contact privacy scrubbing) retains its existing behaviour.
-- No business backfill, new engine/table, value rewrite or destructive reset.
CREATE OR REPLACE FUNCTION atlas_ticket_form_receipt_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  receipt jsonb;
  field jsonb;
  operation_id text;
  previous_definition text := '';
  previous_extension integer;
  extension_id text;
  operations text[];
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
      'requestRecordRevision','fieldRecordRevision','nativeRequestChecksum','packetChecksum','fields'])<>'{}'::jsonb
    OR receipt->'schemaVersion' IS DISTINCT FROM '1'::jsonb
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
        AND e.revision=(receipt->'fields'->(jsonb_array_length(receipt->'fields')-1)->>'extensionRevision')::integer
      FOR SHARE OF v,s,e,d,a) THEN RAISE EXCEPTION 'Ticket form receipt needs its actual staged field anchors'; END IF;
    operation_id := field->>'operationId'; operations := array_append(operations,operation_id);
    previous_definition := field->>'definitionId'; previous_extension := (field->>'extensionRevision')::integer;
    extension_id := field->>'extensionId';
  END LOOP;
  RETURN NEW;
END;
$$;
