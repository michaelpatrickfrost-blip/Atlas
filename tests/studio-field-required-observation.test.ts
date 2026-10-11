import { beforeEach, expect, it, vi } from "vitest";
import type { Prisma, StudioDefinitionVersion } from "@/generated/prisma/client";
import type { Session } from "@/core/auth/session";
import type { FieldRuntimeAuthority } from "@/core/studio/fields/runtime-authority";
const m = vi.hoisted(() => ({ refresh: vi.fn(), principal: vi.fn(), raw: vi.fn(), company: vi.fn(), definition: vi.fn(), version: vi.fn(), generation: vi.fn(), extension: vi.fn(), value: vi.fn(), slot: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: {} }));
vi.mock("@/core/studio/fields/runtime-authority", () => ({ fieldRuntimeAuthorityInTransaction: m.refresh }));
vi.mock("@/core/studio/fields/principal", () => ({ resolveFieldMigrationPrincipal: m.principal }));
import { CapabilityRegistry } from "@/core/studio/registry/registry";
import { ticketStudioContract } from "@/core/service-work/studio";
import { entityDetailsSchema } from "@/core/studio/registry/entities";
import { checksum } from "@/core/studio/registry/contracts";
import { customFieldPayloadSchema, type FieldStorage } from "@/core/studio/fields/schema";
import { conditionalFieldPayloadSchema, type VersionedFieldPayload } from "@/core/studio/fields/required-contract";
import { compileFieldMigrationMetadata } from "@/core/studio/fields/migrations/metadata";
import { sealRequiredFieldMigrationIntent, type RequiredFieldMigrationIntent } from "@/core/studio/fields/migrations/required-contracts";
import { inspectRequiredFieldMigrationRecord, observeRequiredFieldMigrationRecord, observeFieldMigrationRecord } from "@/core/studio/fields/migrations/observation";
import { encodeFieldValue } from "@/core/studio/fields/codec";
const uuid = (n: number) => `00000000-0000-4000-8000-${n.toString().padStart(12, "0")}`;
const root = uuid(4), inputId = uuid(14);
const company = { id: "company", kind: "CUSTOMER" as const, status: "ACTIVE" as const, archivedAt: null, isTest: true };
const actor: Session = { userId: "actor", userName: "Actor", userEmail: "actor@example.invalid", membershipId: "member", organisationId: "company", organisationName: "Company",
  capabilities: new Set(["studio.definition.publish", "tickets.ticket.read", "tickets.ticket.manage"]) };
const stamp = { organisationId: "company", userId: "actor", membershipId: "member", authVersion: 1, sessionVersion: 2 };
const anchor = { recordId: "record", organisationId: "company", revision: 7 };
const tx = { $queryRaw: m.raw, organisation: { findFirst: m.company }, studioDefinition: { findFirst: m.definition }, studioDefinitionVersion: { findFirst: m.version },
  studioFieldGeneration: { findFirst: m.generation }, studioExtensionRecord: { findFirst: m.extension }, studioFieldValue: { findFirst: m.value }, studioFieldSlot: { findFirst: m.slot } } as unknown as Prisma.TransactionClient;
