-- CreateTable
CREATE TABLE "studio_field_bindings" (
    "definitionId" UUID NOT NULL,
    "organisationId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "originVersionId" UUID NOT NULL,
    "initialGenerationId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "studio_field_bindings_pkey" PRIMARY KEY ("definitionId")
);

-- CreateTable
CREATE TABLE "studio_field_generations" (
    "id" UUID NOT NULL,
    "definitionId" UUID NOT NULL,
    "organisationId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "valueType" TEXT NOT NULL,
    "originVersionId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "studio_field_generations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "studio_extension_records" (
    "id" UUID NOT NULL,
    "organisationId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "studio_extension_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "studio_field_slots" (
    "id" UUID NOT NULL,
    "organisationId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "extensionId" UUID NOT NULL,
    "definitionId" UUID NOT NULL,
    "generationId" UUID NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 0,
    "activeValueId" UUID,
    "uniqueToken" CHAR(64),

    CONSTRAINT "studio_field_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "studio_field_values" (
    "id" UUID NOT NULL,
    "organisationId" TEXT NOT NULL,
    "definitionId" UUID NOT NULL,
    "generationId" UUID NOT NULL,
    "slotId" UUID NOT NULL,
    "versionId" UUID NOT NULL,
    "revision" INTEGER NOT NULL,
    "valueType" TEXT NOT NULL,
    "isNull" BOOLEAN NOT NULL DEFAULT false,
    "textValue" TEXT,
    "integerValue" BIGINT,
    "decimalValue" DECIMAL(38,10),
    "currency" CHAR(3),
    "booleanValue" BOOLEAN,
    "dateValue" DATE,
    "instantValue" TIMESTAMPTZ(3),
    "jsonValue" JSONB,
    "referenceValue" TEXT,
    "fingerprint" CHAR(64) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "studio_field_values_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "studio_field_bindings_definitionId_organisationId_key" ON "studio_field_bindings"("definitionId", "organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "studio_field_bindings_definitionId_organisationId_entityId_key" ON "studio_field_bindings"("definitionId", "organisationId", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "studio_field_bindings_organisationId_entityId_fieldKey_key" ON "studio_field_bindings"("organisationId", "entityId", "fieldKey");

-- CreateIndex
CREATE UNIQUE INDEX "studio_field_generations_id_definitionId_organisationId_key" ON "studio_field_generations"("id", "definitionId", "organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "studio_field_generations_id_definitionId_organisationId_ent_key" ON "studio_field_generations"("id", "definitionId", "organisationId", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "studio_field_generations_id_definitionId_organisationId_val_key" ON "studio_field_generations"("id", "definitionId", "organisationId", "valueType");

-- CreateIndex
CREATE UNIQUE INDEX "studio_extension_records_organisationId_entityId_recordId_key" ON "studio_extension_records"("organisationId", "entityId", "recordId");

-- CreateIndex
CREATE UNIQUE INDEX "studio_extension_records_id_organisationId_entityId_key" ON "studio_extension_records"("id", "organisationId", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "studio_field_slots_extensionId_definitionId_generationId_key" ON "studio_field_slots"("extensionId", "definitionId", "generationId");

-- CreateIndex
CREATE UNIQUE INDEX "studio_field_slots_id_definitionId_generationId_organisatio_key" ON "studio_field_slots"("id", "definitionId", "generationId", "organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "studio_field_slots_organisationId_definitionId_generationId_key" ON "studio_field_slots"("organisationId", "definitionId", "generationId", "uniqueToken");

-- CreateIndex
CREATE INDEX "studio_field_fingerprint_idx" ON "studio_field_values"("organisationId", "definitionId", "generationId", "fingerprint");

-- CreateIndex
CREATE INDEX "studio_field_integer_idx" ON "studio_field_values"("organisationId", "definitionId", "generationId", "integerValue");

-- CreateIndex
CREATE INDEX "studio_field_decimal_idx" ON "studio_field_values"("organisationId", "definitionId", "generationId", "decimalValue");

-- CreateIndex
CREATE INDEX "studio_field_date_idx" ON "studio_field_values"("organisationId", "definitionId", "generationId", "dateValue");

-- CreateIndex
CREATE INDEX "studio_field_instant_idx" ON "studio_field_values"("organisationId", "definitionId", "generationId", "instantValue");

-- CreateIndex
CREATE UNIQUE INDEX "studio_field_values_id_slotId_organisationId_key" ON "studio_field_values"("id", "slotId", "organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "studio_field_values_slotId_revision_key" ON "studio_field_values"("slotId", "revision");

-- AddForeignKey
ALTER TABLE "studio_field_bindings" ADD CONSTRAINT "studio_field_bindings_definitionId_organisationId_fkey" FOREIGN KEY ("definitionId", "organisationId") REFERENCES "studio_definitions"("id", "organisationId") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "studio_field_bindings" ADD CONSTRAINT "studio_field_bindings_originVersionId_definitionId_organis_fkey" FOREIGN KEY ("originVersionId", "definitionId", "organisationId") REFERENCES "studio_definition_versions"("id", "definitionId", "organisationId") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "studio_field_bindings" ADD CONSTRAINT "studio_field_bindings_initialGenerationId_definitionId_org_fkey" FOREIGN KEY ("initialGenerationId", "definitionId", "organisationId") REFERENCES "studio_field_generations"("id", "definitionId", "organisationId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "studio_field_generations" ADD CONSTRAINT "studio_field_generations_definitionId_organisationId_entit_fkey" FOREIGN KEY ("definitionId", "organisationId", "entityId") REFERENCES "studio_field_bindings"("definitionId", "organisationId", "entityId") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "studio_field_generations" ADD CONSTRAINT "studio_field_generations_originVersionId_definitionId_orga_fkey" FOREIGN KEY ("originVersionId", "definitionId", "organisationId") REFERENCES "studio_definition_versions"("id", "definitionId", "organisationId") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "studio_extension_records" ADD CONSTRAINT "studio_extension_records_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "studio_field_slots" ADD CONSTRAINT "studio_field_slots_extensionId_organisationId_entityId_fkey" FOREIGN KEY ("extensionId", "organisationId", "entityId") REFERENCES "studio_extension_records"("id", "organisationId", "entityId") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "studio_field_slots" ADD CONSTRAINT "studio_field_slots_generationId_definitionId_organisationI_fkey" FOREIGN KEY ("generationId", "definitionId", "organisationId", "entityId") REFERENCES "studio_field_generations"("id", "definitionId", "organisationId", "entityId") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "studio_field_slots" ADD CONSTRAINT "studio_field_slots_activeValueId_id_organisationId_fkey" FOREIGN KEY ("activeValueId", "id", "organisationId") REFERENCES "studio_field_values"("id", "slotId", "organisationId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "studio_field_values" ADD CONSTRAINT "studio_field_values_slotId_definitionId_generationId_organ_fkey" FOREIGN KEY ("slotId", "definitionId", "generationId", "organisationId") REFERENCES "studio_field_slots"("id", "definitionId", "generationId", "organisationId") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "studio_field_values" ADD CONSTRAINT "studio_field_values_generationId_definitionId_organisation_fkey" FOREIGN KEY ("generationId", "definitionId", "organisationId", "valueType") REFERENCES "studio_field_generations"("id", "definitionId", "organisationId", "valueType") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "studio_field_values" ADD CONSTRAINT "studio_field_values_versionId_definitionId_organisationId_fkey" FOREIGN KEY ("versionId", "definitionId", "organisationId") REFERENCES "studio_definition_versions"("id", "definitionId", "organisationId") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- Additive only: no existing business table/record or historical definition changes.
-- Defer pointer cycles for atomic creation and existing authorised Test cleanup.
ALTER TABLE studio_field_bindings ALTER CONSTRAINT "studio_field_bindings_initialGenerationId_definitionId_org_fkey" DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE studio_field_slots ALTER CONSTRAINT "studio_field_slots_activeValueId_id_organisationId_fkey" DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE studio_extension_records ADD CONSTRAINT studio_extension_revision CHECK (revision >= 0 AND length("recordId") BETWEEN 1 AND 100);
ALTER TABLE studio_field_slots ADD CONSTRAINT studio_slot_revision CHECK (revision >= 0);
ALTER TABLE studio_field_bindings ADD CONSTRAINT studio_field_key CHECK ("fieldKey" ~ '^[a-z][a-z0-9_]{0,39}$');
ALTER TABLE studio_field_values ADD CONSTRAINT studio_field_value_revision CHECK (revision > 0 AND fingerprint ~ '^[a-f0-9]{64}$');
ALTER TABLE studio_field_generations ADD CONSTRAINT studio_field_generation_type CHECK ("valueType" IN ('string','integer','decimal','money','boolean','date','datetime','duration','email','url','phone','enum','multi_enum','reference','address'));
ALTER TABLE studio_field_values ADD CONSTRAINT studio_field_typed_family CHECK (
 CASE WHEN "isNull" THEN num_nonnulls("textValue","integerValue","decimalValue",currency,"booleanValue","dateValue","instantValue","jsonValue","referenceValue") = 0
 ELSE CASE
  WHEN "valueType" IN ('string','email','url','phone','enum') THEN "textValue" IS NOT NULL AND length("textValue") <= 4000 AND num_nonnulls("textValue","integerValue","decimalValue",currency,"booleanValue","dateValue","instantValue","jsonValue","referenceValue") = 1
  WHEN "valueType" IN ('integer','duration') THEN "integerValue" IS NOT NULL AND "integerValue" BETWEEN -9007199254740991 AND 9007199254740991 AND ("valueType" <> 'duration' OR "integerValue" >= 0) AND num_nonnulls("textValue","integerValue","decimalValue",currency,"booleanValue","dateValue","instantValue","jsonValue","referenceValue") = 1
  WHEN "valueType" = 'decimal' THEN "decimalValue" IS NOT NULL AND num_nonnulls("textValue","integerValue","decimalValue",currency,"booleanValue","dateValue","instantValue","jsonValue","referenceValue") = 1
  WHEN "valueType" = 'money' THEN "decimalValue" IS NOT NULL AND currency IS NOT NULL AND currency ~ '^[A-Z]{3}$' AND num_nonnulls("textValue","integerValue","decimalValue",currency,"booleanValue","dateValue","instantValue","jsonValue","referenceValue") = 2
  WHEN "valueType" = 'boolean' THEN "booleanValue" IS NOT NULL AND num_nonnulls("textValue","integerValue","decimalValue",currency,"booleanValue","dateValue","instantValue","jsonValue","referenceValue") = 1
  WHEN "valueType" = 'date' THEN "dateValue" IS NOT NULL AND "dateValue" BETWEEN DATE '0001-01-01' AND DATE '9999-12-31' AND num_nonnulls("textValue","integerValue","decimalValue",currency,"booleanValue","dateValue","instantValue","jsonValue","referenceValue") = 1
  WHEN "valueType" = 'datetime' THEN "instantValue" IS NOT NULL AND "instantValue" >= TIMESTAMPTZ '0001-01-01 00:00:00+00' AND "instantValue" < TIMESTAMPTZ '10000-01-01 00:00:00+00' AND num_nonnulls("textValue","integerValue","decimalValue",currency,"booleanValue","dateValue","instantValue","jsonValue","referenceValue") = 1
  WHEN "valueType" = 'multi_enum' THEN "jsonValue" IS NOT NULL AND CASE WHEN jsonb_typeof("jsonValue") = 'array' THEN jsonb_array_length("jsonValue") <= 200 AND NOT jsonb_path_exists("jsonValue", '$[*] ? (@.type() != "string")') ELSE false END AND num_nonnulls("textValue","integerValue","decimalValue",currency,"booleanValue","dateValue","instantValue","jsonValue","referenceValue") = 1
  WHEN "valueType" = 'address' THEN "jsonValue" IS NOT NULL AND jsonb_typeof("jsonValue") = 'object' AND num_nonnulls("textValue","integerValue","decimalValue",currency,"booleanValue","dateValue","instantValue","jsonValue","referenceValue") = 1
  WHEN "valueType" = 'reference' THEN "referenceValue" IS NOT NULL AND "referenceValue" ~ '^[a-zA-Z0-9_-]{1,100}$' AND num_nonnulls("textValue","integerValue","decimalValue",currency,"booleanValue","dateValue","instantValue","jsonValue","referenceValue") = 1
  ELSE false
 END END
);

-- Reuse the existing immutable-history protection, including its narrow
-- transaction-local wipe flag AND database-confirmed Test/customer exception.
CREATE TRIGGER studio_field_binding_immutable BEFORE UPDATE OR DELETE ON studio_field_bindings FOR EACH ROW EXECUTE FUNCTION atlas_studio_history_guard();
CREATE TRIGGER studio_field_generation_immutable BEFORE UPDATE OR DELETE ON studio_field_generations FOR EACH ROW EXECUTE FUNCTION atlas_studio_history_guard();
CREATE TRIGGER studio_field_value_immutable BEFORE UPDATE OR DELETE ON studio_field_values FOR EACH ROW EXECUTE FUNCTION atlas_studio_history_guard();

CREATE FUNCTION atlas_studio_field_origin_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE p jsonb;
BEGIN
 SELECT v.payload INTO p FROM studio_definition_versions v JOIN studio_definitions d ON d.id=v."definitionId" AND d."organisationId"=v."organisationId"
 WHERE v.id=NEW."originVersionId" AND v."definitionId"=NEW."definitionId" AND v."organisationId"=NEW."organisationId" AND d.kind='customField';
 IF NOT FOUND OR p->'entity'->>'id' IS DISTINCT FROM NEW."entityId" THEN RAISE EXCEPTION 'Field origin must be its tenant-owned published entity definition'; END IF;
 IF TG_TABLE_NAME = 'studio_field_bindings' THEN
  IF p->'field'->>'key' IS DISTINCT FROM NEW."fieldKey" OR p->>'storageGeneration' IS DISTINCT FROM NEW."initialGenerationId"::text THEN RAISE EXCEPTION 'Permanent field key/generation does not match its origin'; END IF;
 ELSE
  IF p->'field'->'storage'->>'type' IS DISTINCT FROM NEW."valueType" OR p->>'storageGeneration' IS DISTINCT FROM NEW.id::text THEN RAISE EXCEPTION 'Field storage generation does not match its immutable schema'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER studio_field_binding_origin BEFORE INSERT ON studio_field_bindings FOR EACH ROW EXECUTE FUNCTION atlas_studio_field_origin_guard();
CREATE TRIGGER studio_field_generation_origin BEFORE INSERT ON studio_field_generations FOR EACH ROW EXECUTE FUNCTION atlas_studio_field_origin_guard();

CREATE FUNCTION atlas_studio_field_value_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE p jsonb;
BEGIN
 SELECT payload INTO p FROM studio_definition_versions WHERE id=NEW."versionId" AND "definitionId"=NEW."definitionId" AND "organisationId"=NEW."organisationId";
 IF NOT FOUND OR p->'field'->'storage'->>'type' IS DISTINCT FROM NEW."valueType" OR p->>'storageGeneration' IS DISTINCT FROM NEW."generationId"::text THEN RAISE EXCEPTION 'Typed value does not match its published field schema/generation'; END IF;
 IF NEW."isNull" AND (p->'field'->>'required')::boolean IS TRUE THEN RAISE EXCEPTION 'A required field cannot store an empty value'; END IF;
 IF NOT NEW."isNull" AND NEW."valueType" IN ('decimal','money') THEN
  IF abs(NEW."decimalValue") >= power(10::numeric,(p->'field'->'storage'->>'precision')::int-(p->'field'->'storage'->>'scale')::int)
     OR NEW."decimalValue"*power(10::numeric,(p->'field'->'storage'->>'scale')::int) <> trunc(NEW."decimalValue"*power(10::numeric,(p->'field'->'storage'->>'scale')::int))
     OR (p->'field'->'storage'->>'min' IS NOT NULL AND NEW."decimalValue" < (p->'field'->'storage'->>'min')::numeric)
     OR (p->'field'->'storage'->>'max' IS NOT NULL AND NEW."decimalValue" > (p->'field'->'storage'->>'max')::numeric) THEN RAISE EXCEPTION 'Decimal value violates its exact schema constraints'; END IF;
  IF NEW."valueType"='money' AND NOT (p->'field'->'storage'->'currencies' ? NEW.currency::text) THEN RAISE EXCEPTION 'Money currency is not approved by its field schema'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER studio_field_value_schema BEFORE INSERT ON studio_field_values FOR EACH ROW EXECUTE FUNCTION atlas_studio_field_value_guard();

CREATE FUNCTION atlas_studio_extension_identity_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_TABLE_NAME = 'studio_extension_records' THEN
  IF (NEW.id,NEW."organisationId",NEW."entityId",NEW."recordId") IS DISTINCT FROM (OLD.id,OLD."organisationId",OLD."entityId",OLD."recordId") OR NEW.revision <> OLD.revision+1 THEN RAISE EXCEPTION 'Extension record identity is immutable; saves require a new revision'; END IF;
 ELSE
  IF (NEW.id,NEW."organisationId",NEW."entityId",NEW."extensionId",NEW."definitionId",NEW."generationId") IS DISTINCT FROM (OLD.id,OLD."organisationId",OLD."entityId",OLD."extensionId",OLD."definitionId",OLD."generationId") OR NEW.revision <= OLD.revision THEN RAISE EXCEPTION 'Field slot identity is immutable; saves require a new revision'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER studio_extension_identity BEFORE UPDATE ON studio_extension_records FOR EACH ROW EXECUTE FUNCTION atlas_studio_extension_identity_guard();
CREATE TRIGGER studio_field_slot_identity BEFORE UPDATE ON studio_field_slots FOR EACH ROW EXECUTE FUNCTION atlas_studio_extension_identity_guard();

-- Commit-time check permits atomic slot -> value -> current-pointer creation, but
-- never commits an empty pointer or a forged uniqueness marker.
CREATE FUNCTION atlas_studio_field_current_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE r record;
BEGIN
 SELECT s.revision AS slot_revision,s."uniqueToken",v.revision AS value_revision,v.fingerprint,v."isNull",p.payload,e.revision AS extension_revision INTO r
 FROM studio_field_slots s JOIN studio_field_values v ON v.id=s."activeValueId" AND v."slotId"=s.id AND v."organisationId"=s."organisationId"
 JOIN studio_definition_versions p ON p.id=v."versionId" AND p."definitionId"=v."definitionId" AND p."organisationId"=v."organisationId"
 JOIN studio_extension_records e ON e.id=s."extensionId" AND e."organisationId"=s."organisationId" AND e."entityId"=s."entityId" WHERE s.id=NEW.id;
 IF NOT FOUND THEN
  IF current_setting('atlas.test_wipe',true)='on' AND EXISTS (SELECT 1 FROM organisations WHERE id=NEW."organisationId" AND "isTest" AND kind='CUSTOMER') AND NOT EXISTS (SELECT 1 FROM studio_field_slots WHERE id=NEW.id) THEN RETURN NULL; END IF;
  RAISE EXCEPTION 'A field slot must commit with its typed current value';
 END IF;
 IF r.slot_revision <> r.value_revision OR r.value_revision > r.extension_revision THEN RAISE EXCEPTION 'Field/extension revisions are inconsistent'; END IF;
 IF r."uniqueToken" IS DISTINCT FROM (CASE WHEN (r.payload->'field'->>'unique')::boolean IS TRUE AND NOT r."isNull" THEN r.fingerprint ELSE NULL END) THEN RAISE EXCEPTION 'Field uniqueness marker does not match its published policy'; END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER studio_field_current_valid AFTER INSERT OR UPDATE ON studio_field_slots DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION atlas_studio_field_current_guard();
