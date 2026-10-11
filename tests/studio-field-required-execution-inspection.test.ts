import { beforeEach, expect, it, vi } from "vitest";
import type { Prisma } from "@/generated/prisma/client";
import type { FieldMigrationAuthority } from "@/core/studio/fields/migrations/authority";
const m = vi.hoisted(() => ({ refresh: vi.fn(), resolve: vi.fn(), company: vi.fn(), module: vi.fn(), raw: vi.fn(),
  preparation: vi.fn(), publication: vi.fn(), execution: vi.fn(), target: vi.fn(), compile: vi.fn(), published: vi.fn(), executing: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: {} }));
vi.mock("@/core/studio/fields/runtime-authority", () => ({ fieldRuntimeAuthorityInTransaction: m.refresh }));
vi.mock("@/core/studio/fields/principal", () => ({ resolveFieldMigrationPrincipal: m.resolve }));
vi.mock("@/core/studio/fields/migrations/metadata", () => ({ compileFieldMigrationMetadata: m.compile }));
vi.mock("@/core/studio/fields/migrations/inspection", () => ({ inspectFieldMigrationReview: vi.fn(),
  inspectPublishedRequiredFieldMigrationReview: m.published, inspectExecutingRequiredFieldMigrationReview: m.executing }));
import { retainedCutoverFixture, cutoverUuid as uuid } from "./fixtures/studio-field-cutover";
import { customFieldPayloadSchema } from "@/core/studio/fields/schema";
import { conditionalFieldPayloadSchema } from "@/core/studio/fields/required-contract";
import { checksum } from "@/core/studio/registry/contracts";
import { sealRequiredFieldMigrationIntent, sealRequiredFieldMigrationReview } from "@/core/studio/fields/migrations/required-contracts";
import { reviewedRequiredFieldPublicationPin } from "@/core/studio/fields/migrations/publication-contract";
import { createRequiredFieldMigrationExecutionPin } from "@/core/studio/fields/migrations/execution-contract";
import { inspectRequiredFieldMigrationExecution } from "@/core/studio/fields/migrations/execution-inspection";
let legacy: Awaited<ReturnType<typeof retainedCutoverFixture>>;
function fixture(base: Awaited<ReturnType<typeof retainedCutoverFixture>>) {
  const ref = (id: string, version: number) => { const descriptor = base.registry.describe(id, version); return { id, version, schemaHash: descriptor.schemaHash, contractHash: descriptor.contractHash }; };
  const payload = conditionalFieldPayloadSchema.parse({ ...base.intent.target.payload, schemaVersion: 2, entity: ref("tickets.ticket", 9),
    requiredIf: { match: "all", predicates: [{ source: { kind: "native", fieldId: "status" }, operator: "present" }] } });
  // Synthetic compiled metadata/review and delegated row readers. These tests
  // prove this orchestration and the real pure owner/pin parsers, not actual SQL,
  // conditional compilation, row outcomes or normal central execution.
  const compiled = { payload, plan: { kind: "customField", schemaVersion: 2, dependencies: [base.registry.describe("tickets.ticket", 9)] } };
  const sealed = sealRequiredFieldMigrationIntent({ ...base.intent, schemaVersion: 2, ownerQuery: ref("tickets.ticket.field_migration", 4),
    target: { ...base.intent.target, payload, compiledChecksum: checksum(compiled.plan) } });
  const stored = sealRequiredFieldMigrationReview({ ...sealed.intent, cohort: base.stored.review.cohort, summary: base.stored.review.summary });
  const target = { ...base.target, payload, compiledPlan: compiled.plan, checksum: sealed.intent.target.compiledChecksum };
  const publication = { ...reviewedRequiredFieldPublicationPin(stored, target, "actor", false), state: "PUBLISHED", revision: 0 };
  const pinned = createRequiredFieldMigrationExecutionPin(stored, target, Object.fromEntries(Object.entries(publication).filter(([key]) => key !== "state" && key !== "revision")),
    base.registry.describe("tickets.ticket", 9), base.registry.describe("tickets.ticket.field_representation", 2));
  return { intent: sealed.intent, stored, target: { ...target, schemaVersion: 2, createdBy: "actor" }, publication, compiled: { ...compiled, checksum: target.checksum }, pinned,
    preparation: { ...base.preparation, intent: sealed.intent, intentChecksum: sealed.checksum,
      review: { ...base.preparation.review, ...stored } },
    execution: { ...base.execution, state: "RUNNING", revision: 0, cursor: null as string | null, processedCount: 0, failureCode: null as string | null, ...{ pin: pinned.pin, pinChecksum: pinned.checksum } } };
}
let f: ReturnType<typeof fixture>, authority: FieldMigrationAuthority, available = true;
const tx = { $queryRaw: m.raw, organisation: { findFirst: m.company }, moduleState: { findFirst: m.module },
  studioFieldMigrationPreparation: { findFirst: m.preparation }, studioFieldMigrationPublication: { findFirst: m.publication },
  studioFieldMigrationExecution: { findFirst: m.execution }, studioDefinitionVersion: { findFirst: m.target } } as unknown as Prisma.TransactionClient;
