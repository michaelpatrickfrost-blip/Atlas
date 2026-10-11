import { beforeEach, expect, it, vi } from "vitest";
import type { Prisma } from "@/generated/prisma/client";
import { retainedCutoverFixture, cutoverUuid as uuid } from "./fixtures/studio-field-cutover";
import { checksum } from "@/core/studio/registry/contracts";
import { conditionalFieldPayloadSchema, type VersionedFieldPayload } from "@/core/studio/fields/required-contract";
import { sealRequiredFieldMigrationIntent, sealRequiredFieldMigrationReview } from "@/core/studio/fields/migrations/required-contracts";
import { reviewedRequiredFieldPublicationPin } from "@/core/studio/fields/migrations/publication-contract";
import { createRequiredFieldMigrationExecutionPin } from "@/core/studio/fields/migrations/execution-contract";
import { createRequiredFieldMigrationCutoverPin } from "@/core/studio/fields/migrations/cutover-contract";
import { createFieldMigrationSettlementPin, fieldMigrationSettlementTransition } from "@/core/studio/fields/migrations/settlement-contract";
import { inspectRequiredFieldMigrationCutoverIdentity, inspectFieldMigrationCutoverIdentity } from "@/core/studio/fields/migrations/cutover-inspection";
import { inspectRequiredFieldMigrationSettlementIdentity, inspectFieldMigrationSettlementIdentity, inspectFieldMigrationSettlementWindow } from "@/core/studio/fields/migrations/settlement-inspection";

async function fixture(sourceConditional = false, targetConditional = true) {
  const base = await retainedCutoverFixture();
  const ref = (id: string, version: number) => { const m = base.registry.describe(id, version); return { id, version, schemaHash: m.schemaHash, contractHash: m.contractHash }; };
  const conditional = (payload: typeof base.source.payload) => conditionalFieldPayloadSchema.parse({ ...payload, schemaVersion: 2,
    entity: ref("tickets.ticket", 9), requiredIf: { match: "all", predicates: [{ source: { kind: "native", fieldId: "status" }, operator: "present" }] } });
  const sourcePayload: VersionedFieldPayload = sourceConditional ? conditional(base.source.payload) : base.source.payload;
  const targetPayload: VersionedFieldPayload = targetConditional ? conditional(base.target.payload) : { ...base.target.payload, entity: ref("tickets.ticket", 9) };
  // Deliberately synthetic compiled plans and reviewed cohort. Real closed2 seals,
  // current Tickets owner contracts and unchanged receipt1 parsers exercise the
  // actual metadata orchestration. These mocks do not prove SQL implementation,
  // conditional evaluation, current permissions, runtime coverage or activation.
  const sourcePlan = { kind: "customField", schemaVersion: sourcePayload.schemaVersion, payload: sourcePayload };
  const targetPlan = { kind: "customField", schemaVersion: targetPayload.schemaVersion, payload: targetPayload };
  const sealed = sealRequiredFieldMigrationIntent({ ...base.intent, schemaVersion: 2, ownerQuery: ref("tickets.ticket.field_migration", 4),
    source: { ...base.intent.source, payload: sourcePayload, versionChecksum: checksum(sourcePlan) },
    target: { ...base.intent.target, payload: targetPayload, compiledChecksum: checksum(targetPlan) } });
  const stored = sealRequiredFieldMigrationReview({ ...sealed.intent, cohort: base.stored.review.cohort, summary: base.stored.review.summary });
  const source = { ...base.source, schemaVersion: sourcePayload.schemaVersion, createdBy: "historical-author", payload: sourcePayload, compiledPlan: sourcePlan, checksum: sealed.intent.source.versionChecksum };
  const target = { ...base.target, schemaVersion: targetPayload.schemaVersion, createdBy: "actor", payload: targetPayload, compiledPlan: targetPlan, checksum: sealed.intent.target.compiledChecksum };
  const projection = { id: target.id, organisationId: target.organisationId, definitionId: target.definitionId, version: target.version, checksum: target.checksum, payload: target.payload, compiledPlan: target.compiledPlan };
  const publication = { ...reviewedRequiredFieldPublicationPin(stored, projection, "actor", false), state: "PUBLISHED", revision: 0 };
  const identity = Object.fromEntries(Object.entries(publication).filter(([key]) => key !== "state" && key !== "revision"));
  const pinned = createRequiredFieldMigrationExecutionPin(stored, projection, identity,
    base.registry.describe("tickets.ticket", 9), base.registry.describe("tickets.ticket.field_representation", 2));
  const execution = { ...base.execution, cursor: base.execution.cursor as string | null, pin: pinned.pin, pinChecksum: pinned.checksum };
  const retained = createRequiredFieldMigrationCutoverPin(stored, execution, publication, { ...base.definition, activeVersionId: source.id, revision: sealed.intent.definitionRevision + 1 });
  return { intent: sealed.intent, stored, retained, source, target, execution,
    preparation: { ...base.preparation, intent: sealed.intent, intentChecksum: sealed.checksum, review: { ...base.preparation.review, ...stored } },
    publication: { ...publication, state: "CUTOVER", revision: 1 }, definition: base.definition,
    draft: { ...base.draft, payload: targetPayload }, receipt: { ...base.receipt, pin: retained.pin, pinChecksum: retained.checksum } };
}
let f: Awaited<ReturnType<typeof fixture>>, fresh: boolean;
const m = { raw: vi.fn(), preparation: vi.fn(), publication: vi.fn(), execution: vi.fn(), receipt: vi.fn(), definition: vi.fn(), draft: vi.fn(), version: vi.fn() };
const tx = { $queryRaw: m.raw, studioFieldMigrationPreparation: { findFirst: m.preparation }, studioFieldMigrationPublication: { findFirst: m.publication },
  studioFieldMigrationExecution: { findFirst: m.execution }, studioFieldMigrationCutover: { findFirst: m.receipt }, studioDefinition: { findFirst: m.definition },
  studioDraft: { findFirst: m.draft }, studioDefinitionVersion: { findFirst: m.version } } as unknown as Prisma.TransactionClient;
