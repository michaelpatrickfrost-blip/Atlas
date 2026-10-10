import { beforeEach, expect, it, vi } from "vitest";
import type { FieldMigrationAuthority } from "@/core/studio/fields/migrations/authority";
const m = vi.hoisted(() => ({ initial: vi.fn(), authority: vi.fn(), inspect: vi.fn(), window: vi.fn(), coverage: vi.fn(), receipt: vi.fn(), publication: vi.fn(), activate: vi.fn(), audit: vi.fn(), enabled: vi.fn(), registry: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: { studioFieldMigrationPreparation: { findFirst: m.initial } } }));
vi.mock("@/core/modules/access", () => ({ assertModuleEnabled: m.enabled }));
vi.mock("@/core/audit/log", () => ({ writeAudit: m.audit }));
vi.mock("@/core/studio/registry/runtime", () => ({ studioRegistry: m.registry }));
vi.mock("@/core/studio/fields/migrations/authority", () => ({ withFieldMigrationAuthority: m.authority }));
vi.mock("@/core/studio/fields/migrations/settlement-inspection", () => ({ inspectFieldMigrationSettlementIdentity: m.inspect, inspectFieldMigrationSettlementWindow: m.window }));
vi.mock("@/core/studio/fields/migrations/settlement-coverage", () => ({ validateFieldMigrationSettlementCoverage: m.coverage }));
vi.mock("@/core/studio/definitions/activation", () => ({ activateCompiledVersionInTransaction: m.activate }));
import { rollbackReviewedFieldMigration, finalizeReviewedFieldMigration } from "@/core/studio/fields/migrations/settlement";
import { retainedCutoverFixture, settleCutoverFixture } from "./fixtures/studio-field-cutover";
let f: Awaited<ReturnType<typeof retainedCutoverFixture>>, authority: FieldMigrationAuthority;
beforeEach(async () => {
  vi.resetAllMocks(); f = await retainedCutoverFixture();
  authority = { session: { ...f.session, userId: "current-actor", membershipId: "current-member" }, principal: { ...f.intent.principal, userId: "current-actor", membershipId: "current-member" },
    company: { id: "company", kind: "CUSTOMER", status: "ACTIVE", archivedAt: null, isTest: true },
    transaction: { studioFieldMigrationCutover: { updateMany: m.receipt }, studioFieldMigrationPublication: { updateMany: m.publication } } as unknown as FieldMigrationAuthority["transaction"] };
  m.initial.mockImplementation(async () => f.preparation); m.registry.mockReturnValue(f.registry);
  m.inspect.mockImplementation(async () => ({ ...f, state: f.receipt.state, settlement: f.receipt.settlementPin === null ? null : { pin: f.receipt.settlementPin, checksum: f.receipt.settlementChecksum } }));
  m.authority.mockImplementation(async (_session, _principal, operation) => operation(authority));
  m.receipt.mockResolvedValue({ count: 1 }); m.publication.mockResolvedValue({ count: 1 });
});
const request = () => ({ preparationId: f.intent.id, cutoverChecksum: f.retained.checksum, cutoverRevision: 0, definitionRevision: 9, publicationRevision: 1 });
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
