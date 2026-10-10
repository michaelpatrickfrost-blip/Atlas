import { expect, it } from "vitest";
import { checksum } from "@/core/studio/registry/contracts";
import { entityDetailsSchema } from "@/core/studio/registry/entities";
import type { ContractMetadata } from "@/core/studio/registry/types";
import { customFieldPayloadSchema } from "@/core/studio/fields/schema";
import { sealFieldMigrationReview } from "@/core/studio/fields/migrations/contracts";
import { reviewedFieldPublicationPin } from "@/core/studio/fields/migrations/publication-contract";
import { createFieldMigrationExecutionPin, createFieldMigrationOutcomePin, fieldMigrationExecutionBatchSchema, readFieldMigrationExecutionProgress } from "@/core/studio/fields/migrations/execution-contract";
const uuid = (value: number) => `00000000-0000-4000-8000-${value.toString().padStart(12, "0")}`;
const details = entityDetailsSchema.parse({ key: "string", fields: [{ id: "number", type: "string", nullable: false, classification: "confidential", filterable: true, sortable: false, decision: false, template: false }],
  extensionPolicy: { customFields: true, recordTypes: true, pageVariants: true }, record: { writeCapability: "tickets.ticket.manage", detailRoute: "/tickets/{recordId}", labelField: "number",
    listQuery: { id: "tickets.ticket.list", version: 1 }, getQuery: { id: "tickets.ticket.get", version: 1 },
    fieldPolicy: { types: ["integer", "decimal"], reservedKeys: ["id"], referenceEntities: [], maxFields: 10 },
    migrationSnapshot: { query: { id: "tickets.ticket.snapshot", version: 1 }, sourceVersions: [2, 5] },
    migrationRepresentation: { query: { id: "tickets.ticket.representation", version: 1 }, sourceVersions: [2, 5] }, nativeFields: "read_only", revision: "owner_positive_integer" } });
const owner: ContractMetadata = { id: "tickets.ticket", version: 5, ownerModuleId: "tickets", kind: "entity", label: "Ticket", lifecycle: "active", classification: "confidential", capability: "tickets.ticket.read", details,
  schemaHash: checksum(details), contractHash: "b".repeat(64) };
const approval: ContractMetadata = { ...owner, id: "tickets.ticket.representation", version: 1, kind: "query", capability: "tickets.ticket.manage", details: { transaction: "required" }, schemaHash: "c".repeat(64), contractHash: "d".repeat(64) };
const source = customFieldPayloadSchema.parse({ schemaVersion: 1, entity: { id: owner.id, version: 2, schemaHash: "a".repeat(64), contractHash: "b".repeat(64) }, storageGeneration: uuid(1),
  field: { key: "extra", label: "Extra", classification: "confidential", storage: { type: "integer" } } });
const payload = customFieldPayloadSchema.parse({ ...source, entity: { id: owner.id, version: owner.version, schemaHash: owner.schemaHash, contractHash: owner.contractHash }, storageGeneration: uuid(2), field: { ...source.field, storage: { type: "decimal" } } });
const plan = { kind: "customField", schemaVersion: 1, payload, dependencies: [] };
const target = { id: uuid(8), organisationId: "company", definitionId: uuid(4), version: 2, payload, compiledPlan: plan, checksum: checksum(plan) };
const review = sealFieldMigrationReview({ schemaVersion: 1, id: uuid(3), organisationId: "company", definitionId: uuid(4), definitionRevision: 7,
  principal: { organisationId: "company", userId: "actor", membershipId: "member", sessionVersion: 2, authVersion: 3, authority: "customer" },
  source: { versionId: uuid(5), versionChecksum: "c".repeat(64), payload: source },
  target: { draftId: uuid(6), draftRevision: 9, compiledChecksum: target.checksum, payload }, conversion: { kind: "integer_to_decimal" },
  ownerQuery: { id: "tickets.ticket.snapshot", version: 1, schemaHash: "d".repeat(64), contractHash: "e".repeat(64) },
  cohort: { recordCount: 2, observationDigest: "f".repeat(64) }, summary: { validCount: 2, invalidCount: 0, lossyCount: 0 } });
const publication = reviewedFieldPublicationPin(review, target, "actor", false);
const execution = () => createFieldMigrationExecutionPin(review, target, publication, owner, approval);
const observation = { id: uuid(11), preparationId: review.review.id, organisationId: "company", definitionId: uuid(4), entityId: owner.id, sourceGenerationId: uuid(1), recordId: "ticket_1", nativeRevision: 5,
  observation: { recordId: "ticket_1", nativeRevision: 5, extension: { id: uuid(12), revision: 9, slot: { id: uuid(13), revision: 1, value: { id: uuid(14), revision: 1, versionId: uuid(5), fingerprint: "f".repeat(64) } } },
    result: { kind: "valid", targetFingerprint: "e".repeat(64), isNull: false, lossy: false } } };
