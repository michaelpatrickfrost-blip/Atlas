-- Additive impact-graph family only. Existing profile eligibility remains closed.
-- Retain exact immutable tenant/version FKs, insert-only history and deferred
-- completeness/cycle/depth/path guards. No table, backfill or business mutation.
ALTER TABLE studio_configuration_dependencies DROP CONSTRAINT studio_configuration_pin_valid;
ALTER TABLE studio_configuration_dependencies ADD CONSTRAINT studio_configuration_pin_valid CHECK (
  "definitionId"<>"targetDefinitionId" AND "targetSchemaVersion">0
  AND "targetChecksum"~'^[a-f0-9]{64}$'
  AND "targetKind" IN ('entityProfile','recordType','page','customField','process','decision','view'));
