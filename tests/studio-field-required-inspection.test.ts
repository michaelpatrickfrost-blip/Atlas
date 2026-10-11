import { beforeEach, expect, it, vi } from "vitest";
import type { Prisma } from "@/generated/prisma/client";
const m = vi.hoisted(() => ({ authority: vi.fn(), company: vi.fn(), coverage: vi.fn(), publishedCoverage: vi.fn(), executingCoverage: vi.fn(), cutoverCoverage: vi.fn(), rollbackCoverage: vi.fn(), principal: vi.fn(), rows: vi.fn(), observe: vi.fn(), publishedObserve: vi.fn(), executingObserve: vi.fn(), cutoverObserve: vi.fn(), rollbackObserve: vi.fn(), digest: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: {} }));
vi.mock("@/core/studio/fields/principal", () => ({ resolveFieldMigrationPrincipal: m.principal }));
vi.mock("@/core/studio/fields/runtime-authority", () => ({ fieldRuntimeAuthorityInTransaction: m.authority }));
vi.mock("@/core/studio/fields/migrations/coverage", () => ({ validateFieldMigrationSourceCoverage: vi.fn(), validateRequiredFieldMigrationSourceCoverage: m.coverage,
  validatePublishedRequiredFieldMigrationSourceCoverage: m.publishedCoverage, validateExecutingRequiredFieldMigrationSourceCoverage: m.executingCoverage, validateCutoverRequiredFieldMigrationSourceCoverage: m.cutoverCoverage, validateRollbackRequiredFieldMigrationSourceCoverage: m.rollbackCoverage }));
vi.mock("@/core/studio/fields/migrations/observation", () => ({ observeRequiredFieldMigrationRecord: m.observe, observePublishedRequiredFieldMigrationRecord: m.publishedObserve, observeExecutingRequiredFieldMigrationRecord: m.executingObserve, observeCutoverRequiredFieldMigrationRecord: m.cutoverObserve, observeRollbackRequiredFieldMigrationRecord: m.rollbackObserve }));
vi.mock("@/core/studio/fields/migrations/archive-digest", () => ({ digestFieldMigrationArchive: vi.fn(), digestRequiredFieldMigrationArchive: m.digest }));
import { retainedCutoverFixture } from "./fixtures/studio-field-cutover";
import { conditionalFieldPayloadSchema } from "@/core/studio/fields/required-contract";
import { requiredFieldMigrationObservationDigest, sealRequiredFieldMigrationIntent, type RequiredFieldMigrationIntent,
  type RequiredFieldMigrationObservation } from "@/core/studio/fields/migrations/required-contracts";
