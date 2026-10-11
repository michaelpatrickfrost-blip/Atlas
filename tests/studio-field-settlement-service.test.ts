import { beforeEach, expect, it, vi } from "vitest";
import type { FieldMigrationAuthority } from "@/core/studio/fields/migrations/authority";
const m = vi.hoisted(() => ({ initial: vi.fn(), authority: vi.fn(), inspect: vi.fn(), window: vi.fn(), coverage: vi.fn(), receipt: vi.fn(), publication: vi.fn(), activate: vi.fn(), audit: vi.fn(), enabled: vi.fn(), registry: vi.fn(), requiredInspect: vi.fn(), requiredCoverage: vi.fn(), metadata: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: { studioFieldMigrationPreparation: { findFirst: m.initial } } }));
vi.mock("@/core/modules/access", () => ({ assertModuleEnabled: m.enabled }));
vi.mock("@/core/audit/log", () => ({ writeAudit: m.audit }));
vi.mock("@/core/studio/registry/runtime", () => ({ studioRegistry: m.registry }));
vi.mock("@/core/studio/fields/migrations/authority", () => ({ withFieldMigrationAuthority: m.authority }));
vi.mock("@/core/studio/fields/migrations/settlement-inspection", () => ({ inspectFieldMigrationSettlementIdentity: m.inspect, inspectRequiredFieldMigrationSettlementIdentity: m.requiredInspect, inspectFieldMigrationSettlementWindow: m.window }));
vi.mock("@/core/studio/fields/migrations/settlement-coverage", () => ({ validateFieldMigrationSettlementCoverage: m.coverage, validateRequiredFieldMigrationSettlementCoverage: m.requiredCoverage }));
vi.mock("@/core/studio/definitions/activation", () => ({ activateCompiledVersionInTransaction: m.activate }));
vi.mock("@/core/studio/fields/migrations/metadata", () => ({ compileFieldMigrationMetadata: m.metadata }));
import { conditionalFieldPayloadSchema } from "@/core/studio/fields/required-contract";
import { compileConditionalCustomField } from "@/core/studio/fields/conditional-compiler";
import { compileCustomField } from "@/core/studio/compiler/fields";
import { registeredRequiredFactMetadata } from "@/core/studio/fields/required-owner";
import { checksum } from "@/core/studio/registry/contracts";
import { sealRequiredFieldMigrationIntent, sealRequiredFieldMigrationReview } from "@/core/studio/fields/migrations/required-contracts";
import { reviewedRequiredFieldPublicationPin } from "@/core/studio/fields/migrations/publication-contract";
import { createRequiredFieldMigrationExecutionPin } from "@/core/studio/fields/migrations/execution-contract";
import { createRequiredFieldMigrationCutoverPin } from "@/core/studio/fields/migrations/cutover-contract";
import { createFieldMigrationSettlementPin, fieldMigrationSettlementTransition } from "@/core/studio/fields/migrations/settlement-contract";
import { rollbackReviewedFieldMigration, finalizeReviewedFieldMigration } from "@/core/studio/fields/migrations/settlement";
import { retainedCutoverFixture, settleCutoverFixture } from "./fixtures/studio-field-cutover";
let f: Awaited<ReturnType<typeof retainedCutoverFixture>>, authority: FieldMigrationAuthority;
let usingRequired = false, rf: Awaited<ReturnType<typeof requiredFixture>>;
beforeEach(async () => {
  vi.resetAllMocks(); usingRequired = false; f = await retainedCutoverFixture();
  authority = { session: { ...f.session, userId: "current-actor", membershipId: "current-member" }, principal: { ...f.intent.principal, userId: "current-actor", membershipId: "current-member" },
    company: { id: "company", kind: "CUSTOMER", status: "ACTIVE", archivedAt: null, isTest: true },
    transaction: { studioFieldMigrationCutover: { updateMany: m.receipt }, studioFieldMigrationPublication: { updateMany: m.publication } } as unknown as FieldMigrationAuthority["transaction"] };
  m.initial.mockImplementation(async () => usingRequired ? rf.preparation : f.preparation); m.registry.mockReturnValue(f.registry);
  m.inspect.mockImplementation(async () => ({ ...f, state: f.receipt.state, settlement: f.receipt.settlementPin === null ? null : { pin: f.receipt.settlementPin, checksum: f.receipt.settlementChecksum } }));
  m.authority.mockImplementation(async (_session, _principal, operation) => operation(authority));
  m.receipt.mockResolvedValue({ count: 1 }); m.publication.mockResolvedValue({ count: 1 });
});
const request = () => ({ preparationId: f.intent.id, cutoverChecksum: usingRequired ? rf.retained.checksum : f.retained.checksum, cutoverRevision: 0, definitionRevision: 9, publicationRevision: 1 });
const call = (rollback = true, input: unknown = request()) => (rollback ? rollbackReviewedFieldMigration : finalizeReviewedFieldMigration)(authority.session, authority.principal, input);
it("rollback uses current authority, exact one-time CAS, shared source activation and paired Audit", async () => {
  expect(await call()).toMatchObject({ state: "ROLLED_BACK", replayed: false, settledBy: "current-actor" });
  expect(m.authority.mock.calls[0][1]).toEqual(authority.principal); expect(m.authority.mock.calls[0][1]).not.toEqual(f.intent.principal);
  expect(m.coverage).toHaveBeenCalledWith(authority, f.registry, expect.anything(), "rollback");
  expect(m.receipt.mock.calls[0][0].where).toMatchObject({ organisationId: "company", state: "ACTIVATED", revision: 0 });
  expect(m.publication.mock.calls[0][0].where).toMatchObject({ state: "CUTOVER", revision: 1 });
  expect(m.activate).toHaveBeenCalledWith(authority.transaction, authority.session, f.intent.definitionId, 9, f.source, expect.objectContaining({ checksum: f.source.checksum }), f.target.id);
  expect(m.audit.mock.calls[0][0]).toMatchObject({ actorUserId: "current-actor", action: "studio.field.migration.rolled_back", after: { definitionRevision: 10, publicationRevision: 2 } });
});
it("finalization closes eligibility without activating or writing any domain/value data", async () => {
  expect(await call(false)).toMatchObject({ state: "FINALIZED", replayed: false });
  expect(m.coverage).toHaveBeenCalledWith(authority, f.registry, expect.anything(), "history"); expect(m.activate).not.toHaveBeenCalled();
  expect(m.audit.mock.calls[0][0]).toMatchObject({ action: "studio.field.migration.finalized", after: { definitionRevision: 9 } });
});
it.each(["ROLLED_BACK", "FINALIZED"] as const)("%s replay checks current history coverage and reports actual old actor without mutation", async disposition => {
  settleCutoverFixture(f, disposition); f.definition.revision += 10;
  authority.session = { ...authority.session, userId: "another-current-actor", membershipId: "another-current-member" };
  authority.principal = { ...authority.principal, userId: authority.session.userId, membershipId: authority.session.membershipId };
  expect(await call(disposition === "ROLLED_BACK")).toMatchObject({ state: disposition, replayed: true, settledBy: "current-actor" });
  expect(m.window).not.toHaveBeenCalled(); expect(m.receipt).not.toHaveBeenCalled(); expect(m.publication).not.toHaveBeenCalled(); expect(m.activate).not.toHaveBeenCalled(); expect(m.audit).not.toHaveBeenCalled();
  expect(m.coverage).toHaveBeenCalledWith(authority, f.registry, expect.anything(), "history");
  await expect(call(disposition !== "ROLLED_BACK")).rejects.toThrow("stale or has changed");
});
it("stale confirmation, client tenant/mode/grants and unavailable preparation fail before mutations", async () => {
  for (const patch of [{ cutoverChecksum: "f".repeat(64) }, { definitionRevision: 10 }, { publicationRevision: 2 }, { organisationId: "foreign" }, { mode: "ROLLED_BACK" }, { capabilities: ["*"] }])
    await expect(call(true, { ...request(), ...patch })).rejects.toThrow();
  expect(m.receipt).not.toHaveBeenCalled();
  m.initial.mockResolvedValue(null); await expect(call()).rejects.toThrow("stale or has changed");
});
it("coverage or CAS failure prevents activation; Audit failure propagates to the shared transaction", async () => {
  m.coverage.mockRejectedValue(new Error("FORBIDDEN: revoked")); await expect(call()).rejects.toThrow("revoked"); expect(m.receipt).not.toHaveBeenCalled();
  m.coverage.mockResolvedValue(undefined); m.publication.mockResolvedValue({ count: 0 }); await expect(call()).rejects.toThrow("stale or has changed"); expect(m.activate).not.toHaveBeenCalled();
  m.publication.mockResolvedValue({ count: 1 }); m.audit.mockRejectedValue(new Error("Audit unavailable")); await expect(call()).rejects.toThrow("Audit unavailable");
});


