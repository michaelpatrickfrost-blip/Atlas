import { expect, it } from "vitest";
import { checksum } from "@/core/studio/registry/contracts";
import { customFieldPayloadSchema } from "@/core/studio/fields/schema";
import { sealFieldMigrationReview } from "@/core/studio/fields/migrations/contracts";
import { fieldMigrationExecutionPinSchema } from "@/core/studio/fields/migrations/execution-contract";
import { createFieldMigrationCutoverPin, fieldMigrationCutoverPinSchema, fieldMigrationCutoverRequestSchema } from "@/core/studio/fields/migrations/cutover-contract";

const uuid = (n: number) => `00000000-0000-4000-8000-${n.toString().padStart(12, "0")}`;
const ref = { id: "tickets.ticket", version: 5, schemaHash: "a".repeat(64), contractHash: "b".repeat(64) };
const source = customFieldPayloadSchema.parse({ schemaVersion: 1, entity: { ...ref, version: 2 }, storageGeneration: uuid(1),
  field: { key: "extra", label: "Extra", classification: "confidential", storage: { type: "integer" } } });
const target = customFieldPayloadSchema.parse({ ...source, entity: ref, storageGeneration: uuid(2), field: { ...source.field, storage: { type: "decimal" } } });
function ready(count = 2) {
  const sealed = sealFieldMigrationReview({ schemaVersion: 1, id: uuid(3), organisationId: "company", definitionId: uuid(4), definitionRevision: 7,
    principal: { organisationId: "company", userId: "actor", membershipId: "member", sessionVersion: 2, authVersion: 3, authority: "customer" },
    source: { versionId: uuid(5), versionChecksum: "c".repeat(64), payload: source },
    target: { draftId: uuid(6), draftRevision: 9, compiledChecksum: "d".repeat(64), payload: target }, conversion: { kind: "integer_to_decimal" },
    ownerQuery: { ...ref, id: "tickets.ticket.field_migration", version: 3 },
    cohort: { recordCount: count, observationDigest: "e".repeat(64) }, summary: { validCount: count, invalidCount: 0, lossyCount: 0 } });
  const publicationPin = { preparationId: uuid(3), organisationId: "company", definitionId: uuid(4), reviewChecksum: sealed.checksum,
    sourceGenerationId: uuid(1), targetGenerationId: uuid(2), targetVersionId: uuid(8), targetVersionNumber: 2, targetChecksum: "d".repeat(64), publisherUserId: "actor", acknowledgedLoss: false };
  const pin = fieldMigrationExecutionPinSchema.parse({ schemaVersion: 1, publication: publicationPin, sourceVersionId: uuid(5), sourceChecksum: "c".repeat(64), entity: ref,
    ownerApproval: { ...ref, id: "tickets.ticket.field_representation", version: 1 }, cohort: sealed.review.cohort });
  const execution = { preparationId: uuid(3), organisationId: "company", definitionId: uuid(4), entityId: ref.id, pin, pinChecksum: checksum(pin),
    state: "READY", revision: 3, cursor: count ? "ticket_2" : null, processedCount: count, failureCode: null };
  const publication = { ...publicationPin, state: "PUBLISHED", revision: 0 };
  const definition = { id: uuid(4), organisationId: "company", kind: "customField", activeVersionId: uuid(5), revision: 8, latestVersion: 2, retiredAt: null };
  return { sealed, execution, publication, definition };
}
const create = (f: ReturnType<typeof ready>) => createFieldMigrationCutoverPin(f.sealed, f.execution, f.publication, f.definition);
it("binds exact READY execution and source-active definition CAS, retaining identity without values or authority", () => {
  const f = ready(), before = structuredClone(f), result = create(f);
  expect(result.checksum).toBe(checksum(result.pin)); expect(f).toEqual(before);
  expect(result.pin).toMatchObject({ publication: { preparationId: uuid(3), targetVersionId: uuid(8), revision: 0 },
    execution: { checksum: f.execution.pinChecksum, revision: 3 }, source: { versionId: uuid(5), checksum: "c".repeat(64) }, definitionRevision: 8,
    rollbackPolicy: "unchanged_reviewed_representation" });
  for (const forbidden of ["capabilities", "values", "nativePatch", "canRollback", "active", "reverseConversion"])
    expect(result.pin).not.toHaveProperty(forbidden);
});
it("denies foreign/stale/retired/wrong-kind definition and substituted active target or latest version", () => {
  for (const patch of [{ id: uuid(99) }, { organisationId: "other" }, { revision: 9 }, { activeVersionId: uuid(8) }, { latestVersion: 3 },
    { retiredAt: new Date() }, { kind: "capabilitySet" }, { bypass: true }]) {
    const f = ready(); expect(() => createFieldMigrationCutoverPin(f.sealed, f.execution, f.publication, { ...f.definition, ...patch })).toThrow();
  }
});
it("denies unfinished/failed/cancelled execution and incomplete or ambiguous READY progress", () => {
  for (const patch of [{ state: "RUNNING" }, { state: "FAILED", failureCode: "WRITE_FAILED" }, { state: "CANCELLED" }, { processedCount: 1 },
    { processedCount: 3 }, { cursor: null }, { revision: 0 }, { failureCode: "WRITE_FAILED" }, { cursor: "invalid id" }, { privileged: true }]) {
    const f = ready(); expect(() => createFieldMigrationCutoverPin(f.sealed, { ...f.execution, ...patch }, f.publication, f.definition)).toThrow();
  }
  expect(create(ready(0)).pin.definitionRevision).toBe(8);
});
it("denies substituted execution scope and tampered integrity pins even when a changed pin is rechecksummed", () => {
  for (const patch of [{ preparationId: uuid(99) }, { organisationId: "other" }, { definitionId: uuid(99) }, { entityId: "finance.invoice" }, { pinChecksum: "f".repeat(64) }]) {
    const f = ready(); expect(() => createFieldMigrationCutoverPin(f.sealed, { ...f.execution, ...patch }, f.publication, f.definition)).toThrow();
  }
  for (const patch of [{ sourceVersionId: uuid(99) }, { sourceChecksum: "f".repeat(64) }, { entity: { ...ref, version: 6 } },
    { cohort: { recordCount: 2, observationDigest: "f".repeat(64) } }, { publication: { ...ready().execution.pin.publication, targetGenerationId: uuid(99) } }]) {
    const f = ready(), pin = { ...f.execution.pin, ...patch };
    expect(() => createFieldMigrationCutoverPin(f.sealed, { ...f.execution, pin, pinChecksum: checksum(pin) }, f.publication, f.definition)).toThrow();
  }
});
it("denies cancelled/foreign/altered publication and source-version reuse", () => {
  for (const patch of [{ state: "CANCELLED" }, { organisationId: "other" }, { reviewChecksum: "f".repeat(64) }, { publisherUserId: "other" },
    { targetVersionId: uuid(5) }, { targetChecksum: "f".repeat(64) }, { targetVersionNumber: 3 }, { sourceGenerationId: uuid(99) }, { bypass: true }]) {
    const f = ready(); expect(() => createFieldMigrationCutoverPin(f.sealed, f.execution, { ...f.publication, ...patch }, f.definition)).toThrow();
  }
});
it("revalidates the sealed review and denies invalid rows or unacknowledged conversion loss", () => {
  const f = ready(); expect(() => create({ ...f, sealed: { ...f.sealed, checksum: "f".repeat(64) } })).toThrow();
  for (const summary of [{ validCount: 1, invalidCount: 1, lossyCount: 0 }, { validCount: 2, invalidCount: 0, lossyCount: 1 }]) {
    const sealed = sealFieldMigrationReview({ ...f.sealed.review, summary }), publication = { ...f.publication, reviewChecksum: sealed.checksum };
    const pin = { ...f.execution.pin, publication: { ...f.execution.pin.publication, reviewChecksum: sealed.checksum } };
    expect(() => createFieldMigrationCutoverPin(sealed, { ...f.execution, pin, pinChecksum: checksum(pin) }, publication, f.definition)).toThrow();
  }
});
it("reserves integer transition capacity and rejects defaults/coercion instead of changing historical identity", () => {
  const f = ready(), sealed = sealFieldMigrationReview({ ...f.sealed.review, definitionRevision: 2147483644 });
  const publication = { ...f.publication, reviewChecksum: sealed.checksum }, pin = { ...f.execution.pin, publication: { ...f.execution.pin.publication, reviewChecksum: sealed.checksum } };
  expect(createFieldMigrationCutoverPin(sealed, { ...f.execution, pin, pinChecksum: checksum(pin) }, publication, { ...f.definition, revision: 2147483645 }).pin.definitionRevision).toBe(2147483645);
  for (const revision of [2147483646, 2147483647, Number.MAX_SAFE_INTEGER, -1, 8.5, "8"])
    expect(() => createFieldMigrationCutoverPin(f.sealed, f.execution, f.publication, { ...f.definition, revision })).toThrow();
  expect(() => createFieldMigrationCutoverPin(f.sealed, f.execution, { ...f.publication, revision: 2147483646 }, f.definition)).toThrow();
});
it("accepts only explicit revision/checksum confirmations without client tenant, target, stage or grant", () => {
  const f = ready(), request = { preparationId: uuid(3), reviewChecksum: f.sealed.checksum, definitionRevision: 8, publicationRevision: 0, executionRevision: 3 };
  expect(fieldMigrationCutoverRequestSchema.parse(request)).toEqual(request);
  for (const patch of [{ organisationId: "other" }, { targetVersionId: uuid(99) }, { stage: "cutover" }, { pin: create(f).pin },
    { canRollback: true }, { definitionRevision: 2147483646 }, { executionRevision: -1 }, { reviewChecksum: "invalid" }])
    expect(() => fieldMigrationCutoverRequestSchema.parse({ ...request, ...patch })).toThrow();
  const pin = create(f).pin;
  expect(() => fieldMigrationCutoverPinSchema.parse({ ...pin, rollbackPolicy: "always_lossless" })).toThrow();
  expect(() => fieldMigrationCutoverPinSchema.parse({ ...pin, authority: { capabilities: ["all"] } })).toThrow();
});