import { inspectRequiredFieldMigrationReview, inspectPublishedRequiredFieldMigrationReview, inspectExecutingRequiredFieldMigrationReview, inspectCutoverRequiredFieldMigrationReview, inspectRollbackRequiredFieldMigrationReview } from "@/core/studio/fields/migrations/inspection";
let fixture: Awaited<ReturnType<typeof retainedCutoverFixture>>, intent: RequiredFieldMigrationIntent, observations: RequiredFieldMigrationObservation[];
const tx = { organisation: { findFirst: m.company }, studioFieldMigrationObservation: { findMany: m.rows } } as unknown as Prisma.TransactionClient;
const inspect = () => inspectRequiredFieldMigrationReview({ session: fixture.session, transaction: tx }, intent);
const inspectPublished = () => inspectPublishedRequiredFieldMigrationReview({ session: fixture.session, transaction: tx }, intent);
const inspectCutover = () => inspectCutoverRequiredFieldMigrationReview({ session: fixture.session, transaction: tx }, intent);
const inspectExecuting = () => inspectExecutingRequiredFieldMigrationReview({ session: fixture.session, transaction: tx }, intent);
function aggregate() { const stream = requiredFieldMigrationObservationDigest(); observations.forEach(row => stream.append(row)); return { ...stream.finish(), duplicateTarget: false }; }
beforeEach(async () => {
  vi.resetAllMocks(); fixture = await retainedCutoverFixture();
  const target = conditionalFieldPayloadSchema.parse({ ...fixture.intent.target.payload, schemaVersion: 2,
    requiredIf: { match: "all", predicates: [{ source: { kind: "native", fieldId: "status" }, operator: "present" }] } });
  intent = sealRequiredFieldMigrationIntent({ ...fixture.intent, schemaVersion: 2, target: { ...fixture.intent.target, payload: target } }).intent;
  observations = ["a", "b"].map(recordId => ({ recordId, nativeRevision: 7, extension: null,
    requirement: { sourceEvaluationChecksum: "a".repeat(64), targetEvaluationChecksum: "b".repeat(64), targetRequired: true }, result: { kind: "invalid", code: "FIELD_REQUIRED" } }));
  m.authority.mockResolvedValue({ session: fixture.session, registry: fixture.registry, transaction: tx,
    stamp: { ...intent.principal } });
  m.company.mockResolvedValue({ id: "company", kind: "CUSTOMER", status: "ACTIVE", archivedAt: null, isTest: true }); m.coverage.mockResolvedValue(undefined);
  m.rows.mockImplementation(async ({ where, take }) => observations.filter(row => !where.recordId || row.recordId > where.recordId.gt).slice(0, take)
    .map(row => ({ recordId: row.recordId, nativeRevision: row.nativeRevision, observation: structuredClone(row) })));
  m.observe.mockImplementation(async (_context, _intent, anchor) => structuredClone(observations.find(row => row.recordId === anchor.recordId)));
  m.publishedObserve.mockImplementation(async (_context, _intent, anchor) => structuredClone(observations.find(row => row.recordId === anchor.recordId)));
  m.executingObserve.mockImplementation(async (_context, _intent, anchor) => structuredClone(observations.find(row => row.recordId === anchor.recordId)));
  m.cutoverObserve.mockImplementation(async (_context, _intent, anchor) => structuredClone(observations.find(row => row.recordId === anchor.recordId)));
  m.rollbackObserve.mockImplementation(async (_authority, _intent, anchor) => structuredClone(observations.find(row => row.recordId === anchor.recordId)));
  m.principal.mockResolvedValue(fixture.session);
  m.digest.mockImplementation(async () => aggregate());
});
it("checks authority and exact owner coverage before bounded archive reads, then compares actual row evidence and SQL/pure framing", async () => {
  const sealed = await inspect(); expect(sealed.review).toMatchObject({ schemaVersion: 2, cohort: { recordCount: 2 }, summary: { validCount: 0, invalidCount: 2, lossyCount: 0 } });
  expect(m.authority.mock.invocationCallOrder[0]).toBeLessThan(m.coverage.mock.invocationCallOrder[0]);
  expect(m.coverage.mock.invocationCallOrder[0]).toBeLessThan(m.rows.mock.invocationCallOrder[0]);
  expect(m.observe.mock.invocationCallOrder.at(-1)).toBeLessThan(m.digest.mock.invocationCallOrder[0]);
  expect(m.rows).toHaveBeenCalledWith(expect.objectContaining({ take: 50, where: expect.objectContaining({ organisationId: "company", definitionId: intent.definitionId,
    entityId: "tickets.ticket", sourceGenerationId: intent.source.payload.storageGeneration }) }));
});
it("rejects copied/revoked/changed principal authority and coverage before reading IDs or counts", async () => {
  m.authority.mockRejectedValueOnce(new Error("FORBIDDEN: copied session")); await expect(inspect()).rejects.toThrow("copied session");
  m.coverage.mockRejectedValueOnce(new Error("FORBIDDEN: private cohort")); await expect(inspect()).rejects.toThrow("private cohort");
  intent = { ...intent, principal: { ...intent.principal, authVersion: intent.principal.authVersion + 1 } }; await expect(inspect()).rejects.toThrow("stale or has changed");
  expect(m.rows).not.toHaveBeenCalled(); expect(m.digest).not.toHaveBeenCalled();
});
it("does not let equal conversion results waive changed conditions or native/global revision envelopes", async () => {
  for (const actual of [{ ...observations[0], requirement: { ...observations[0].requirement, targetEvaluationChecksum: "c".repeat(64) } },
    { ...observations[0], nativeRevision: 8 }, { ...observations[0], extension: { id: "00000000-0000-4000-8000-000000000009", revision: 1, slot: null } }]) {
    m.observe.mockResolvedValueOnce(actual); await expect(inspect()).rejects.toThrow("stale or has changed");
  }
  expect(m.digest).not.toHaveBeenCalled();
});
it("rechecks actual row access and rejects aggregate drift and unique collisions before sealing", async () => {
  m.observe.mockRejectedValueOnce(new Error("FORBIDDEN: condition input")); await expect(inspect()).rejects.toThrow("condition input");
  m.digest.mockResolvedValueOnce({ ...aggregate(), observationDigest: "d".repeat(64) }); await expect(inspect()).rejects.toThrow("stale or has changed");
  intent = { ...intent, target: { ...intent.target, payload: { ...intent.target.payload, field: { ...intent.target.payload.field, unique: true } } } };
  m.digest.mockResolvedValueOnce({ ...aggregate(), duplicateTarget: true }); await expect(inspect()).rejects.toThrow("MIGRATION_UNIQUENESS_CONFLICT");
});
it("keeps memory bounded across the stored cursor and still validates empty-cohort authority and metadata coverage", async () => {
  observations = Array.from({ length: 51 }, (_, n) => ({ ...observations[0], recordId: `record_${n.toString().padStart(3, "0")}` }));
  expect((await inspect()).review.cohort.recordCount).toBe(51); expect(m.rows).toHaveBeenCalledTimes(2);
  expect(m.rows.mock.calls[1][0].where.recordId).toEqual({ gt: "record_049" }); expect(m.observe).toHaveBeenCalledTimes(51);
  vi.clearAllMocks(); observations = []; expect((await inspect()).review.cohort.recordCount).toBe(0);
  expect(m.authority).toHaveBeenCalledOnce(); expect(m.coverage).toHaveBeenCalledOnce(); expect(m.observe).not.toHaveBeenCalled(); expect(m.digest).toHaveBeenCalledOnce();
});
it("uses only the explicit publication coverage and row reader and rejects semantic/native/global drift before sealing", async () => {
  const sealed = await inspectPublished(); expect(sealed.review.cohort.recordCount).toBe(2);
  expect(m.coverage).not.toHaveBeenCalled(); expect(m.observe).not.toHaveBeenCalled();
  expect(m.publishedCoverage).toHaveBeenCalledOnce(); expect(m.publishedObserve).toHaveBeenCalledTimes(2);
  expect(m.publishedCoverage.mock.invocationCallOrder[0]).toBeLessThan(m.rows.mock.invocationCallOrder[0]);
  m.digest.mockClear();
  for (const actual of [{ ...observations[0], requirement: { ...observations[0].requirement, targetEvaluationChecksum: "c".repeat(64) } },
    { ...observations[0], nativeRevision: 8 }, { ...observations[0], extension: { id: "00000000-0000-4000-8000-000000000009", revision: 1, slot: null } }]) {
    m.publishedObserve.mockResolvedValueOnce(actual); await expect(inspectPublished()).rejects.toThrow("stale or has changed");
  }
  expect(m.digest).not.toHaveBeenCalled();
});
it("requires current publication authority even for an empty cohort and never falls back to preparation after denial", async () => {
  observations = []; m.publishedCoverage.mockRejectedValueOnce(new Error("FORBIDDEN: publication cohort"));
  await expect(inspectPublished()).rejects.toThrow("publication cohort"); expect(m.rows).not.toHaveBeenCalled(); expect(m.digest).not.toHaveBeenCalled();
  expect(m.coverage).not.toHaveBeenCalled(); expect(m.observe).not.toHaveBeenCalled();
  expect((await inspectPublished()).review.cohort.recordCount).toBe(0); expect(m.publishedObserve).not.toHaveBeenCalled();
  m.digest.mockResolvedValueOnce({ ...aggregate(), observationDigest: "d".repeat(64) }); await expect(inspectPublished()).rejects.toThrow("stale or has changed");
});