const inspect = () => inspectRequiredFieldMigrationExecution(authority, f.intent);
beforeEach(async () => {
  vi.resetAllMocks(); legacy = await retainedCutoverFixture(); f = fixture(legacy); available = true;
  authority = { session: legacy.session, principal: f.intent.principal, transaction: tx,
    company: { id: "company", kind: "CUSTOMER", status: "ACTIVE", archivedAt: null, isTest: true } };
  m.refresh.mockResolvedValue({ session: legacy.session, transaction: tx, registry: legacy.registry, stamp: f.intent.principal });
  m.resolve.mockResolvedValue(legacy.session); m.raw.mockResolvedValue([]); m.module.mockImplementation(async () => available ? { id: "enabled" } : null);
  m.company.mockResolvedValue(authority.company); m.preparation.mockImplementation(async () => structuredClone(f.preparation));
  m.publication.mockImplementation(async () => structuredClone(f.publication)); m.execution.mockResolvedValue(null);
  m.target.mockImplementation(async () => structuredClone(f.target)); m.compile.mockImplementation(async () => structuredClone(f.compiled));
  m.published.mockImplementation(async () => structuredClone(f.stored)); m.executing.mockImplementation(async () => structuredClone(f.stored));
});
it("refreshes genuine authority before metadata and reconstructs the exact conditional pin through publication inspection", async () => {
  const result = await inspect(); expect(result.pin).toEqual(f.pinned.pin); expect(result.pinChecksum).toBe(f.pinned.checksum);
  expect(result.existing).toBeNull(); expect(result.progress).toBeNull(); expect(result.registry).toBe(legacy.registry);
  expect(m.refresh.mock.invocationCallOrder[0]).toBeLessThan(m.preparation.mock.invocationCallOrder[0]);
  expect(m.resolve.mock.invocationCallOrder[0]).toBeLessThan(m.preparation.mock.invocationCallOrder[0]);
  expect(m.published).toHaveBeenCalledOnce(); expect(m.executing).not.toHaveBeenCalled();
  for (const call of [m.publication, m.execution, m.target]) expect(call.mock.calls[0][0].where).toMatchObject({ organisationId: "company", definitionId: f.intent.definitionId });
  expect(m.compile.mock.calls[0][1]).toBe(legacy.registry); expect(result.target).not.toHaveProperty("createdBy");
});
it("uses only actual execution inspection for running, failed and ready replay, retaining receipt1 shape", async () => {
  for (const patch of [{ state: "RUNNING", revision: 1, cursor: "ticket_a", processedCount: 1, failureCode: null },
    { state: "FAILED", revision: 2, cursor: "ticket_a", processedCount: 1, failureCode: "WRITE_FAILED" },
    { state: "READY", revision: 3, cursor: "ticket_b", processedCount: 2, failureCode: null }]) {
    m.execution.mockResolvedValue({ ...f.execution, ...patch }); const result = await inspect();
    expect(result.progress).toEqual(patch); expect(result.pin.schemaVersion).toBe(1); expect(result.stored.review.schemaVersion).toBe(2);
  }
  expect(m.executing).toHaveBeenCalledTimes(3); expect(m.published).not.toHaveBeenCalled();
  m.executing.mockRejectedValueOnce(new Error("FORBIDDEN: actual outcome/input changed"));
  await expect(inspect()).rejects.toThrow("actual outcome/input changed"); expect(m.published).not.toHaveBeenCalled();
});
it("denies copied or revoked sessions and changed full principal/support authority before migration data access", async () => {
  m.refresh.mockRejectedValueOnce(new Error("FORBIDDEN: copied session")); await expect(inspect()).rejects.toThrow("copied session");
  m.resolve.mockRejectedValueOnce(new Error("FORBIDDEN: support Audit revoked")); await expect(inspect()).rejects.toThrow("support Audit revoked");
  for (const patch of [{ authVersion: 4 }, { sessionVersion: 3 }]) {
    m.refresh.mockResolvedValueOnce({ session: legacy.session, transaction: tx, registry: legacy.registry, stamp: { ...f.intent.principal, ...patch } });
    await expect(inspect()).rejects.toThrow("stale or has changed");
  }
  authority.principal = { ...f.intent.principal, membershipId: "other" };
  await expect(inspect()).rejects.toThrow("stale or has changed");
  authority.principal = { ...f.intent.principal, authority: "staff_support", auditId: "different" };
  await expect(inspect()).rejects.toThrow("stale or has changed"); expect(m.preparation).not.toHaveBeenCalled(); expect(m.raw).not.toHaveBeenCalled();
});
it("rejects legacy/foreign/changed stored intent or review and unreviewed preparations without protocol fallback", async () => {
  const original = structuredClone(f.preparation);
  for (const patch of [{ organisationId: "other" }, { definitionId: uuid(99) }, { intent: legacy.intent, intentChecksum: checksum(legacy.intent) },
    { intentChecksum: "a".repeat(64) }, { state: "CANCELLED" }, { review: { ...original.review, definitionId: uuid(99) } },
    { review: { ...original.review, ...legacy.stored } }]) {
    m.preparation.mockResolvedValueOnce({ ...original, ...patch }); await expect(inspect()).rejects.toThrow();
  }
  expect(m.publication).not.toHaveBeenCalled(); expect(m.compile).not.toHaveBeenCalled();
});
it("denies stale target publisher/schema/plan and publication generation/hash/actor/state", async () => {
  for (const patch of [{ state: "CUTOVER" }, { publisherUserId: "other" }, { reviewChecksum: "a".repeat(64) },
    { sourceGenerationId: uuid(99) }, { targetGenerationId: uuid(99) }, { targetVersionNumber: 3 }, { organisationId: "other" }]) {
    m.publication.mockResolvedValueOnce({ ...f.publication, ...patch }); await expect(inspect()).rejects.toThrow();
  }
  for (const patch of [{ schemaVersion: 1 }, { createdBy: "other" }, { compiledPlan: {} }, { organisationId: "other" }, { version: 3 }, { payload: legacy.target.payload }]) {
    m.target.mockResolvedValueOnce({ ...f.target, ...patch }); await expect(inspect()).rejects.toThrow();
  }
});
it("rejects substituted pins, scope, terminal executions and impossible progress on replay", async () => {
  for (const patch of [{ pinChecksum: "a".repeat(64) }, { pin: { ...f.execution.pin, privileged: true } }, { entityId: "sales.order" },
    { organisationId: "other" }, { preparationId: uuid(99) }, { state: "CANCELLED" }, { processedCount: 3 }, { state: "READY", revision: 1 },
    { state: "FAILED", revision: 1 }, { cursor: "ticket_a" }, { processedCount: 1 }, { failureCode: "secret" }]) {
    m.execution.mockResolvedValueOnce({ ...f.execution, ...patch }); await expect(inspect()).rejects.toThrow();
  }
  expect(m.published).not.toHaveBeenCalled();
});
it("checks publish, Studio/source enablement, compiler checksum and delegated private/current coverage even for an empty cohort", async () => {
  const revoked = { ...legacy.session, capabilities: new Set(["tickets.ticket.read", "tickets.ticket.manage"]) };
  m.refresh.mockResolvedValueOnce({ session: revoked, transaction: tx, registry: legacy.registry, stamp: f.intent.principal });
  await expect(inspect()).rejects.toThrow("FORBIDDEN"); expect(m.preparation).not.toHaveBeenCalled();
  available = false; await expect(inspect()).rejects.toThrow("Studio is unavailable"); expect(m.preparation).not.toHaveBeenCalled(); available = true;
  m.module.mockResolvedValueOnce({ id: "studio" }).mockResolvedValueOnce(null); await expect(inspect()).rejects.toThrow("field source is unavailable");
  m.compile.mockResolvedValueOnce({ ...f.compiled, checksum: "a".repeat(64) }); await expect(inspect()).rejects.toThrow("stale or has changed");
  m.published.mockRejectedValueOnce(new Error("FORBIDDEN: empty private cohort")); await expect(inspect()).rejects.toThrow("empty private cohort");
  m.published.mockResolvedValueOnce({ ...f.stored, checksum: "a".repeat(64) }); await expect(inspect()).rejects.toThrow("stale or has changed");
  f.stored = sealRequiredFieldMigrationReview({ ...f.stored.review, cohort: { recordCount: 0, observationDigest: "e".repeat(64) }, summary: { validCount: 0, invalidCount: 0, lossyCount: 0 } });
  f.preparation.review = { ...f.preparation.review, ...f.stored }; f.publication.reviewChecksum = f.stored.checksum;
  expect((await inspect()).pin.cohort.recordCount).toBe(0);
});

