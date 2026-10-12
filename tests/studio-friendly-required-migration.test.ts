import { beforeEach, expect, it, vi } from "vitest";
import type { Session } from "@/core/auth/session";
import type { Prisma } from "@/generated/prisma/client";
import type { FieldMigrationPrincipal } from "@/core/studio/fields/principal-contract";
const m = vi.hoisted(() => ({ context: vi.fn(), authority: vi.fn(), refresh: vi.fn(), resolve: vi.fn(), raw: vi.fn(), definition: vi.fn(),
  preparation: vi.fn(), publication: vi.fn(), version: vi.fn(), versions: vi.fn(), module: vi.fn(), member: vi.fn(), native: vi.fn(), count: vi.fn(),
  generation: vi.fn(), progress: vi.fn(), startPreparation: vi.fn(), collect: vi.fn(), seal: vi.fn(), publish: vi.fn(), start: vi.fn(), batch: vi.fn(),
  cutover: vi.fn(), cancel: vi.fn(), rollback: vi.fn(), finalize: vi.fn(), execution2: vi.fn(), history2: vi.fn(), coverage2: vi.fn(), legacy: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: {} }));
vi.mock("@/core/studio/authoring/field-migration-preview", async original => ({
  ...await original<typeof import("@/core/studio/authoring/field-migration-preview")>(), resolveAdditionalFieldMigrationContext: m.context }));
vi.mock("@/core/studio/fields/migrations/authority", () => ({ withFieldMigrationAuthority: m.authority }));
vi.mock("@/core/studio/fields/runtime-authority", () => ({ fieldRuntimeAuthorityInTransaction: m.refresh }));
vi.mock("@/core/studio/fields/principal", () => ({ resolveFieldMigrationPrincipal: m.resolve }));
vi.mock("@/core/studio/registry/runtime", () => ({ studioRegistry: () => registry }));
vi.mock("@/core/studio/fields/migrations/preparation", () => ({ startFieldMigrationPreparation: m.startPreparation }));
vi.mock("@/core/studio/fields/migrations/collection", () => ({ collectFieldMigrationBatch: m.collect }));
vi.mock("@/core/studio/fields/migrations/sealing", () => ({ sealFieldMigrationPreparation: m.seal }));
vi.mock("@/core/studio/fields/migrations/publication", () => ({ publishReviewedFieldMigration: m.publish }));
vi.mock("@/core/studio/fields/migrations/execution-start", () => ({ startFieldMigrationExecution: m.start }));
vi.mock("@/core/studio/fields/migrations/execution-batch", () => ({ executeFieldMigrationBatch: m.batch }));
vi.mock("@/core/studio/fields/migrations/cutover", () => ({ cutoverReviewedFieldMigration: m.cutover }));
vi.mock("@/core/studio/fields/migrations/cancellation", () => ({ cancelFieldMigrationPublication: m.cancel }));
vi.mock("@/core/studio/fields/migrations/settlement", () => ({ rollbackReviewedFieldMigration: m.rollback, finalizeReviewedFieldMigration: m.finalize }));
vi.mock("@/core/studio/fields/migrations/execution-inspection", () => ({ inspectRequiredFieldMigrationExecution: m.execution2, inspectFieldMigrationExecution: m.legacy }));
vi.mock("@/core/studio/fields/migrations/settlement-inspection", () => ({ inspectRequiredFieldMigrationSettlementIdentity: m.history2, inspectFieldMigrationSettlementIdentity: m.legacy }));
vi.mock("@/core/studio/fields/migrations/settlement-coverage", () => ({ validateRequiredFieldMigrationSettlementCoverage: m.coverage2, validateFieldMigrationSettlementCoverage: m.legacy }));
import { CapabilityRegistry } from "@/core/studio/registry/registry";
import { ticketStudioContract } from "@/core/service-work/studio";
import { versionedFieldPayloadSchema, type VersionedFieldPayload } from "@/core/studio/fields/required-contract";
import { compileFieldMigrationMetadata } from "@/core/studio/fields/migrations/metadata";
import { sealRequiredFieldMigrationIntent, sealRequiredFieldMigrationReview } from "@/core/studio/fields/migrations/required-contracts";
import { prepareAdditionalFieldMigration, collectAdditionalFieldMigration, sealAdditionalFieldMigration } from "@/core/studio/authoring/field-migration-lifecycle";
import { publishAdditionalFieldMigration, startAdditionalFieldMigrationExecution, executeAdditionalFieldMigrationBatch, cutoverAdditionalFieldMigration,
  rollbackAdditionalFieldMigration, finalizeAdditionalFieldMigration, cancelAdditionalFieldMigration, readAdditionalFieldMigrationStatus,
  readAdditionalFieldMigrationRecoveryStatus } from "@/core/studio/authoring/field-migration-control";

