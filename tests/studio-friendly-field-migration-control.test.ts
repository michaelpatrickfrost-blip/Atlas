import { beforeEach, expect, it, vi } from "vitest";
import type { Session } from "@/core/auth/session";
import type { FieldMigrationPrincipal } from "@/core/studio/fields/principal-contract";
import type { FieldMigrationAuthority } from "@/core/studio/fields/migrations/authority";
const m = vi.hoisted(() => ({ context: vi.fn(), resolve: vi.fn(), authority: vi.fn(), raw: vi.fn(), preparation: vi.fn(), versions: vi.fn(), nativeDefault: vi.fn(), enabled: vi.fn(), version: vi.fn(), definition: vi.fn(), progress: vi.fn(), publication: vi.fn(),
  preflight: vi.fn(), publish: vi.fn(), start: vi.fn(), batch: vi.fn(), cutover: vi.fn(), cancel: vi.fn(), rollback: vi.fn(), finalize: vi.fn(), inspect: vi.fn(), history: vi.fn(), coverage: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: {} }));
vi.mock("@/core/studio/authoring/field-migration-preview", async () => ({
  ...await vi.importActual<typeof import("@/core/studio/authoring/field-migration-preview")>("@/core/studio/authoring/field-migration-preview"),
  resolveAdditionalFieldMigrationContext: m.context, preflightAdditionalFieldMigration: m.preflight }));
vi.mock("@/core/studio/fields/migrations/authority", () => ({ withFieldMigrationAuthority: m.authority }));
vi.mock("@/core/studio/fields/principal", () => ({ resolveFieldMigrationPrincipal: m.resolve }));
vi.mock("@/core/studio/registry/runtime", () => ({ studioRegistry: () => registry }));
vi.mock("@/core/studio/fields/migrations/publication", () => ({ publishReviewedFieldMigration: m.publish }));
vi.mock("@/core/studio/fields/migrations/execution-start", () => ({ startFieldMigrationExecution: m.start }));
vi.mock("@/core/studio/fields/migrations/execution-batch", () => ({ executeFieldMigrationBatch: m.batch }));
vi.mock("@/core/studio/fields/migrations/cutover", () => ({ cutoverReviewedFieldMigration: m.cutover }));
vi.mock("@/core/studio/fields/migrations/cancellation", () => ({ cancelFieldMigrationPublication: m.cancel }));
vi.mock("@/core/studio/fields/migrations/settlement", () => ({ rollbackReviewedFieldMigration: m.rollback, finalizeReviewedFieldMigration: m.finalize }));
vi.mock("@/core/studio/fields/migrations/execution-inspection", () => ({ inspectFieldMigrationExecution: m.inspect }));
vi.mock("@/core/studio/fields/migrations/settlement-inspection", () => ({ inspectFieldMigrationSettlementIdentity: m.history }));
vi.mock("@/core/studio/fields/migrations/settlement-coverage", () => ({ validateFieldMigrationSettlementCoverage: m.coverage }));
import { CapabilityRegistry } from "@/core/studio/registry/registry";
import { ticketStudioContract } from "@/core/service-work/studio";
import { compileCustomField } from "@/core/studio/compiler/fields";
import { customFieldPayloadSchema } from "@/core/studio/fields/schema";
import { conditionalFieldPayloadSchema } from "@/core/studio/fields/required-contract";
import { compileConditionalCustomField } from "@/core/studio/fields/conditional-compiler";
import { registeredRequiredFactMetadata } from "@/core/studio/fields/required-owner";
import { sealRequiredFieldMigrationIntent, sealRequiredFieldMigrationReview } from "@/core/studio/fields/migrations/required-contracts";
import { sealFieldMigrationIntent, sealFieldMigrationReview } from "@/core/studio/fields/migrations/contracts";
import { publishAdditionalFieldMigration, startAdditionalFieldMigrationExecution, executeAdditionalFieldMigrationBatch, cutoverAdditionalFieldMigration,
  cancelAdditionalFieldMigration, rollbackAdditionalFieldMigration, finalizeAdditionalFieldMigration, readAdditionalFieldMigrationStatus, readAdditionalFieldMigrationRecoveryStatus } from "@/core/studio/authoring/field-migration-control";