const targetIds = { extensionId: uuid(12), slotId: uuid(15), valueId: uuid(16) };
it("pins exact reviewed publication, immutable target and explicitly approved owner query without persisted grants", () => {
  const result = execution(); expect(result.checksum).toBe(checksum(result.pin));
  expect(result.pin.publication).toEqual(publication); expect(result.pin.sourceVersionId).toBe(uuid(5));
  expect(result.pin.ownerApproval).toEqual({ id: approval.id, version: approval.version, schemaHash: approval.schemaHash, contractHash: approval.contractHash });
  expect(result.pin.cohort).toEqual(review.review.cohort);
  expect(JSON.stringify(result.pin)).not.toContain("capabilities"); expect(result.pin).not.toHaveProperty("active");
});
it("rejects foreign or altered publication/source/target pins and old read-only owner contracts", () => {
  for (const invalid of [{ ...publication, organisationId: "other" }, { ...publication, preparationId: uuid(99) }, { ...publication, reviewChecksum: "0".repeat(64) }, { ...publication, targetGenerationId: uuid(99) }, { ...publication, privileged: true }])
    expect(() => createFieldMigrationExecutionPin(review, target, invalid, owner, approval)).toThrow();
  for (const invalid of [{ ...owner, version: 4 }, { ...owner, schemaHash: "0".repeat(64) }, { ...owner, details: { ...details, record: { ...details.record, migrationRepresentation: undefined } } }])
    expect(() => createFieldMigrationExecutionPin(review, target, publication, invalid, approval)).toThrow();
  for (const invalid of [{ ...approval, ownerModuleId: "finance" }, { ...approval, capability: "tickets.ticket.read" }, { ...approval, kind: "command" as const }, { ...approval, version: 2 }, { ...approval, details: {} }])
    expect(() => createFieldMigrationExecutionPin(review, target, publication, owner, invalid)).toThrow();
  expect(() => createFieldMigrationExecutionPin(review, { ...target, compiledPlan: {} }, publication, owner, approval)).toThrow();
});
it("success lineage binds observed source checksum and exact own extension increment, retaining no business values", () => {
  const { pin, checksum: executionChecksum } = execution(), result = createFieldMigrationOutcomePin(pin, observation, targetIds);
  expect(result.executionChecksum).toBe(executionChecksum); expect(result.observationChecksum).toBe(checksum(observation.observation));
  expect(result.target).toEqual({ ...targetIds, extensionRevision: 10, valueRevision: 1, fingerprint: "e".repeat(64), isNull: false });
  expect(result.observationId).toBe(observation.id); expect(result.targetGenerationId).toBe(publication.targetGenerationId);
  expect(result.targetVersionId).toBe(target.id); expect(result.recordId).toBe(observation.recordId);
  expect(result).not.toHaveProperty("value"); expect(result.target).not.toHaveProperty("nativePatch");
});
it("unanchored/null observations create an explicit first target revision and cannot reuse observed source slot/value", () => {
  const { pin } = execution(), unanchored = { ...observation, observation: { ...observation.observation, extension: null, result: { ...observation.observation.result, isNull: true } } };
  expect(createFieldMigrationOutcomePin(pin, unanchored, targetIds).target).toEqual({ ...targetIds, extensionRevision: 1, valueRevision: 1, fingerprint: "e".repeat(64), isNull: true });
  for (const invalid of [{ ...targetIds, extensionId: uuid(99) }, { ...targetIds, slotId: uuid(13) }, { ...targetIds, valueId: uuid(14) }, { ...targetIds, expectedRevision: 9 }])
    expect(() => createFieldMigrationOutcomePin(pin, observation, invalid)).toThrow();
});
it("rejects substituted tenant/record/native revision, invalid review result, overflow and noncanonical source observations", () => {
  const { pin } = execution();
  for (const invalid of [{ ...observation, organisationId: "other" }, { ...observation, recordId: "substituted" }, { ...observation, nativeRevision: 6 }, { ...observation, sourceGenerationId: uuid(99) },
    { ...observation, observation: { ...observation.observation, result: { kind: "invalid", code: "INVALID_SOURCE" } } },
    { ...observation, observation: { ...observation.observation, extension: { ...observation.observation.extension, revision: 2147483647 } } },
    { ...observation, observation: { ...observation.observation, capabilities: ["tickets.ticket.manage"] } }])
    expect(() => createFieldMigrationOutcomePin(pin, invalid, targetIds)).toThrow();
});
it("validates closed bounded CAS requests and explicit failed/ready progress without claiming runtime completion", () => {
  expect(fieldMigrationExecutionBatchSchema.parse({ preparationId: uuid(3), revision: 0 }).limit).toBe(25);
  for (const bad of [{ preparationId: uuid(3), revision: 0, limit: 51 }, { preparationId: uuid(3), revision: -1 }, { preparationId: uuid(3), revision: 2147483647 }, { preparationId: uuid(3), revision: 0, organisationId: "other" }])
    expect(() => fieldMigrationExecutionBatchSchema.parse(bad)).toThrow();
  const { pin } = execution(), initial = { state: "RUNNING", revision: 0, cursor: null, processedCount: 0, failureCode: null };
  expect(readFieldMigrationExecutionProgress(pin, initial)).toEqual(initial);
  expect(readFieldMigrationExecutionProgress(pin, { ...initial, state: "FAILED", revision: 1, failureCode: "WRITE_FAILED" }).failureCode).toBe("WRITE_FAILED");
  expect(readFieldMigrationExecutionProgress(pin, { ...initial, state: "READY", revision: 2, cursor: "ticket_2", processedCount: 2 }).state).toBe("READY");
  for (const bad of [{ ...initial, state: "READY", revision: 1 }, { ...initial, state: "FAILED", revision: 1 }, { ...initial, processedCount: 3 },
    { ...initial, revision: 1, processedCount: 1 }, { ...initial, cursor: "ticket_1" }, { ...initial, failureCode: "secret-business-value" }, { ...initial, privileged: true }])
    expect(() => readFieldMigrationExecutionProgress(pin, bad)).toThrow();
});
