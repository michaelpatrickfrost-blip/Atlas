import { expect, it } from "vitest";
import { checksum } from "@/core/studio/registry/contracts";
import { customFieldPayloadSchema } from "@/core/studio/fields/schema";
import { sealFieldMigrationReview } from "@/core/studio/fields/migrations/contracts";
import { fieldMigrationExecutionPinSchema } from "@/core/studio/fields/migrations/execution-contract";
import { createFieldMigrationCutoverPin, fieldMigrationCutoverPinSchema, fieldMigrationCutoverRequestSchema } from "@/core/studio/fields/migrations/cutover-contract";
import { readFieldMigrationCutoverReceipt } from "@/core/studio/fields/migrations/cutover-receipt";
import { assertFieldMigrationSettlementConfirmation, createFieldMigrationSettlementPin, fieldMigrationSettlementPinSchema,
  fieldMigrationSettlementRequestSchema, fieldMigrationSettlementTransition, readFieldMigrationSettlementPin } from "@/core/studio/fields/migrations/settlement-contract";

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

function activated() {
  const f = ready(), pinned = create(f);
  return { ...f, publication: { ...f.publication, state: "CUTOVER", revision: 1 },
    definition: { ...f.definition, activeVersionId: f.publication.targetVersionId, revision: 9 },
    receipt: { preparationId: f.publication.preparationId, organisationId: f.publication.organisationId, definitionId: f.publication.definitionId,
      sourceVersionId: f.execution.pin.sourceVersionId, targetVersionId: f.publication.targetVersionId,
      pin: pinned.pin, pinChecksum: pinned.checksum, state: "ACTIVATED", revision: 0, createdBy: "actor" } };
}
const read = (f: ReturnType<typeof activated>) => readFieldMigrationCutoverReceipt(f.sealed, f.execution, f.publication, f.definition, f.receipt);
it("reads actual post-cutover identity without pretending the source is still active or granting rollback", () => {
  const f = activated(), before = structuredClone(f);
  expect(read(f)).toEqual({ pin: f.receipt.pin, checksum: f.receipt.pinChecksum }); expect(f).toEqual(before);
  expect(() => createFieldMigrationCutoverPin(f.sealed, f.execution, f.publication, f.definition)).toThrow();
  expect(read(f)).not.toHaveProperty("canRollback");
});
it("post-cutover identity rejects forged/foreign/history-mutated receipts even with recomputed hashes", () => {
  const f = activated();
  for (const patch of [{ organisationId: "other" }, { definitionId: uuid(99) }, { preparationId: uuid(99) }, { createdBy: "other" },
    { sourceVersionId: uuid(99) }, { targetVersionId: uuid(99) }, { pinChecksum: "f".repeat(64) }, { state: "ROLLED_BACK" }, { revision: 1 }, { capabilities: ["all"] }])
    expect(() => readFieldMigrationCutoverReceipt(f.sealed, f.execution, f.publication, f.definition, { ...f.receipt, ...patch })).toThrow();
  for (const patch of [{ definitionRevision: 9 }, { source: { ...f.receipt.pin.source, checksum: "f".repeat(64) } },
    { execution: { ...f.receipt.pin.execution, revision: 4 } }, { publication: { ...f.receipt.pin.publication, revision: 1 } }]) {
    const pin = { ...f.receipt.pin, ...patch };
    expect(() => readFieldMigrationCutoverReceipt(f.sealed, f.execution, f.publication, f.definition, { ...f.receipt, pin, pinChecksum: checksum(pin) })).toThrow();
  }
});
it("post-cutover receipt requires actual exact target/CAS and READY identity, not source-active or cancelled state", () => {
  const f = activated();
  for (const patch of [{ activeVersionId: f.receipt.sourceVersionId }, { revision: 10 }, { latestVersion: 3 }, { retiredAt: new Date() }, { organisationId: "other" }])
    expect(() => readFieldMigrationCutoverReceipt(f.sealed, f.execution, f.publication, { ...f.definition, ...patch }, f.receipt)).toThrow();
  for (const patch of [{ state: "PUBLISHED" }, { state: "CANCELLED" }, { revision: 0 }, { targetChecksum: "f".repeat(64) }, { acknowledgedLoss: true }])
    expect(() => readFieldMigrationCutoverReceipt(f.sealed, f.execution, { ...f.publication, ...patch }, f.definition, f.receipt)).toThrow();
  for (const patch of [{ state: "RUNNING" }, { state: "FAILED" }, { revision: 4 }, { processedCount: 1 }, { pinChecksum: "f".repeat(64) }])
    expect(() => readFieldMigrationCutoverReceipt(f.sealed, { ...f.execution, ...patch }, f.publication, f.definition, f.receipt)).toThrow();
});
it("post-cutover identity still binds sealed reviewed source/target/cohort and current explicit loss acknowledgement", () => {
  const f = activated();
  expect(() => read({ ...f, sealed: { ...f.sealed, checksum: "f".repeat(64) } })).toThrow();
  for (const patch of [{ sourceVersionId: uuid(99) }, { sourceChecksum: "f".repeat(64) }, { entity: { ...ref, version: 6 } },
    { cohort: { ...f.execution.pin.cohort, observationDigest: "f".repeat(64) } }]) {
    const pin = { ...f.execution.pin, ...patch }, pinChecksum = checksum(pin);
    const receiptPin = { ...f.receipt.pin, execution: { ...f.receipt.pin.execution, checksum: pinChecksum } };
    expect(() => readFieldMigrationCutoverReceipt(f.sealed, { ...f.execution, pin, pinChecksum }, f.publication, f.definition,
      { ...f.receipt, pin: receiptPin, pinChecksum: checksum(receiptPin) })).toThrow();
  }
});

