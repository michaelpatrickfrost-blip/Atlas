import { beforeEach, expect, it, vi } from "vitest";
import type { Prisma } from "@/generated/prisma/client";
import { closeFieldWriteWindow } from "@/core/studio/fields/runtime-write-window";
import { retainedCutoverFixture, cutoverUuid as uuid } from "./fixtures/studio-field-cutover";
import type { FieldRuntimeAuthority } from "@/core/studio/fields/runtime-authority";
import type { FieldWriteRequest } from "@/core/studio/fields/runtime-write-contract";
import { compileCustomField } from "@/core/studio/compiler/fields";
import { compileConditionalCustomField } from "@/core/studio/fields/conditional-compiler";
import { registeredRequiredFactMetadata } from "@/core/studio/fields/required-owner";
import { sealRequiredFieldMigrationIntent, sealRequiredFieldMigrationReview } from "@/core/studio/fields/migrations/required-contracts";
import { reviewedRequiredFieldPublicationPin } from "@/core/studio/fields/migrations/publication-contract";
import { createRequiredFieldMigrationExecutionPin } from "@/core/studio/fields/migrations/execution-contract";
import { createRequiredFieldMigrationCutoverPin } from "@/core/studio/fields/migrations/cutover-contract";
import { checksum } from "@/core/studio/registry/contracts";
const m = vi.hoisted(() => ({ publication: vi.fn(), preparation: vi.fn(), inspection: vi.fn(), required: vi.fn(), window: vi.fn(), cutover: vi.fn(), update: vi.fn(), audit: vi.fn() }));
vi.mock("@/core/studio/fields/migrations/settlement-inspection", () => ({ inspectFieldMigrationSettlementIdentity: m.inspection,
  inspectRequiredFieldMigrationSettlementIdentity: m.required, inspectFieldMigrationSettlementWindow: m.window }));
