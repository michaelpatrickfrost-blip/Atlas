import { beforeEach, expect, it, vi } from "vitest";
import type { Session } from "@/core/auth/session";
import type { Prisma } from "@/generated/prisma/client";
import type { FieldRuntimeAuthority } from "@/core/studio/fields/runtime-authority";
import { buildRegistry } from "@/core/studio/registry/runtime";
import { compileCustomField } from "@/core/studio/compiler/fields";
import { customFieldPayloadSchema } from "@/core/studio/fields/schema";
import { checksum } from "@/core/studio/registry/contracts";
import { entityProfilePayloadSchema, recordTypePayloadSchema, configurationReferenceSchema } from "@/core/studio/record-types/schema";
import { resolveEntityProfile, resolveRecordTypeProfile } from "@/core/studio/record-types/resolver";
const m = vi.hoisted(() => ({ stamps: new WeakMap<object, object>(), module: vi.fn(), compile: vi.fn(), create: vi.fn(), draft: vi.fn(),
  save: vi.fn(), definition: vi.fn(), version: vi.fn(), versions: vi.fn(), bases: vi.fn(), audit: vi.fn(), lock: vi.fn(),
  publish: vi.fn(), activate: vi.fn(), required: vi.fn(), definitions: vi.fn() }));
vi.mock("@/core/auth/session", () => ({ sessionAuthorityStamp: (session: object) => m.stamps.get(session) }));
vi.mock("@/core/audit/log", () => ({ writeAudit: m.audit }));
vi.mock("@/core/studio/compiler", () => ({ compileDefinitionInTransaction: m.compile, parseDefinitionPayload: (kind: string, payload: unknown) => {
  if (kind === "customField") return customFieldPayloadSchema.parse(payload);
  if (kind === "entityProfile") return entityProfilePayloadSchema.parse(payload);
  if (kind === "recordType") return recordTypePayloadSchema.parse(payload);
  throw new Error("unsupported kind");
} }));
vi.mock("@/core/studio/fields/entity-lock", () => ({ lockFieldEntitiesInTransaction: m.lock }));
vi.mock("@/core/studio/definitions/publication", () => ({ publishCompiledDefinitionInTransaction: m.publish }));
vi.mock("@/core/studio/definitions/activation", () => ({ activateCompiledVersionInTransaction: m.activate }));
vi.mock("@/core/studio/fields/activation-coverage", () => ({ prepareRequiredFieldActivationInTransaction: m.required }));
import { createAdditionalFieldDraftInTransaction, saveAdditionalFieldDraftInTransaction, createBaseProfileDraftInTransaction,
  saveBaseProfileDraftInTransaction, createRecordTypeDraftInTransaction, saveRecordTypeDraftInTransaction, readConfigurationDraftInTransaction,
  reviewConfigurationDraftInTransaction, publishConfigurationDraftInTransaction, activateConfigurationVersionInTransaction,
  goLiveConfigurationDraftInTransaction, getSetupCatalogInTransaction, configureAdditionalFieldDraftInTransaction } from "@/core/studio/authoring/configuration";