it("retains conditional review dispatch when removing rules produces a schema1 target and resolves the exact support Audit", async () => {
  const sourcePayload = { ...f.intent.source.payload, ...f.intent.target.payload, storageGeneration: f.intent.source.payload.storageGeneration,
    field: f.intent.source.payload.field };
  const targetPayload = customFieldPayloadSchema.parse({ schemaVersion: 1, entity: f.intent.target.payload.entity,
    storageGeneration: f.intent.target.payload.storageGeneration, field: f.intent.target.payload.field });
  const plan = { ...f.compiled.plan, schemaVersion: 1 }, compiledChecksum = checksum(plan);
  const principal = { ...f.intent.principal, authority: "staff_support" as const, auditId: "approved-support-audit" };
  f.intent = sealRequiredFieldMigrationIntent({ ...f.intent, principal, source: { ...f.intent.source, payload: sourcePayload },
    target: { ...f.intent.target, payload: targetPayload, compiledChecksum } }).intent;
  f.stored = sealRequiredFieldMigrationReview({ ...f.intent, cohort: f.stored.review.cohort, summary: f.stored.review.summary });
  f.preparation.intent = f.intent; f.preparation.intentChecksum = checksum(f.intent); f.preparation.review = { ...f.preparation.review, ...f.stored };
  const target = { ...f.target, payload: targetPayload, compiledPlan: plan, checksum: compiledChecksum, schemaVersion: 1 };
  const { schemaVersion, createdBy, ...projection } = target; void schemaVersion; void createdBy;
  f.publication = { ...reviewedRequiredFieldPublicationPin(f.stored, projection, "actor", false), state: "PUBLISHED", revision: 0 };
  authority.principal = principal;
  m.compile.mockResolvedValue({ payload: targetPayload, plan, checksum: compiledChecksum }); m.target.mockResolvedValue(target);
  const result = await inspect(); expect(result.intent.schemaVersion).toBe(2); expect(result.target.payload).toMatchObject({ schemaVersion: 1 });
  expect(m.published).toHaveBeenCalledOnce(); expect(m.executing).not.toHaveBeenCalled(); expect(m.resolve).toHaveBeenCalledWith(principal);
});
