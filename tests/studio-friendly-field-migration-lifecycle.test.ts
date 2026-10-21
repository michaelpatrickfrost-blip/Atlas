import { beforeEach, expect, it, vi } from "vitest";
import type { Session } from "@/core/auth/session";
import type { FieldMigrationPrincipal } from "@/core/studio/fields/principal-contract";
const m = vi.hoisted(() => ({ context: vi.fn(), transaction: vi.fn(), resolve: vi.fn(), module: vi.fn(), enabled: vi.fn(), raw: vi.fn(), member: vi.fn(), company: vi.fn(),
  definition: vi.fn(), generation: vi.fn(), existing: vi.fn(), create: vi.fn(), audit: vi.fn(), native: vi.fn(), count: vi.fn(), start: vi.fn(), collect: vi.fn(), seal: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: { $transaction: m.transaction } }));
vi.mock("@/core/studio/fields/principal", () => ({ resolveFieldMigrationPrincipal: m.resolve }));
vi.mock("@/core/studio/authoring/field-migration-preview", () => ({ resolveAdditionalFieldMigrationContext: m.context }));
vi.mock("@/core/studio/registry/runtime", () => ({ studioRegistry: () => registry }));
vi.mock("@/core/modules/access", () => ({ assertModuleEnabled: m.enabled }));
vi.mock("@/core/studio/fields/migrations/preparation", () => ({ startFieldMigrationPreparation: m.start }));
vi.mock("@/core/studio/fields/migrations/collection", () => ({ collectFieldMigrationBatch: m.collect }));
vi.mock("@/core/studio/fields/migrations/sealing", () => ({ sealFieldMigrationPreparation: m.seal }));
import { CapabilityRegistry } from "@/core/studio/registry/registry";
import { ticketStudioContract } from "@/core/service-work/studio";
import { compileCustomField } from "@/core/studio/compiler/fields";
import { customFieldPayloadSchema } from "@/core/studio/fields/schema";
import { sealFieldMigrationIntent, type FieldMigrationIntent } from "@/core/studio/fields/migrations/contracts";
import { prepareAdditionalFieldMigration, collectAdditionalFieldMigration, sealAdditionalFieldMigration } from "@/core/studio/authoring/field-migration-lifecycle";
const original = await vi.importActual<typeof import("@/core/studio/fields/migrations/preparation")>("@/core/studio/fields/migrations/preparation");
// Real metadata registry/compiler/seals, authority SQL shape and original
// preparation retry path in its dedicated case. Principal/SQL/context and batch/
// sealing collaborators are explicit; separate original service regressions
// cover their CAS/coverage/rollback. No genuine PostgreSQL commit claimed.
const uuid = (n: number) => `80000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const registry = new CapabilityRegistry(async () => true); registry.register("tickets", ticketStudioContract);
const session: Session = { userId: "actor", userName: "Actor", userEmail: "actor@example.test", membershipId: "member", organisationId: "business", organisationName: "Business",
  capabilities: new Set(["studio.definition.publish", "tickets.ticket.read", "tickets.ticket.manage"]) };
const principal: FieldMigrationPrincipal = { userId: "actor", membershipId: "member", organisationId: "business", authVersion: 1, sessionVersion: 2, authority: "customer" };
const ref = (version: number) => { const meta = registry.describe("tickets.ticket", version); return { id: meta.id, version, schemaHash: meta.schemaHash, contractHash: meta.contractHash }; };
const from = customFieldPayloadSchema.parse({ schemaVersion: 1, entity: ref(2), storageGeneration: uuid(1), field: { key: "amount", label: "Amount", classification: "confidential",
  readCapability: "tickets.ticket.read", writeCapability: "tickets.ticket.manage", storage: { type: "integer" } } });
const to = customFieldPayloadSchema.parse({ ...from, entity: ref(9), storageGeneration: uuid(2), field: { ...from.field, storage: { type: "decimal" } } });
const prepareRequest = { operationId: uuid(3), definitionId: uuid(4), definitionRevision: 7, draftRevision: 9, sourceVersionId: uuid(6), conversion: { kind: "integer_to_decimal" } };
const batchRequest = { definitionId: uuid(4), preparationId: uuid(3), revision: 0, expectedState: "PREPARING", limit: 2 };
const sealRequest = { definitionId: uuid(4), preparationId: uuid(3), revision: 1, expectedState: "PREPARING" };
const tx = { $queryRaw: m.raw, membership: { findFirst: m.member }, moduleState: { findFirst: m.module }, organisation: { findFirst: m.company },
  studioDefinition: { findFirst: m.definition }, studioFieldGeneration: { findFirst: m.generation },
  studioFieldMigrationPreparation: { findFirst: m.existing, create: m.create }, auditEntry: { create: m.audit },
  serviceWorkItem: { findFirst: m.native, count: m.count } };
let insideMetadata = false;
let definition: { id: string; revision: number; activeVersionId: string; activeVersion: { id: string; organisationId: string; definitionId: string; schemaVersion: number; payload: unknown; compiledPlan: unknown; checksum: string }; draft: { id: string; organisationId: string; definitionId: string; revision: number; payload: unknown } };
let saved: { id: string; organisationId: string; definitionId: string; entityId: string; sourceVersionId: string; sourceGenerationId: string; targetGenerationId: string;
  draftId: string; intent: FieldMigrationIntent; intentChecksum: string; revision: number; state: string } | null;
async function stored() {
  const source = customFieldPayloadSchema.parse(definition.activeVersion.payload), target = customFieldPayloadSchema.parse(definition.draft.payload);
  const compiled = await compileCustomField(session, target, registry), query = registry.describe("tickets.ticket.field_migration", 4);
  const packet = sealFieldMigrationIntent({ schemaVersion: 1, id: uuid(3), organisationId: "business", definitionId: uuid(4), definitionRevision: 7, principal,
    source: { versionId: uuid(6), versionChecksum: definition.activeVersion.checksum, payload: source }, target: { draftId: uuid(5), draftRevision: 9, compiledChecksum: compiled.checksum, payload: target },
    conversion: { kind: "integer_to_decimal" }, ownerQuery: { id: query.id, version: query.version, schemaHash: query.schemaHash, contractHash: query.contractHash } });
  return { id: uuid(3), organisationId: "business", definitionId: uuid(4), entityId: "tickets.ticket", sourceVersionId: uuid(6), sourceGenerationId: uuid(1), targetGenerationId: uuid(2),
    draftId: uuid(5), intent: packet.intent, intentChecksum: packet.checksum, revision: 0, state: "PREPARING" };
}
beforeEach(async () => {
  vi.clearAllMocks(); insideMetadata = false; saved = null;
  m.context.mockResolvedValue({ session, principal }); m.resolve.mockResolvedValue(session); m.enabled.mockResolvedValue(undefined);
  m.transaction.mockImplementation(async (run) => { expect(insideMetadata).toBe(false); insideMetadata = true; try { return await run(tx); } finally { insideMetadata = false; } });
  m.raw.mockImplementation(async (s: TemplateStringsArray) => s.join("?").includes("SHOW transaction_isolation") ? [{ transaction_isolation: "serializable" }] : []);
  m.member.mockResolvedValue({ sessionVersion: 2, user: { authVersion: 1 } }); m.module.mockResolvedValue({ id: "enabled" });
  m.company.mockResolvedValue({ id: "business", kind: "CUSTOMER", status: "ACTIVE", archivedAt: null, isTest: true });
  const compiled = await compileCustomField(session, from, registry);
  definition = { id: uuid(4), revision: 7, activeVersionId: uuid(6), activeVersion: { id: uuid(6), organisationId: "business", definitionId: uuid(4), schemaVersion: 1, payload: compiled.payload, compiledPlan: compiled.plan, checksum: compiled.checksum },
    draft: { id: uuid(5), organisationId: "business", definitionId: uuid(4), revision: 9, payload: to } };
  m.definition.mockImplementation(async ({ where }) => where.id === uuid(4) && where.organisationId === "business" && (where.revision === undefined || where.revision === definition.revision) ? definition : null);
  m.existing.mockImplementation(async ({ where }) => saved && where.id === saved.id && where.organisationId === saved.organisationId
    && (where.definitionId === undefined || where.definitionId === saved.definitionId) ? saved : null);
  m.generation.mockResolvedValue({ id: uuid(1) }); m.native.mockResolvedValue(null); m.count.mockResolvedValue(0); m.audit.mockResolvedValue({ id: "audit" });
  m.create.mockImplementation(async ({ data }) => { saved = { ...data, revision: 0, state: "PREPARING" }; return saved; });
  m.start.mockImplementation(async () => { expect(insideMetadata).toBe(false); return { id: uuid(3), revision: 0, state: "PREPARING" }; });
  m.collect.mockImplementation(async () => { expect(insideMetadata).toBe(false); return { id: uuid(3), revision: 1, state: "PREPARING", replayed: false, appended: 2, cursorExhausted: false }; });
  m.seal.mockImplementation(async () => { expect(insideMetadata).toBe(false); return { id: uuid(3), revision: 2, state: "REVIEWED", checksum: "a".repeat(64),
    cohort: { recordCount: 3, observationDigest: "b".repeat(64) }, summary: { validCount: 2, invalidCount: 1, lossyCount: 1 }, indexImpact: ["Original index impact"], rollbackLimit: "reverse_review_after_target_writes", replayed: false }; });
});
it("prepares through the original engine only after metadata transaction ends, forwarding exact revisions and server-resolved conversion", async () => {
  expect(await prepareAdditionalFieldMigration(session, undefined, prepareRequest)).toEqual({ preparationId: uuid(3), revision: 0, state: "PREPARING" });
  expect(m.context).toHaveBeenCalledWith(session, undefined);
  expect(m.start).toHaveBeenCalledWith(session, principal, { operationId: uuid(3), definitionId: uuid(4), definitionRevision: 7, draftRevision: 9, conversion: { kind: "integer_to_decimal" } });
  expect(m.create).not.toHaveBeenCalled(); expect(m.audit).not.toHaveBeenCalled(); expect(m.count).not.toHaveBeenCalled();
});
it("maps choice index zero against actual saved target identity rather than posting raw option IDs", async () => {
  const source = customFieldPayloadSchema.parse({ ...from, field: { ...from.field, storage: { type: "string" } } }), compiled = await compileCustomField(session, source, registry);
  definition.activeVersion = { ...definition.activeVersion, payload: compiled.payload, compiledPlan: compiled.plan, checksum: compiled.checksum };
  definition.draft.payload = customFieldPayloadSchema.parse({ ...to, field: { ...to.field, storage: { type: "enum", valueSetVersion: 1, options: [{ id: "server_choice", label: "Approved" }] } } });
  await prepareAdditionalFieldMigration(session, undefined, { ...prepareRequest, conversion: { kind: "string_to_enum", mapping: [{ from: "yes", toChoice: 0 }], unmapped: "reject" } });
  expect(m.start.mock.calls[0][2].conversion).toEqual({ kind: "string_to_enum", mapping: [{ from: "yes", to: "server_choice" }], unmapped: "reject" });
  await expect(prepareAdditionalFieldMigration(session, undefined, { ...prepareRequest, conversion: { kind: "string_to_enum", mapping: [{ from: "yes", toChoice: 1 }], unmapped: "reject" } })).rejects.toThrow("available target choice");
});
it.each(["draft", "definition", "source", "foreign", "seal", "conditional"])("refuses %s drift before original preparation effects", async kind => {
  if (kind === "draft") definition.draft.revision++;
  if (kind === "definition") definition.revision++;
  if (kind === "source") definition.activeVersionId = uuid(99);
  if (kind === "foreign") definition.draft.organisationId = "foreign";
  if (kind === "seal") definition.activeVersion.checksum = "f".repeat(64);
  if (kind === "conditional") definition.draft.payload = { ...to, schemaVersion: 2, requiredIf: {} };
  await expect(prepareAdditionalFieldMigration(session, undefined, prepareRequest)).rejects.toThrow(); expect(m.start).not.toHaveBeenCalled();
});
it("preserves original race failure after metadata resolution with no retry, fallback, or synthetic acknowledgement", async () => {
  m.start.mockRejectedValue(new Error("REVIEW_CHANGED: source changed after metadata transaction"));
  await expect(prepareAdditionalFieldMigration(session, undefined, prepareRequest)).rejects.toThrow("source changed");
  expect(m.start).toHaveBeenCalledTimes(1);
});
it("real original staff preparation retry reuses only exact stored purpose principal, and rejects changed conversion/revisions/actor", async () => {
  const staff = { ...session, capabilities: new Set([...session.capabilities, "atlas.staff.manage", "atlas.companies.manage"]) };
  let audit = 0; m.context.mockImplementation(async () => ({ session: staff, principal: { ...principal, authority: "staff_support", auditId: `support-${++audit}` } }));
  m.resolve.mockResolvedValue(staff); m.start.mockImplementation(original.startFieldMigrationPreparation);
  const source = customFieldPayloadSchema.parse({ ...from, field: { ...from.field, storage: { type: "string" } } }), compiled = await compileCustomField(session, source, registry);
  definition.activeVersion = { ...definition.activeVersion, payload: compiled.payload, compiledPlan: compiled.plan, checksum: compiled.checksum };
  definition.draft.payload = customFieldPayloadSchema.parse({ ...to, field: { ...to.field, storage: { type: "enum", valueSetVersion: 1, options: [{ id: "server_choice", label: "Approved" }] } } });
  const input = { ...prepareRequest, conversion: { kind: "string_to_enum", mapping: [{ from: "yes", toChoice: 0 }], unmapped: "reject" } };
  const first = await prepareAdditionalFieldMigration(staff, "business", input);
  const second = await prepareAdditionalFieldMigration(staff, "business", input);
  expect(second).toEqual(first); expect(m.create).toHaveBeenCalledTimes(1); expect(m.audit).toHaveBeenCalledTimes(1);
  expect(m.start.mock.calls[1][1]).toMatchObject({ authority: "staff_support", auditId: "support-1" });
  expect(m.context).toHaveBeenCalledTimes(2); expect(m.resolve.mock.calls.length).toBe(8); // metadata and original engine both refresh twice per call
  await expect(prepareAdditionalFieldMigration(staff, "business", { ...input, definitionRevision: 8 })).rejects.toThrow();
  await expect(prepareAdditionalFieldMigration(staff, "business", { ...input, conversion: { ...input.conversion, unmapped: "empty" } })).rejects.toThrow("stale");
  const other = { ...staff, userId: "other", membershipId: "other-member" };
  m.context.mockResolvedValue({ session: other, principal: { ...principal, userId: "other", membershipId: "other-member", authority: "staff_support", auditId: "other-audit" } }); m.resolve.mockResolvedValue(other);
  await expect(prepareAdditionalFieldMigration(other, "business", input)).rejects.toThrow();
  expect(m.create).toHaveBeenCalledTimes(1); expect(m.audit).toHaveBeenCalledTimes(1);
});
it("collection delegates one bounded batch and preserves read-only old-revision replay instead of collecting the next page", async () => {
  saved = await stored();
  expect(await collectAdditionalFieldMigration(session, undefined, batchRequest)).toMatchObject({ revision: 1, appended: 2, cursorExhausted: false });
  saved.revision = 1; m.collect.mockResolvedValue({ id: uuid(3), revision: 1, state: "PREPARING", replayed: true, appended: 0, cursorExhausted: null });
  expect(await collectAdditionalFieldMigration(session, undefined, batchRequest)).toMatchObject({ replayed: true, appended: 0, cursorExhausted: null });
  expect(m.collect).toHaveBeenCalledTimes(2); expect(m.context).toHaveBeenCalledTimes(2);
  expect(m.collect).toHaveBeenLastCalledWith(session, { preparationId: uuid(3), revision: 0, limit: 2 }); expect(m.audit).not.toHaveBeenCalled();
});
it("sealing preserves full original invalid/loss/index/rollback summary and legitimate PREPARING→REVIEWED lost-response replay", async () => {
  saved = await stored(); saved.revision = 1;
  const first = await sealAdditionalFieldMigration(session, undefined, sealRequest);
  expect(first).toMatchObject({ state: "REVIEWED", affectedCount: 3, valid: 2, invalid: 1, lossy: 1, rollbackLimit: "reverse_review_after_target_writes" });
  expect(first).not.toHaveProperty("observationDigest"); expect(first).not.toHaveProperty("principal");
  saved.state = "REVIEWED"; saved.revision = 2;
  const acknowledgement = await m.seal.mock.results[0].value;
  m.seal.mockResolvedValue({ ...acknowledgement, replayed: true });
  expect(await sealAdditionalFieldMigration(session, undefined, sealRequest)).toEqual({ ...first, replayed: true });
  expect(m.seal).toHaveBeenCalledTimes(2); expect(m.seal).toHaveBeenLastCalledWith(session, { preparationId: uuid(3), revision: 1 });
});
it.each(["foreign_definition", "cancelled", "future_revision", "creator", "checksum", "reviewed_phase"])("collect/seal deny %s before engine side effects", async kind => {
  saved = await stored(); const input = { ...batchRequest };
  if (kind === "foreign_definition") input.definitionId = uuid(99);
  if (kind === "cancelled") saved.state = "CANCELLED";
  if (kind === "future_revision") input.revision = 5;
  if (kind === "creator") { const packet = sealFieldMigrationIntent({ ...saved.intent, principal: { ...principal, userId: "original-other" } }); saved.intent = packet.intent; saved.intentChecksum = packet.checksum; }
  if (kind === "checksum") saved.intentChecksum = "f".repeat(64);
  if (kind === "reviewed_phase") saved.state = "REVIEWED";
  await expect(collectAdditionalFieldMigration(session, undefined, input)).rejects.toThrow(); expect(m.collect).not.toHaveBeenCalled();
  if (kind !== "reviewed_phase") { await expect(sealAdditionalFieldMigration(session, undefined, { definitionId: input.definitionId, preparationId: input.preparationId, revision: input.revision, expectedState: input.expectedState })).rejects.toThrow(); expect(m.seal).not.toHaveBeenCalled(); }
});
it("refuses invented client authority/stage/summary/cursor and coerced bounds before context opening", async () => {
  for (const extra of [{ organisationId: "foreign" }, { principal }, { conversion: { kind: "expression", script: "x" } }, { summary: {} }, { stage: "cutover" }])
    await expect(prepareAdditionalFieldMigration(session, undefined, { ...prepareRequest, ...extra })).rejects.toThrow();
  for (const extra of [{ cursor: "client-record" }, { limit: 51 }, { limit: "2" }, { expectedState: "READY" }])
    await expect(collectAdditionalFieldMigration(session, undefined, { ...batchRequest, ...extra })).rejects.toThrow();
  await expect(sealAdditionalFieldMigration(session, undefined, { ...sealRequest, reviewed: true })).rejects.toThrow();
  expect(m.context).not.toHaveBeenCalled(); expect(m.start).not.toHaveBeenCalled(); expect(m.collect).not.toHaveBeenCalled(); expect(m.seal).not.toHaveBeenCalled();
});
it("a current revoked/native grant cannot borrow the creator's grants, including collection retry", async () => {
  saved = await stored(); const actor = { ...session, capabilities: new Set(session.capabilities) }; actor.capabilities.delete("tickets.ticket.manage");
  m.context.mockResolvedValue({ session: actor, principal }); m.resolve.mockResolvedValue(actor);
  await expect(collectAdditionalFieldMigration(actor, undefined, batchRequest)).rejects.toThrow("tickets.ticket.manage"); expect(m.collect).not.toHaveBeenCalled();
  m.resolve.mockRejectedValue(new Error("FORBIDDEN: revoked")); await expect(sealAdditionalFieldMigration(actor, undefined, sealRequest)).rejects.toThrow("revoked"); expect(m.seal).not.toHaveBeenCalled();
});