const cutover = () => inspectRequiredFieldMigrationCutoverIdentity(tx, f.intent);
const settlement = () => inspectRequiredFieldMigrationSettlementIdentity(tx, f.intent);
beforeEach(async () => {
  vi.resetAllMocks(); f = await fixture(); fresh = true;
  m.raw.mockImplementation(async (strings: TemplateStringsArray) => strings.join("?").includes("AS fresh") ? [{ fresh }] : []);
  for (const key of ["preparation", "publication", "execution", "definition", "draft"] as const) m[key].mockImplementation(async () => structuredClone(f[key]));
  m.receipt.mockImplementation(async ({ select }: { select: Record<string, boolean> }) => Object.fromEntries(Object.keys(select).map(key => [key, structuredClone(f.receipt[key as keyof typeof f.receipt])])));
  m.version.mockImplementation(async ({ where }: { where: { id: string } }) => structuredClone(where.id === f.source.id ? f.source : f.target));
});
it.each([[false, true], [true, false], [true, true]])("checks actual closed2 identity with source conditional=%s, target conditional=%s", async (source, target) => {
  f = await fixture(source, target); const result = await cutover();
  expect(result.pin).toEqual(f.retained.pin); expect(result.intent.schemaVersion).toBe(2); expect(result.pin.schemaVersion).toBe(1);
  expect(result.source.schemaVersion).toBe(source ? 2 : 1); expect(result.target.schemaVersion).toBe(target ? 2 : 1);
  expect(result.definition.activeVersionId).toBe(f.target.id); expect(result.definition.revision).toBe(f.intent.definitionRevision + 2);
  const sql = m.raw.mock.calls.at(-1)?.[0].join("?");
  expect(sql).toContain("atlas_studio_execution_source_fresh(pub) AND atlas_studio_execution_targets_fresh(pub)"); expect(sql).toContain("pub.state='CUTOVER'");
  for (const [strings, ...values] of m.raw.mock.calls) { expect(values).toContain("company"); expect(strings.join("?")).not.toMatch(/atlas_studio_(execution|publication|migration)_fresh\(/); }
  for (const call of [m.publication, m.execution, m.receipt]) expect(call.mock.calls[0][0].where).toEqual({ preparationId: f.intent.id, organisationId: "company", definitionId: f.intent.definitionId });
  expect(m.version.mock.calls.every(([arg]) => arg.where.organisationId === "company" && arg.where.definitionId === f.intent.definitionId)).toBe(true);
  expect(Object.keys(tx)).not.toContain("serviceWorkItem");
});
it("keeps both legacy entry points closed1 and rejects old intent at required entries before metadata reads", async () => {
  const legacy = await retainedCutoverFixture();
  await expect(inspectFieldMigrationCutoverIdentity(tx, f.intent as unknown as typeof legacy.intent)).rejects.toThrow();
  await expect(inspectFieldMigrationSettlementIdentity(tx, f.intent as unknown as typeof legacy.intent)).rejects.toThrow();
  await expect(inspectRequiredFieldMigrationCutoverIdentity(tx, legacy.intent as unknown as typeof f.intent)).rejects.toThrow();
  await expect(inspectRequiredFieldMigrationSettlementIdentity(tx, legacy.intent as unknown as typeof f.intent)).rejects.toThrow();
  expect(m.raw).not.toHaveBeenCalled(); expect(m.preparation).not.toHaveBeenCalled();
});
it("rejects changed/foreign preparation and full reviewed2 mirrors without protocol fallback", async () => {
  const original = structuredClone(f.preparation), legacy = await retainedCutoverFixture();
  for (const patch of [{ id: uuid(99) }, { organisationId: "foreign" }, { definitionId: uuid(99) }, { state: "CANCELLED" },
    { intentChecksum: "a".repeat(64) }, { intent: legacy.intent, intentChecksum: checksum(legacy.intent) },
    { review: { ...original.review, id: uuid(99) } }, { review: { ...original.review, organisationId: "foreign" } },
    { review: { ...original.review, definitionId: uuid(99) } }, { review: { ...original.review, checksum: "a".repeat(64) } },
    { review: { ...original.review, ...legacy.stored } }]) {
    m.preparation.mockResolvedValueOnce({ ...original, ...patch }); await expect(cutover()).rejects.toThrow();
    m.preparation.mockResolvedValueOnce({ ...original, ...patch }); await expect(settlement()).rejects.toThrow();
  }
  const changedReview = sealRequiredFieldMigrationReview({ ...f.stored.review, principal: { ...f.intent.principal, userId: "replacement" } });
  m.preparation.mockResolvedValueOnce({ ...original, review: { ...original.review, ...changedReview } }); await expect(settlement()).rejects.toThrow();
  expect(m.publication).not.toHaveBeenCalled(); expect(m.version).not.toHaveBeenCalled();
});
it("requires genuine ACTIVATED/CUTOVER/READY, original hashes, target pointer+2 and frozen draft+1", async () => {
  for (const change of [() => { f.receipt.state = "FINALIZED"; }, () => { f.receipt.revision++; }, () => { f.receipt.createdBy = "other"; },
    () => { f.receipt.pinChecksum = "a".repeat(64); }, () => { f.receipt.organisationId = "foreign"; }, () => { f.publication.state = "PUBLISHED"; },
    () => { f.publication.revision++; }, () => { f.publication.reviewChecksum = "a".repeat(64); }, () => { f.publication.publisherUserId = "other"; },
    () => { f.execution.state = "RUNNING"; }, () => { f.execution.revision++; }, () => { f.execution.processedCount--; },
    () => { f.execution.pinChecksum = "a".repeat(64); }, () => { f.definition.activeVersionId = f.source.id; }, () => { f.definition.revision--; },
    () => { f.definition.retiredAt = new Date(); }, () => { f.draft.revision++; }, () => { f.draft.baseVersionId = f.source.id; },
    () => { f.draft.payload = f.source.payload; }]) { f = await fixture(); change(); await expect(cutover()).rejects.toThrow(); }
  f = await fixture(); fresh = false; await expect(cutover()).rejects.toThrow("stale or has changed");
  m.receipt.mockResolvedValueOnce(null); await expect(cutover()).rejects.toThrow();
});
it("checks immutable source/target schema, hash, payload, tenant, ID, version and actual publisher in both identities", async () => {
  for (const key of ["source", "target"] as const) {
    for (const patch of [{ id: uuid(99) }, { organisationId: "foreign" }, { definitionId: uuid(99) }, { schemaVersion: 3 },
      { checksum: "a".repeat(64) }, { compiledPlan: {} }, { payload: {} }, ...(key === "target" ? [{ version: 99 }, { createdBy: "other" }] : [])]) {
      f = await fixture(); Object.assign(f[key], patch); await expect(cutover()).rejects.toThrow(); await expect(settlement()).rejects.toThrow();
    }
  }
});
it.each(["ROLLED_BACK", "FINALIZED"] as const)("retains original closed2 %s history after later legitimate configuration/native/value changes", async disposition => {
  const packet = createFieldMigrationSettlementPin(f.retained, { ...f.intent.principal, userId: "current-actor", membershipId: "current-member" }, disposition);
  const transition = fieldMigrationSettlementTransition(packet.pin);
  Object.assign(f.receipt, { state: disposition, revision: 1, settlementPin: packet.pin, settlementChecksum: packet.checksum,
    settledBy: packet.pin.principal.userId, settledAt: new Date("2026-10-11T10:00:00.000Z") });
  Object.assign(f.publication, transition.publication);
  Object.assign(f.definition, { activeVersionId: uuid(99), revision: 99, latestVersion: 99, retiredAt: new Date() }); f.draft.revision = 99; fresh = false;
  const result = await settlement(); expect(result.settlement).toEqual(packet); expect(result.intent.principal).toEqual(f.intent.principal);
  expect(result.stored.review.schemaVersion).toBe(2); expect(m.draft).not.toHaveBeenCalled();
  expect(m.raw.mock.calls.every(([strings]) => !strings.join("?").includes("AS fresh"))).toBe(true);
  await expect(inspectFieldMigrationSettlementWindow(tx, result, "FINALIZED")).rejects.toThrow();
  const original = structuredClone(f.receipt);
  for (const patch of [{ settlementChecksum: "a".repeat(64) }, { settledBy: "other" }, { settledAt: null }, { revision: 0 }]) {
    Object.assign(f.receipt, original, patch); await expect(settlement()).rejects.toThrow();
  }
});
it("keeps still-open pointer/draft checks and rollback-only source AND target freshness for required settlement", async () => {
  const result = await settlement(); fresh = false;
  await expect(inspectFieldMigrationSettlementWindow(tx, result, "ROLLED_BACK")).rejects.toThrow(); m.raw.mockClear();
  expect(await inspectFieldMigrationSettlementWindow(tx, result, "FINALIZED")).toBe(result); expect(m.raw).not.toHaveBeenCalled();
  for (const change of [() => { f.definition.activeVersionId = f.source.id; }, () => { f.definition.revision++; }, () => { f.definition.retiredAt = new Date(); },
    () => { f.draft.revision++; }, () => { f.draft.baseVersionId = f.source.id; }, () => { f.draft.payload = f.source.payload; }]) {
    f = await fixture(); change(); const inspected = await settlement();
    await expect(inspectFieldMigrationSettlementWindow(tx, inspected, "FINALIZED")).rejects.toThrow();
  }
});

it("denies absent/ambiguous freshness and altered retained row pairing without a current-stage substitute", async () => {
  for (const rows of [[], [{ fresh: false }], [{ fresh: true }, { fresh: true }]]) {
    m.raw.mockImplementationOnce(async () => []).mockImplementationOnce(async () => []).mockImplementationOnce(async () => [])
      .mockImplementationOnce(async () => []).mockImplementationOnce(async () => []).mockResolvedValueOnce(rows);
    await expect(cutover()).rejects.toThrow();
  }
  for (const change of [() => { f.receipt.state = "FINALIZED"; }, () => { f.receipt.revision++; }, () => { f.receipt.createdBy = "other"; },
    () => { f.receipt.sourceVersionId = uuid(99); }, () => { f.receipt.targetVersionId = uuid(99); },
    () => { f.receipt.organisationId = "foreign"; }, () => { f.publication.state = "COMPLETED"; }, () => { f.publication.revision++; },
    () => { f.publication.reviewChecksum = "a".repeat(64); }, () => { f.execution.state = "FAILED"; }, () => { f.execution.revision++; },
    () => { f.execution.cursor = null; }, () => { f.execution.processedCount--; }, () => { f.definition.organisationId = "foreign"; }]) {
    f = await fixture(); change(); await expect(settlement()).rejects.toThrow();
  }
});
