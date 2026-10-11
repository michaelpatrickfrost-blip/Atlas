import { expect, it, vi } from "vitest";
vi.mock("@/core/db/client", () => ({ db: {} }));
import { checksum } from "@/core/studio/registry/contracts";
import { compileCustomField } from "@/core/studio/compiler/fields";
import { compileConditionalCustomField } from "@/core/studio/fields/conditional-compiler";
import { registeredRequiredFactMetadata } from "@/core/studio/fields/required-owner";
import { customFieldPayloadSchema } from "@/core/studio/fields/schema";
import { conditionalFieldPayloadSchema } from "@/core/studio/fields/required-contract";
import { sealRequiredFieldMigrationIntent, sealRequiredFieldMigrationReview } from "@/core/studio/fields/migrations/required-contracts";
import { reviewedRequiredFieldPublicationPin } from "@/core/studio/fields/migrations/publication-contract";
import { createRequiredFieldMigrationExecutionPin } from "@/core/studio/fields/migrations/execution-contract";
import { createFieldMigrationCutoverPin, createRequiredFieldMigrationCutoverPin } from "@/core/studio/fields/migrations/cutover-contract";
import { readFieldMigrationCutoverIdentity, readFieldMigrationCutoverReceipt,
  readRequiredFieldMigrationCutoverIdentity, readRequiredFieldMigrationCutoverReceipt } from "@/core/studio/fields/migrations/cutover-receipt";
import { createFieldMigrationSettlementPin, fieldMigrationSettlementTransition } from "@/core/studio/fields/migrations/settlement-contract";
import { readFieldMigrationSettlementReceipt, readRequiredFieldMigrationSettlementReceipt } from "@/core/studio/fields/migrations/settlement-receipt";
import { retainedCutoverFixture, cutoverUuid as uuid } from "./fixtures/studio-field-cutover";

