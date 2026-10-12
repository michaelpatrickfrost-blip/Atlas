import { beforeEach, expect, it, vi } from "vitest";
import type { Session } from "@/core/auth/session";
const m = vi.hoisted(() => ({ transaction: vi.fn(), resolve: vi.fn(), capture: vi.fn(), support: vi.fn(), authoring: vi.fn(), enabled: vi.fn(),
  refresh: vi.fn(), raw: vi.fn(), member: vi.fn(), module: vi.fn(), company: vi.fn(), definition: vi.fn(), generation: vi.fn(), versions: vi.fn(), version: vi.fn(),
  native: vi.fn(), natives: vi.fn(), count: vi.fn(), extension: vi.fn(), value: vi.fn(), publication: vi.fn(), preparation: vi.fn(), archive: vi.fn(), write: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: { $transaction: m.transaction } }));
vi.mock("@/core/studio/fields/principal", () => ({ resolveFieldMigrationPrincipal: m.resolve,
  captureCustomerFieldMigrationPrincipal: m.capture, openFieldMigrationSupportContext: m.support }));
vi.mock("@/core/studio/authoring/context", () => ({ withStudioAuthoringAuthority: m.authoring }));
vi.mock("@/core/studio/fields/runtime-authority", () => ({ fieldRuntimeAuthorityInTransaction: m.refresh }));
vi.mock("@/core/modules/access", () => ({ assertModuleEnabled: m.enabled }));
vi.mock("@/core/studio/registry/runtime", () => ({ studioRegistry: () => registry }));
import { CapabilityRegistry } from "@/core/studio/registry/registry";
import { ticketStudioContract } from "@/core/service-work/studio";
import { compileCustomField } from "@/core/studio/compiler/fields";
import { compileFieldMigrationMetadata } from "@/core/studio/fields/migrations/metadata";
import { conditionalFieldPayloadSchema, versionedFieldPayloadSchema, type VersionedFieldPayload } from "@/core/studio/fields/required-contract";
import { customFieldPayloadSchema } from "@/core/studio/fields/schema";
import { checksum } from "@/core/studio/registry/contracts";
import { encodeFieldValue } from "@/core/studio/fields/codec";
import { sealRequiredFieldMigrationIntent, sealRequiredFieldMigrationReview } from "@/core/studio/fields/migrations/required-contracts";
import { inspectRequiredFieldMigrationRecord } from "@/core/studio/fields/migrations/observation";
import { sealFieldMigrationIntent, sealFieldMigrationReview, type FieldMigrationObservation } from "@/core/studio/fields/migrations/contracts";
import { previewAdditionalFieldMigration, readAdditionalFieldMigrationDetail, resolveAdditionalFieldMigrationContext, readAdditionalFieldMigrationSetup } from "@/core/studio/authoring/field-migration-preview";
import type { FieldMigrationPrincipal } from "@/core/studio/fields/principal-contract";