// These unit fixtures exercise bounded inspector orchestration and strict sealed
// comparison. Actual own-outcome/native/private checks belong to the real executing
// observation/coverage suites and central runtime proof, not these mock readers.
it("uses only execution coverage and the proved original-envelope reader before SQL/pure sealing", async () => {
  const sealed = await inspectExecuting();
  expect(sealed.review).toMatchObject({ schemaVersion: 2, cohort: { recordCount: 2 }, summary: { invalidCount: 2 } });
  expect(m.authority.mock.invocationCallOrder[0]).toBeLessThan(m.executingCoverage.mock.invocationCallOrder[0]);
  expect(m.executingCoverage.mock.invocationCallOrder[0]).toBeLessThan(m.rows.mock.invocationCallOrder[0]);
  expect(m.executingObserve.mock.invocationCallOrder.at(-1)).toBeLessThan(m.digest.mock.invocationCallOrder[0]);
  expect(m.executingCoverage).toHaveBeenCalledOnce(); expect(m.executingObserve).toHaveBeenCalledTimes(2);
  expect(m.coverage).not.toHaveBeenCalled(); expect(m.publishedCoverage).not.toHaveBeenCalled();
  expect(m.observe).not.toHaveBeenCalled(); expect(m.publishedObserve).not.toHaveBeenCalled();
});
it("refreshes executing authority and rejects copied, tenant or principal drift before cohort IDs or counts", async () => {
  m.authority.mockRejectedValueOnce(new Error("FORBIDDEN: copied session"));
  await expect(inspectExecuting()).rejects.toThrow("copied session");
  const original = intent;
  for (const changed of [
    { ...original, organisationId: "other-company", principal: { ...original.principal, organisationId: "other-company" } },
    { ...original, principal: { ...original.principal, userId: "other-user" } },
    { ...original, principal: { ...original.principal, membershipId: "other-membership" } },
    { ...original, principal: { ...original.principal, authVersion: original.principal.authVersion + 1 } },
    { ...original, principal: { ...original.principal, sessionVersion: original.principal.sessionVersion + 1 } },
  ]) { intent = changed; await expect(inspectExecuting()).rejects.toThrow("stale or has changed"); }
  expect(m.rows).not.toHaveBeenCalled(); expect(m.digest).not.toHaveBeenCalled(); expect(m.executingCoverage).not.toHaveBeenCalled();
});
it("denies executing coverage and actual-row access without publication or preparation fallback", async () => {
  m.executingCoverage.mockRejectedValueOnce(new Error("FORBIDDEN: private execution cohort"));
  await expect(inspectExecuting()).rejects.toThrow("private execution cohort");
  expect(m.rows).not.toHaveBeenCalled(); expect(m.digest).not.toHaveBeenCalled();
  m.executingObserve.mockRejectedValueOnce(new Error("FORBIDDEN: independent condition Read"));
  await expect(inspectExecuting()).rejects.toThrow("independent condition Read"); expect(m.digest).not.toHaveBeenCalled();
  expect(m.coverage).not.toHaveBeenCalled(); expect(m.publishedCoverage).not.toHaveBeenCalled();
  expect(m.observe).not.toHaveBeenCalled(); expect(m.publishedObserve).not.toHaveBeenCalled();
});
it("requires exact retained condition, source, native and extension envelopes after executing row proof", async () => {
  for (const actual of [
    { ...observations[0], requirement: { ...observations[0].requirement, sourceEvaluationChecksum: "c".repeat(64) } },
    { ...observations[0], requirement: { ...observations[0].requirement, targetEvaluationChecksum: "c".repeat(64) } },
    { ...observations[0], requirement: { ...observations[0].requirement, targetRequired: false } },
    { ...observations[0], nativeRevision: 8 },
    { ...observations[0], extension: { id: "00000000-0000-4000-8000-000000000009", revision: 1, slot: null } },
    { ...observations[0], result: { kind: "invalid", code: "INVALID_SOURCE" } },
  ]) { m.executingObserve.mockResolvedValueOnce(actual); await expect(inspectExecuting()).rejects.toThrow("stale or has changed"); }
  expect(m.digest).not.toHaveBeenCalled();
  m.rows.mockResolvedValueOnce([{ recordId: "wrong-anchor", nativeRevision: 7, observation: observations[0] }]);
  m.executingObserve.mockClear(); await expect(inspectExecuting()).rejects.toThrow("stale or has changed"); expect(m.executingObserve).not.toHaveBeenCalled();
  m.rows.mockResolvedValueOnce([{ recordId: observations[0].recordId, nativeRevision: 8, observation: observations[0] }]);
  await expect(inspectExecuting()).rejects.toThrow("stale or has changed"); expect(m.executingObserve).not.toHaveBeenCalled();
});
it("streams executing reviews in 50-row pages under exact tenant and source bindings, including empty-cohort guards", async () => {
  observations = Array.from({ length: 101 }, (_, n) => ({ ...observations[0], recordId: `record_${n.toString().padStart(3, "0")}` }));
  expect((await inspectExecuting()).review.cohort.recordCount).toBe(101); expect(m.rows).toHaveBeenCalledTimes(3);
  for (const [args] of m.rows.mock.calls) expect(args).toMatchObject({ take: 50, orderBy: { recordId: "asc" }, where: {
    organisationId: "company", preparationId: intent.id, definitionId: intent.definitionId, entityId: "tickets.ticket", sourceGenerationId: intent.source.payload.storageGeneration } });
  expect(m.rows.mock.calls[1][0].where.recordId).toEqual({ gt: "record_049" });
  expect(m.rows.mock.calls[2][0].where.recordId).toEqual({ gt: "record_099" }); expect(m.executingObserve).toHaveBeenCalledTimes(101);
  vi.clearAllMocks(); observations = [];
  m.executingCoverage.mockRejectedValueOnce(new Error("FORBIDDEN: empty execution authority"));
  await expect(inspectExecuting()).rejects.toThrow("empty execution authority"); expect(m.rows).not.toHaveBeenCalled(); expect(m.digest).not.toHaveBeenCalled();
  expect((await inspectExecuting()).review.cohort.recordCount).toBe(0); expect(m.authority).toHaveBeenCalledTimes(2);
  expect(m.executingObserve).not.toHaveBeenCalled(); expect(m.digest).toHaveBeenCalledOnce();
});
it("rejects executing SQL/pure count, digest and summary drift and current target uniqueness collisions", async () => {
  for (const changed of [
    { ...aggregate(), recordCount: 3 },
    { ...aggregate(), observationDigest: "d".repeat(64) },
    { ...aggregate(), summary: { validCount: 1, invalidCount: 1, lossyCount: 0 } },
  ]) { m.digest.mockResolvedValueOnce(changed); await expect(inspectExecuting()).rejects.toThrow("stale or has changed"); }
  intent = { ...intent, target: { ...intent.target, payload: { ...intent.target.payload, field: { ...intent.target.payload.field, unique: true } } } };
  m.digest.mockResolvedValueOnce({ ...aggregate(), duplicateTarget: true });
  await expect(inspectExecuting()).rejects.toThrow("MIGRATION_UNIQUENESS_CONFLICT");
});
it("rejects malformed, duplicate or out-of-order executing archive rows before SQL seals them", async () => {
  m.rows.mockResolvedValueOnce([{ recordId: observations[0].recordId, nativeRevision: 7,
    observation: { ...observations[0], unexpected: true } }]);
  await expect(inspectExecuting()).rejects.toThrow(); expect(m.executingObserve).not.toHaveBeenCalled();
  for (const rows of [[observations[0], observations[0]], [observations[1], observations[0]]]) {
    m.rows.mockResolvedValueOnce(rows.map(row => ({ recordId: row.recordId, nativeRevision: row.nativeRevision, observation: row })));
    await expect(inspectExecuting()).rejects.toThrow("The field migration observation is invalid.");
  }
  expect(m.digest).not.toHaveBeenCalled();
});