// Pure integrity fixtures: genuine compiled metadata and sealed review2, plus
// synthetic READY progress/row projections. No SQL, actual conditional/native
// evaluation, permission, value, activation or settlement authority is implied.
async function ready(mode: "add" | "remove" = "add", count = 2) {
  const legacy = await retainedCutoverFixture(), { session, registry } = legacy;
  const ref = (id: string, version: number) => { const d = registry.describe(id, version); return { id, version, schemaHash: d.schemaHash, contractHash: d.contractHash }; };
  const condition = { match: "all", predicates: [{ source: { kind: "native", fieldId: "status" }, operator: "present" }] };
  const sourcePayload = mode === "remove" ? conditionalFieldPayloadSchema.parse({ ...legacy.intent.source.payload,
    schemaVersion: 2, entity: ref("tickets.ticket", 9), requiredIf: condition }) : legacy.intent.source.payload;
  const plainTarget = customFieldPayloadSchema.parse({ ...legacy.intent.target.payload, entity: ref("tickets.ticket", 9) });
  const targetPayload = mode === "add" ? conditionalFieldPayloadSchema.parse({ ...plainTarget, schemaVersion: 2, requiredIf: condition }) : plainTarget;
  const compile = async (payload: typeof sourcePayload | typeof targetPayload) => payload.schemaVersion === 1 ? compileCustomField(session, payload, registry)
    : compileConditionalCustomField({ session, registry, definitionId: legacy.intent.definitionId, resolveMetadata: async fact => fact.kind === "native"
      ? registeredRequiredFactMetadata(session, registry, payload.entity, fact.fieldId) : Promise.reject(new Error("Unexpected custom fact fixture")) }, payload);
  const source = await compile(sourcePayload), targetCompiled = await compile(targetPayload);
  const intent = sealRequiredFieldMigrationIntent({ ...legacy.intent, schemaVersion: 2, ownerQuery: ref("tickets.ticket.field_migration", 4),
    source: { ...legacy.intent.source, payload: source.payload, versionChecksum: source.checksum },
    target: { ...legacy.intent.target, payload: targetCompiled.payload, compiledChecksum: targetCompiled.checksum } }).intent;
  const stored = sealRequiredFieldMigrationReview({ ...intent, cohort: { recordCount: count, observationDigest: "e".repeat(64) },
    summary: { validCount: count, invalidCount: 0, lossyCount: 0 } });
  const target = { ...legacy.target, payload: targetCompiled.payload, compiledPlan: targetCompiled.plan, checksum: targetCompiled.checksum };
  const publicationIdentity = reviewedRequiredFieldPublicationPin(stored, target, session.userId, false);
  const pinned = createRequiredFieldMigrationExecutionPin(stored, target, publicationIdentity, registry.describe("tickets.ticket", 9), registry.describe("tickets.ticket.field_representation", 2));
  const execution = { preparationId: intent.id, organisationId: intent.organisationId, definitionId: intent.definitionId, entityId: intent.target.payload.entity.id,
    pin: pinned.pin, pinChecksum: pinned.checksum, state: "READY", revision: 2, cursor: count ? "ticket_z" : null, processedCount: count, failureCode: null };
  const publication = { ...publicationIdentity, state: "PUBLISHED", revision: 0 };
  const definition = { id: intent.definitionId, organisationId: intent.organisationId, kind: "customField", activeVersionId: intent.source.versionId,
    revision: intent.definitionRevision + 1, latestVersion: target.version, retiredAt: null };
  return { legacy, session, registry, stored, target, execution, publication, definition, compile };
}
type Ready = Awaited<ReturnType<typeof ready>>;
const create = (f: Ready) => createRequiredFieldMigrationCutoverPin(f.stored, f.execution, f.publication, f.definition);
function activated(f: Ready) {
  const retained = create(f);
  return { ...f, retained, publication: { ...f.publication, state: "CUTOVER", revision: f.publication.revision + 1 },
    definition: { ...f.definition, activeVersionId: f.target.id, revision: f.definition.revision + 1 },
    receipt: { preparationId: f.stored.review.id, organisationId: f.stored.review.organisationId, definitionId: f.stored.review.definitionId,
      sourceVersionId: f.stored.review.source.versionId, targetVersionId: f.target.id, pin: retained.pin, pinChecksum: retained.checksum,
      state: "ACTIVATED", revision: 0, createdBy: f.session.userId } };
}
type Activated = ReturnType<typeof activated>;
const read = (f: Activated) => readRequiredFieldMigrationCutoverReceipt(f.stored, f.execution, f.publication, f.definition, f.receipt);
function identities(f: Activated) {
  const { state: _publicationState, revision: _publicationRevision, ...publication } = f.publication;
  const { state: _receiptState, revision: _receiptRevision, ...receipt } = f.receipt;
  void [_publicationState, _publicationRevision, _receiptState, _receiptRevision];
  return { publication, receipt };
}
function settle(f: Activated, disposition: "ROLLED_BACK" | "FINALIZED") {
  const principal = { ...f.stored.review.principal, userId: "current-settler", membershipId: "current-member", authVersion: 11, sessionVersion: 12 };
  const settlement = createFieldMigrationSettlementPin(f.retained, principal, disposition), transition = fieldMigrationSettlementTransition(settlement.pin);
  return { ...f, settlement, publication: { ...f.publication, ...transition.publication },
    definition: { ...f.definition, activeVersionId: transition.definition.versionId, revision: transition.definition.revision },
    receipt: { ...f.receipt, ...transition.cutover, settlementPin: settlement.pin, settlementChecksum: settlement.checksum,
      settledBy: principal.userId, settledAt: "2026-10-11T12:00:00.000Z" } };
}
const openReceipt = (f: Activated) => ({ ...f.receipt, settlementPin: null, settlementChecksum: null, settledBy: null, settledAt: null });