const settlementActor = { organisationId: "company", userId: "current-publisher", membershipId: "current-member", sessionVersion: 4, authVersion: 5, authority: "customer" as const };
const settlementRequest = (pin: ReturnType<typeof createFieldMigrationSettlementPin>["pin"]) => ({ preparationId: pin.preparationId, cutoverChecksum: pin.cutoverChecksum,
  cutoverRevision: 0, definitionRevision: pin.definitionRevision, publicationRevision: pin.publicationRevision });
it("derives honest rollback or finalization from retained cutover identity without mutating history or granting access", () => {
  const retained = create(ready()), before = structuredClone(retained);
  for (const disposition of ["ROLLED_BACK", "FINALIZED"] as const) {
    const result = createFieldMigrationSettlementPin(retained, settlementActor, disposition);
    expect(readFieldMigrationSettlementPin(retained, result)).toEqual(result);
    expect(result.checksum).toBe(checksum(result.pin));
    expect(() => assertFieldMigrationSettlementConfirmation(settlementRequest(result.pin), result)).not.toThrow();
    expect(fieldMigrationSettlementTransition(result.pin)).toEqual({ cutover: { state: disposition, revision: 1 },
      publication: { state: disposition === "ROLLED_BACK" ? "ROLLED_BACK" : "COMPLETED", revision: 2 },
      definition: { versionId: disposition === "ROLLED_BACK" ? uuid(5) : uuid(8), revision: disposition === "ROLLED_BACK" ? 10 : 9 } });
    for (const forbidden of ["capabilities", "values", "canRollback", "active", "reverseConversion", "ready", "nativePatch"]) expect(result.pin).not.toHaveProperty(forbidden);
  }
  expect(retained).toEqual(before);
});
it("permits independent same-company identity while rejecting foreign scope, carried grants and fake support identity", () => {
  const retained = create(ready());
  expect(createFieldMigrationSettlementPin(retained, settlementActor, "ROLLED_BACK").pin.principal.userId).not.toBe(retained.pin.publication.publisherUserId);
  const support = { ...settlementActor, authority: "staff_support", auditId: "server-support-audit" };
  expect(createFieldMigrationSettlementPin(retained, support, "FINALIZED").pin.principal).toEqual(support);
  for (const principal of [{ ...settlementActor, organisationId: "foreign" }, { ...settlementActor, capabilities: ["*"] },
    { ...settlementActor, authority: "staff_support" }, { ...support, bypass: true }])
    expect(() => createFieldMigrationSettlementPin(retained, principal, "ROLLED_BACK")).toThrow();
});
it("rejects stale confirmation, foreign identity and client mode/tenant/target/grants instead of choosing a settlement", () => {
  const result = createFieldMigrationSettlementPin(create(ready()), settlementActor, "ROLLED_BACK"), request = settlementRequest(result.pin);
  for (const patch of [{ preparationId: uuid(99) }, { cutoverChecksum: "f".repeat(64) }, { definitionRevision: 8 }, { publicationRevision: 0 },
    { cutoverRevision: 1 }, { disposition: "FINALIZED" }, { organisationId: "company" }, { targetVersionId: uuid(8) }, { capabilities: [] },
    { stage: "rollback" }, { definitionRevision: "9" }]) expect(() => assertFieldMigrationSettlementConfirmation({ ...request, ...patch }, result)).toThrow();
  expect(fieldMigrationSettlementRequestSchema.safeParse({ ...request, nativePatch: {} }).success).toBe(false);
});
it("binds historical settlement to original source, target, scope and CAS even when substituted settlement data is rechecksummed", () => {
  const retained = create(ready()), result = createFieldMigrationSettlementPin(retained, settlementActor, "ROLLED_BACK");
  for (const patch of [{ sourceVersionId: uuid(99) }, { targetVersionId: uuid(99) }, { organisationId: "foreign" }, { definitionId: uuid(99) },
    { preparationId: uuid(99) }, { cutoverChecksum: "f".repeat(64) }, { definitionRevision: 10 }, { publicationRevision: 2 }]) {
    const pin = { ...result.pin, ...patch };
    expect(() => readFieldMigrationSettlementPin(retained, { pin, checksum: checksum(pin) })).toThrow();
  }
  expect(() => readFieldMigrationSettlementPin(retained, { ...result, checksum: "f".repeat(64) })).toThrow();
  expect(() => createFieldMigrationSettlementPin({ ...retained, checksum: "f".repeat(64) }, settlementActor, "FINALIZED")).toThrow();
});
it("retains a closed protocol with no defaults/coercions or internally impossible same-generation reversal", () => {
  const retained = create(ready()), result = createFieldMigrationSettlementPin(retained, settlementActor, "FINALIZED");
  for (const input of [{ ...retained, ignored: true }, { pin: { ...retained.pin, capabilities: [] }, checksum: retained.checksum }])
    expect(() => createFieldMigrationSettlementPin(input, settlementActor, "FINALIZED")).toThrow();
  for (const pin of [{ ...retained.pin, source: { ...retained.pin.source, versionId: retained.pin.publication.targetVersionId } },
    { ...retained.pin, publication: { ...retained.pin.publication, sourceGenerationId: retained.pin.publication.targetGenerationId } }])
    expect(() => createFieldMigrationSettlementPin({ pin, checksum: checksum(pin) }, settlementActor, "ROLLED_BACK")).toThrow();
  for (const patch of [{ disposition: "REVERSE_CONVERSION" }, { schemaVersion: "1" }, { canRollback: true }, { nativePatch: {} }])
    expect(fieldMigrationSettlementPinSchema.safeParse({ ...result.pin, ...patch }).success).toBe(false);
  expect(() => readFieldMigrationSettlementPin(retained, { ...result, verified: true })).toThrow();
});
it("uses the reserved final revision for rollback and refuses overflow, fractions and coerced counters", () => {
  const f = ready(), sealed = sealFieldMigrationReview({ ...f.sealed.review, definitionRevision: 2147483644 });
  const publication = { ...f.publication, revision: 2147483645, reviewChecksum: sealed.checksum };
  const pin = { ...f.execution.pin, publication: { ...f.execution.pin.publication, reviewChecksum: sealed.checksum } };
  const retained = createFieldMigrationCutoverPin(sealed, { ...f.execution, pin, pinChecksum: checksum(pin) }, publication, { ...f.definition, revision: 2147483645 });
  const result = createFieldMigrationSettlementPin(retained, settlementActor, "ROLLED_BACK");
  expect(fieldMigrationSettlementTransition(result.pin)).toMatchObject({ definition: { revision: 2147483647 }, publication: { revision: 2147483647 } });
  for (const revision of [2147483647, Number.MAX_SAFE_INTEGER, -1, 1.5, "9"])
    expect(() => fieldMigrationSettlementTransition({ ...result.pin, definitionRevision: revision })).toThrow();
});