let f: Awaited<ReturnType<typeof retainedCutoverFixture>>;
let authority: FieldRuntimeAuthority;
let request: FieldWriteRequest;
// Real stored2 seals/compiler and pure receipt1 packets. The immutable/window
// inspectors and transactional mutations are explicit bounded collaborators;
// no actual SQL freshness, owner permission or database rollback proof is claimed.
async function requiredFixture(targetConditional = true) {
  const ref = (id: string, version: number) => { const metadata = f.registry.describe(id, version);
    return { id, version, schemaHash: metadata.schemaHash, contractHash: metadata.contractHash }; };
  const entity = ref("tickets.ticket", 9);
  const compile = async (base: typeof f.source.payload, conditional: boolean) => conditional
    ? compileConditionalCustomField({ session: f.session, registry: f.registry, definitionId: f.definition.id,
      resolveMetadata: async source => registeredRequiredFactMetadata(f.session, f.registry, entity, source.kind === "native" ? source.fieldId : "invalid") },
    { ...base, schemaVersion: 2, entity, requiredIf: { match: "all", predicates: [{ source: { kind: "native", fieldId: "status" }, operator: "present" }] } })
    : compileCustomField(f.session, { ...base, entity }, f.registry);
  const a = await compile(f.source.payload, !targetConditional), b = await compile(f.target.payload, targetConditional);
  const source = { ...f.source, schemaVersion: a.plan.schemaVersion, payload: a.payload, compiledPlan: a.plan, checksum: a.checksum };
  const target = { ...f.target, schemaVersion: b.plan.schemaVersion, payload: b.payload, compiledPlan: b.plan, checksum: b.checksum };
  const sealed = sealRequiredFieldMigrationIntent({ ...f.intent, schemaVersion: 2, ownerQuery: ref("tickets.ticket.field_migration", 4),
    source: { ...f.intent.source, payload: source.payload, versionChecksum: source.checksum },
    target: { ...f.intent.target, payload: target.payload, compiledChecksum: target.checksum } });
  const stored = sealRequiredFieldMigrationReview({ ...sealed.intent, cohort: f.stored.review.cohort, summary: f.stored.review.summary });
  const targetProjection = { id: target.id, organisationId: target.organisationId, definitionId: target.definitionId, version: target.version,
    checksum: target.checksum, payload: target.payload, compiledPlan: target.compiledPlan };
  const published = { ...reviewedRequiredFieldPublicationPin(stored, targetProjection, "actor", false), state: "PUBLISHED", revision: 0 };
  const identity = Object.fromEntries(Object.entries(published).filter(([key]) => key !== "state" && key !== "revision"));
  const pin = createRequiredFieldMigrationExecutionPin(stored, targetProjection, identity, f.registry.describe("tickets.ticket", 9), f.registry.describe("tickets.ticket.field_representation", 2));
  const execution = { ...f.execution, pin: pin.pin, pinChecksum: pin.checksum };
  const retained = createRequiredFieldMigrationCutoverPin(stored, execution, published, { ...f.definition, activeVersionId: source.id, revision: sealed.intent.definitionRevision + 1 });
  return { ...f, intent: sealed.intent, stored, source, target, execution, retained, state: "ACTIVATED",
    preparation: { ...f.preparation, intent: sealed.intent, intentChecksum: sealed.checksum, review: { ...f.preparation.review, ...stored } },
    publication: { ...published, state: "CUTOVER", revision: 1 },
    receipt: { ...f.receipt, pin: retained.pin, pinChecksum: retained.checksum } };
}
function useRequiredFixture(g: Awaited<ReturnType<typeof requiredFixture>>) {
  m.publication.mockResolvedValue(g.publication); m.preparation.mockResolvedValue(g.preparation); m.required.mockResolvedValue(g);
}
beforeEach(async () => {
  vi.resetAllMocks(); f = await retainedCutoverFixture();
  authority = { session: { ...f.session, capabilities: new Set(["tickets.ticket.read", "tickets.ticket.manage"]) }, registry: f.registry,
    stamp: { userId: "actor", organisationId: "company", membershipId: "member", authVersion: 3, sessionVersion: 2 },
    transaction: { studioFieldMigrationPublication: { findFirst: m.publication, updateMany: m.update }, studioFieldMigrationPreparation: { findFirst: m.preparation }, studioFieldMigrationCutover: { updateMany: m.cutover }, auditEntry: { create: m.audit } } as unknown as Prisma.TransactionClient };
  request = { operationId: uuid(60), definitionId: f.definition.id, versionId: f.target.id, generationId: f.target.payload.storageGeneration,
    definitionRevision: f.definition.revision, recordId: "native", recordRevision: 7, extensionRevision: 3, slotRevision: 1, valueRevision: 1, value: "12.5" };
  m.publication.mockResolvedValue({ ...f.publication, state: "CUTOVER" }); m.preparation.mockResolvedValue(f.preparation);
  m.inspection.mockResolvedValue(f);
  m.cutover.mockResolvedValue({ count: 1 }); m.update.mockResolvedValue({ count: 1 }); m.audit.mockResolvedValue({ id: "support-audit" });
});
it("closes only the actual unchanged target window with current customer identity and paired metadata Audit", async () => {
  await closeFieldWriteWindow(authority, request);
  expect(m.window).toHaveBeenCalledWith(authority.transaction, expect.anything(), "FINALIZED");
  expect(m.cutover).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ organisationId: "company", state: "ACTIVATED", revision: 0 }), data: expect.objectContaining({ state: "FINALIZED", revision: 1, settledBy: "actor", settlementPin: expect.objectContaining({ principal: { ...authority.stamp, authority: "customer" } }) }) }));
  expect(m.update).toHaveBeenCalledWith(expect.objectContaining({ data: { state: "COMPLETED", revision: 2 } }));
  expect(m.audit).toHaveBeenCalledTimes(1); expect(m.audit.mock.calls[0][0].data.after.trigger).toBe("ordinary_field_save");
  expect(authority.session.capabilities.has("studio.definition.publish")).toBe(false);
});
it("performs no settlement outside a window and freezes source/unfinished target saves before mutation", async () => {
  m.publication.mockResolvedValue(null); await closeFieldWriteWindow(authority, request); expect(m.inspection).not.toHaveBeenCalled();
  for (const state of ["PUBLISHED", "CUTOVER"]) {
    m.publication.mockResolvedValue({ ...f.publication, state });
    await expect(closeFieldWriteWindow(authority, { ...request, generationId: f.source.payload.storageGeneration })).rejects.toThrow("FIELD_MIGRATION_IN_PROGRESS");
  }
  expect(m.cutover).not.toHaveBeenCalled(); expect(m.audit).not.toHaveBeenCalled();
});
it("rejects stale configuration before a receipt, and propagates Audit/CAS failure for atomic rollback", async () => {
  await expect(closeFieldWriteWindow(authority, { ...request, definitionRevision: 99 })).rejects.toThrow("CONFLICT"); expect(m.cutover).not.toHaveBeenCalled();
  m.cutover.mockResolvedValue({ count: 0 }); await expect(closeFieldWriteWindow(authority, request)).rejects.toThrow("CONFLICT"); expect(m.update).not.toHaveBeenCalled();
  m.cutover.mockResolvedValue({ count: 1 }); m.audit.mockRejectedValue(new Error("Audit unavailable"));
  await expect(closeFieldWriteWindow(authority, request)).rejects.toThrow("Audit unavailable");
});
it("retains affiliated staff as audited support, never as a customer principal", async () => {
  authority.session.capabilities.add("atlas.staff.manage"); authority.session.capabilities.add("atlas.companies.manage");
  await closeFieldWriteWindow(authority, request);
  expect(m.audit.mock.calls[0][0].data).toMatchObject({ action: "studio.field.migration.support_opened", entityId: "member", after: { ...authority.stamp, fromOrganisationId: "company" } });
  expect(m.cutover.mock.calls[0][0].data.settlementPin.principal).toEqual({ ...authority.stamp, authority: "staff_support", auditId: "support-audit" });
  expect(m.audit).toHaveBeenCalledTimes(2);
});
it.each([true, false])("dispatches genuine sealed intent2 with target conditional=%s using the current different customer principal", async conditional => {
  const g = await requiredFixture(conditional); useRequiredFixture(g);
  authority.session = { ...authority.session, userId: "current-actor", membershipId: "current-member" };
  authority.stamp = { ...authority.stamp, userId: "current-actor", membershipId: "current-member" };
  await closeFieldWriteWindow(authority, request);
  expect(m.required).toHaveBeenCalledWith(authority.transaction, g.intent); expect(m.inspection).not.toHaveBeenCalled();
  expect(m.window).toHaveBeenCalledWith(authority.transaction, g, "FINALIZED");
  const saved = m.cutover.mock.calls[0][0].data;
  expect(saved).toMatchObject({ state: "FINALIZED", settledBy: "current-actor", settlementPin: { schemaVersion: 1, principal: { ...authority.stamp, authority: "customer" } } });
  expect(saved.settlementChecksum).toBe(checksum(saved.settlementPin));
  expect(g.intent.principal).toEqual(f.intent.principal); expect(g.stored.review.principal).toEqual(f.intent.principal);
  expect(g.retained.pin.publication.publisherUserId).toBe(f.intent.principal.userId);
  expect(m.update.mock.calls[0][0]).toMatchObject({ where: { organisationId: "company", definitionId: request.definitionId, preparationId: g.intent.id, state: "CUTOVER", revision: 1 }, data: { state: "COMPLETED", revision: 2 } });
  expect(m.audit.mock.calls[0][0].data).toMatchObject({ actorUserId: "current-actor", action: "studio.field.migration.finalized",
    after: { sourceVersionId: g.source.id, targetVersionId: g.target.id, operationId: request.operationId, trigger: "ordinary_field_save" } });
  expect(authority.session.capabilities).toEqual(new Set(["tickets.ticket.read", "tickets.ticket.manage"]));
  expect(g.target.schemaVersion).toBe(conditional ? 2 : 1); expect(g.intent.schemaVersion).toBe(2);
});
it("keeps affiliated conditional support identity current and purpose-bound without borrowing the creator", async () => {
  const g = await requiredFixture(); useRequiredFixture(g);
  authority.session = { ...authority.session, userId: "support-actor", membershipId: "support-member",
    capabilities: new Set([...authority.session.capabilities, "atlas.staff.manage", "atlas.companies.manage"]) };
  authority.stamp = { ...authority.stamp, userId: "support-actor", membershipId: "support-member" };
  await closeFieldWriteWindow(authority, request);
  expect(m.audit.mock.calls[0][0].data).toMatchObject({ actorUserId: "support-actor", entityId: "support-member", before: { operationId: request.operationId, purpose: "ordinary_field_save" }, after: authority.stamp });
  expect(m.cutover.mock.calls[0][0].data.settlementPin.principal).toEqual({ ...authority.stamp, authority: "staff_support", auditId: "support-audit" });
  expect(m.audit).toHaveBeenCalledTimes(2); expect(g.intent.principal.userId).toBe("actor");
});
it("denies a staff window close without the current companies grant before support evidence or mutation", async () => {
  const g = await requiredFixture(); useRequiredFixture(g); authority.session.capabilities.add("atlas.staff.manage");
  await expect(closeFieldWriteWindow(authority, request)).rejects.toThrow("FORBIDDEN");
  expect(m.audit).not.toHaveBeenCalled(); expect(m.cutover).not.toHaveBeenCalled(); expect(m.update).not.toHaveBeenCalled();
});
it("rejects unknown/corrupt/foreign stored2 and preparation scalar mirrors before either inspector", async () => {
  const g = await requiredFixture(); useRequiredFixture(g);
  for (const invalid of [{ ...g.preparation, id: uuid(99) }, { ...g.preparation, organisationId: "foreign" }, { ...g.preparation, definitionId: uuid(99) },
    { ...g.preparation, intentChecksum: "f".repeat(64) }, { ...g.preparation, intent: { ...g.intent, schemaVersion: 3 } },
    { ...g.preparation, intent: { ...g.intent, unsafe: true } }, { ...g.preparation, intent: { ...g.intent, organisationId: "foreign" } },
    { ...g.preparation, intent: { ...g.intent, definitionId: uuid(99) } }]) {
    m.preparation.mockResolvedValue(invalid); await expect(closeFieldWriteWindow(authority, request)).rejects.toThrow();
  }
  m.preparation.mockResolvedValue(null); await expect(closeFieldWriteWindow(authority, request)).rejects.toThrow("FIELD_STORAGE_INVALID");
  expect(m.required).not.toHaveBeenCalled(); expect(m.inspection).not.toHaveBeenCalled(); expect(m.cutover).not.toHaveBeenCalled(); expect(m.audit).not.toHaveBeenCalled();
});
it("pairs initial stored2 source/target publication mirrors before identity inspection", async () => {
  const g = await requiredFixture(); useRequiredFixture(g);
  for (const patch of [{ organisationId: "foreign" }, { definitionId: uuid(99) }, { preparationId: uuid(99) },
    { state: "COMPLETED" }, { sourceGenerationId: uuid(99) }]) {
    m.publication.mockResolvedValue({ ...g.publication, ...patch }); await expect(closeFieldWriteWindow(authority, request)).rejects.toThrow("FIELD_STORAGE_INVALID");
  }
  expect(m.required).not.toHaveBeenCalled(); expect(m.cutover).not.toHaveBeenCalled(); expect(m.audit).not.toHaveBeenCalled();
});
it("requires inspected stored2 source/target/receipt/definition/publication to pair actual request before support or CAS", async () => {
  const g = await requiredFixture(); useRequiredFixture(g);
  const changed = [{ ...g, intent: { ...g.intent, principal: { ...g.intent.principal, userId: "replacement" } } },
    { ...g, publication: { ...g.publication, reviewChecksum: "e".repeat(64) } }, { ...g, publication: { ...g.publication, revision: 99 } },
    { ...g, definition: { ...g.definition, id: uuid(99) } }, { ...g, definition: { ...g.definition, organisationId: "foreign" } },
    { ...g, receipt: { ...g.receipt, preparationId: uuid(99) } }, { ...g, receipt: { ...g.receipt, organisationId: "foreign" } },
    { ...g, receipt: { ...g.receipt, definitionId: uuid(99) } }, { ...g, receipt: { ...g.receipt, sourceVersionId: uuid(99) } },
    { ...g, receipt: { ...g.receipt, targetVersionId: uuid(99) } }, { ...g, source: { ...g.source, id: uuid(99) } },
    { ...g, target: { ...g.target, id: uuid(99) } }, { ...g, source: { ...g.source, organisationId: "foreign" } },
    { ...g, source: { ...g.source, definitionId: uuid(99) } }, { ...g, target: { ...g.target, organisationId: "foreign" } },
    { ...g, target: { ...g.target, definitionId: uuid(99) } }, { ...g, source: { ...g.source, checksum: "e".repeat(64) } },
    { ...g, target: { ...g.target, checksum: "e".repeat(64) } }];
  for (const invalid of changed) {
    m.required.mockResolvedValue(invalid); await expect(closeFieldWriteWindow(authority, request)).rejects.toThrow("FIELD_STORAGE_INVALID");
  }
  expect(m.window).not.toHaveBeenCalled(); expect(m.cutover).not.toHaveBeenCalled(); expect(m.audit).not.toHaveBeenCalled();
});
it("preserves strict conditional target/draft/config guards and source/unfinished freezes", async () => {
  const g = await requiredFixture(); useRequiredFixture(g);
  for (const patch of [{ versionId: uuid(99) }, { definitionRevision: 99 }])
    await expect(closeFieldWriteWindow(authority, { ...request, ...patch })).rejects.toThrow("CONFLICT");
  m.window.mockRejectedValue(new Error("Reviewed target draft or active config changed"));
  await expect(closeFieldWriteWindow(authority, request)).rejects.toThrow("target draft");
  expect(m.cutover).not.toHaveBeenCalled(); expect(m.audit).not.toHaveBeenCalled();
  m.window.mockReset(); m.required.mockClear(); m.publication.mockResolvedValue({ ...g.publication, state: "PUBLISHED" });
  await expect(closeFieldWriteWindow(authority, request)).rejects.toThrow("FIELD_MIGRATION_IN_PROGRESS");
  m.publication.mockResolvedValue(g.publication);
  await expect(closeFieldWriteWindow(authority, { ...request, generationId: g.intent.source.payload.storageGeneration })).rejects.toThrow("FIELD_MIGRATION_IN_PROGRESS");
  expect(m.required).not.toHaveBeenCalled();
});
it("propagates required inspector/support/receipt/publication/Audit failures to the caller's owning transaction", async () => {
  const g = await requiredFixture(); useRequiredFixture(g);
  m.required.mockRejectedValueOnce(new Error("Retained review changed"));
  await expect(closeFieldWriteWindow(authority, request)).rejects.toThrow("Retained review changed"); expect(m.cutover).not.toHaveBeenCalled();
  m.cutover.mockResolvedValueOnce({ count: 0 }); await expect(closeFieldWriteWindow(authority, request)).rejects.toThrow("CONFLICT"); expect(m.update).not.toHaveBeenCalled();
  m.update.mockResolvedValueOnce({ count: 0 }); await expect(closeFieldWriteWindow(authority, request)).rejects.toThrow("CONFLICT"); expect(m.audit).not.toHaveBeenCalled();
  m.audit.mockRejectedValueOnce(new Error("Audit unavailable")); await expect(closeFieldWriteWindow(authority, request)).rejects.toThrow("Audit unavailable");
  authority.session.capabilities.add("atlas.staff.manage"); authority.session.capabilities.add("atlas.companies.manage");
  m.cutover.mockClear(); m.update.mockClear(); m.audit.mockRejectedValueOnce(new Error("Support evidence unavailable"));
  await expect(closeFieldWriteWindow(authority, request)).rejects.toThrow("Support evidence unavailable");
  expect(m.cutover).not.toHaveBeenCalled(); expect(m.update).not.toHaveBeenCalled();
});