import { additionalFieldSetupSchema } from "@/core/studio/authoring/field-setup-contract";
// Real owner metadata, field compiler/constraints, profile schemas/resolver and
// exact generic immutable pin/edge seals. Profile compiler/SQL/fresh authority,
// publication/activation/coverage/Audit are explicit collaborators, not SQL proof.
const uuid = (n: number) => `60000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const session: Session = { userId: "actor", organisationId: "business", membershipId: "member", userName: "Actor", userEmail: "actor@example.test",
  organisationName: "Business", capabilities: new Set(["studio.definition.read", "studio.definition.edit", "studio.definition.publish", "tickets.ticket.read", "tickets.ticket.manage"]) };
const stamp = { userId: "actor", organisationId: "business", membershipId: "member", authVersion: 1, sessionVersion: 2 };
const registry = buildRegistry(async () => true), source = registry.describe("tickets.ticket", 9);
const entity = { id: source.id, version: source.version, schemaHash: source.schemaHash, contractHash: source.contractHash };
const tx = { moduleState: { findFirst: m.module }, studioDefinition: { create: m.create, findFirst: m.definition, findMany: m.definitions },
  studioDraft: { findFirst: m.draft, updateMany: m.save }, studioDefinitionVersion: { findFirst: m.version, findMany: m.versions },
  studioProfileBinding: { findMany: m.bases } } as unknown as Prisma.TransactionClient;
const authority: FieldRuntimeAuthority = { session, stamp, transaction: tx, registry };
let draft: { id: string; definitionId: string; organisationId: string; revision: number; payload: unknown;
  definition: { id: string; kind: string; organisationId: string; revision: number; activeVersionId: string | null; latestVersion: number }; baseVersion: { version: number } | null };
let rows: ReturnType<typeof sealed>[];
function sealed(id: number, kind: string, payload: object, plan: object) {
  const refs = "configurationDependencies" in plan ? configurationReferenceSchema.array().parse(plan.configurationDependencies) : [];
  return { id: uuid(id + 10), definitionId: uuid(id), organisationId: "business", version: 1, schemaVersion: 1, payload, compiledPlan: plan,
    checksum: checksum(plan), publishedAt: new Date("2026-10-11T12:00:00Z"), definition: { id: uuid(id), kind, organisationId: "business", retiredAt: null },
    configurationDependencies: refs.map(pin => ({ organisationId: "business", definitionId: uuid(id), versionId: uuid(id + 10), targetDefinitionId: pin.definitionId,
      targetVersionId: pin.versionId, targetKind: pin.kind, targetSchemaVersion: pin.schemaVersion, targetChecksum: pin.checksum })) };
}
beforeEach(async () => {
  vi.restoreAllMocks(); vi.clearAllMocks(); m.stamps.set(session, stamp); m.module.mockResolvedValue({ id: "studio" });
  const field = await compileCustomField(session, { schemaVersion: 1, entity, storageGeneration: uuid(50), field: { key: "review_count", label: "Count",
    classification: "confidential", readCapability: source.capability, writeCapability: "tickets.ticket.manage", storage: { type: "integer" } } }, registry);
  const base = entityProfilePayloadSchema.parse({ schemaVersion: 1, entity, profile: {} });
  const resolved = resolveEntityProfile(base)!;
  rows = [sealed(1, "customField", field.payload, field.plan), sealed(2, "entityProfile", base, { kind: "entityProfile", schemaVersion: 1, payload: base,
    resolvedProfile: resolved.profile, dependencies: [], configurationDependencies: [] } as object)];
  draft = { id: "draft", definitionId: uuid(1), organisationId: "business", revision: 3, payload: field.payload,
    definition: { id: uuid(1), kind: "customField", organisationId: "business", revision: 7, activeVersionId: uuid(11), latestVersion: 1 }, baseVersion: { version: 1 } };
  m.draft.mockImplementation(async ({ where }) => where.organisationId === "business" && where.definitionId === draft.definitionId
    && (where.revision === undefined || where.revision === draft.revision) ? draft : null);
  m.definition.mockImplementation(async ({ where }) => { const row = rows.find(row => row.definitionId === where.id && row.organisationId === where.organisationId && row.definition.kind === where.kind);
    return row ? { ...row.definition, activeVersionId: row.id, activeVersion: row } : null; });
  m.version.mockImplementation(async ({ where }) => rows.find(row => row.id === where.id && row.definitionId === where.definitionId && row.organisationId === where.organisationId) ?? null);
  m.compile.mockImplementation(async (a: FieldRuntimeAuthority, id: string, kind: string, input: unknown) => {
    if (kind === "customField") return compileCustomField(a.session, input, a.registry);
    const payload = kind === "entityProfile" ? entityProfilePayloadSchema.parse(input) : recordTypePayloadSchema.parse(input);
    const resolved = kind === "entityProfile" ? resolveEntityProfile(payload)! : resolveRecordTypeProfile({ reference: recordTypePayloadSchema.parse(payload).baseProfile,
      payload: rows.find(row => row.id === recordTypePayloadSchema.parse(payload).baseProfile.versionId)!.payload }, payload, id);
    const plan = { kind, schemaVersion: 1, payload, resolvedProfile: resolved.profile, dependencies: [], configurationDependencies: resolved.configurationDependencies };
    return { payload, plan, checksum: checksum(plan), warnings: [] };
  });
  m.create.mockResolvedValue({ id: uuid(99) }); m.save.mockResolvedValue({ count: 1 }); m.bases.mockResolvedValue([{ definitionId: uuid(2) }]);
  m.versions.mockResolvedValue(rows); m.definitions.mockResolvedValue([]);
  m.publish.mockResolvedValue({ version: { id: uuid(11) }, versionNumber: 2, draftRevision: 4 }); m.activate.mockResolvedValue({ revision: 9 }); m.required.mockResolvedValue(session);
});
it.each(["string", "integer", "boolean", "date"])("creates a friendly optional %s draft with server-owned policy/key/generation and no activation", async type => {
  expect(await createAdditionalFieldDraftInTransaction(authority, { label: "  Our detail  ", type })).toMatchObject({ revision: 0 });
  const data = m.create.mock.calls[0][0].data, payload = customFieldPayloadSchema.parse(data.draft.create.payload);
  expect(data).toMatchObject({ organisationId: "business", name: "Our detail", kind: "customField", createdBy: "actor" });
  expect(payload.entity).toEqual(entity); expect(payload.storageGeneration).toMatch(/^[a-f0-9-]{36}$/);
  expect(payload.field).toMatchObject({ label: "Our detail", help: "", storage: { type }, required: false, indexed: false, unique: false,
    classification: "confidential", readCapability: "tickets.ticket.read", writeCapability: "tickets.ticket.manage" });
  expect(payload.field.key).toMatch(/^f_[a-f0-9]{32}$/); expect(data.key).toBe(`tickets.ticket.${payload.field.key}`);
  expect(m.publish).not.toHaveBeenCalled(); expect(m.activate).not.toHaveBeenCalled();
  expect(m.lock.mock.invocationCallOrder[0]).toBeLessThan(m.create.mock.invocationCallOrder[0]);
});
it("rejects client identity/security/structural/default extras and unsupported storage before creating a draft", async () => {
  for (const extra of [{ organisationId: "other" }, { key: "status" }, { storageGeneration: uuid(90) }, { readCapability: "secret.read" },
    { required: true }, { defaultValue: { type: "boolean", value: false } }, { type: "reference" }])
    await expect(createAdditionalFieldDraftInTransaction(authority, { label: "Detail", type: "string", ...extra })).rejects.toThrow();
  expect(m.create).not.toHaveBeenCalled(); expect(m.audit).not.toHaveBeenCalled();
});
it.each(["forged", "studio", "edit", "native_read", "native_manage"])("denies %s authoring before draft reads or writes", async mode => {
  let a = authority;
  if (mode === "forged") a = { ...a, session: { ...session } };
  else if (mode === "studio") m.module.mockResolvedValue(null);
  else { const capabilities = new Set(session.capabilities); capabilities.delete(mode === "edit" ? "studio.definition.edit" : `tickets.ticket.${mode === "native_read" ? "read" : "manage"}`);
    const current = { ...session, capabilities }; m.stamps.set(current, stamp); a = { ...a, session: current }; }
  await expect(createAdditionalFieldDraftInTransaction(a, { label: "Detail", type: "string" })).rejects.toThrow();
  expect(m.draft).not.toHaveBeenCalled(); expect(m.create).not.toHaveBeenCalled();
});
it("saves labels/help with exact scoped draft CAS while preserving all server storage/security flags", async () => {
  const previous = customFieldPayloadSchema.parse(draft.payload);
  await saveAdditionalFieldDraftInTransaction(authority, { definitionId: draft.definitionId, revision: 3, label: "Packages", help: "Enter a count" });
  expect(m.save.mock.calls[0][0]).toMatchObject({ where: { id: "draft", organisationId: "business", revision: 3, definition: { retiredAt: null } }, data: { revision: { increment: 1 } } });
  expect(m.save.mock.calls[0][0].data.payload).toEqual({ ...previous, field: { ...previous.field, label: "Packages", help: "Enter a count" } });
  expect(m.audit).toHaveBeenCalledWith(expect.objectContaining({ organisationId: "business", action: "studio.draft.updated" }), tx);
});
it("stale saves, lost CAS, wrong kind and schema2 edits remain closed before successful Audit", async () => {
  await expect(saveAdditionalFieldDraftInTransaction(authority, { definitionId: draft.definitionId, revision: 2, label: "New" })).rejects.toThrow("CONFLICT");
  m.save.mockResolvedValueOnce({ count: 0 });
  await expect(saveAdditionalFieldDraftInTransaction(authority, { definitionId: draft.definitionId, revision: 3, label: "New" })).rejects.toThrow("CONFLICT");
  draft.payload = { ...customFieldPayloadSchema.parse(draft.payload), schemaVersion: 2 };
  await expect(saveAdditionalFieldDraftInTransaction(authority, { definitionId: draft.definitionId, revision: 3, label: "New" })).rejects.toThrow();
  expect(m.audit).not.toHaveBeenCalled();
});
it("creates the canonical base key from current active server field pins and exposes no customer-provided seals", async () => {
  await createBaseProfileDraftInTransaction(authority, { pageDefinitionId: null, requiredFieldDefinitionIds: [uuid(1)] });
  const data = m.create.mock.calls[0][0].data;
  expect(data.key).toBe("tickets.ticket.base_profile");
  expect(entityProfilePayloadSchema.parse(data.draft.create.payload).profile.requiredFields).toEqual([{ kind: "customField", definitionId: uuid(1), versionId: uuid(11), schemaVersion: 1, checksum: rows[0].checksum }]);
  await expect(createBaseProfileDraftInTransaction(authority, { pageDefinitionId: null, requiredFieldDefinitionIds: [uuid(1), uuid(1)] })).rejects.toThrow();
  await expect(createBaseProfileDraftInTransaction(authority, { pageDefinitionId: null, requiredFieldDefinitionIds: [], baseProfile: {} })).rejects.toThrow();
});
it("rejects missing, inactive, foreign or wrong-owner selected fields before persisting the setup", async () => {
  await expect(createBaseProfileDraftInTransaction(authority, { pageDefinitionId: null, requiredFieldDefinitionIds: [uuid(90)] })).rejects.toThrow();
  m.definition.mockResolvedValueOnce({ activeVersionId: null, activeVersion: null });
  await expect(createBaseProfileDraftInTransaction(authority, { pageDefinitionId: null, requiredFieldDefinitionIds: [uuid(1)] })).rejects.toThrow();
  rows[0].organisationId = "foreign";
  await expect(createBaseProfileDraftInTransaction(authority, { pageDefinitionId: null, requiredFieldDefinitionIds: [uuid(1)] })).rejects.toThrow();
  expect(m.create).not.toHaveBeenCalled();
});
it("requires the selected field's independent Read grant before persisting a mandatory-field pin", async () => {
  const original = customFieldPayloadSchema.parse(rows[0].payload);
  const privateField = await compileCustomField({ ...session, capabilities: new Set([...session.capabilities, "tickets.private.read"]) }, { ...original, field: { ...original.field, readCapability: "tickets.private.read" } }, registry);
  rows[0].payload = privateField.payload; rows[0].compiledPlan = privateField.plan; rows[0].checksum = privateField.checksum;
  await expect(createBaseProfileDraftInTransaction(authority, { pageDefinitionId: null, requiredFieldDefinitionIds: [uuid(1)] })).rejects.toThrow("FORBIDDEN");
  expect(m.create).not.toHaveBeenCalled();
});
it("creates a subtype from the current canonical base and keeps omitted Page as inheritance, explicit null as replacement", async () => {
  await createRecordTypeDraftInTransaction(authority, { label: "Complaint", requiredFieldDefinitionIds: [] });
  const first = recordTypePayloadSchema.parse(m.create.mock.calls[0][0].data.draft.create.payload);
  expect(first.baseProfile).toEqual({ kind: "entityProfile", definitionId: uuid(2), versionId: uuid(12), schemaVersion: 1, checksum: rows[1].checksum });
  expect(first.overlay).not.toHaveProperty("page");
  await createRecordTypeDraftInTransaction(authority, { label: "Simple", pageDefinitionId: null, requiredFieldDefinitionIds: [] });
  expect(recordTypePayloadSchema.parse(m.create.mock.calls[1][0].data.draft.create.payload).overlay.page).toBeNull();
});
it("subtype edits preserve the exact retained base instead of loading today's changed base", async () => {
  await createRecordTypeDraftInTransaction(authority, { label: "Complaint", requiredFieldDefinitionIds: [] });
  const previous = recordTypePayloadSchema.parse(m.create.mock.calls[0][0].data.draft.create.payload);
  draft.definition.kind = "recordType"; draft.definitionId = uuid(3); draft.definition.id = uuid(3); draft.payload = previous; m.bases.mockClear();
  await saveRecordTypeDraftInTransaction(authority, { definitionId: draft.definitionId, revision: 3, label: "Returns", requiredFieldDefinitionIds: [uuid(1)] });
  expect(m.bases).not.toHaveBeenCalled();
  expect(recordTypePayloadSchema.parse(m.save.mock.calls[0][0].data.payload)).toMatchObject({ baseProfile: previous.baseProfile, label: "Returns" });
});
it("base editing retains reserved Process/Decision configuration instead of erasing it from a simpler setup form", async () => {
  draft.definition.kind = "entityProfile"; draft.payload = rows[1].payload;
  await saveBaseProfileDraftInTransaction(authority, { definitionId: draft.definitionId, revision: 3, pageDefinitionId: null, requiredFieldDefinitionIds: [uuid(1)] });
  expect(entityProfilePayloadSchema.parse(m.save.mock.calls[0][0].data.payload).profile).toMatchObject({ allowedProcesses: [], defaultDecisions: [] });
});
it("read and review return saved draft metadata/typed payload and exact revision, never native records or posted draft payload", async () => {
  expect(await readConfigurationDraftInTransaction(authority, draft.definitionId)).toMatchObject({ kind: "customField", revision: 3, definitionRevision: 7, activeVersionId: uuid(11) });
  await reviewConfigurationDraftInTransaction(authority, { definitionId: draft.definitionId, revision: 3 });
  expect(m.save.mock.calls[0][0].data.validation.validatedRevision).toBe(3);
  await expect(reviewConfigurationDraftInTransaction(authority, { definitionId: draft.definitionId, revision: 3, payload: {} })).rejects.toThrow();
  expect(m.publish).not.toHaveBeenCalled();
});
it("checks an existing field's own Read grant before returning its configured default metadata", async () => {
  const previous = customFieldPayloadSchema.parse(draft.payload);
  draft.payload = { ...previous, field: { ...previous.field, readCapability: "tickets.private.read", defaultValue: { type: "integer", value: 0 } } };
  await expect(readConfigurationDraftInTransaction(authority, draft.definitionId)).rejects.toThrow("FORBIDDEN");
  expect(m.versions).not.toHaveBeenCalled();
});
it("preflights an existing reference default's native target before returning its identifier", async () => {
  const previous = customFieldPayloadSchema.parse(draft.payload);
  draft.payload = { ...previous, field: { ...previous.field, storage: { type: "reference", entity }, defaultValue: { type: "reference", value: "private-ticket" } } };
  const target = vi.spyOn(registry, "authoriseRecord").mockRejectedValueOnce(new Error("FORBIDDEN: private target"));
  await expect(readConfigurationDraftInTransaction(authority, draft.definitionId)).rejects.toThrow("private target");
  expect(target).toHaveBeenCalledWith({ session, transaction: tx }, entity, { recordId: "private-ticket", intent: "read" });
  expect(m.versions).not.toHaveBeenCalled();
});
it("shows retained conditional field setup metadata without offering the ordinary schema1 presentation editor", async () => {
  draft.payload = { ...customFieldPayloadSchema.parse(draft.payload), schemaVersion: 2,
    requiredIf: { match: "all", predicates: [{ operator: "present", source: { kind: "native", fieldId: "status" } }] } };
  expect(await readConfigurationDraftInTransaction(authority, draft.definitionId)).toMatchObject({ presentationEditable: false, payload: { schemaVersion: 2 } });
});
it("publish-only uses the original binder with fresh compilation and warning acknowledgement; structural migration failure propagates", async () => {
  const result = await publishConfigurationDraftInTransaction(authority, { definitionId: draft.definitionId, revision: 3, acknowledgeWarnings: false });
  expect(result).toEqual({ revision: 4, definitionRevision: 8, versionId: uuid(11), version: 2 });
  expect(m.publish.mock.calls[0]).toHaveLength(5); expect(m.activate).not.toHaveBeenCalled();
  m.publish.mockRejectedValueOnce(new Error("MIGRATION_REQUIRED: structural evolution"));
  await expect(publishConfigurationDraftInTransaction(authority, { definitionId: draft.definitionId, revision: 3, acknowledgeWarnings: false })).rejects.toThrow("MIGRATION_REQUIRED");
  m.compile.mockResolvedValueOnce({ payload: {}, plan: {}, checksum: "f".repeat(64), warnings: ["Review source"] });
  await expect(publishConfigurationDraftInTransaction(authority, { definitionId: draft.definitionId, revision: 3, acknowledgeWarnings: false })).rejects.toThrow("acknowledge");
});
it("activation uses exact server version seals and shared primitive; required field activation still enters original cohort gate", async () => {
  await activateConfigurationVersionInTransaction(authority, { definitionId: uuid(1), versionId: uuid(11), definitionRevision: 7 });
  expect(m.activate).toHaveBeenCalledWith(tx, session, uuid(1), 7, rows[0], expect.anything()); expect(m.required).not.toHaveBeenCalled();
  const required = await compileCustomField(session, { ...customFieldPayloadSchema.parse(rows[0].payload), field: { ...customFieldPayloadSchema.parse(rows[0].payload).field, required: true } }, registry);
  rows[0].payload = required.payload; rows[0].compiledPlan = required.plan; rows[0].checksum = required.checksum;
  await activateConfigurationVersionInTransaction(authority, { definitionId: uuid(1), versionId: uuid(11), definitionRevision: 7 });
  expect(m.required).toHaveBeenCalledWith(session, tx, { definitionId: uuid(1), versionId: uuid(11), definitionRevision: 7 }, expect.objectContaining({ checksum: required.checksum }));
});
it("explicit go live keeps publication and activation on the same existing transaction and propagates coverage failure", async () => {
  expect(await goLiveConfigurationDraftInTransaction(authority, { definitionId: uuid(1), revision: 3, acknowledgeWarnings: false })).toMatchObject({ definitionRevision: 9 });
  expect(m.publish.mock.calls[0][0]).toBe(tx); expect(m.activate.mock.calls[0][0]).toBe(tx);
  m.activate.mockRejectedValueOnce(new Error("Required value missing"));
  await expect(goLiveConfigurationDraftInTransaction(authority, { definitionId: uuid(1), revision: 3, acknowledgeWarnings: false })).rejects.toThrow("Required value");
});
it("catalogue is bounded, server tenant-scoped, metadata-only and offers only owner-approved friendly typed choices", async () => {
  const result = await getSetupCatalogInTransaction(authority);
  expect(result.fieldTypes.map(type => type.id)).toEqual(["string", "integer", "decimal", "money", "boolean", "date", "datetime", "duration", "email", "url", "phone", "enum", "multi_enum", "reference", "address"]);
  expect(result.referenceTargets).toEqual([{ id: "tickets.ticket", name: source.label }]);
  expect(m.definitions.mock.calls.every(([args]) => args.where.organisationId === "business" && args.take === 101)).toBe(true);
  m.definitions.mockResolvedValueOnce(Array(101).fill({}));
  await expect(getSetupCatalogInTransaction(authority)).rejects.toThrow("bounded");
});

it.each([
  { type: "string", settings: { minLength: 1, maxLength: 20, characters: "letters_numbers_spaces_dashes" }, initialValue: "Our detail" },
  { type: "integer", settings: { min: 0, max: 10 }, initialValue: 0 },
  { type: "decimal", settings: { precision: 6, scale: 2, min: "0", max: "10" }, initialValue: "0.00" },
  { type: "money", settings: { precision: 8, scale: 2, currencies: ["GBP"] }, initialValue: { amount: "0", currency: "GBP" } },
  { type: "boolean", initialValue: false },
  { type: "date", initialValue: "2026-10-11" },
  { type: "datetime", initialValue: "2026-10-11T12:00:00Z" },
  { type: "duration", settings: { min: 0, max: 3600 }, initialValue: 0 },
  { type: "email", initialValue: "Contact@example.test" },
  { type: "url", initialValue: "https://example.test" },
  { type: "phone", initialValue: "+441234567890" },
  { type: "enum", settings: { choices: ["One", "Two"] }, initialValue: 0 },
  { type: "multi_enum", settings: { choices: ["One", "Two"], maxSelections: 2 }, initialValue: [1, 0] },
  { type: "address", settings: { countries: ["GB"] }, initialValue: { line1: "One", city: "Town", country: "GB" } },
])("validates friendly $type constraints/defaults through the original typed compiler", async setup => {
  await createAdditionalFieldDraftInTransaction(authority, { label: "Detail", ...setup });
  const payload = customFieldPayloadSchema.parse(m.create.mock.calls[0][0].data.draft.create.payload), field = payload.field;
  expect(field.storage.type).toBe(setup.type); expect(field.defaultValue?.type).toBe(setup.type);
  expect(field).toMatchObject({ required: false, unique: false, indexed: false, readCapability: source.capability, writeCapability: "tickets.ticket.manage" });
  if (field.storage.type === "enum" || field.storage.type === "multi_enum") {
    expect(field.storage.valueSetVersion).toBe(1);
    expect(field.storage.options.map(option => option.label)).toEqual(["One", "Two"]);
    expect(field.storage.options.every(option => /^o_[a-f0-9]{32}$/.test(option.id))).toBe(true);
    expect(field.defaultValue?.value).toEqual(field.storage.type === "enum" ? field.storage.options[0].id : field.storage.options.map(option => option.id).sort());
  }
  if (setup.type === "boolean" || setup.type === "integer" || setup.type === "duration") expect(field.defaultValue?.value).toBe(setup.initialValue);
  if (field.storage.type === "string") expect(field.storage.pattern).toBe("^[A-Za-z0-9 _-]{1,20}$");
  if (field.storage.type === "datetime") expect(field.storage.timezone).toBe("UTC");
  if (field.storage.type === "duration") expect(field.storage.unit).toBe("seconds");
  if (field.storage.type === "phone") expect(field.storage.format).toBe("E164");
});
it("references use exact owner-approved current pins and independent private target authorization before creation", async () => {
  const target = vi.spyOn(registry, "authoriseRecord").mockResolvedValue({ organisationId: "business", recordId: "ticket-own", revision: 1 });
  await createAdditionalFieldDraftInTransaction(authority, { label: "Linked ticket", type: "reference", settings: { entityId: "tickets.ticket" }, initialValue: "ticket-own" });
  const field = customFieldPayloadSchema.parse(m.create.mock.calls[0][0].data.draft.create.payload).field;
  expect(field.storage).toEqual({ type: "reference", entity }); expect(field.defaultValue).toEqual({ type: "reference", value: "ticket-own" });
  expect(target).toHaveBeenCalledWith({ session, transaction: tx }, entity, { recordId: "ticket-own", intent: "read" });
  expect(target.mock.invocationCallOrder[0]).toBeLessThan(m.create.mock.invocationCallOrder[0]);
  target.mockRejectedValueOnce(new Error("FORBIDDEN: private or foreign target"));
  await expect(createAdditionalFieldDraftInTransaction(authority, { label: "Link", type: "reference", settings: { entityId: "tickets.ticket" }, initialValue: "ticket-private" })).rejects.toThrow("FORBIDDEN");
  await expect(createAdditionalFieldDraftInTransaction(authority, { label: "Link", type: "reference", settings: { entityId: "sales.order" } })).rejects.toThrow("unavailable");
  expect(m.create).toHaveBeenCalledTimes(1);
});
it.each([
  { type: "string", settings: { characters: "letters", maxLength: 3 }, initialValue: "12" },
  { type: "string", settings: { minLength: 10, maxLength: 2 } },
  { type: "string", settings: { pattern: "(a+)+" } },
  { type: "integer", settings: { min: 2, max: 1 } },
  { type: "integer", initialValue: "0" },
  { type: "boolean", initialValue: null },
  { type: "decimal", settings: { precision: 2, scale: 3 } },
  { type: "decimal", settings: { precision: 4, scale: 2 }, initialValue: "123.00" },
  { type: "money", settings: { currencies: ["GBP"] }, initialValue: { amount: "1", currency: "USD" } },
  { type: "duration", initialValue: -1 },
  { type: "datetime", settings: { timezone: "Europe/London" } },
  { type: "url", initialValue: "http://example.test" },
  { type: "url", initialValue: "https://user:pass@example.test" },
  { type: "phone", initialValue: "0123456789" },
  { type: "enum", settings: { choices: ["Same", " same "] } },
  { type: "enum", settings: { choices: ["One"] }, initialValue: 1 },
  { type: "enum", settings: { choices: [{ id: "client_id", label: "One" }] } },
  { type: "multi_enum", settings: { choices: ["One", "Two"], maxSelections: 1 }, initialValue: [0, 1] },
  { type: "multi_enum", settings: { choices: ["One"] }, initialValue: [0, 0] },
  { type: "reference", settings: { entityId: "tickets.ticket", version: 1 } },
  { type: "address", settings: { countries: ["GB"] }, initialValue: { line1: "One", city: "Town", country: "US" } },
])("rejects invalid or caller-owned typed settings $type before draft/Audit effects", async setup => {
  await expect(createAdditionalFieldDraftInTransaction(authority, { label: "Detail", ...setup })).rejects.toThrow();
  expect(m.create).not.toHaveBeenCalled(); expect(m.audit).not.toHaveBeenCalled();
});
it("text controls are bounded friendly inputs and original first-four absence shapes stay optional", () => {
  expect(additionalFieldSetupSchema.parse({ label: "Text", type: "string" })).not.toHaveProperty("initialValue");
  expect(additionalFieldSetupSchema.parse({ label: "No", type: "boolean", initialValue: false })).toHaveProperty("initialValue", false);
  expect(additionalFieldSetupSchema.safeParse({ label: "Text", type: "string", settings: { characters: "anything_custom" } }).success).toBe(false);
});
it("unpublished configuration retains exact field identity, privileges and CAS while replacing only selected typed setup", async () => {
  const previous = customFieldPayloadSchema.parse(draft.payload);
  draft.definition.latestVersion = 0; draft.definition.activeVersionId = null; draft.baseVersion = null;
  await configureAdditionalFieldDraftInTransaction(authority, { definitionId: draft.definitionId, revision: 3,
    setup: { label: "Size", type: "decimal", settings: { precision: 5, scale: 2 }, initialValue: "0" } });
  const next = customFieldPayloadSchema.parse(m.save.mock.calls[0][0].data.payload);
  expect(next.storageGeneration).toBe(previous.storageGeneration); expect(next.field.key).toBe(previous.field.key);
  expect(next.field).toMatchObject({ readCapability: previous.field.readCapability, writeCapability: previous.field.writeCapability, classification: previous.field.classification,
    required: previous.field.required, unique: previous.field.unique, indexed: previous.field.indexed, label: "Size", storage: { type: "decimal", precision: 5, scale: 2 } });
  expect(m.lock.mock.invocationCallOrder[0]).toBeLessThan(m.draft.mock.invocationCallOrder[0]);
  expect(m.save.mock.calls[0][0].where.revision).toBe(3); expect(m.publish).not.toHaveBeenCalled();
});
it.each(["latest", "base", "active", "retained"])("published/previously activated fields cannot use initial setup even if $mode is the only retained indicator", async mode => {
  draft.definition.latestVersion = 0; draft.definition.activeVersionId = null; draft.baseVersion = null;
  if (mode === "latest") draft.definition.latestVersion = 1;
  if (mode === "base") draft.baseVersion = { version: 1 };
  if (mode === "active") draft.definition.activeVersionId = uuid(11);
  if (mode === "retained") m.version.mockResolvedValueOnce({ id: uuid(11) });
  await expect(configureAdditionalFieldDraftInTransaction(authority, { definitionId: draft.definitionId, revision: 3,
    setup: { label: "Size", type: "integer" } })).rejects.toThrow("MIGRATION_REQUIRED");
  expect(m.save).not.toHaveBeenCalled(); expect(m.audit).not.toHaveBeenCalled();
});