// Real owner registry, native authorisation, snapshot policy, metadata compiler,
// seals, shared source/typed decoder, converter and DTOs. SQL/session-resolution
// and outer authoring context are explicit collaborators: no PostgreSQL proof.
const uuid = (n: number) => `70000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const session: Session = { userId: "user", userName: "User", userEmail: "user@example.test", membershipId: "member", organisationId: "business",
  organisationName: "Business", capabilities: new Set(["studio.definition.publish", "tickets.ticket.read", "tickets.ticket.manage"]) };
const principal: FieldMigrationPrincipal = { organisationId: "business", userId: "user", membershipId: "member", authVersion: 1, sessionVersion: 2, authority: "customer" };
const registry = new CapabilityRegistry(async () => true); registry.register("tickets", ticketStudioContract);
const ref = (version: number) => { const r = registry.describe("tickets.ticket", version); return { id: r.id, version, schemaHash: r.schemaHash, contractHash: r.contractHash }; };
const source = customFieldPayloadSchema.parse({ schemaVersion: 1, entity: ref(2), storageGeneration: uuid(1),
  field: { key: "count", label: "Our count", classification: "confidential", readCapability: "tickets.ticket.read", writeCapability: "tickets.ticket.manage", storage: { type: "integer" } } });
const target = customFieldPayloadSchema.parse({ ...source, entity: ref(9), storageGeneration: uuid(2), field: { ...source.field, storage: { type: "decimal" } } });
const request = { definitionId: uuid(4), definitionRevision: 7, draftRevision: 9, sourceVersionId: uuid(6), conversion: { kind: "integer_to_decimal" }, limit: 2 };
const tx = { $queryRaw: m.raw, membership: { findFirst: m.member }, moduleState: { findFirst: m.module }, organisation: { findFirst: m.company },
  studioDefinition: { findFirst: m.definition, create: m.write, update: m.write }, studioDefinitionVersion: { findFirst: m.version, findMany: m.versions, create: m.write },
  studioDraft: { update: m.write }, studioFieldGeneration: { findFirst: m.generation, create: m.write },
  serviceWorkItem: { findFirst: m.native, findMany: m.natives, count: m.count, create: m.write, update: m.write },
  studioExtensionRecord: { findFirst: m.extension, create: m.write }, studioFieldValue: { findFirst: m.value, create: m.write },
  studioFieldMigrationPublication: { findFirst: m.publication },
  studioFieldMigrationPreparation: { findFirst: m.preparation, create: m.write, update: m.write }, studioFieldMigrationObservation: { findMany: m.archive, create: m.write },
  auditEntry: { create: m.write } };
let sourceVersion: Awaited<ReturnType<typeof makeVersion>>;
let definition: { id: string; revision: number; activeVersionId: string; activeVersion: typeof sourceVersion; draft: { id: string; definitionId: string; organisationId: string; revision: number; payload: unknown } };
let metadata: { id: string; revision: number; versionId: string; fingerprint: string; schemaVersion: typeof sourceVersion };
let storedValue: object;
let archiveObservation: FieldMigrationObservation;
async function makeVersion(payload = source) { const fixturePublisher = { ...session, capabilities: new Set([...session.capabilities, payload.field.readCapability, payload.field.writeCapability].filter((cap): cap is string => typeof cap === "string")) };
  const compiled = await compileCustomField(fixturePublisher, payload, registry);
  return { id: uuid(6), definitionId: uuid(4), organisationId: "business", schemaVersion: 1, payload: compiled.payload, compiledPlan: compiled.plan, checksum: compiled.checksum }; }
function recordId(input: unknown): string | null {
  if (!input || typeof input !== "object") return null;
  for (const [key, value] of Object.entries(input)) {
    if (key === "id" && typeof value === "string") return value;
    const result = recordId(value); if (result) return result;
  }
  return null;
}
async function preparation() {
  const compiled = await compileCustomField(session, definition.draft.payload, registry), q = registry.describe("tickets.ticket.field_migration", 4);
  const sealed = sealFieldMigrationIntent({ schemaVersion: 1, id: uuid(3), organisationId: "business", definitionId: uuid(4), definitionRevision: 7, principal,
    source: { versionId: sourceVersion.id, versionChecksum: sourceVersion.checksum, payload: sourceVersion.payload },
    target: { draftId: uuid(5), draftRevision: 9, compiledChecksum: compiled.checksum, payload: compiled.payload },
    conversion: { kind: "integer_to_decimal" }, ownerQuery: { id: q.id, version: q.version, schemaHash: q.schemaHash, contractHash: q.contractHash } });
  return { id: uuid(3), organisationId: "business", definitionId: uuid(4), entityId: "tickets.ticket", sourceVersionId: uuid(6),
    sourceGenerationId: uuid(1), targetGenerationId: uuid(2), draftId: uuid(5), intent: sealed.intent, intentChecksum: sealed.checksum, state: "PREPARING", revision: 0, review: null };
}
beforeEach(async () => {
  vi.restoreAllMocks(); vi.clearAllMocks(); m.transaction.mockImplementation(async (run: (tx: unknown) => Promise<unknown>) => run(tx));
  m.refresh.mockImplementation(async selected => ({ session: selected, transaction: tx, registry, stamp: principal }));
  m.resolve.mockResolvedValue(session); m.enabled.mockResolvedValue(undefined); m.capture.mockResolvedValue(principal);
  m.authoring.mockImplementation(async (_a, _cap, _target, run) => run({ session, transaction: tx, registry })); m.support.mockResolvedValue({ session, principal: { ...principal, authority: "staff_support", auditId: "audit" } });
  m.raw.mockImplementation(async (s: TemplateStringsArray) => s.join("?").includes("SHOW transaction_isolation") ? [{ transaction_isolation: "serializable" }] : []);
  m.member.mockResolvedValue({ sessionVersion: 2, user: { authVersion: 1 } }); m.module.mockResolvedValue({ id: "enabled" });
  m.company.mockResolvedValue({ id: "business", kind: "CUSTOMER", status: "ACTIVE", archivedAt: null, isTest: true });
  sourceVersion = await makeVersion(); definition = { id: uuid(4), revision: 7, activeVersionId: uuid(6), activeVersion: sourceVersion,
    draft: { id: uuid(5), definitionId: uuid(4), organisationId: "business", revision: 9, payload: structuredClone(target) } };
  m.definition.mockImplementation(async ({ where }) => where.organisationId === "business" && where.id === uuid(4)
    && (where.revision === undefined || where.revision === definition.revision) ? definition : null);
  m.publication.mockResolvedValue(null); m.versions.mockResolvedValue([]); m.version.mockResolvedValue(sourceVersion); m.generation.mockResolvedValue({ id: uuid(1) }); m.count.mockResolvedValue(3);
  m.native.mockImplementation(async ({ where, select }) => Object.keys(select).length === 1 ? null
    : { id: recordId(where), organisationId: "business", version: 1, status: "NEW", priority: "NORMAL", mergedIntoId: null, queueId: "q", queue: { restricted: false } });
  m.natives.mockResolvedValue([{ id: "a", organisationId: "business", version: 1 }, { id: "b", organisationId: "business", version: 1 }, { id: "c", organisationId: "business", version: 1 }]);
  const encoded = encodeFieldValue(source.field, 0); metadata = { id: uuid(9), revision: 1, versionId: uuid(6), fingerprint: encoded.fingerprint, schemaVersion: sourceVersion };
  storedValue = { ...encoded, ...metadata };
  m.extension.mockResolvedValue({ id: uuid(7), revision: 1, slots: [{ id: uuid(8), revision: 1, activeValueId: uuid(9) }] });
  m.value.mockImplementation(async ({ select }) => select ? metadata : storedValue);
  archiveObservation = { recordId: "a", nativeRevision: 1, extension: { id: uuid(7), revision: 1, slot: { id: uuid(8), revision: 1,
    value: { id: uuid(9), revision: 1, versionId: uuid(6), fingerprint: encoded.fingerprint } } },
    result: { kind: "valid", targetFingerprint: checksum({ type: "decimal", value: "0" }), isNull: false, lossy: false } };
  m.preparation.mockResolvedValue(await preparation()); m.archive.mockResolvedValue([{ organisationId: "business", definitionId: uuid(4), preparationId: uuid(3),
    entityId: "tickets.ticket", sourceGenerationId: uuid(1), recordId: "a", nativeRevision: 1, observation: archiveObservation }]);
  m.write.mockImplementation(() => { throw new Error("Unexpected persistence"); });
});
it("uses the real owner/codec/converter in one read-only Serializable page; zero survives and counts stay explicitly partial", async () => {
  const result = await previewAdditionalFieldMigration(session, principal, request);
  expect(result).toMatchObject({ affectedCount: 3, countsScope: "this_page", pageCounts: { valid: 2, invalid: 0, lossy: 0 }, nextCursor: "b",
    examples: [{ label: "Record 1", before: { type: "integer", value: 0 }, after: { type: "decimal", value: "0" }, result: "ready" },
      { label: "Record 2", before: { type: "integer", value: 0 }, after: { type: "decimal", value: "0" }, result: "ready" }] });
  expect(result.impact.index.join(" ")).toContain("existing source values"); expect(result.impact.rollbackLimit).toBe("reverse_review_after_target_writes");
  expect(JSON.stringify(result)).not.toContain("fingerprint"); expect(JSON.stringify(result)).not.toContain("member");
  expect(m.transaction).toHaveBeenCalledTimes(1); expect(m.transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: "Serializable" });
  expect(m.resolve).toHaveBeenCalledTimes(2); expect(m.write).not.toHaveBeenCalled();
  expect(m.natives).toHaveBeenCalledWith(expect.objectContaining({ take: 3, orderBy: { id: "asc" } }));
});
it("keeps preview defaults out of missing values and classifies invalid storage without leaking malformed columns", async () => {
  m.extension.mockResolvedValue(null); expect((await previewAdditionalFieldMigration(session, principal, request)).examples[0]).toMatchObject({ before: null, after: null, result: "ready" });
  m.extension.mockResolvedValue({ id: uuid(7), revision: 1, slots: [{ id: uuid(8), revision: 1, activeValueId: uuid(9) }] });
  storedValue = { ...storedValue, textValue: "protected malformed" };
  const result = await previewAdditionalFieldMigration(session, principal, request);
  expect(result.examples[0]).toMatchObject({ before: null, after: null, result: "invalid", issue: "FIELD_STORAGE_INVALID" });
  expect(JSON.stringify(result)).not.toContain("protected malformed"); expect(result.pageCounts.invalid).toBe(2);
});
it.each(["definition", "draft", "source", "foreign_version", "checksum"])("denies %s drift before native count and typed values", async kind => {
  if (kind === "definition") definition.revision++;
  if (kind === "draft") definition.draft.revision++;
  if (kind === "source") definition.activeVersionId = uuid(99);
  if (kind === "foreign_version") sourceVersion.organisationId = "foreign";
  if (kind === "checksum") sourceVersion.checksum = "f".repeat(64);
  await expect(previewAdditionalFieldMigration(session, principal, request)).rejects.toThrow();
  expect(m.count).not.toHaveBeenCalled(); expect(m.value).not.toHaveBeenCalled(); expect(m.write).not.toHaveBeenCalled();
});
it("rejects foreign/client principal/schema overrides and out-of-bound pages before a transaction", async () => {
  for (const extra of [{ organisationId: "foreign" }, { principal }, { source: source }, { limit: 51 }, { limit: 0 }, { limit: "2" }, { stage: "execution" }])
    await expect(previewAdditionalFieldMigration(session, principal, { ...request, ...extra })).rejects.toThrow();
  await expect(previewAdditionalFieldMigration(session, { ...principal, organisationId: "foreign" }, request)).rejects.toThrow("authenticated");
  expect(m.transaction).not.toHaveBeenCalled();
});
it.each(["revoked", "native_read", "native_manage", "source_field", "written_field", "private", "live_data", "module"])("denies %s before protected columns/examples", async mode => {
  let actor = session;
  if (mode === "revoked") m.resolve.mockRejectedValue(new Error("FORBIDDEN: revoked"));
  if (mode === "native_read" || mode === "native_manage") { actor = { ...session, capabilities: new Set(session.capabilities) };
    actor.capabilities.delete(`tickets.ticket.${mode === "native_read" ? "read" : "manage"}`); m.resolve.mockResolvedValue(actor); }
  if (mode === "source_field") { sourceVersion.payload = { ...sourceVersion.payload, field: { ...sourceVersion.payload.field, readCapability: "private.read" } }; }
  if (mode === "written_field") { metadata.schemaVersion = await makeVersion({ ...source, field: { ...source.field, readCapability: "private.read" } }); }
  if (mode === "private") m.native.mockResolvedValue({ id: "private" });
  if (mode === "live_data") m.company.mockResolvedValue({ id: "business", kind: "CUSTOMER", status: "ACTIVE", archivedAt: null, isTest: false });
  if (mode === "module") m.module.mockResolvedValue(null);
  await expect(previewAdditionalFieldMigration(actor, principal, request)).rejects.toThrow();
  expect(m.value.mock.calls.some(([args]) => !args.select)).toBe(false); expect(m.write).not.toHaveBeenCalled();
  if (mode === "private") { expect(m.count).not.toHaveBeenCalled(); expect(m.natives).not.toHaveBeenCalled(); }
});
it("rejects malformed conditional source/target before count or values; no schema1 fallback", async () => {
  definition.draft.payload = { ...target, schemaVersion: 2, requiredIf: {} };
  await expect(previewAdditionalFieldMigration(session, principal, request)).rejects.toThrow();
  expect(m.count).not.toHaveBeenCalled(); expect(m.value).not.toHaveBeenCalled(); expect(m.count).not.toHaveBeenCalled(); expect(m.value).not.toHaveBeenCalled();
});
it("reads retained classifications with a different current actor without resolving or borrowing the original creator", async () => {
  const other = { ...session, userId: "settler", membershipId: "other" }, current = { ...principal, userId: "settler", membershipId: "other" };
  m.resolve.mockResolvedValue(other);
  const p = await preparation(), sealed = sealFieldMigrationReview({ ...p.intent, cohort: { recordCount: 1, observationDigest: checksum(archiveObservation) },
    summary: { validCount: 1, invalidCount: 0, lossyCount: 0 } });
  m.preparation.mockResolvedValue({ ...p, state: "REVIEWED", revision: 4, review: { id: p.id, organisationId: "business", definitionId: uuid(4), review: sealed.review, checksum: sealed.checksum } });
  const result = await readAdditionalFieldMigrationDetail(other, current, { definitionId: uuid(4), preparationId: uuid(3) });
  expect(result).toMatchObject({ revision: 4, state: "REVIEWED", currentAffectedCount: 3, review: { affectedCount: 1, valid: 1 }, rows: [{ label: "Record 1", result: "ready" }] });
  expect(m.resolve.mock.calls.every(([value]) => value.userId === "settler")).toBe(true);
  expect(m.value).not.toHaveBeenCalled(); expect(m.write).not.toHaveBeenCalled(); expect(JSON.stringify(result)).not.toContain("fingerprint");
});
it("current active field policy and retained written field policy both protect historical classification labels", async () => {
  const restricted = { ...await makeVersion({ ...target, field: { ...target.field, readCapability: "private.read" } }), id: uuid(80) };
  definition.activeVersion = restricted; definition.activeVersionId = restricted.id;
  await expect(readAdditionalFieldMigrationDetail(session, principal, { definitionId: uuid(4), preparationId: uuid(3) })).rejects.toThrow("private.read");
  expect(m.archive).not.toHaveBeenCalled();
});
it("detail private denial withholds even sealed totals and observation IDs; unknown/foreign preparations remain unavailable", async () => {
  m.native.mockResolvedValue({ id: "private" });
  await expect(readAdditionalFieldMigrationDetail(session, principal, { definitionId: uuid(4), preparationId: uuid(3) })).rejects.toThrow();
  expect(m.count).not.toHaveBeenCalled(); expect(m.archive).not.toHaveBeenCalled();
  m.native.mockResolvedValue(null); m.preparation.mockResolvedValue(null);
  await expect(readAdditionalFieldMigrationDetail(session, principal, { definitionId: uuid(4), preparationId: uuid(3) })).rejects.toThrow("stale");
});
it("selects genuine business authority before explicit customer capture or audited staff support; never nests engines in authoring tx", async () => {
  let inAuthoring = false;
  m.authoring.mockImplementation(async (_actor, _cap, _target, run) => { inAuthoring = true; const result = await run({ session }); inAuthoring = false; return result; });
  m.capture.mockImplementation(async () => { expect(inAuthoring).toBe(false); return principal; });
  expect(await resolveAdditionalFieldMigrationContext(session)).toEqual({ session, principal });
  expect(m.capture).toHaveBeenCalledWith(session); expect(m.support).not.toHaveBeenCalled();
  const staff = { ...session, capabilities: new Set([...session.capabilities, "atlas.staff.manage", "atlas.companies.manage"]) };
  m.authoring.mockImplementation(async (_actor, _cap, _target, run) => run({ session: staff }));
  await resolveAdditionalFieldMigrationContext(staff, "business");
  expect(m.support).toHaveBeenCalledWith(staff, "business"); expect(m.transaction).not.toHaveBeenCalled();
});
async function schemas(from: unknown, to: unknown, value: unknown) {
  sourceVersion = await makeVersion(customFieldPayloadSchema.parse(from)); definition.activeVersion = sourceVersion;
  definition.draft.payload = customFieldPayloadSchema.parse(to);
  const encoded = encodeFieldValue(sourceVersion.payload.field, value);
  metadata = { ...metadata, schemaVersion: sourceVersion, fingerprint: encoded.fingerprint };
  storedValue = { ...encoded, ...metadata };
}
it.each([false, true])("uses Yes/No display and preserves boolean %s without truthiness", async value => {
  const from = { ...source, field: { ...source.field, storage: { type: "boolean" } } };
  const to = { ...target, field: { ...source.field, indexed: true, storage: { type: "boolean" } } };
  await schemas(from, to, value);
  const result = await previewAdditionalFieldMigration(session, principal, { ...request, conversion: { kind: "same_type" } });
  expect(result.examples[0]).toMatchObject({ before: { type: "boolean", value }, after: { type: "boolean", value }, beforeDisplay: value ? "Yes" : "No", afterDisplay: value ? "Yes" : "No" });
});
it("resolves friendly text-to-choice ordinals to exact saved options and exposes labels rather than IDs", async () => {
  const from = { ...source, field: { ...source.field, storage: { type: "string" } } };
  const to = { ...target, field: { ...source.field, storage: { type: "enum", valueSetVersion: 1, options: [{ id: "first", label: "Approved" }] } } };
  await schemas(from, to, "yes");
  const input = { ...request, conversion: { kind: "string_to_enum", mapping: [{ from: "yes", toChoice: 0 }], unmapped: "reject" } };
  const result = await previewAdditionalFieldMigration(session, principal, input);
  expect(result.examples[0]).toMatchObject({ beforeDisplay: "yes", afterDisplay: "Approved", after: { type: "enum", value: "first" } });
  await expect(previewAdditionalFieldMigration(session, principal, { ...input, conversion: { ...input.conversion, mapping: [{ from: "yes", toChoice: 1 }] } })).rejects.toThrow("available target choice");
  const unmapped = await previewAdditionalFieldMigration(session, principal, { ...input, conversion: { ...input.conversion, mapping: [] } });
  expect(unmapped.examples[0]).toMatchObject({ result: "invalid", issue: "UNMAPPED_VALUE", beforeDisplay: "yes", afterDisplay: "Needs review" });
  const empty = await previewAdditionalFieldMigration(session, principal, { ...input, conversion: { ...input.conversion, mapping: [], unmapped: "empty" } });
  expect(empty.examples[0]).toMatchObject({ result: "loss", after: null, afterDisplay: "No value" });
  expect(empty.pageCounts.lossy).toBe(2); expect(m.write).not.toHaveBeenCalled();
});
it("date/time loss requires the explicit original conversion rule and never infers a local timezone", async () => {
  await schemas({ ...source, field: { ...source.field, storage: { type: "datetime", timezone: "UTC" } } },
    { ...target, field: { ...source.field, storage: { type: "date" } } }, "2026-10-12T12:30:00.000Z");
  const rule = { kind: "datetime_to_date", timezone: "UTC", loss: "reject" };
  const denied = await previewAdditionalFieldMigration(session, principal, { ...request, conversion: rule });
  expect(denied.examples[0]).toMatchObject({ issue: "LOSS_REQUIRES_REVIEW", result: "invalid" });
  const lossy = await previewAdditionalFieldMigration(session, principal, { ...request, conversion: { ...rule, loss: "allow_time_loss" } });
  expect(lossy.examples[0]).toMatchObject({ result: "loss", afterDisplay: "2026-10-12" });
  await expect(previewAdditionalFieldMigration(session, principal, { ...request, conversion: { ...rule, timezone: "Europe/London" } })).rejects.toThrow();
});
it("reference display stays neutral; separate referenced-record private access is rechecked before examples", async () => {
  const from = { ...source, entity: ref(9), field: { ...source.field, storage: { type: "reference", entity: ref(9) } } };
  const to = { ...target, field: { ...source.field, indexed: true, storage: { type: "reference", entity: ref(9) } } };
  await schemas(from, to, "linked_secret_id");
  const result = await previewAdditionalFieldMigration(session, principal, { ...request, conversion: { kind: "same_type" } });
  expect(result.examples[0]).toMatchObject({ beforeDisplay: "Linked record", afterDisplay: "Linked record" });
  expect(m.native.mock.calls.some(([args]) => recordId(args.where) === "linked_secret_id")).toBe(true);
  m.native.mockImplementation(async ({ where, select }) => Object.keys(select).length === 1 ? null : recordId(where) === "linked_secret_id" ? null
    : { id: recordId(where), organisationId: "business", version: 1, status: "NEW", priority: "NORMAL", mergedIntoId: null, queueId: "q", queue: { restricted: false } });
  await expect(previewAdditionalFieldMigration(session, principal, { ...request, conversion: { kind: "same_type" } })).rejects.toThrow();
});
it("empty cohorts remain fully authorised, and cursor advances canonical scanned rows only", async () => {
  m.natives.mockResolvedValue([]); m.count.mockResolvedValue(0);
  expect(await previewAdditionalFieldMigration(session, principal, request)).toMatchObject({ affectedCount: 0, examples: [], nextCursor: null, pageCounts: { valid: 0, invalid: 0, lossy: 0 } });
  expect(m.native).toHaveBeenCalled(); // whole private preflight still runs
  m.natives.mockResolvedValue([{ id: "b", organisationId: "business", version: 1 }, { id: "c", organisationId: "business", version: 1 }]);
  await previewAdditionalFieldMigration(session, principal, { ...request, cursor: "a" });
  expect(m.natives).toHaveBeenLastCalledWith(expect.objectContaining({ where: expect.objectContaining({ id: { gt: "a" } }) }));
  m.natives.mockResolvedValue([{ id: "a", organisationId: "foreign", version: 1 }]);
  await expect(previewAdditionalFieldMigration(session, principal, request)).rejects.toThrow();
});
it("editor metadata needs Edit only, returns exact stamps and safe projections, and never opens migration/support or reads live values", async () => {
  const actor = { ...session, capabilities: new Set(["studio.definition.edit", "tickets.ticket.read", "tickets.ticket.manage"]) };
  m.authoring.mockImplementation(async (_actor, capability, _target, run) => { expect(capability).toBe("studio.definition.edit"); return run({ session: actor, transaction: tx, registry }); });
  const result = await readAdditionalFieldMigrationSetup(actor, undefined, { definitionId: uuid(4) });
  expect(result).toMatchObject({ definitionRevision: 7, draftRevision: 9, sourceVersionId: uuid(6),
    source: { kind: "editable", initial: { label: "Our count", type: "integer" } }, target: { kind: "editable", initial: { type: "decimal" } } });
  expect(JSON.stringify(result)).not.toContain("storageGeneration"); expect(JSON.stringify(result)).not.toContain("tickets.ticket.manage");
  expect(m.capture).not.toHaveBeenCalled(); expect(m.support).not.toHaveBeenCalled(); expect(m.count).not.toHaveBeenCalled(); expect(m.value).not.toHaveBeenCalled(); expect(m.write).not.toHaveBeenCalled();
});
it("editor choice ordinals preserve renamed/reordered identities with zero as a real default", async () => {
  const from = { ...source, field: { ...source.field, storage: { type: "enum", valueSetVersion: 1,
    options: [{ id: "a_choice", label: "First" }, { id: "b_choice", label: "Second" }] }, defaultValue: { type: "enum", value: "a_choice" } } };
  const to = { ...target, field: { ...source.field, storage: { type: "enum", valueSetVersion: 2,
    options: [{ id: "b_choice", label: "Renamed second" }, { id: "a_choice", label: "First" }, { id: "new_choice", label: "New" }] }, defaultValue: { type: "enum", value: "b_choice" } } };
  await schemas(from, to, "a_choice");
  const result = await readAdditionalFieldMigrationSetup(session, undefined, { definitionId: uuid(4) });
  expect(result.targetChoiceSourceIndexes).toEqual([1, 0, null]); expect(result.sourceChoiceLabels).toEqual(["First", "Second"]);
  expect(result.source).toMatchObject({ kind: "editable", initial: { initialValue: 0 } });
  expect(result.target).toMatchObject({ kind: "editable", initial: { initialValue: 0 } });
  expect(JSON.stringify(result)).not.toContain("a_choice"); expect(JSON.stringify(result)).not.toContain("new_choice");
});
it("unrepresentable/retired settings preserve an explicit read-only reason instead of silently dropping history", async () => {
  await schemas({ ...source, field: { ...source.field, storage: { type: "string", minLength: 0, maxLength: 200, pattern: "^[A-Z]{1,10}$" } } }, target, "CUSTOM");
  const result = await readAdditionalFieldMigrationSetup(session, undefined, { definitionId: uuid(4) });
  expect(result.source).toMatchObject({ kind: "read_only", reason: expect.stringContaining("character rules") });
  expect(m.write).not.toHaveBeenCalled();
});
it("setup denies private reference defaults before exposing friendly labels; exact tenant/source mirrors still checked", async () => {
  const from = { ...source, entity: ref(9), field: { ...source.field, storage: { type: "reference", entity: ref(9) }, defaultValue: { type: "reference", value: "private_default" } } };
  const to = { ...target, field: { ...source.field, storage: { type: "reference", entity: ref(9) } } };
  await schemas(from, to, "private_default");
  m.native.mockResolvedValue(null);
  await expect(readAdditionalFieldMigrationSetup(session, undefined, { definitionId: uuid(4) })).rejects.toThrow();
  expect(m.count).not.toHaveBeenCalled(); expect(m.value).not.toHaveBeenCalled();
  definition.draft.organisationId = "foreign";
  await expect(readAdditionalFieldMigrationSetup(session, undefined, { definitionId: uuid(4) })).rejects.toThrow("stale");
});

it("retained detail survives legitimate native revision/current active version changes while retaining original immutable intent", async () => {
  const current = { ...await makeVersion(target), id: uuid(80) };
  definition.activeVersion = current; definition.activeVersionId = current.id; definition.revision = 20;
  m.native.mockImplementation(async ({ where, select }) => Object.keys(select).length === 1 ? null
    : { id: recordId(where), organisationId: "business", version: 8, status: "CLOSED", mergedIntoId: null, queueId: "q", queue: { restricted: false } });
  const result = await readAdditionalFieldMigrationDetail(session, principal, { definitionId: uuid(4), preparationId: uuid(3) });
  expect(result.rows).toEqual([{ label: "Record 1", result: "ready", issue: null }]);
  expect(result.review).toBeNull(); expect(result.countsScope).toBe("sealed_review_or_unavailable");
  expect(m.value).not.toHaveBeenCalled(); expect(m.write).not.toHaveBeenCalled();
});
it("retained written-field restrictions deny archive labels independently of today's current field rights", async () => {
  const written = { ...await makeVersion({ ...source, field: { ...source.field, readCapability: "private.read" } }), id: uuid(90) };
  archiveObservation.extension!.slot!.value!.versionId = written.id;
  m.version.mockImplementation(async ({ where }) => where.id === written.id ? written : sourceVersion);
  await expect(readAdditionalFieldMigrationDetail(session, principal, { definitionId: uuid(4), preparationId: uuid(3) })).rejects.toThrow("private.read");
  expect(m.value).not.toHaveBeenCalled(); expect(m.write).not.toHaveBeenCalled();
});
it.each(["intent", "source_mirror", "review", "foreign_archive", "unknown_state"])("detail refuses %s corruption instead of blessing a retained checksum", async kind => {
  const p = await preparation();
  if (kind === "intent") p.intentChecksum = "f".repeat(64);
  if (kind === "source_mirror") p.sourceGenerationId = uuid(99);
  if (kind === "review") {
    const r = sealFieldMigrationReview({ ...p.intent, cohort: { recordCount: 1, observationDigest: checksum(archiveObservation) }, summary: { validCount: 1, invalidCount: 0, lossyCount: 0 } });
    m.preparation.mockResolvedValue({ ...p, review: { id: p.id, organisationId: "business", definitionId: uuid(4), review: r.review, checksum: "f".repeat(64) } });
  } else m.preparation.mockResolvedValue({ ...p, ...(kind === "unknown_state" ? { state: "EXECUTING" } : {}) });
  if (kind === "foreign_archive") m.archive.mockResolvedValue([{ organisationId: "foreign", definitionId: uuid(4), preparationId: p.id,
    entityId: "tickets.ticket", sourceGenerationId: uuid(1), recordId: "a", nativeRevision: 1, observation: archiveObservation }]);
  await expect(readAdditionalFieldMigrationDetail(session, principal, { definitionId: uuid(4), preparationId: uuid(3) })).rejects.toThrow();
  expect(m.value).not.toHaveBeenCalled(); expect(m.write).not.toHaveBeenCalled();
});

// Conditional source/metadata/row/fact/codec/converter paths are real. Fresh
// runtime authority issuance and SQL rows are explicit collaborators, not SQL or
// genuine cookie/session proof; original required runtime suites cover those.
async function conditionalTarget() {
  const payload = conditionalFieldPayloadSchema.parse({ ...source, entity: ref(9), storageGeneration: uuid(2), schemaVersion: 2,
    requiredIf: { match: "all", predicates: [{ source: { kind: "native", fieldId: "status" }, operator: "equals", value: { type: "enum", value: "NEW" } }] } });
  Object.assign(definition, { organisationId: "business", kind: "customField", key: "tickets.ticket.count", retiredAt: null });
  definition.draft.payload = payload;
  return { ...request, conversion: { kind: "same_type" } };
}
it("previews a real optional1→conditional2 draft through original conditional facts/conversion; zero is present", async () => {
  const input = await conditionalTarget();
  const result = await previewAdditionalFieldMigration(session, principal, input);
  expect(result).toMatchObject({ affectedCount: 3, pageCounts: { valid: 2, invalid: 0, lossy: 0 } });
  expect(result.examples).toHaveLength(2);
  for (const example of result.examples) expect(example).toMatchObject({ before: { type: "integer", value: 0 }, after: { type: "integer", value: 0 }, result: "ready" });
  expect(m.refresh).toHaveBeenCalled(); expect(m.native.mock.calls.some(([args]) => args.select?.priority)).toBe(true);
  expect(m.write).not.toHaveBeenCalled();
});
it("conditional missing source values become FIELD_REQUIRED only after real target condition evaluation, never a default fill", async () => {
  const input = await conditionalTarget(); m.extension.mockResolvedValue(null);
  const result = await previewAdditionalFieldMigration(session, principal, input);
  expect(result.pageCounts).toEqual({ valid: 0, invalid: 2, lossy: 0 });
  for (const example of result.examples) expect(example).toMatchObject({ before: null, after: null, issue: "FIELD_REQUIRED", result: "invalid" });
  expect(m.write).not.toHaveBeenCalled();
});
it("condition false permits null; corrupt actual fact/revision fails before source typed columns", async () => {
  const input = await conditionalTarget(); m.extension.mockResolvedValue(null);
  const native = m.native.getMockImplementation()!;
  m.native.mockImplementation(async (...args) => { const row = await native(...args); return row ? { ...row, status: "IN_PROGRESS" } : row; });
  expect((await previewAdditionalFieldMigration(session, principal, input)).pageCounts).toEqual({ valid: 2, invalid: 0, lossy: 0 });
  m.native.mockImplementation(async (...args) => { const row = await native(...args); return row && args[0].select?.priority ? { ...row, version: 99 } : row; });
  await expect(previewAdditionalFieldMigration(session, principal, input)).rejects.toThrow();
  expect(m.value.mock.calls.some(([args]) => !args.select)).toBe(false);
});
it.each(["private", "current_field", "written_field", "module", "stamp"])("conditional %s denial keeps counts/provider/typed values behind their owning gates", async mode => {
  const input = await conditionalTarget();
  if (mode === "private") m.native.mockResolvedValue({ id: "private" });
  if (mode === "current_field") definition.draft.payload = { ...(definition.draft.payload as VersionedFieldPayload), field: { ...source.field, writeCapability: "private.manage" } };
  if (mode === "written_field") metadata.schemaVersion = await makeVersion({ ...source, field: { ...source.field, readCapability: "private.read" } });
  if (mode === "module") m.module.mockResolvedValue(null);
  if (mode === "stamp") m.member.mockResolvedValue({ sessionVersion: 3, user: { authVersion: 1 } });
  await expect(previewAdditionalFieldMigration(session, principal, input)).rejects.toThrow();
  expect(m.value.mock.calls.some(([args]) => !args.select)).toBe(false); expect(m.write).not.toHaveBeenCalled();
  if (mode !== "written_field") expect(m.count).not.toHaveBeenCalled();
});
it("closed2 source→closed1 removal remains explicit required protocol; saved conditional source is reconstructed exactly", async () => {
  const input = await conditionalTarget(), proposed = definition.draft.payload;
  const original = sourceVersion;
  const conditionalSource = { ...(proposed as VersionedFieldPayload), storageGeneration: uuid(1) };
  const compiled = await compileFieldMigrationMetadata({ session, transaction: tx as never }, registry,
    { id: "business", kind: "CUSTOMER", status: "ACTIVE", archivedAt: null, isTest: true }, uuid(4), conditionalSource);
  const version = { ...original, schemaVersion: 2, payload: compiled.payload, compiledPlan: compiled.plan, checksum: compiled.checksum };
  definition.activeVersion = version as typeof original; sourceVersion = version as typeof original;
  definition.draft.payload = { ...source, entity: ref(9), storageGeneration: uuid(2) };
  metadata.schemaVersion = original;
  expect((await previewAdditionalFieldMigration(session, principal, input)).pageCounts.valid).toBe(2);
});

it("required detail reads actual sealed2 observation classifications, not schema1 projections or live examples", async () => {
  await conditionalTarget();
  const targetPayload = versionedFieldPayloadSchema.parse(definition.draft.payload);
  const compiled = await compileFieldMigrationMetadata({ session, transaction: tx as never }, registry,
    { id: "business", kind: "CUSTOMER", status: "ACTIVE", archivedAt: null, isTest: true }, uuid(4), targetPayload);
  const query = registry.describe("tickets.ticket.field_migration", 4), intent = sealRequiredFieldMigrationIntent({
    schemaVersion: 2, id: uuid(3), organisationId: "business", definitionId: uuid(4), definitionRevision: 7, principal,
    source: { versionId: sourceVersion.id, versionChecksum: sourceVersion.checksum, payload: sourceVersion.payload },
    target: { draftId: uuid(5), draftRevision: 9, compiledChecksum: compiled.checksum, payload: compiled.payload },
    conversion: { kind: "same_type" }, ownerQuery: { id: query.id, version: query.version, schemaHash: query.schemaHash, contractHash: query.contractHash } });
  const observed = await inspectRequiredFieldMigrationRecord({ session, transaction: tx as never }, intent.intent,
    { recordId: "a", organisationId: "business", revision: 1 });
  const reviewed = sealRequiredFieldMigrationReview({ ...intent.intent, cohort: { recordCount: 1, observationDigest: "a".repeat(64) }, summary: { validCount: 1, invalidCount: 0, lossyCount: 0 } });
  const previous = await m.preparation();
  m.preparation.mockResolvedValue({ ...previous, intent: intent.intent, intentChecksum: intent.checksum, state: "REVIEWED",
    review: { id: uuid(3), organisationId: "business", definitionId: uuid(4), review: reviewed.review, checksum: reviewed.checksum } });
  m.archive.mockResolvedValue([{ organisationId: "business", definitionId: uuid(4), preparationId: uuid(3), entityId: "tickets.ticket",
    sourceGenerationId: uuid(1), recordId: "a", nativeRevision: 1, observation: observed.observation }]);
  const result = await readAdditionalFieldMigrationDetail(session, principal, { definitionId: uuid(4), preparationId: uuid(3) });
  expect(result).toMatchObject({ review: { affectedCount: 1, valid: 1 }, rows: [{ label: "Record 1", result: "ready", issue: null }] });
  expect(JSON.stringify(result)).not.toMatch(/requirement|fingerprint|predicates|authVersion/); expect(m.write).not.toHaveBeenCalled();
  m.archive.mockResolvedValue([{ organisationId: "business", definitionId: uuid(4), preparationId: uuid(3), entityId: "tickets.ticket",
    sourceGenerationId: uuid(1), recordId: "a", nativeRevision: 1, observation: { ...observed.observation, requirement: undefined } }]);
  await expect(readAdditionalFieldMigrationDetail(session, principal, { definitionId: uuid(4), preparationId: uuid(3) })).rejects.toThrow();
});