async function requiredFixture(sourceConditional = false, targetConditional = true) {
  const ref = (id: string, version: number) => { const d = f.registry.describe(id, version); return { id, version, schemaHash: d.schemaHash, contractHash: d.contractHash }; };
  const conditional = (payload: typeof f.source.payload) => conditionalFieldPayloadSchema.parse({ ...payload, schemaVersion: 2,
    entity: ref("tickets.ticket", 9), requiredIf: { match: "all", predicates: [{ source: { kind: "native", fieldId: "status" }, operator: "present" }] } });
  const compile = (input: ReturnType<typeof conditional>) => compileConditionalCustomField({ session: f.session, registry: f.registry, definitionId: f.intent.definitionId,
    resolveMetadata: async source => source.kind === "native" ? registeredRequiredFactMetadata(f.session, f.registry, input.entity, source.fieldId) : Promise.reject(new Error("Unexpected fixture field")) }, input);
  const a = sourceConditional ? await compile(conditional(f.source.payload)) : await compileCustomField(f.session, f.source.payload, f.registry);
  const b = targetConditional ? await compile(conditional(f.target.payload)) : await compileCustomField(f.session, { ...f.target.payload, entity: ref("tickets.ticket", 9) }, f.registry);
  const sealed = sealRequiredFieldMigrationIntent({ ...f.intent, schemaVersion: 2, ownerQuery: ref("tickets.ticket.field_migration", 4),
    source: { ...f.intent.source, payload: a.payload, versionChecksum: a.checksum }, target: { ...f.intent.target, payload: b.payload, compiledChecksum: b.checksum } });
  const stored = sealRequiredFieldMigrationReview({ ...sealed.intent, cohort: f.stored.review.cohort, summary: f.stored.review.summary });
  const source = { ...f.source, schemaVersion: a.payload.schemaVersion, createdBy: "historical-author", payload: a.payload, compiledPlan: a.plan, checksum: a.checksum };
  const target = { ...f.target, schemaVersion: b.payload.schemaVersion, createdBy: "actor", payload: b.payload, compiledPlan: b.plan, checksum: b.checksum };
  const projectedTarget = { ...f.target, payload: b.payload, compiledPlan: b.plan, checksum: b.checksum };
  const publication = { ...reviewedRequiredFieldPublicationPin(stored, projectedTarget, "actor", false), state: "PUBLISHED", revision: 0 };
  const identity = Object.fromEntries(Object.entries(publication).filter(([key]) => key !== "state" && key !== "revision"));
  const pinned = createRequiredFieldMigrationExecutionPin(stored, projectedTarget, identity,
    f.registry.describe("tickets.ticket", 9), f.registry.describe("tickets.ticket.field_representation", 2));
  const execution = { ...f.execution, pin: pinned.pin, pinChecksum: pinned.checksum };
  const retained = createRequiredFieldMigrationCutoverPin(stored, execution, publication, { ...f.definition, activeVersionId: source.id, revision: 8 });
  m.metadata.mockImplementation(async (_context, _registry, _company, _definitionId, input) => checksum(input) === checksum(a.payload) ? a : b);
  return { intent: sealed.intent, stored, retained, source, target, execution,
    preparation: { ...f.preparation, intent: sealed.intent, intentChecksum: sealed.checksum, review: { ...f.preparation.review, ...stored } },
    receipt: { ...f.receipt, pin: retained.pin, pinChecksum: retained.checksum }, publication: { ...publication, state: "CUTOVER", revision: 1 },
    definition: structuredClone(f.definition), draft: { ...f.draft, payload: b.payload } };
}
async function useRequired(sourceConditional = false, targetConditional = true) {
  rf = await requiredFixture(sourceConditional, targetConditional); usingRequired = true;
  // Identity, whole-cohort coverage and activation are collaborators here. Real
  // compilers and closed2/receipt1 parsers run; snapshotting tx mocks establish
  // propagation/atomic orchestration, not PostgreSQL or current-policy proof.
  m.requiredInspect.mockImplementation(async () => ({ ...rf, state: rf.receipt.state,
    settlement: rf.receipt.settlementPin === null ? null : { pin: rf.receipt.settlementPin, checksum: rf.receipt.settlementChecksum } }));
  m.authority.mockImplementation(async (_session, _principal, operation) => {
    const before = structuredClone({ receipt: rf.receipt, publication: rf.publication, definition: rf.definition });
    try { return await operation(authority); } catch (error) { Object.assign(rf, before); throw error; }
  });
  m.receipt.mockImplementation(async ({ where, data }) => {
    if (where.state !== rf.receipt.state || where.revision !== rf.receipt.revision) return { count: 0 };
    Object.assign(rf.receipt, data); return { count: 1 };
  });
  m.publication.mockImplementation(async ({ where, data }) => {
    if (where.state !== rf.publication.state || where.revision !== rf.publication.revision) return { count: 0 };
    Object.assign(rf.publication, data); return { count: 1 };
  });
  m.activate.mockImplementation(async (_tx, _actor, _definition, _revision, version) => {
    Object.assign(rf.definition, { activeVersionId: version.id, revision: rf.definition.revision + 1 });
    await m.audit({ action: "studio.definition.activated" }, authority.transaction);
  });
}
function retainRequiredSettlement(disposition: "ROLLED_BACK" | "FINALIZED") {
  const packet = createFieldMigrationSettlementPin(rf.retained, authority.principal, disposition), transition = fieldMigrationSettlementTransition(packet.pin);
  Object.assign(rf.receipt, { ...transition.cutover, settlementPin: packet.pin, settlementChecksum: packet.checksum,
    settledBy: authority.principal.userId, settledAt: new Date() }); Object.assign(rf.publication, transition.publication);
  return packet;
}
it.each([[false, true], [true, false]])("normal required rollback uses a different current settler for source2=%s,target2=%s", async (source2, target2) => {
  await useRequired(source2, target2); const originalPrincipal = structuredClone(rf.intent.principal), source = structuredClone(rf.source), target = structuredClone(rf.target);
  expect(await call()).toMatchObject({ state: "ROLLED_BACK", replayed: false, settledBy: "current-actor" });
  expect(m.authority.mock.calls[0][1]).toEqual(authority.principal); expect(m.authority.mock.calls[0][1]).not.toEqual(rf.intent.principal);
  expect(m.requiredCoverage).toHaveBeenCalledWith(authority, f.registry, expect.anything(), "rollback"); expect(m.coverage).not.toHaveBeenCalled();
  expect(m.metadata.mock.calls[0][0]).toEqual({ session: authority.session, transaction: authority.transaction }); expect(m.metadata.mock.calls[0][4]).toEqual(rf.source.payload);
  expect(m.activate.mock.calls[0][4]).toEqual(rf.source); expect(m.activate.mock.calls[0][5]).toMatchObject({ checksum: rf.source.checksum });
  expect(m.audit.mock.calls.map(([arg]) => arg.action)).toEqual(["studio.definition.activated", "studio.field.migration.rolled_back"]);
  expect(rf.intent.principal).toEqual(originalPrincipal); expect(rf.source).toEqual(source); expect(rf.target).toEqual(target);
});
it("Test gate restricts only new conditional-source activation, preserving ordinary source rollback and finalization", async () => {
  await useRequired(true, false); authority.company.isTest = false;
  await expect(call()).rejects.toThrow("STUDIO_FIELD_REQUIRED_NOT_READY");
  expect(m.window).not.toHaveBeenCalled(); expect(m.requiredCoverage).not.toHaveBeenCalled(); expect(m.receipt).not.toHaveBeenCalled(); expect(m.activate).not.toHaveBeenCalled();
  expect(await call(false)).toMatchObject({ state: "FINALIZED", replayed: false }); expect(m.requiredCoverage).toHaveBeenCalledWith(authority, f.registry, expect.anything(), "history"); expect(m.activate).not.toHaveBeenCalled();
  await useRequired(false, true); expect(await call()).toMatchObject({ state: "ROLLED_BACK", replayed: false });
});
it.each(["ROLLED_BACK", "FINALIZED"] as const)("required %s replay survives later configuration/actor changes with current history coverage and no Test activation gate", async disposition => {
  await useRequired(true, false); const packet = retainRequiredSettlement(disposition); rf.definition.revision = 99; rf.definition.activeVersionId = "later-version";
  authority.company.isTest = false; authority.session = { ...authority.session, userId: "another-current", membershipId: "another-member" };
  authority.principal = { ...authority.principal, userId: authority.session.userId, membershipId: authority.session.membershipId };
  expect(await call(disposition === "ROLLED_BACK")).toMatchObject({ replayed: true, settledBy: "current-actor", settlementChecksum: packet.checksum });
  expect(m.requiredCoverage).toHaveBeenCalledWith(authority, f.registry, expect.anything(), "history"); expect(m.window).not.toHaveBeenCalled();
  for (const mock of [m.receipt, m.publication, m.activate, m.metadata, m.audit]) expect(mock).not.toHaveBeenCalled();
  m.requiredCoverage.mockRejectedValueOnce(new Error("FORBIDDEN: current private/history access")); await expect(call(disposition === "ROLLED_BACK")).rejects.toThrow("private/history");
});
it("required receipt/publication/activation/Audit failures restore exact retained state and allow retry", async () => {
  await useRequired(true, false); const before = structuredClone({ receipt: rf.receipt, publication: rf.publication, definition: rf.definition });
  for (const reject of [() => m.receipt.mockResolvedValueOnce({ count: 0 }), () => m.publication.mockResolvedValueOnce({ count: 0 }),
    () => m.activate.mockRejectedValueOnce(new Error("activation unavailable")), () => m.audit.mockRejectedValueOnce(new Error("activation Audit unavailable")),
    () => { m.audit.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error("settlement Audit unavailable")); }]) {
    reject(); await expect(call()).rejects.toThrow(); expect({ receipt: rf.receipt, publication: rf.publication, definition: rf.definition }).toEqual(before);
  }
  expect(await call()).toMatchObject({ state: "ROLLED_BACK", replayed: false });
});
it("required service rejects stored scalar drift, client format, current coverage and conditional compile failure without legacy fallback", async () => {
  await useRequired(true, false);
  for (const patch of [{ organisationId: "foreign" }, { definitionId: "foreign" }, { id: "foreign" }, { intentChecksum: "a".repeat(64) }]) {
    m.initial.mockResolvedValueOnce({ ...rf.preparation, ...patch }); await expect(call()).rejects.toThrow();
  }
  await expect(call(true, { ...request(), schemaVersion: 2 })).rejects.toThrow();
  m.requiredCoverage.mockRejectedValueOnce(new Error("FORBIDDEN: current rollback conditions")); await expect(call()).rejects.toThrow("rollback conditions"); expect(m.receipt).not.toHaveBeenCalled();
  m.metadata.mockRejectedValueOnce(new Error("FORBIDDEN: conditional graph unavailable")); await expect(call()).rejects.toThrow("graph unavailable");
  expect(rf.receipt.state).toBe("ACTIVATED"); expect(rf.publication.state).toBe("CUTOVER"); expect(m.activate).not.toHaveBeenCalled(); expect(m.coverage).not.toHaveBeenCalled();
});