import { authoriseAdditionalFieldMigrationHistoricalMetadata, authoriseAdditionalFieldMigrationMetadata } from "@/core/studio/authoring/field-migration-lifecycle";
import { additionalFieldMigrationDetailSchema, additionalFieldMigrationPreviewRequestSchema, additionalFieldMigrationSetupSchema } from "@/core/studio/authoring/field-migration-contract";
// Real registry/compiler and immutable closed1 intent/review seals. Engine/SQL,
// principal issuance and complete private snapshot/history coverage are explicit
// collaborators; original engine regression suites verify their implementation.
// These tests establish adapter ordering/dispatch/DTO/denial, not PostgreSQL proof.
const uuid = (n: number) => `81000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const registry = new CapabilityRegistry(async () => true); registry.register("tickets", ticketStudioContract);
const session: Session = { userId: "actor", userName: "Actor", userEmail: "actor@example.test", membershipId: "member", organisationId: "business", organisationName: "Business",
  capabilities: new Set(["studio.definition.publish", "tickets.ticket.read", "tickets.ticket.manage"]) };
const principal: FieldMigrationPrincipal = { authority: "customer", userId: "actor", membershipId: "member", organisationId: "business", authVersion: 1, sessionVersion: 2 };
const ref = (version: number) => { const d = registry.describe("tickets.ticket", version); return { id: d.id, version, schemaHash: d.schemaHash, contractHash: d.contractHash }; };
const source = customFieldPayloadSchema.parse({ schemaVersion: 1, entity: ref(2), storageGeneration: uuid(1), field: { key: "amount", label: "Amount", classification: "confidential",
  readCapability: "tickets.ticket.read", writeCapability: "tickets.ticket.manage", storage: { type: "integer" } } });
const target = customFieldPayloadSchema.parse({ ...source, entity: ref(9), storageGeneration: uuid(2), field: { ...source.field, storage: { type: "decimal" } } });
const scope = { definitionId: uuid(4), preparationId: uuid(3) }, hash = "a".repeat(64);
const tx = { serviceWorkItem: { findFirst: m.nativeDefault }, $queryRaw: m.raw, studioFieldMigrationPreparation: { findFirst: m.preparation }, studioDefinition: { findFirst: m.definition },
  moduleState: { findFirst: m.enabled }, studioDefinitionVersion: { findFirst: m.version, findMany: m.versions }, studioFieldMigrationExecution: { findFirst: m.progress }, studioFieldMigrationPublication: { findFirst: m.publication } };
let inside = false;
let saved: Awaited<ReturnType<typeof stored>>;
async function stored() {
  const from = await compileCustomField(session, source, registry), to = await compileCustomField(session, target, registry), query = registry.describe("tickets.ticket.field_migration", 4);
  const sealed = sealFieldMigrationIntent({ schemaVersion: 1, id: scope.preparationId, organisationId: session.organisationId, definitionId: scope.definitionId, definitionRevision: 7,
    principal, source: { versionId: uuid(6), versionChecksum: from.checksum, payload: from.payload }, target: { draftId: uuid(5), draftRevision: 9, compiledChecksum: to.checksum, payload: to.payload },
    conversion: { kind: "integer_to_decimal" }, ownerQuery: { id: query.id, version: query.version, schemaHash: query.schemaHash, contractHash: query.contractHash } });
  const reviewed = sealFieldMigrationReview({ ...sealed.intent, cohort: { recordCount: 3, observationDigest: "b".repeat(64) }, summary: { validCount: 3, invalidCount: 0, lossyCount: 0 } });
  return { id: scope.preparationId, organisationId: session.organisationId, definitionId: scope.definitionId, entityId: source.entity.id, sourceVersionId: uuid(6),
    sourceGenerationId: source.storageGeneration, targetGenerationId: target.storageGeneration, draftId: uuid(5), intent: sealed.intent, intentChecksum: sealed.checksum,
    revision: 2, state: "REVIEWED", review: { id: scope.preparationId, definitionId: scope.definitionId, organisationId: session.organisationId, review: reviewed.review, checksum: reviewed.checksum } };
}
const publishRequest = { ...scope, revision: 2, reviewChecksum: hash, acknowledgeWarnings: false, acknowledgeLoss: false };
const cutoverRequest = { ...scope, reviewChecksum: hash, definitionRevision: 7, publicationRevision: 0, executionRevision: 4 };
const settlementRequest = { ...scope, cutoverChecksum: hash, cutoverRevision: 0, definitionRevision: 8, publicationRevision: 1 };
function engine<T>(value: T) { return async () => { expect(inside).toBe(false); return value; }; }
beforeEach(async () => {
  vi.clearAllMocks(); saved = await stored(); inside = false;
  m.resolve.mockResolvedValue(session); m.context.mockResolvedValue({ session, principal }); m.preparation.mockImplementation(async () => saved); m.raw.mockResolvedValue([]);
  m.authority.mockImplementation(async (_s, p, callback) => { inside = true; try { return await callback({ session: _s, principal: p, transaction: tx,
    company: { id: "business", kind: "CUSTOMER", status: "ACTIVE", archivedAt: null, isTest: true } } as unknown as FieldMigrationAuthority); } finally { inside = false; } });
  const from = await compileCustomField(session, source, registry);
  m.definition.mockResolvedValue({ id: scope.definitionId, organisationId: "business", revision: 7, activeVersionId: uuid(6), activeVersion: {
    id: uuid(6), definitionId: scope.definitionId, organisationId: "business", schemaVersion: 1, payload: from.payload, compiledPlan: from.plan, checksum: from.checksum, version: 1 } });
  m.version.mockResolvedValue((await m.definition()).activeVersion); m.versions.mockResolvedValue([]); m.enabled.mockResolvedValue({ id: "module" }); m.nativeDefault.mockResolvedValue(null);
  m.publication.mockResolvedValue(null); m.progress.mockResolvedValue({ state: "RUNNING", revision: 1 }); m.preflight.mockResolvedValue({ count: 3 });
  m.publish.mockImplementation(engine({ id: scope.preparationId, state: "PUBLISHED", preparationRevision: 2, publicationRevision: 0, reviewChecksum: hash, sourceVersionId: uuid(6), targetVersionId: uuid(7), replayed: false }));
  m.start.mockImplementation(engine({ id: scope.preparationId, state: "RUNNING", revision: 0, processedCount: 0, cursor: null, failureCode: null, replayed: false }));
  m.batch.mockImplementation(engine({ id: scope.preparationId, state: "READY", revision: 4, processedCount: 3, cursor: "private-record", failureCode: null, replayed: false, appended: 2 }));
  m.cutover.mockImplementation(engine({ id: scope.preparationId, state: "ACTIVATED", definitionRevision: 8, publicationRevision: 1, executionRevision: 4, reviewChecksum: hash, targetVersionId: uuid(7), replayed: false }));
  m.cancel.mockImplementation(engine({ id: scope.preparationId, state: "CANCELLED", revision: 1, replayed: false }));
  m.rollback.mockImplementation(engine({ id: scope.preparationId, state: "ROLLED_BACK", settlementChecksum: hash, settledBy: "actor", replayed: false }));
  m.finalize.mockImplementation(engine({ id: scope.preparationId, state: "FINALIZED", settlementChecksum: hash, settledBy: "actor", replayed: false }));
  m.inspect.mockImplementation(async () => { expect(m.preflight).toHaveBeenCalled(); return { publication: { state: "PUBLISHED", revision: 0 }, pin: { cohort: { recordCount: 3 } },
    progress: { state: "READY", revision: 4, processedCount: 3, failureCode: null, cursor: "private-record" } }; });
  m.history.mockImplementation(async () => { expect(m.preflight).toHaveBeenCalled(); return { publication: { state: "CUTOVER", revision: 1 }, execution: { state: "READY", revision: 4, processedCount: 3, failureCode: null },
    executionPin: { cohort: { recordCount: 3 } }, retained: { checksum: hash, pin: { definitionRevision: 7, publication: { revision: 0 } } }, state: "ACTIVATED", receipt: { revision: 0 }, settlement: null }; });
  m.coverage.mockResolvedValue(undefined);
});
it("forwards exact explicit publication acknowledgements and engine stamps outside metadata transaction", async () => {
  const result = await publishAdditionalFieldMigration(session, undefined, publishRequest);
  expect(result).toMatchObject({ state: "PUBLISHED", reviewChecksum: hash }); expect(result).not.toHaveProperty("targetVersionId");
  const { definitionId, ...request } = publishRequest; void definitionId; expect(m.publish).toHaveBeenCalledWith(session, request);
  m.publish.mockRejectedValue(new Error("MIGRATION_INVALID_VALUES: invalid retained review"));
  await expect(publishAdditionalFieldMigration(session, undefined, publishRequest)).rejects.toThrow("invalid retained review");
  expect(m.publish).toHaveBeenCalledTimes(2); expect(m.start).not.toHaveBeenCalled();
});
it("starts once then explicitly resumes FAILED through the same original bounded execution service", async () => {
  expect(await startAdditionalFieldMigrationExecution(session, undefined, { ...scope, publicationRevision: 0, reviewChecksum: hash })).toMatchObject({ revision: 0, appended: 0 });
  m.progress.mockResolvedValue({ state: "FAILED", revision: 2 });
  const result = await executeAdditionalFieldMigrationBatch(session, undefined, { ...scope, revision: 2, expectedState: "FAILED", limit: 2 });
  expect(result).toMatchObject({ state: "READY", processedCount: 3, appended: 2 }); expect(result).not.toHaveProperty("cursor");
  expect(m.batch).toHaveBeenCalledWith(session, { preparationId: scope.preparationId, revision: 2, limit: 2 }); expect(m.batch).toHaveBeenCalledTimes(1);
});
it("requires explicit current FAILED resume, keeps old-revision/READY replay, and propagates original sparse failure evidence unchanged", async () => {
  m.progress.mockResolvedValue({ state: "FAILED", revision: 2 });
  await expect(executeAdditionalFieldMigrationBatch(session, undefined, { ...scope, revision: 2, expectedState: "RUNNING" })).rejects.toThrow(); expect(m.batch).not.toHaveBeenCalled();
  m.batch.mockImplementation(engine({ id: scope.preparationId, state: "READY", revision: 4, processedCount: 3, cursor: "secret", failureCode: null, replayed: true, appended: 0 }));
  expect(await executeAdditionalFieldMigrationBatch(session, undefined, { ...scope, revision: 1, expectedState: "RUNNING" })).toMatchObject({ replayed: true, appended: 0 });
  const error = Object.assign(new Error("The batch did not commit"), { code: "ACCESS_CHANGED", failureRecorded: false }); m.batch.mockRejectedValue(error);
  await expect(executeAdditionalFieldMigrationBatch(session, undefined, { ...scope, revision: 2, expectedState: "FAILED" })).rejects.toBe(error);
  expect(m.cancel).not.toHaveBeenCalled(); expect(m.cutover).not.toHaveBeenCalled();
});
it("cutover passes exact READY confirmation and preserves original nonTest/conditional readiness refusal without fallback", async () => {
  expect(await cutoverAdditionalFieldMigration(session, undefined, cutoverRequest)).toMatchObject({ state: "ACTIVATED", definitionRevision: 8 });
  const { definitionId, ...request } = cutoverRequest; void definitionId; expect(m.cutover).toHaveBeenCalledWith(session, request);
  m.cutover.mockRejectedValue(new Error("STUDIO_FIELD_REQUIRED_NOT_READY")); await expect(cutoverAdditionalFieldMigration(session, undefined, cutoverRequest)).rejects.toThrow("NOT_READY");
  expect(m.finalize).not.toHaveBeenCalled();
});
it("fresh support Audit can differ while exact initiating principal stamp stays mandatory for creator operations", async () => {
  const old = { ...principal, authority: "staff_support" as const, auditId: "original-purpose" }, sealed = sealFieldMigrationIntent({ ...saved.intent, principal: old });
  saved.intent = sealed.intent; saved.intentChecksum = sealed.checksum;
  m.context.mockResolvedValue({ session, principal: { ...old, auditId: "fresh-purpose" } });
  await publishAdditionalFieldMigration(session, "business", publishRequest);
  m.context.mockResolvedValue({ session, principal: { ...old, auditId: "another-purpose", sessionVersion: 3 } });
  await expect(publishAdditionalFieldMigration(session, "business", publishRequest)).rejects.toThrow(); expect(m.publish).toHaveBeenCalledTimes(1);
});
it("metadata cancellation permits a different CURRENT publisher after native grants are lost, preserving original sparse recovery", async () => {
  const current = { ...session, userId: "recovery", membershipId: "current", capabilities: new Set(["studio.definition.publish"]) }, now = { ...principal, userId: current.userId, membershipId: current.membershipId };
  m.context.mockResolvedValue({ session: current, principal: now });
  expect(await cancelAdditionalFieldMigration(current, undefined, { ...scope, revision: 0 })).toMatchObject({ state: "CANCELLED", revision: 1 });
  expect(m.cancel).toHaveBeenCalledWith(current, now, { preparationId: scope.preparationId, revision: 0 }); expect(m.preflight).not.toHaveBeenCalled();
  saved.state = "PREPARING"; await expect(cancelAdditionalFieldMigration(current, undefined, { ...scope, revision: 0 })).rejects.toThrow(); expect(m.cancel).toHaveBeenCalledTimes(1);
});
it("rollback and finalization are distinct explicit current-settler operations with unchanged receipt confirmation", async () => {
  const current = { ...session, userId: "settler", membershipId: "new-member" }, now = { ...principal, userId: current.userId, membershipId: current.membershipId, authVersion: 9 };
  m.context.mockResolvedValue({ session: current, principal: now });
  expect(await rollbackAdditionalFieldMigration(current, undefined, settlementRequest)).toMatchObject({ state: "ROLLED_BACK" });
  expect(await finalizeAdditionalFieldMigration(current, undefined, settlementRequest)).toMatchObject({ state: "FINALIZED" });
  const { definitionId, ...request } = settlementRequest; void definitionId; expect(m.rollback).toHaveBeenCalledWith(current, now, request); expect(m.finalize).toHaveBeenCalledWith(current, now, request);
  m.rollback.mockRejectedValue(new Error("REVIEW_CHANGED: target written since cutover")); await expect(rollbackAdditionalFieldMigration(current, undefined, settlementRequest)).rejects.toThrow("target written");
  expect(m.finalize).toHaveBeenCalledTimes(1);
});
it.each(["foreign", "definition", "checksum", "creator", "native_rights"])("denies %s before original creator operation effects", async kind => {
  if (kind === "foreign") saved.organisationId = "foreign";
  if (kind === "definition") saved.definitionId = uuid(99);
  if (kind === "checksum") saved.intentChecksum = "f".repeat(64);
  if (kind === "creator") m.context.mockResolvedValue({ session: { ...session, userId: "another" }, principal: { ...principal, userId: "another" } });
  if (kind === "native_rights") m.context.mockResolvedValue({ session: { ...session, capabilities: new Set(["studio.definition.publish", "tickets.ticket.read"]) }, principal });
  await expect(publishAdditionalFieldMigration(session, undefined, publishRequest)).rejects.toThrow(); expect(m.publish).not.toHaveBeenCalled();
});
it("a compiled conditional seal cannot manufacture genuine current runtime authority; sparse recovery remains closed1", async () => {
  const payload = conditionalFieldPayloadSchema.parse({ ...target, schemaVersion: 2,
    requiredIf: { match: "all", predicates: [{ source: { kind: "native", fieldId: "status" }, operator: "present" }] } });
  const compiled = await compileConditionalCustomField({ session, registry, definitionId: scope.definitionId, resolveMetadata: async fact => fact.kind === "native"
    ? registeredRequiredFactMetadata(session, registry, payload.entity, fact.fieldId) : Promise.reject(new Error("Unexpected custom fact")) }, payload);
  const sealed = sealRequiredFieldMigrationIntent({ ...saved.intent, schemaVersion: 2,
    target: { ...saved.intent.target, payload: compiled.payload, compiledChecksum: compiled.checksum } });
  const review = sealRequiredFieldMigrationReview({ ...sealed.intent, cohort: { recordCount: 3, observationDigest: "b".repeat(64) }, summary: { validCount: 3, invalidCount: 0, lossyCount: 0 } });
  m.preparation.mockResolvedValue({ ...saved, intent: sealed.intent, intentChecksum: sealed.checksum, review: { ...saved.review, review: review.review, checksum: review.checksum } });
  await expect(publishAdditionalFieldMigration(session, undefined, publishRequest)).rejects.toThrow("current authenticated");
  await expect(readAdditionalFieldMigrationStatus(session, undefined, scope)).rejects.toThrow("current authenticated");
  await expect(readAdditionalFieldMigrationRecoveryStatus(session, undefined, scope)).rejects.toThrow("Conditional field changes");
  expect(m.publish).not.toHaveBeenCalled(); expect(m.preflight).not.toHaveBeenCalled();
});
it("PUBLISHED status uses full original execution inspection after private preflight and omits cursor/IDs/principal", async () => {
  m.publication.mockResolvedValue({ ...scope, organisationId: "business", state: "PUBLISHED", revision: 0 });
  const result = await readAdditionalFieldMigrationStatus(session, undefined, scope);
  expect(result).toMatchObject({ publication: { state: "PUBLISHED", revision: 0 }, execution: { state: "READY", revision: 4, affectedCount: 3 }, currentHead: { definitionRevision: 7, versionLabel: "Version 1" } });
  expect(JSON.stringify(result)).not.toMatch(/private-record|principal|generation|valueId|cursor/); expect(m.history).not.toHaveBeenCalled();
});
it("terminal history uses CURRENT different settler's coverage and keeps original confirmation separate from today's head", async () => {
  const current = { ...session, userId: "new-settler", membershipId: "current" }, now = { ...principal, userId: current.userId, membershipId: current.membershipId };
  m.context.mockResolvedValue({ session: current, principal: now }); m.publication.mockResolvedValue({ ...scope, organisationId: "business", state: "COMPLETED", revision: 2 });
  await m.preflight(); const base = await m.history(); m.history.mockResolvedValue({ ...base, state: "FINALIZED", publication: { state: "COMPLETED", revision: 2 }, receipt: { revision: 1 }, settlement: { checksum: "c".repeat(64) } }); m.preflight.mockClear();
  const definition = await m.definition(); m.definition.mockResolvedValue({ ...definition, revision: 20 });
  const result = await readAdditionalFieldMigrationStatus(current, undefined, scope);
  expect(result).toMatchObject({ currentHead: { definitionRevision: 20 }, cutover: { state: "FINALIZED", confirmation: { definitionRevision: 8, publicationRevision: 1, cutoverRevision: 0 }, settlementChecksum: "c".repeat(64) } });
  expect(m.coverage.mock.calls[0][0].principal).toEqual(now); expect(m.coverage.mock.calls[0][3]).toBe("history"); expect(m.inspect).not.toHaveBeenCalled();
});
it("historical metadata omits unused deleted reference DEFAULT lookup while mutation preparation still authorises that real default", async () => {
  const payload = customFieldPayloadSchema.parse({ ...source, entity: ref(9), field: { ...source.field,
    storage: { type: "reference", entity: ref(9) }, defaultValue: { type: "reference", value: "deleted_default" } } });
  const authority = { session, principal, transaction: tx, company: { id: "business", kind: "CUSTOMER", status: "ACTIVE", archivedAt: null, isTest: true } } as unknown as FieldMigrationAuthority;
  await authoriseAdditionalFieldMigrationHistoricalMetadata(authority, scope.definitionId, payload, payload);
  expect(m.nativeDefault).not.toHaveBeenCalled();
  await expect(authoriseAdditionalFieldMigrationMetadata(authority, scope.definitionId, payload, payload)).rejects.toThrow(); expect(m.nativeDefault).toHaveBeenCalled();
  const denied = { ...authority, session: { ...session, capabilities: new Set(["studio.definition.publish", "tickets.ticket.manage"]) } };
  await expect(authoriseAdditionalFieldMigrationHistoricalMetadata(denied, scope.definitionId, payload, payload)).rejects.toThrow("tickets.ticket.read");
});
it.each(["read", "write", "foreign", "missing", "hash"])("retained written %s denial precedes review total disclosure without typed/default reads", async kind => {
  const payload = customFieldPayloadSchema.parse({ ...source, field: { ...source.field,
    ...(kind === "read" ? { readCapability: "tickets.ticket.private.read" } : {}), ...(kind === "write" ? { writeCapability: "tickets.ticket.private.write" } : {}) } });
  const fixturePublisher = { ...session, capabilities: new Set([...session.capabilities, "tickets.ticket.private.read", "tickets.ticket.private.write"]) };
  const compiled = await compileCustomField(fixturePublisher, payload, registry);
  const version = { id: uuid(20), definitionId: scope.definitionId, organisationId: kind === "foreign" ? "foreign" : "business", schemaVersion: 1,
    payload: compiled.payload, compiledPlan: compiled.plan, checksum: kind === "hash" ? "f".repeat(64) : compiled.checksum };
  m.raw.mockImplementation(async (text: TemplateStringsArray) => text.join("?").includes('SELECT DISTINCT v."versionId"') ? [{ versionId: uuid(20) }] : []);
  m.versions.mockResolvedValue(kind === "missing" ? [] : [version]);
  await expect(readAdditionalFieldMigrationStatus(session, undefined, scope)).rejects.toThrow(); expect(m.preflight).toHaveBeenCalled(); expect(m.inspect).not.toHaveBeenCalled(); expect(m.history).not.toHaveBeenCalled();
  expect(m.versions).toHaveBeenCalledWith(expect.objectContaining({ where: { id: { in: [uuid(20)] }, organisationId: "business", definitionId: scope.definitionId } }));
});
it("current active logical field drift refuses status before private counts or progress", async () => {
  const definition = await m.definition(), version = definition.activeVersion;
  m.definition.mockResolvedValue({ ...definition, activeVersion: { ...version, payload: { ...version.payload, field: { ...version.payload.field, key: "another_field" } } } });
  await expect(readAdditionalFieldMigrationStatus(session, undefined, scope)).rejects.toThrow(); expect(m.preflight).not.toHaveBeenCalled(); expect(m.inspect).not.toHaveBeenCalled();
});
it("source version/hash drift refuses status before private cohort or protected progress reads", async () => {
  const version = await m.version(); m.version.mockResolvedValue({ ...version, checksum: "f".repeat(64) });
  await expect(readAdditionalFieldMigrationStatus(session, undefined, scope)).rejects.toThrow(); expect(m.preflight).not.toHaveBeenCalled(); expect(m.inspect).not.toHaveBeenCalled();
});
it("PUBLISHED creator status refuses a revoked original purpose principal before protected progress is returned", async () => {
  m.publication.mockResolvedValue({ ...scope, organisationId: "business", state: "PUBLISHED", revision: 0 });
  m.resolve.mockRejectedValue(new Error("FORBIDDEN: retained support purpose revoked"));
  await expect(readAdditionalFieldMigrationStatus(session, undefined, scope)).rejects.toThrow("purpose revoked"); expect(m.inspect).not.toHaveBeenCalled();
});
it("private/current access rejection precedes history/progress inspection, and unchanged counts never assert READY", async () => {
  m.publication.mockResolvedValue({ ...scope, organisationId: "business", state: "PUBLISHED", revision: 0 }); m.preflight.mockRejectedValue(new Error("FORBIDDEN: private queue"));
  await expect(readAdditionalFieldMigrationStatus(session, undefined, scope)).rejects.toThrow("private queue"); expect(m.inspect).not.toHaveBeenCalled(); expect(m.history).not.toHaveBeenCalled();
  m.preflight.mockResolvedValue({ count: 3 }); m.inspect.mockRejectedValue(new Error("REVIEW_CHANGED: native cohort drift"));
  await expect(readAdditionalFieldMigrationStatus(session, undefined, scope)).rejects.toThrow("cohort drift");
});
it("CANCELLED status validates sealed lineage but discloses only sparse metadata after native access loss", async () => {
  m.context.mockResolvedValue({ session: { ...session, capabilities: new Set(["studio.definition.publish"]) }, principal });
  m.publication.mockResolvedValue({ ...scope, organisationId: "business", state: "CANCELLED", revision: 1, reviewChecksum: saved.review.checksum,
    sourceGenerationId: source.storageGeneration, targetGenerationId: target.storageGeneration, targetChecksum: saved.intent.target.compiledChecksum, publisherUserId: principal.userId });
  const result = await readAdditionalFieldMigrationStatus(session, undefined, scope);
  expect(result).toMatchObject({ publication: { state: "CANCELLED" }, review: null, execution: null, fieldLabel: null, currentHead: null }); expect(m.preflight).not.toHaveBeenCalled();
  const publication = await m.publication(); m.publication.mockResolvedValue({ ...publication, reviewChecksum: hash });
  await expect(readAdditionalFieldMigrationStatus(session, undefined, scope)).rejects.toThrow();
});
it("rejects arbitrary authority/mode/cursor/forced state/target/coerced bounds before genuine context opens", async () => {
  for (const extra of [{ organisationId: "foreign" }, { principal }, { targetVersionId: uuid(99) }, { cursor: "secret" }, { state: "READY" }, { mode: "finalize" }])
    await expect(publishAdditionalFieldMigration(session, undefined, { ...publishRequest, ...extra })).rejects.toThrow();
  await expect(executeAdditionalFieldMigrationBatch(session, undefined, { ...scope, revision: "1", expectedState: "RUNNING" })).rejects.toThrow();
  await expect(executeAdditionalFieldMigrationBatch(session, undefined, { ...scope, revision: 1, expectedState: "RUNNING", limit: 51 })).rejects.toThrow();
  await expect(rollbackAdditionalFieldMigration(session, undefined, { ...settlementRequest, cutoverRevision: 1 })).rejects.toThrow();
  expect(m.context).not.toHaveBeenCalled();
});
it("read-only preparation status retains saved review while no lifecycle operation starts implicitly", async () => {
  const result = await readAdditionalFieldMigrationStatus(session, undefined, scope);
  expect(result).toMatchObject({ preparationState: "REVIEWED", preparationRevision: 2, publication: null, execution: null, cutover: null, review: { affectedCount: 3, invalid: 0 } });
  expect(m.publish).not.toHaveBeenCalled(); expect(m.start).not.toHaveBeenCalled(); expect(m.batch).not.toHaveBeenCalled(); expect(m.cancel).not.toHaveBeenCalled();
});
it("saved response revisions allow SQL integer ceiling while requests reserve the final transition", () => {
  expect(additionalFieldMigrationSetupSchema.parse({ definitionId: scope.definitionId, definitionRevision: 2147483647, draftRevision: 2147483647, sourceVersionId: uuid(6), source: { kind: "read_only", reason: "unsupported" }, target: { kind: "read_only", reason: "unsupported" }, sourceChoiceLabels: [], targetChoiceSourceIndexes: [] }).definitionRevision).toBe(2147483647);
  expect(additionalFieldMigrationDetailSchema.safeParse({ ...scope, revision: 2147483647, state: "PREPARING", fieldLabel: "Amount", currentAffectedCount: 0, review: null, rows: [], nextCursor: null, countsScope: "sealed_review_or_unavailable", impact: { index: [], uniquenessCheck: false, rollbackLimit: "reverse_review_after_target_writes" } }).success).toBe(true);
  expect(additionalFieldMigrationPreviewRequestSchema.safeParse({ definitionId: scope.definitionId, definitionRevision: 2147483647, draftRevision: 0, sourceVersionId: uuid(6), conversion: { kind: "integer_to_decimal" } }).success).toBe(false);
});

function recoveryPublication() {
  return { ...scope, organisationId: session.organisationId, state: "PUBLISHED", revision: 0,
    reviewChecksum: saved.review.checksum, sourceGenerationId: source.storageGeneration,
    targetGenerationId: target.storageGeneration, targetChecksum: saved.intent.target.compiledChecksum, publisherUserId: principal.userId };
}
it("explicit recovery exposes only scoped sealed publication metadata with fresh different publisher and no private/value traversal", async () => {
  const current = { ...session, userId: "recovery", membershipId: "new", capabilities: new Set(["studio.definition.publish"]) };
  m.context.mockResolvedValue({ session: current, principal: { ...principal, userId: "recovery", membershipId: "new" } });
  m.publication.mockResolvedValue(recoveryPublication());
  const result = await readAdditionalFieldMigrationRecoveryStatus(current, undefined, scope);
  expect(result).toEqual({ ...scope, preparationState: "REVIEWED", publicationState: "PUBLISHED", publicationRevision: 0 });
  expect(m.publication).toHaveBeenCalledWith({ where: { ...scope, organisationId: session.organisationId } });
  for (const protectedRead of [m.preflight, m.nativeDefault, m.version, m.versions, m.definition, m.progress, m.inspect, m.history, m.coverage]) protectedRead.mockClear();
  await readAdditionalFieldMigrationRecoveryStatus(current, undefined, scope);
  for (const protectedRead of [m.preflight, m.nativeDefault, m.version, m.versions, m.definition, m.progress, m.inspect, m.history, m.coverage]) expect(protectedRead).not.toHaveBeenCalled();
  expect(m.raw.mock.calls.every(([query]) => !query.join("?").match(/studio_field_values|studio_field_migration_observations|service_work_items|studio_field_migration_outcomes/))).toBe(true);
  expect(m.cancel).not.toHaveBeenCalled(); expect(m.publish).not.toHaveBeenCalled();
});
it("recovery reports inactive preparation and terminal publication states without inventing cancellation or current live state", async () => {
  saved.state = "PREPARING"; m.preparation.mockResolvedValue({ ...saved, review: null });
  expect(await readAdditionalFieldMigrationRecoveryStatus(session, undefined, scope)).toEqual({ ...scope, preparationState: "PREPARING", publicationState: null, publicationRevision: null });
  m.preparation.mockImplementation(async () => saved); saved.state = "REVIEWED";
  for (const state of ["CUTOVER", "CANCELLED", "ROLLED_BACK", "COMPLETED"]) {
    m.publication.mockResolvedValue({ ...recoveryPublication(), state, revision: 2 });
    expect(await readAdditionalFieldMigrationRecoveryStatus(session, undefined, scope)).toMatchObject({ publicationState: state, publicationRevision: 2 });
  }
  expect(m.cancel).not.toHaveBeenCalled(); expect(m.coverage).not.toHaveBeenCalled();
});
it.each(["tenant", "definition", "intent_hash", "review_hash", "publication_scope", "publication_hash", "publisher", "target"])("recovery %s mirror/seal denial precedes any native traversal", async kind => {
  m.publication.mockResolvedValue(recoveryPublication());
  if (kind === "tenant") saved.organisationId = "foreign";
  if (kind === "definition") saved.definitionId = uuid(90);
  if (kind === "intent_hash") saved.intentChecksum = "f".repeat(64);
  if (kind === "review_hash") saved.review.checksum = "f".repeat(64);
  const publication = recoveryPublication();
  if (kind === "publication_scope") publication.definitionId = uuid(99);
  if (kind === "publication_hash") publication.reviewChecksum = hash;
  if (kind === "publisher") publication.publisherUserId = "another";
  if (kind === "target") publication.targetChecksum = "f".repeat(64);
  m.publication.mockResolvedValue(publication);
  await expect(readAdditionalFieldMigrationRecoveryStatus(session, undefined, scope)).rejects.toThrow();
  expect(m.preflight).not.toHaveBeenCalled(); expect(m.inspect).not.toHaveBeenCalled(); expect(m.cancel).not.toHaveBeenCalled();
});
it("recovery refuses revoked current Publish and forged request metadata before accessing operation or native data", async () => {
  for (const extra of [{ organisationId: "foreign" }, { principal }, { state: "PUBLISHED" }, { publicationRevision: 0 }])
    await expect(readAdditionalFieldMigrationRecoveryStatus(session, undefined, { ...scope, ...extra })).rejects.toThrow();
  expect(m.context).not.toHaveBeenCalled();
  m.context.mockResolvedValue({ session: { ...session, capabilities: new Set(["tickets.ticket.read"]) }, principal });
  await expect(readAdditionalFieldMigrationRecoveryStatus(session, undefined, scope)).rejects.toThrow("studio.definition.publish");
  expect(m.preparation).not.toHaveBeenCalled(); expect(m.preflight).not.toHaveBeenCalled();
  m.context.mockRejectedValue(new Error("FORBIDDEN: genuine support/session access required"));
  await expect(readAdditionalFieldMigrationRecoveryStatus(session, "foreign", scope)).rejects.toThrow("genuine");
  expect(m.preparation).not.toHaveBeenCalled();
});