it.each(["add", "remove"] as const)("retains review2 and receipt1 for %s requirements with genuine target metadata", async mode => {
  const f = await ready(mode), before = structuredClone({ stored: f.stored, execution: f.execution, publication: f.publication, definition: f.definition }), retained = create(f);
  expect(f.stored.review.schemaVersion).toBe(2); expect(f.target.payload.schemaVersion).toBe(mode === "add" ? 2 : 1);
  expect(retained.pin).toMatchObject({ schemaVersion: 1, publication: { reviewChecksum: f.stored.checksum, targetChecksum: f.target.checksum },
    execution: { checksum: f.execution.pinChecksum, revision: 2 }, source: { checksum: f.stored.review.source.versionChecksum },
    definitionRevision: 8, rollbackPolicy: "unchanged_reviewed_representation" });
  expect(retained.checksum).toBe(checksum(retained.pin));
  expect({ stored: f.stored, execution: f.execution, publication: f.publication, definition: f.definition }).toEqual(before);
  for (const key of ["capabilities", "canRollback", "values", "nativePatch", "reverseConversion"]) expect(retained.pin).not.toHaveProperty(key);
  const post = activated(f), id = identities(post);
  expect(read(post)).toEqual(retained);
  expect(readRequiredFieldMigrationCutoverIdentity(f.stored, f.execution, id.publication, id.receipt)).toEqual(retained);
});
it("keeps old and new entry points closed to the other review protocol and unknown/coerced formats", async () => {
  const f = await ready(), post = activated(f), id = identities(post), old = f.legacy;
  expect(old.retained.checksum).toMatchInlineSnapshot(`"d70e0f4d9a4680b0a4e371ecf4e8d723483386a8ede0a01468366569492db988"`);
  expect(createFieldMigrationCutoverPin(old.stored, old.execution, { ...old.publication, state: "PUBLISHED", revision: 0 },
    { ...old.definition, activeVersionId: old.source.id, revision: old.stored.review.definitionRevision + 1 })).toEqual(old.retained);
  expect(() => createFieldMigrationCutoverPin(f.stored, f.execution, f.publication, f.definition)).toThrow();
  expect(() => readFieldMigrationCutoverIdentity(f.stored, f.execution, id.publication, id.receipt)).toThrow();
  expect(() => readFieldMigrationCutoverReceipt(f.stored, f.execution, post.publication, post.definition, post.receipt)).toThrow();
  expect(() => readFieldMigrationSettlementReceipt(f.stored, f.execution, post.publication, openReceipt(post))).toThrow();
  expect(() => createRequiredFieldMigrationCutoverPin(old.stored, old.execution, f.publication, f.definition)).toThrow();
  expect(() => readRequiredFieldMigrationCutoverIdentity(old.stored, f.execution, id.publication, id.receipt)).toThrow();
  expect(() => readRequiredFieldMigrationCutoverReceipt(old.stored, f.execution, post.publication, post.definition, post.receipt)).toThrow();
  expect(() => readRequiredFieldMigrationSettlementReceipt(old.stored, f.execution, post.publication, openReceipt(post))).toThrow();
  for (const schemaVersion of [3, "2", null]) {
    const review = { ...f.stored.review, schemaVersion }, stored = { review, checksum: checksum(review) };
    expect(() => createRequiredFieldMigrationCutoverPin(stored, f.execution, f.publication, f.definition)).toThrow();
    expect(() => readRequiredFieldMigrationCutoverReceipt(stored, f.execution, post.publication, post.definition, post.receipt)).toThrow();
    expect(() => readRequiredFieldMigrationSettlementReceipt(stored, f.execution, post.publication, openReceipt(post))).toThrow();
  }
});
it("a re-sealed changed condition and rechecksummed execution cannot replace the originally pinned full review hash", async () => {
  const f = await ready("remove"), post = activated(f), source = conditionalFieldPayloadSchema.parse({ ...f.stored.review.source.payload,
    requiredIf: { match: "all", predicates: [{ source: { kind: "native", fieldId: "status" }, operator: "absent" }] } });
  const compiled = await f.compile(source), changed = sealRequiredFieldMigrationReview({ ...f.stored.review,
    source: { ...f.stored.review.source, payload: compiled.payload, versionChecksum: compiled.checksum } });
  const pin = { ...f.execution.pin, sourceChecksum: compiled.checksum }, execution = { ...f.execution, pin, pinChecksum: checksum(pin) };
  expect(changed.checksum).not.toBe(f.stored.checksum); expect(execution.pinChecksum).toBe(checksum(execution.pin));
  expect(() => createRequiredFieldMigrationCutoverPin(changed, execution, f.publication, f.definition)).toThrow("stale or has changed");
  expect(() => readRequiredFieldMigrationCutoverReceipt(changed, execution, post.publication, post.definition, post.receipt)).toThrow();
});
it("invalid required-null rows or unacknowledged loss block pre-cutover even with internally consistent summary pins", async () => {
  const f = await ready();
  // The summary stands for reviewed invalid FIELD_REQUIRED/null rows; this pure
  // helper cannot infer row requirements or prove that actual native conditions ran.
  for (const summary of [{ validCount: 1, invalidCount: 1, lossyCount: 0 }, { validCount: 2, invalidCount: 0, lossyCount: 1 }]) {
    const stored = sealRequiredFieldMigrationReview({ ...f.stored.review, summary });
    const publication = { ...f.publication, reviewChecksum: stored.checksum }, pin = { ...f.execution.pin, publication: { ...f.execution.pin.publication, reviewChecksum: stored.checksum } };
    expect(() => createRequiredFieldMigrationCutoverPin(stored, { ...f.execution, pin, pinChecksum: checksum(pin) }, publication, f.definition)).toThrow();
  }
});
it("requires complete READY progress and exact source-active CAS, including empty cohorts and reserved integer bounds", async () => {
  const f = await ready(), empty = await ready("add", 0); expect(create(empty).pin.definitionRevision).toBe(8);
  for (const patch of [{ state: "RUNNING" }, { state: "FAILED", failureCode: "WRITE_FAILED" }, { state: "CANCELLED" },
    { processedCount: 1 }, { processedCount: 3 }, { cursor: null }, { revision: 0 }, { failureCode: "WRITE_FAILED" }, { processedCount: "2" }])
    expect(() => createRequiredFieldMigrationCutoverPin(f.stored, { ...f.execution, ...patch }, f.publication, f.definition)).toThrow();
  for (const patch of [{ activeVersionId: f.target.id }, { revision: 9 }, { latestVersion: 3 }, { retiredAt: new Date() },
    { kind: "capabilitySet" }, { revision: "8" }, { revision: 2147483646 }, { bypass: true }])
    expect(() => createRequiredFieldMigrationCutoverPin(f.stored, f.execution, f.publication, { ...f.definition, ...patch })).toThrow();
  const stored = sealRequiredFieldMigrationReview({ ...f.stored.review, definitionRevision: 2147483644 });
  const publication = { ...f.publication, revision: 2147483645, reviewChecksum: stored.checksum };
  const pin = { ...f.execution.pin, publication: { ...f.execution.pin.publication, reviewChecksum: stored.checksum } };
  const retained = createRequiredFieldMigrationCutoverPin(stored, { ...f.execution, pin, pinChecksum: checksum(pin) }, publication,
    { ...f.definition, revision: 2147483645 });
  expect(fieldMigrationSettlementTransition(createFieldMigrationSettlementPin(retained, { ...f.stored.review.principal }, "ROLLED_BACK").pin))
    .toMatchObject({ definition: { revision: 2147483647 }, publication: { revision: 2147483647 } });
});
it("rejects substituted tenant/native/cohort/source/generation identities even with recomputed receipt hashes", async () => {
  const f = await ready();
  for (const patch of [{ organisationId: "other" }, { preparationId: uuid(99) }, { definitionId: uuid(99) }, { entityId: "finance.invoice" }, { pinChecksum: "a".repeat(64) }])
    expect(() => createRequiredFieldMigrationCutoverPin(f.stored, { ...f.execution, ...patch }, f.publication, f.definition)).toThrow();
  for (const patch of [{ sourceVersionId: uuid(99) }, { sourceChecksum: "a".repeat(64) }, { entity: { ...f.execution.pin.entity, version: 8 } },
    { cohort: { ...f.execution.pin.cohort, observationDigest: "a".repeat(64) } }]) {
    const pin = { ...f.execution.pin, ...patch };
    expect(() => createRequiredFieldMigrationCutoverPin(f.stored, { ...f.execution, pin, pinChecksum: checksum(pin) }, f.publication, f.definition)).toThrow();
  }
  for (const patch of [{ sourceGenerationId: uuid(99) }, { targetGenerationId: uuid(99) }, { publisherUserId: "other" }, { reviewChecksum: "a".repeat(64) },
    { targetVersionId: f.stored.review.source.versionId }, { targetVersionNumber: 3 }, { state: "CANCELLED" }, { organisationId: "other" }])
    expect(() => createRequiredFieldMigrationCutoverPin(f.stored, f.execution, { ...f.publication, ...patch }, f.definition)).toThrow();
});
it("post-cutover strict receipt requires actual target-active +2 while immutable identity remains historical", async () => {
  const f = await ready(), post = activated(f), id = identities(post);
  expect(() => create(post)).toThrow();
  expect(() => readRequiredFieldMigrationCutoverReceipt(f.stored, f.execution, f.publication, f.definition, post.receipt)).toThrow();
  for (const patch of [{ activeVersionId: f.stored.review.source.versionId }, { revision: 8 }, { revision: 10 }, { latestVersion: 3 }, { organisationId: "other" }])
    expect(() => readRequiredFieldMigrationCutoverReceipt(f.stored, f.execution, post.publication, { ...post.definition, ...patch }, post.receipt)).toThrow();
  for (const patch of [{ state: "PUBLISHED" }, { state: "COMPLETED" }, { revision: 0 }, { revision: 2 }])
    expect(() => readRequiredFieldMigrationCutoverReceipt(f.stored, f.execution, { ...post.publication, ...patch }, post.definition, post.receipt)).toThrow();
  for (const patch of [{ createdBy: "other" }, { state: "FINALIZED" }, { revision: 1 }, { targetVersionId: uuid(99) }, { organisationId: "other" }, { canRollback: true }])
    expect(() => readRequiredFieldMigrationCutoverReceipt(f.stored, f.execution, post.publication, post.definition, { ...post.receipt, ...patch })).toThrow();
  const pin = { ...post.receipt.pin, definitionRevision: 9 };
  expect(() => readRequiredFieldMigrationCutoverIdentity(f.stored, f.execution, id.publication, { ...id.receipt, pin, pinChecksum: checksum(pin) })).toThrow();
});
it.each(["ROLLED_BACK", "FINALIZED"] as const)("retains conditional %s history with a different settler and no today's-pointer inference", async disposition => {
  const f = activated(await ready("remove")), completed = settle(f, disposition);
  const readTerminal = () => readRequiredFieldMigrationSettlementReceipt(completed.stored, completed.execution, completed.publication, completed.receipt);
  expect(readTerminal()).toEqual({ retained: f.retained, settlement: completed.settlement, state: disposition });
  expect(completed.receipt.createdBy).toBe("actor"); expect(completed.receipt.settledBy).toBe("current-settler");
  completed.definition.activeVersionId = uuid(99); completed.definition.revision += 20; completed.definition.latestVersion += 3;
  expect(readTerminal().settlement).toEqual(completed.settlement); expect(readTerminal()).not.toHaveProperty("canRollback");
  expect(() => readRequiredFieldMigrationCutoverReceipt(completed.stored, completed.execution, completed.publication, completed.definition, completed.receipt)).toThrow();
  for (const patch of [{ settledBy: "actor" }, { settledAt: null }, { settlementChecksum: "a".repeat(64) }, { revision: 0 }, { state: "ACTIVATED" }])
    expect(() => readRequiredFieldMigrationSettlementReceipt(completed.stored, completed.execution, completed.publication, { ...completed.receipt, ...patch })).toThrow();
  const forged = { ...completed.settlement.pin, principal: { ...completed.settlement.pin.principal, organisationId: "other" } };
  expect(() => readRequiredFieldMigrationSettlementReceipt(completed.stored, completed.execution, completed.publication,
    { ...completed.receipt, settlementPin: forged, settlementChecksum: checksum(forged) })).toThrow();
  expect(() => readRequiredFieldMigrationSettlementReceipt(completed.stored, completed.execution,
    { ...completed.publication, state: disposition === "ROLLED_BACK" ? "COMPLETED" : "ROLLED_BACK" }, completed.receipt)).toThrow();
});
it("conditional open settlement has exact ACT/CUTOVER pairing and no carried settlement metadata", async () => {
  const f = activated(await ready()), receipt = openReceipt(f);
  expect(readRequiredFieldMigrationSettlementReceipt(f.stored, f.execution, f.publication, receipt)).toEqual({ retained: f.retained, settlement: null, state: "ACTIVATED" });
  for (const patch of [{ settledBy: "actor" }, { settledAt: "2026-10-11T12:00:00.000Z" }, { settlementPin: {} }, { revision: 1 }, { canActivate: true }])
    expect(() => readRequiredFieldMigrationSettlementReceipt(f.stored, f.execution, f.publication, { ...receipt, ...patch })).toThrow();
  for (const patch of [{ state: "COMPLETED" }, { revision: 2 }])
    expect(() => readRequiredFieldMigrationSettlementReceipt(f.stored, f.execution, { ...f.publication, ...patch }, receipt)).toThrow();
});