it("routes cutover aggregate through only actual post-cutover coverage and row proof in bounded tenant pages", async () => {
  observations = Array.from({ length: 51 }, (_, n) => ({ ...observations[0], recordId: `record_${n.toString().padStart(3, "0")}` }));
  expect((await inspectCutover()).review.cohort.recordCount).toBe(51);
  expect(m.cutoverCoverage).toHaveBeenCalledOnce(); expect(m.cutoverObserve).toHaveBeenCalledTimes(51);
  expect(m.cutoverCoverage.mock.invocationCallOrder[0]).toBeLessThan(m.rows.mock.invocationCallOrder[0]);
  expect(m.rows.mock.calls[1][0].where.recordId).toEqual({ gt: "record_049" });
  expect(m.coverage).not.toHaveBeenCalled(); expect(m.publishedCoverage).not.toHaveBeenCalled(); expect(m.executingCoverage).not.toHaveBeenCalled();
  expect(m.observe).not.toHaveBeenCalled(); expect(m.publishedObserve).not.toHaveBeenCalled(); expect(m.executingObserve).not.toHaveBeenCalled();
});
it("requires current cutover identity/owner access even for empty cohorts and never falls back after denial", async () => {
  observations = []; m.cutoverCoverage.mockRejectedValueOnce(new Error("actual cutover denied"));
  await expect(inspectCutover()).rejects.toThrow("actual cutover denied"); expect(m.rows).not.toHaveBeenCalled(); expect(m.digest).not.toHaveBeenCalled();
  expect((await inspectCutover()).review.cohort.recordCount).toBe(0); expect(m.authority).toHaveBeenCalledTimes(2); expect(m.cutoverObserve).not.toHaveBeenCalled();
  intent.principal.sessionVersion++; m.rows.mockClear(); await expect(inspectCutover()).rejects.toThrow(); expect(m.rows).not.toHaveBeenCalled();
});
it("refuses changed post-cutover row meaning or SQL/pure digest and uniqueness conflicts before resealing", async () => {
  m.cutoverObserve.mockResolvedValueOnce({ ...observations[0], requirement: { ...observations[0].requirement, targetEvaluationChecksum: "c".repeat(64) } });
  await expect(inspectCutover()).rejects.toThrow(); expect(m.digest).not.toHaveBeenCalled();
  m.digest.mockResolvedValueOnce({ ...aggregate(), observationDigest: "d".repeat(64) }); await expect(inspectCutover()).rejects.toThrow();
  intent = { ...intent, target: { ...intent.target, payload: { ...intent.target.payload, field: { ...intent.target.payload.field, unique: true } } } };
  m.digest.mockResolvedValueOnce({ ...aggregate(), duplicateTarget: true }); await expect(inspectCutover()).rejects.toThrow("MIGRATION_UNIQUENESS_CONFLICT");
});