// Real owner registry/compiler, current conditional graph provider and closed2
// pure seals. Session/SQL and ORIGINAL lifecycle/stage inspectors are explicit
// collaborators; these tests verify adapter dispatch/order, never SQL commits,
// native conversion writes or genuine cookie/session issuance.
const uuid = (n: number) => `82000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const registry = new CapabilityRegistry(async () => true); registry.register("tickets", ticketStudioContract);
const session: Session = { organisationId: "company", organisationName: "Company", userId: "actor", userName: "Actor", userEmail: "actor@example.test", membershipId: "member",
  capabilities: new Set(["studio.definition.publish", "tickets.ticket.read", "tickets.ticket.manage"]) };
const principal: FieldMigrationPrincipal = { organisationId: "company", userId: "actor", membershipId: "member", authVersion: 1, sessionVersion: 2, authority: "customer" };
const company = { id: "company", kind: "CUSTOMER" as const, status: "ACTIVE" as const, archivedAt: null, isTest: true };
const scope = { definitionId: uuid(4), preparationId: uuid(3) }, hash = "a".repeat(64);
const ref = () => { const r = registry.describe("tickets.ticket", 9); return { id: r.id, version: r.version, schemaHash: r.schemaHash, contractHash: r.contractHash }; };
const tx = { $queryRaw: m.raw, studioDefinition: { findFirst: m.definition }, studioDefinitionVersion: { findFirst: m.version, findMany: m.versions },
  studioFieldMigrationPreparation: { findFirst: m.preparation }, studioFieldMigrationPublication: { findFirst: m.publication }, studioFieldMigrationExecution: { findFirst: m.progress },
  moduleState: { findFirst: m.module }, membership: { findFirst: m.member }, serviceWorkItem: { findFirst: m.native, count: m.count }, studioFieldGeneration: { findFirst: m.generation } } as unknown as Prisma.TransactionClient;
let inside: boolean, definition: Awaited<ReturnType<typeof fixture>>["definition"], saved: Awaited<ReturnType<typeof fixture>>["saved"];
let versions: Map<string, Awaited<ReturnType<typeof fixture>>["sourceVersion"]>, events: string[];
function payload(generation: number, conditional: boolean): VersionedFieldPayload {
  const base = { schemaVersion: 1, entity: ref(), storageGeneration: uuid(generation), field: { key: "detail", label: "Details", classification: "confidential", storage: { type: "boolean" } } };
  return versionedFieldPayloadSchema.parse(conditional ? { ...base, schemaVersion: 2,
    requiredIf: { match: "all", predicates: [{ source: { kind: "native", fieldId: "status" }, operator: "equals", value: { type: "enum", value: "NEW" } }] } } : base);
}
async function fixture(source2 = false, target2 = true) {
  const root = { id: scope.definitionId, organisationId: "company", kind: "customField", key: "tickets.ticket.detail", retiredAt: null,
    revision: 7, activeVersionId: uuid(6), activeVersion: {} as object, draft: { id: uuid(5), organisationId: "company", definitionId: scope.definitionId, revision: 9, payload: payload(2, target2) } };
  m.definition.mockResolvedValue(root);
  const source = await compileFieldMigrationMetadata({ session, transaction: tx }, registry, company, scope.definitionId, payload(1, source2)),
    target = await compileFieldMigrationMetadata({ session, transaction: tx }, registry, company, scope.definitionId, root.draft.payload);
  const sourceVersion = { id: uuid(6), organisationId: "company", definitionId: scope.definitionId, version: 1, schemaVersion: source.payload.schemaVersion,
    payload: source.payload, compiledPlan: source.plan, checksum: source.checksum };
  const targetVersion = { ...sourceVersion, id: uuid(7), version: 2, schemaVersion: target.payload.schemaVersion, payload: target.payload, compiledPlan: target.plan, checksum: target.checksum };
  const query = registry.describe("tickets.ticket.field_migration", 4);
  const intent = sealRequiredFieldMigrationIntent({ schemaVersion: 2, id: scope.preparationId, organisationId: "company", definitionId: scope.definitionId, definitionRevision: 7, principal,
    source: { versionId: sourceVersion.id, versionChecksum: source.checksum, payload: source.payload }, target: { draftId: uuid(5), draftRevision: 9, compiledChecksum: target.checksum, payload: target.payload },
    conversion: { kind: "same_type" }, ownerQuery: { id: query.id, version: query.version, schemaHash: query.schemaHash, contractHash: query.contractHash } });
  const review = sealRequiredFieldMigrationReview({ ...intent.intent, cohort: { recordCount: 1, observationDigest: "b".repeat(64) }, summary: { validCount: 1, invalidCount: 0, lossyCount: 0 } });
  const definition = { ...root, activeVersion: sourceVersion };
  const saved = { id: scope.preparationId, organisationId: "company", definitionId: scope.definitionId, entityId: "tickets.ticket", sourceVersionId: uuid(6), sourceGenerationId: uuid(1), targetGenerationId: uuid(2), draftId: uuid(5),
    intent: intent.intent, intentChecksum: intent.checksum, state: "REVIEWED", revision: 2, review: { id: scope.preparationId, organisationId: "company", definitionId: scope.definitionId, review: review.review, checksum: review.checksum } };
  return { definition, saved, sourceVersion, targetVersion };
}
const prepareRequest = { operationId: scope.preparationId, definitionId: scope.definitionId, definitionRevision: 7, draftRevision: 9, sourceVersionId: uuid(6), conversion: { kind: "same_type" } };
const publishRequest = { ...scope, revision: 2, reviewChecksum: hash, acknowledgeWarnings: false, acknowledgeLoss: false };
const settlementRequest = { ...scope, cutoverChecksum: hash, cutoverRevision: 0, definitionRevision: 9, publicationRevision: 1 };
function engine<T>(value: T) { return async () => { expect(inside).toBe(false); return value; }; }
beforeEach(async () => {
  vi.clearAllMocks(); inside = false; events = [];
  m.context.mockResolvedValue({ session, principal }); m.resolve.mockResolvedValue(session);
  m.authority.mockImplementation(async (actor, p, callback) => { inside = true; try { return await callback({ session: actor, principal: p, transaction: tx, company }); } finally { inside = false; } });
  m.refresh.mockImplementation(async actor => ({ session: actor, stamp: { ...principal }, transaction: tx, registry }));
  m.module.mockResolvedValue({ id: "available" }); m.member.mockResolvedValue({ id: "member" }); m.generation.mockResolvedValue({ id: uuid(1) });
  m.native.mockResolvedValue(null); m.count.mockImplementation(async () => { events.push("private_preflight"); return 1; });
  m.raw.mockImplementation(async sql => { if (sql.join("").includes("SHOW transaction_isolation")) return [{ transaction_isolation: "serializable" }];
    if (sql.join("").includes("SELECT DISTINCT v")) events.push("written_metadata"); return []; });
  const f = await fixture(); definition = f.definition; saved = f.saved; versions = new Map([[uuid(6), f.sourceVersion], [uuid(7), f.targetVersion]]);
  m.definition.mockImplementation(async () => definition); m.preparation.mockImplementation(async () => saved); m.publication.mockResolvedValue(null);
  m.version.mockImplementation(async ({ where }) => versions.get(where.id) ?? null); m.versions.mockResolvedValue([]); m.progress.mockResolvedValue({ state: "RUNNING", revision: 1 });
  m.startPreparation.mockImplementation(engine({ id: scope.preparationId, revision: 0, state: "PREPARING" }));
  m.collect.mockImplementation(engine({ id: scope.preparationId, revision: 1, state: "PREPARING", replayed: false, appended: 1, cursorExhausted: true }));
  m.seal.mockImplementation(engine({ id: scope.preparationId, revision: 2, state: "REVIEWED", checksum: hash, cohort: { recordCount: 1 }, summary: { validCount: 1, invalidCount: 0, lossyCount: 0 }, indexImpact: [], rollbackLimit: "reverse_review_after_target_writes", replayed: false }));
  m.publish.mockImplementation(engine({ id: scope.preparationId, state: "PUBLISHED", preparationRevision: 2, publicationRevision: 0, reviewChecksum: hash, replayed: false }));
  m.start.mockImplementation(engine({ id: scope.preparationId, state: "RUNNING", revision: 0, processedCount: 0, failureCode: null, replayed: false }));
  m.batch.mockImplementation(engine({ id: scope.preparationId, state: "READY", revision: 3, processedCount: 1, failureCode: null, replayed: false, appended: 1 }));
  m.cutover.mockImplementation(engine({ id: scope.preparationId, state: "ACTIVATED", definitionRevision: 9, publicationRevision: 1, executionRevision: 3, reviewChecksum: hash, replayed: false }));
  m.rollback.mockImplementation(engine({ id: scope.preparationId, state: "ROLLED_BACK", settlementChecksum: hash, replayed: false }));
  m.finalize.mockImplementation(engine({ id: scope.preparationId, state: "FINALIZED", settlementChecksum: hash, replayed: false }));
  m.execution2.mockImplementation(async () => { events.push("execution2"); return { publication: { state: "PUBLISHED", revision: 0 }, progress: { state: "READY", revision: 3, processedCount: 1, failureCode: null }, pin: { cohort: { recordCount: 1 } } }; });
  m.history2.mockImplementation(async () => { events.push("history2"); return { publication: { state: "CUTOVER", revision: 1 }, execution: { state: "READY", revision: 3, processedCount: 1, failureCode: null }, executionPin: { cohort: { recordCount: 1 } },
    state: "ACTIVATED", receipt: { revision: 0 }, retained: { checksum: hash, pin: { definitionRevision: 8, publication: { revision: 0 } } }, settlement: null }; });
  m.coverage2.mockResolvedValue(undefined); m.legacy.mockImplementation(() => { throw new Error("Unexpected closed1 entry"); });
  m.refresh.mockClear();
});
it("prepares exact saved target2, collects and seals through original APIs; request carries no protocol or condition input", async () => {
  expect(await prepareAdditionalFieldMigration(session, undefined, prepareRequest)).toMatchObject({ state: "PREPARING" });
  expect(m.startPreparation).toHaveBeenCalledWith(session, principal, { operationId: scope.preparationId, definitionId: scope.definitionId, definitionRevision: 7, draftRevision: 9, conversion: { kind: "same_type" } });
  saved.state = "PREPARING"; saved.revision = 0;
  expect(await collectAdditionalFieldMigration(session, undefined, { ...scope, revision: 0, expectedState: "PREPARING" })).toMatchObject({ appended: 1 });
  expect(await sealAdditionalFieldMigration(session, undefined, { ...scope, revision: 0, expectedState: "PREPARING" })).toMatchObject({ affectedCount: 1, valid: 1 });
  expect(m.legacy).not.toHaveBeenCalled();
});
it("published lifecycle dispatch preserves original refusals and recorded FAILED state; never falls back to old protocol", async () => {
  await publishAdditionalFieldMigration(session, undefined, publishRequest);
  await startAdditionalFieldMigrationExecution(session, undefined, { ...scope, publicationRevision: 0, reviewChecksum: hash });
  await executeAdditionalFieldMigrationBatch(session, undefined, { ...scope, revision: 1, expectedState: "RUNNING" });
  m.progress.mockResolvedValue({ state: "FAILED", revision: 2 }); m.batch.mockRejectedValue(Object.assign(new Error("actual conversion failed"), { failureRecorded: true }));
  await expect(executeAdditionalFieldMigrationBatch(session, undefined, { ...scope, revision: 2, expectedState: "FAILED" })).rejects.toMatchObject({ failureRecorded: true });
  m.cutover.mockRejectedValue(new Error("STUDIO_FIELD_REQUIRED_NOT_READY: Test only"));
  await expect(cutoverAdditionalFieldMigration(session, undefined, { ...scope, reviewChecksum: hash, definitionRevision: 8, publicationRevision: 0, executionRevision: 3 })).rejects.toThrow("Test only");
  expect(m.legacy).not.toHaveBeenCalled();
});
it("PUBLISHED status uses actual required inspector after complete current/private/written preflight and retains original support principal", async () => {
  m.publication.mockResolvedValue({ ...scope, organisationId: "company", state: "PUBLISHED", revision: 0 });
  const result = await readAdditionalFieldMigrationStatus(session, undefined, scope);
  expect(result).toMatchObject({ review: { affectedCount: 1 }, execution: { state: "READY", processedCount: 1 } });
  expect(events).toEqual(["private_preflight", "written_metadata", "execution2"]);
  expect(m.execution2).toHaveBeenCalledWith(expect.objectContaining({ principal: saved.intent.principal }), saved.intent);
  expect(JSON.stringify(result)).not.toMatch(/ownerQuery|fingerprint|authVersion|predicates/); expect(m.legacy).not.toHaveBeenCalled();
});
it("CUTOVER/terminal history uses current different actor, full sealed metadata plus base policy; old conditional graph/creator is never recomputed", async () => {
  const f = await fixture(true, false); definition = f.definition; saved = f.saved;
  versions = new Map([[uuid(6), f.sourceVersion], [uuid(7), f.targetVersion]]);
  definition.activeVersion = f.targetVersion; definition.activeVersionId = uuid(7); definition.revision = 12;
  m.definition.mockImplementation(async () => definition);
  const current = { ...session, userId: "settler", membershipId: "settler-member" }, currentPrincipal = { ...principal, userId: current.userId, membershipId: current.membershipId };
  m.context.mockResolvedValue({ session: current, principal: currentPrincipal }); m.refresh.mockRejectedValue(new Error("Today's old input graph unavailable")); m.refresh.mockClear();
  m.resolve.mockImplementation(async p => { if (p.userId === principal.userId) throw new Error("Original creator revoked"); return current; });
  for (const state of ["CUTOVER", "ROLLED_BACK", "COMPLETED"]) {
    m.publication.mockResolvedValue({ ...scope, organisationId: "company", state, revision: 1, targetVersionId: uuid(7) });
    const result = await readAdditionalFieldMigrationStatus(current, undefined, scope);
    expect(result.cutover?.confirmation).toEqual({ cutoverRevision: 0, definitionRevision: 9, publicationRevision: 1 });
  }
  expect(m.refresh).not.toHaveBeenCalled(); expect(m.resolve).not.toHaveBeenCalled(); expect(m.legacy).not.toHaveBeenCalled();
  expect(m.coverage2).toHaveBeenCalledWith(expect.objectContaining({ session: current, principal: currentPrincipal }), registry, expect.any(Object), "history");
});
it("settlement delegates current principal without compiling old condition graph or inventing source activation authority", async () => {
  const current = { ...session, userId: "settler", membershipId: "new" }, p = { ...principal, userId: "settler", membershipId: "new" };
  m.context.mockResolvedValue({ session: current, principal: p }); m.refresh.mockRejectedValue(new Error("Old graph changed"));
  await rollbackAdditionalFieldMigration(current, undefined, settlementRequest); await finalizeAdditionalFieldMigration(current, undefined, settlementRequest);
  expect(m.rollback).toHaveBeenCalledWith(current, p, { preparationId: scope.preparationId, cutoverChecksum: hash, cutoverRevision: 0, definitionRevision: 9, publicationRevision: 1 });
  expect(m.refresh).not.toHaveBeenCalled();
});
it.each(["private", "write", "written", "seal", "target_seal"])("status %s failure cannot disclose counts or call required history inspector", async mode => {
  m.publication.mockResolvedValue({ ...scope, organisationId: "company", state: "CUTOVER", revision: 1, targetVersionId: uuid(7) });
  if (mode === "private") m.native.mockResolvedValue({ id: "private" });
  if (mode === "write") m.context.mockResolvedValue({ session: { ...session, capabilities: new Set(["studio.definition.publish", "tickets.ticket.read"]) }, principal });
  if (mode === "written") { m.raw.mockImplementation(async sql => sql.join("").includes("SHOW transaction_isolation") ? [{ transaction_isolation: "serializable" }] : sql.join("").includes("SELECT DISTINCT v") ? [{ versionId: uuid(7) }] : []);
    const denied = { ...versions.get(uuid(7))!, payload: { ...versions.get(uuid(7))!.payload, field: { ...versions.get(uuid(7))!.payload.field, readCapability: "private.read" } } };
    m.versions.mockResolvedValue([denied]); }
  if (mode === "seal") versions.get(uuid(6))!.checksum = "f".repeat(64);
  if (mode === "target_seal") versions.get(uuid(7))!.checksum = "f".repeat(64);
  await expect(readAdditionalFieldMigrationStatus(session, undefined, scope)).rejects.toThrow();
  expect(m.history2).not.toHaveBeenCalled(); expect(m.execution2).not.toHaveBeenCalled();
  if (mode !== "written") expect(m.count).not.toHaveBeenCalled();
});
it.each([false, true])("closed2 sparse recovery/cancellation use original metadata engine without condition/count/progress evaluation (rule removal=%s)", async removal => {
  if (removal) saved = (await fixture(true, false)).saved;
  expect(await readAdditionalFieldMigrationRecoveryStatus(session, undefined, scope)).toEqual({ ...scope, preparationState: "REVIEWED", publicationState: null, publicationRevision: null });
  await expect(cancelAdditionalFieldMigration(session, undefined, { ...scope, revision: 0 })).rejects.toMatchObject({ code: "REVIEW_CHANGED" });
  const publication = { ...scope, organisationId: "company", state: "PUBLISHED", revision: 0, reviewChecksum: saved.review.checksum,
    sourceGenerationId: saved.sourceGenerationId, targetGenerationId: saved.targetGenerationId, targetChecksum: saved.intent.target.compiledChecksum, publisherUserId: principal.userId };
  m.publication.mockResolvedValue(publication);
  m.cancel.mockImplementation(engine({ id: scope.preparationId, state: "CANCELLED", revision: 1, replayed: false }));
  await cancelAdditionalFieldMigration(session, undefined, { ...scope, revision: 0 });
  expect(m.cancel).toHaveBeenCalledWith(session, principal, { preparationId: scope.preparationId, revision: 0 });
  m.publication.mockResolvedValue({ ...publication, state: "CANCELLED", revision: 1 });
  expect(await readAdditionalFieldMigrationStatus(session, undefined, scope)).toMatchObject({ publication: { state: "CANCELLED", revision: 1 }, review: null, execution: null, fieldLabel: null });
  expect(m.count).not.toHaveBeenCalled(); expect(m.native).not.toHaveBeenCalled(); expect(m.execution2).not.toHaveBeenCalled();
});
it.each(["protocol", "checksum", "generation", "creator", "revision"])("closed2 %s drift rejects before original lifecycle effect", async mode => {
  if (mode === "protocol") await expect(publishAdditionalFieldMigration(session, undefined, { ...publishRequest, schemaVersion: 2 })).rejects.toThrow();
  if (mode === "checksum") saved.intentChecksum = "f".repeat(64);
  if (mode === "generation") saved.targetGenerationId = uuid(99);
  if (mode === "creator") m.context.mockResolvedValue({ session: { ...session, userId: "other" }, principal: { ...principal, userId: "other" } });
  if (mode === "revision") { m.progress.mockResolvedValue({ state: "FAILED", revision: 1 }); await expect(executeAdditionalFieldMigrationBatch(session, undefined, { ...scope, revision: 2, expectedState: "FAILED" })).rejects.toThrow(); }
  if (mode !== "protocol" && mode !== "revision") await expect(publishAdditionalFieldMigration(session, undefined, publishRequest)).rejects.toThrow();
  expect(m.publish).not.toHaveBeenCalled(); expect(m.batch).not.toHaveBeenCalled();
});