let registry: CapabilityRegistry, session: Session, intent: RequiredFieldMigrationIntent;
let sourceVersion: StudioDefinitionVersion, rootRow: { id: string; organisationId: string; kind: string; key: string; retiredAt: null; revision: number; activeVersionId: string; activeVersion: StudioDefinitionVersion; draft: { id: string; definitionId: string; organisationId: string; revision: number; payload: Prisma.JsonValue } };
let fact: ReturnType<typeof vi.spyOn>, native: ReturnType<typeof vi.spyOn>;
function ref(version = 9) { const r = registry.describe("tickets.ticket", version); return { id: r.id, version, schemaHash: r.schemaHash, contractHash: r.contractHash }; }
function payload(generation: number, conditional = true, storage: FieldStorage = { type: "boolean" }, required = false): VersionedFieldPayload {
  const base = customFieldPayloadSchema.parse({ schemaVersion: 1, entity: ref(), storageGeneration: uuid(generation),
    field: { key: "detail", label: "Detail", classification: "confidential", storage, required } });
  return conditional ? conditionalFieldPayloadSchema.parse({ ...base, schemaVersion: 2,
    requiredIf: { match: "all", predicates: [{ source: { kind: "native", fieldId: "status" }, operator: "equals", value: { type: "enum", value: "RESOLVED" } }] } }) : base;
}
async function prepare(source = payload(1, false), target = payload(2)) {
  rootRow = { id: root, organisationId: "company", kind: "customField", key: "tickets.ticket.detail", retiredAt: null, revision: 1,
    activeVersionId: uuid(5), activeVersion: {} as StudioDefinitionVersion,
    draft: { id: uuid(6), definitionId: root, organisationId: "company", revision: 2, payload: target as unknown as Prisma.JsonValue } };
  const context = { session, transaction: tx }, from = await compileFieldMigrationMetadata(context, registry, company, root, source), to = await compileFieldMigrationMetadata(context, registry, company, root, target);
  sourceVersion = { id: uuid(5), definitionId: root, organisationId: "company", version: 1, schemaVersion: source.schemaVersion,
    semanticVersion: "1.0.0", payload: from.payload as unknown as Prisma.JsonValue, compiledPlan: from.plan as unknown as Prisma.JsonValue, checksum: from.checksum, createdBy: "actor", publishedAt: new Date() };
  rootRow.activeVersion = sourceVersion;
  const query = registry.describe("tickets.ticket.field_migration", 4);
  intent = sealRequiredFieldMigrationIntent({ schemaVersion: 2, id: uuid(3), organisationId: "company", definitionId: root, definitionRevision: 1,
    principal: { ...stamp, authority: "customer" }, source: { versionId: sourceVersion.id, versionChecksum: from.checksum, payload: from.payload },
    target: { draftId: uuid(6), draftRevision: 2, compiledChecksum: to.checksum, payload: to.payload }, conversion: { kind: "same_type" },
    ownerQuery: { id: query.id, version: query.version, schemaHash: query.schemaHash, contractHash: query.contractHash } }).intent;
  fact.mockClear(); native.mockClear(); m.value.mockClear();
  return intent;
}
async function stored(raw: unknown, written: VersionedFieldPayload = intent.source.payload) {
  const compiled = await compileFieldMigrationMetadata({ session, transaction: tx }, registry, company, root, written);
  const version = { ...sourceVersion, schemaVersion: written.schemaVersion, payload: compiled.payload, compiledPlan: compiled.plan, checksum: compiled.checksum };
  const value = { id: uuid(9), revision: 2, versionId: version.id, ...encodeFieldValue(written.field, raw), schemaVersion: version };
  m.extension.mockResolvedValue({ id: uuid(7), revision: 4, slots: [{ id: uuid(8), revision: 2, activeValueId: value.id }] });
  m.value.mockResolvedValue(value);
  return value;
}
const inspect = () => inspectRequiredFieldMigrationRecord({ session, transaction: tx }, intent, anchor);
beforeEach(async () => {
  vi.resetAllMocks(); session = { ...actor, capabilities: new Set(actor.capabilities) }; registry = new CapabilityRegistry(async () => true); registry.register("tickets", ticketStudioContract);
  // Test-only owner/protocol. No new production owner or legacy callback runs.
  const entity = ticketStudioContract.contributions.find(c => c.metadata.id === "tickets.ticket" && c.metadata.version === 8)!;
  const snapshot = ticketStudioContract.contributions.find(c => c.metadata.id === "tickets.ticket.field_migration" && c.metadata.version === 3)!;
  const details = entityDetailsSchema.parse(entity.metadata.details); details.record!.migrationSnapshot = { ...details.record!.migrationSnapshot!,
    sourceVersions: [2, 3, 4, 5, 6, 7, 8, 9], query: { id: snapshot.metadata.id, version: 4 }, intentVersions: [1, 2] };
  registry.register("tickets", { contributions: [{ ...entity, metadata: { ...entity.metadata, version: 9, details, schemaHash: checksum(details) } },
    { metadata: { ...snapshot.metadata, version: 4, details: { ...snapshot.metadata.details, fieldMigration: { entityId: "tickets.ticket", purpose: "snapshot", intentVersions: [1, 2] } } }, run: vi.fn() }] });
  m.refresh.mockImplementation(async selected => ({ session: selected, stamp, transaction: tx, registry } satisfies FieldRuntimeAuthority));
  m.principal.mockResolvedValue(session); m.raw.mockResolvedValue([]); m.company.mockResolvedValue(company);
  m.definition.mockImplementation(async args => args.where.id === root ? rootRow : null);
  m.generation.mockImplementation(async args => ({ id: args.where.id })); m.extension.mockResolvedValue(null);
  native = vi.spyOn(registry, "authoriseRecord").mockImplementation(async (context, reference, input) => {
    await registry.resolve(context.session, reference); return { ...anchor, recordId: (input as { recordId: string }).recordId };
  });
  fact = vi.spyOn(registry, "invokeQueryInTransaction").mockResolvedValue({ ...anchor, fields: { status: "RESOLVED", priority: "NORMAL" } });
  await prepare();
});
it("reviews actual unanchored presence and condition evidence without mutations or raw facts in the archive", async () => {
  const result = await inspect();
  expect(result.convertedValue).toBeNull(); expect(result.observation).toMatchObject({ recordId: anchor.recordId, nativeRevision: 7, extension: null,
    requirement: { targetRequired: true }, result: { kind: "invalid", code: "FIELD_REQUIRED" } });
  const archive = await observeRequiredFieldMigrationRecord({ session, transaction: tx }, intent, anchor);
  expect(archive).toEqual(result.observation); expect(JSON.stringify(archive)).not.toContain("RESOLVED"); expect(archive).not.toHaveProperty("convertedValue");
  fact.mockResolvedValue({ ...anchor, fields: { status: "NEW", priority: "NORMAL" } });
  const optional = await inspect(); expect(optional.observation.result).toEqual({ kind: "valid", isNull: true, targetFingerprint: checksum(null), lossy: false });
  expect(optional.observation.requirement.targetEvaluationChecksum).not.toBe(result.observation.requirement.targetEvaluationChecksum);
});
it("keeps false and zero present and treats empty multi-selection as absent even when isNull is false", async () => {
  for (const [storage, raw] of [[{ type: "boolean" }, false], [{ type: "integer" }, 0]] as const) {
    await prepare(payload(1, false, storage), payload(2, true, storage)); await stored(raw);
    const result = await inspect(); expect(result.observation.result).toMatchObject({ kind: "valid", isNull: false }); expect(result.convertedValue?.value).toBe(raw);
  }
  const storage: FieldStorage = { type: "multi_enum", options: [{ id: "a", label: "A", retired: false }], valueSetVersion: 1, maxSelections: 2 };
  await prepare(payload(1, false, storage), payload(2, true, storage)); await stored([]);
  expect((await inspect()).observation.result).toEqual({ kind: "invalid", code: "FIELD_REQUIRED" });
  fact.mockResolvedValue({ ...anchor, fields: { status: "NEW", priority: "NORMAL" } });
  const optional = await inspect(); expect(optional.convertedValue).toEqual({ type: "multi_enum", value: [] }); expect(optional.observation.result).toMatchObject({ kind: "valid", isNull: false });
});
it("requires real source rules and never lets a false condition relax unconditional requirements", async () => {
  await prepare(payload(1), payload(2, false)); expect((await inspect()).observation.result).toEqual({ kind: "invalid", code: "INVALID_SOURCE" });
  fact.mockResolvedValue({ ...anchor, fields: { status: "NEW", priority: "NORMAL" } }); expect((await inspect()).observation.result.kind).toBe("valid");
  await prepare(payload(1, false), payload(2, true, { type: "boolean" }, true)); expect((await inspect()).observation.result).toEqual({ kind: "invalid", code: "FIELD_REQUIRED" });
});
it("rejects source/draft/hash drift before facts or business columns and leaves the legacy entry closed", async () => {
  const saved = structuredClone(rootRow);
  for (const change of [() => { rootRow.activeVersionId = uuid(99); }, () => { rootRow.draft.revision++; },
    () => { rootRow.activeVersion.checksum = "f".repeat(64); }, () => { rootRow.draft.payload = {} as Prisma.JsonValue; }]) {
    rootRow = structuredClone(saved); change(); fact.mockClear();
    await expect(inspect()).rejects.toThrow(); expect(fact).not.toHaveBeenCalled(); expect(m.value).not.toHaveBeenCalled();
  }
  await expect(observeFieldMigrationRecord({ session, transaction: tx }, registry, company, intent as unknown as Parameters<typeof observeFieldMigrationRecord>[3], anchor)).rejects.toThrow("review is invalid");
});
it("denies copied sessions through the actual authority bridge before any caller transaction query", async () => {
  const actual = await vi.importActual<typeof import("@/core/studio/fields/runtime-authority")>("@/core/studio/fields/runtime-authority");
  m.refresh.mockImplementation(actual.fieldRuntimeAuthorityInTransaction); m.raw.mockClear(); m.company.mockClear();
  await expect(inspect()).rejects.toThrow("authenticated company access"); expect(m.raw).not.toHaveBeenCalled(); expect(m.company).not.toHaveBeenCalled(); expect(m.value).not.toHaveBeenCalled();
});
it("checks tenant/current identity, support Audit, production access and native owner permission before storage", async () => {
  await expect(inspectRequiredFieldMigrationRecord({ session, transaction: tx }, intent, { ...anchor, organisationId: "foreign" })).rejects.toThrow("stale or has changed");
  intent.principal.authVersion++; await expect(inspect()).rejects.toThrow("stale or has changed"); intent.principal.authVersion--;
  m.principal.mockRejectedValueOnce(new Error("FORBIDDEN: support Audit unavailable")); await expect(inspect()).rejects.toThrow("support Audit");
  m.company.mockResolvedValueOnce({ ...company, isTest: false }); await expect(inspect()).rejects.toThrow("studio.test.live_data");
  session.capabilities.delete("tickets.ticket.manage"); await expect(inspect()).rejects.toThrow("tickets.ticket.manage"); session.capabilities.add("tickets.ticket.manage");
  native.mockRejectedValueOnce(new Error("private native denied")); await expect(inspect()).rejects.toThrow("private native denied"); expect(m.value).not.toHaveBeenCalled();
  native.mockResolvedValueOnce({ ...anchor, revision: 8 }); await expect(inspect()).rejects.toThrow("stale or has changed");
});
it("rejects a retained legacy owner/query instead of reinterpreting it as format2", async () => {
  await prepare(payload(1, false), { ...payload(2), entity: ref(8) });
  await expect(inspect()).rejects.toThrow("stale or has changed"); expect(m.extension).not.toHaveBeenCalled(); expect(fact).not.toHaveBeenCalled();
});
it("authorises the written field and native/reference owner before columns/fingerprint classification", async () => {
  session.capabilities.add("tickets.field.secret");
  await stored(false, { ...intent.source.payload, field: { ...intent.source.payload.field, readCapability: "tickets.field.secret" } });
  session.capabilities.delete("tickets.field.secret");
  await expect(inspect()).rejects.toThrow("tickets.field.secret"); expect(m.value).toHaveBeenCalledTimes(1); expect(m.value.mock.calls[0][0]).toHaveProperty("select");
  m.value.mockClear(); const storedRow = await stored(false); storedRow.schemaVersion.definitionId = uuid(99);
  await expect(inspect()).rejects.toThrow("stale or has changed"); expect(m.value).toHaveBeenCalledTimes(1);
});
it("denies unavailable/stale/foreign facts before source decoding rather than making them optional", async () => {
  await stored(false);
  for (const facts of [{ ...anchor, fields: {} }, { ...anchor, revision: 8, fields: { status: "NEW" } }, { ...anchor, organisationId: "foreign", fields: { status: "NEW" } }]) {
    fact.mockResolvedValue(facts); m.value.mockClear(); await expect(inspect()).rejects.toThrow("FIELD_REQUIREMENT_INVALID"); expect(m.value).not.toHaveBeenCalled();
  }
  fact.mockRejectedValue(new Error("native facts denied")); await expect(inspect()).rejects.toThrow("native facts denied"); expect(m.value).not.toHaveBeenCalled();
});
it("keeps semantic evidence stable only for identical values/rules while exact envelopes still record revision drift", async () => {
  await stored(false); const first = await inspect();
  m.extension.mockResolvedValue({ id: uuid(7), revision: 5, slots: [{ id: uuid(8), revision: 2, activeValueId: uuid(9) }] });
  const later = await inspect(); expect(later.observation.requirement).toEqual(first.observation.requirement); expect(later.observation.extension?.revision).toBe(5);
  fact.mockResolvedValue({ ...anchor, fields: { status: "NEW", priority: "NORMAL" } });
  expect((await inspect()).observation.requirement.targetEvaluationChecksum).not.toBe(first.observation.requirement.targetEvaluationChecksum);
  m.extension.mockResolvedValueOnce({ id: uuid(7), revision: 5 }).mockResolvedValueOnce({ id: uuid(7), revision: 6, slots: [] });
  await expect(inspect()).rejects.toThrow("stale or has changed");
});
it("records closed storage failures without bypassing actual condition access", async () => {
  const row = await stored(false); row.fingerprint = "f".repeat(64);
  expect((await inspect()).observation.result).toEqual({ kind: "invalid", code: "FIELD_STORAGE_INVALID" });
  fact.mockRejectedValue(new Error("facts denied")); await expect(inspect()).rejects.toThrow("facts denied");
});
it("uses actual current/pinned/written field inputs with independent Read, not their Write grant", async () => {
  const inputPayload = customFieldPayloadSchema.parse({ ...payload(11, false), field: { ...payload(11, false).field, key: "flag", readCapability: "tickets.field.secret", writeCapability: "tickets.field.edit" } });
  session.capabilities.add("tickets.field.secret"); session.capabilities.add("tickets.field.edit");
  const compiled = await compileFieldMigrationMetadata({ session, transaction: tx }, registry, company, inputId, inputPayload);
  const version = { ...sourceVersion, id: uuid(15), definitionId: inputId, payload: compiled.payload as unknown as Prisma.JsonValue,
    compiledPlan: compiled.plan as unknown as Prisma.JsonValue, checksum: compiled.checksum };
  const input = { ...rootRow, id: inputId, key: "tickets.ticket.flag", activeVersionId: version.id, activeVersion: version };
  const inputValue = { id: uuid(19), organisationId: "company", definitionId: inputId, generationId: inputPayload.storageGeneration, slotId: uuid(18), versionId: version.id, revision: 1,
    ...encodeFieldValue(inputPayload.field, true), createdBy: "actor", createdAt: new Date(), schemaVersion: version };
  m.definition.mockImplementation(async args => args.where.id === root ? rootRow : args.where.id === inputId ? input : null);
  m.version.mockResolvedValue(version);
  m.extension.mockResolvedValue({ id: uuid(7), revision: 4, slots: [] });
  m.slot.mockResolvedValue({ id: uuid(18), revision: 1, activeValueId: inputValue.id, activeValue: inputValue });
  const target = conditionalFieldPayloadSchema.parse({ ...payload(2), requiredIf: { match: "all", predicates: [
    { source: { kind: "native", fieldId: "status" }, operator: "equals", value: { type: "enum", value: "RESOLVED" } },
    { source: { kind: "field", definitionId: inputId, versionId: version.id, checksum: version.checksum }, operator: "equals", value: { type: "boolean", value: true } },
  ] } });
  await prepare(payload(1, false), target); session.capabilities.delete("tickets.field.edit");
  const required = await inspect(); expect(required.observation.result).toEqual({ kind: "invalid", code: "FIELD_REQUIRED" });
  Object.assign(inputValue, encodeFieldValue(inputPayload.field, false));
  const optional = await inspect(); expect(optional.observation.result.kind).toBe("valid"); expect(optional.observation.requirement.targetEvaluationChecksum).not.toBe(required.observation.requirement.targetEvaluationChecksum);
  fact.mockResolvedValue({ ...anchor, fields: { status: "NEW", priority: "NORMAL" } }); session.capabilities.delete("tickets.field.secret"); m.value.mockClear(); m.slot.mockClear();
  await expect(inspect()).rejects.toThrow("tickets.field.secret"); expect(m.value).not.toHaveBeenCalled(); expect(m.slot).not.toHaveBeenCalled();
  session.capabilities.add("tickets.field.secret"); version.checksum = "f".repeat(64);
  await expect(inspect()).rejects.toThrow("sealed field metadata changed");
});
it("keeps independent reference denials ahead of corrupt fingerprint classification", async () => {
  const storage: FieldStorage = { type: "reference", entity: ref(8) };
  await prepare(payload(1, false, storage), payload(2, true, storage));
  const row = await stored("private-reference"); row.fingerprint = "f".repeat(64);
  native.mockImplementation(async (...[context, reference, input]: Parameters<CapabilityRegistry["authoriseRecord"]>) => {
    await registry.resolve(context.session, reference); const recordId = (input as { recordId: string }).recordId;
    if (recordId === "private-reference") throw new Error("reference owner denied");
    return { ...anchor, recordId };
  });
  await expect(inspect()).rejects.toThrow("reference owner denied");
  row.referenceValue = null; await expect(inspect()).rejects.toThrow("stale or has changed");
});
it("reads a retained conditional written schema without changing its rule or inventing a value", async () => {
  await prepare(payload(1), payload(2)); await stored(false);
  const row = await inspect(); expect(row.convertedValue).toEqual({ type: "boolean", value: false }); expect(row.observation.result.kind).toBe("valid");
  expect(fact).toHaveBeenCalledTimes(2);
});