function rollbackAuthority() {
  const session = { ...fixture.session, userId: "current-settler", membershipId: "current-member" };
  const principal = { ...intent.principal, userId: session.userId, membershipId: session.membershipId, authVersion: 11, sessionVersion: 12 };
  const company = { id: "company", kind: "CUSTOMER" as const, status: "ACTIVE" as const, archivedAt: null, isTest: true };
  m.authority.mockResolvedValue({ session, registry: fixture.registry, transaction: tx, stamp: principal });
  m.principal.mockImplementation(async selected => { if (selected.userId === intent.principal.userId) throw new Error("creator revoked"); return session; });
  return { session, principal, transaction: tx, company };
}
it("seals original rollback review under a different fresh principal and passes current authority to coverage and each bounded row", async () => {
  const authority = rollbackAuthority(), original = structuredClone(intent);
  const result = await inspectRollbackRequiredFieldMigrationReview(authority, intent);
  expect(result.review.principal).toEqual(original.principal); expect(intent).toEqual(original);
  expect(m.rollbackCoverage).toHaveBeenCalledWith(expect.objectContaining({ principal: authority.principal, session: authority.session }), intent);
  expect(m.rollbackObserve).toHaveBeenCalledTimes(2);
  expect(m.rollbackObserve.mock.calls.every(([selected]) => selected.principal.userId === "current-settler")).toBe(true);
  expect(m.principal).toHaveBeenCalledWith(authority.principal);
  expect(m.cutoverCoverage).not.toHaveBeenCalled(); expect(m.executingCoverage).not.toHaveBeenCalled(); expect(m.coverage).not.toHaveBeenCalled();
});
it("checks current rollback principal/support/coverage for empty cohorts and rejects authority drift before archived IDs", async () => {
  const authority = rollbackAuthority(); observations = [];
  expect((await inspectRollbackRequiredFieldMigrationReview(authority, intent)).review.cohort.recordCount).toBe(0);
  expect(m.principal).toHaveBeenCalledWith(authority.principal); expect(m.rollbackCoverage).toHaveBeenCalledOnce(); expect(m.rollbackObserve).not.toHaveBeenCalled();
  m.rows.mockClear(); m.principal.mockRejectedValueOnce(new Error("current support denied"));
  await expect(inspectRollbackRequiredFieldMigrationReview(authority, intent)).rejects.toThrow("current support denied"); expect(m.rows).not.toHaveBeenCalled();
  await expect(inspectRollbackRequiredFieldMigrationReview({ ...authority, principal: { ...authority.principal, sessionVersion: 13 } }, intent)).rejects.toThrow(); expect(m.rows).not.toHaveBeenCalled();
  m.rollbackCoverage.mockRejectedValueOnce(new Error("current rollback cohort denied"));
  await expect(inspectRollbackRequiredFieldMigrationReview(authority, intent)).rejects.toThrow("current rollback cohort denied"); expect(m.rows).not.toHaveBeenCalled();
});
