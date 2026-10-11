import { beforeEach, expect, it, vi } from "vitest";
import type { Session } from "@/core/auth/session";
import type { Prisma } from "@/generated/prisma/client";
const m = vi.hoisted(() => ({ raw: vi.fn(), enabled: vi.fn(), native: vi.fn(), extension: vi.fn(), value: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: {} }));
import { CapabilityRegistry } from "@/core/studio/registry/registry";
import { ticketStudioContract } from "@/core/service-work/studio";
import { compileCustomField } from "@/core/studio/compiler/fields";
import { customFieldPayloadSchema, type CustomFieldPayload } from "@/core/studio/fields/schema";
import { checksum } from "@/core/studio/registry/contracts";
import { sealFieldMigrationIntent } from "@/core/studio/fields/migrations/contracts";
import { observeFieldMigrationRecord } from "@/core/studio/fields/migrations/observation";
const registry = new CapabilityRegistry(async () => true); registry.register("tickets", ticketStudioContract);
const uuid = (value: number) => `00000000-0000-4000-8000-${value.toString().padStart(12, "0")}`;
const ref = (version: number) => { const meta = registry.describe("tickets.ticket", version); return { id: meta.id, version, schemaHash: meta.schemaHash, contractHash: meta.contractHash }; };
const session: Session = { userId: "user", userName: "User", userEmail: "user@example.invalid", membershipId: "member", organisationId: "company", organisationName: "Company",
  capabilities: new Set(["studio.definition.publish", "tickets.ticket.read", "tickets.ticket.manage"]) };
const company = { id: "company", kind: "CUSTOMER", status: "ACTIVE", archivedAt: null, isTest: true };
const source = customFieldPayloadSchema.parse({ schemaVersion: 1, entity: ref(2), storageGeneration: uuid(1), field: { key: "extra", label: "Extra", classification: "confidential", storage: { type: "integer" } } });
const target = customFieldPayloadSchema.parse({ ...source, entity: ref(3), storageGeneration: uuid(2), field: { ...source.field, storage: { type: "decimal" } } });
const tx = { $queryRaw: m.raw, moduleState: { findFirst: m.enabled }, serviceWorkItem: { findFirst: m.native },
  studioExtensionRecord: { findFirst: m.extension }, studioFieldValue: { findFirst: m.value } } as unknown as Prisma.TransactionClient;
const context = { session, transaction: tx }, anchor = { recordId: "record", organisationId: "company", revision: 4 };
async function intent(from = source, to = target, conversion: object = { kind: "integer_to_decimal" }) {
  const owner = registry.describe("tickets.ticket.field_migration", 1);
  return sealFieldMigrationIntent({ schemaVersion: 1, id: uuid(3), definitionId: uuid(4), definitionRevision: 7, organisationId: "company",
    principal: { organisationId: "company", userId: "user", membershipId: "member", sessionVersion: 2, authVersion: 3, authority: "customer" },
    source: { versionId: uuid(5), versionChecksum: (await compileCustomField(session, from, registry)).checksum, payload: from },
    target: { draftId: uuid(6), draftRevision: 9, compiledChecksum: (await compileCustomField(session, to, registry)).checksum, payload: to }, conversion,
    ownerQuery: { id: owner.id, version: owner.version, schemaHash: owner.schemaHash, contractHash: owner.contractHash } }).intent;
}
async function stored(written: CustomFieldPayload = source, changes: object = {}) {
  const compilerActor = { ...session, capabilities: new Set([...session.capabilities, "tickets.queue.read", "tickets.queue.manage"]) };
  const compiled = await compileCustomField(compilerActor, written, registry);
  const metadata = { id: uuid(9), revision: 2, versionId: uuid(5), fingerprint: checksum({ type: "integer", value: 42 }),
    schemaVersion: { payload: written, compiledPlan: compiled.plan, checksum: compiled.checksum } };
  const value = { id: metadata.id, valueType: "integer", isNull: false, textValue: null, integerValue: 42n, decimalValue: null, currency: null,
    booleanValue: null, dateValue: null, instantValue: null, jsonValue: null, referenceValue: null, ...changes };
  m.extension.mockResolvedValue({ id: uuid(7), revision: 3, slots: [{ id: uuid(8), revision: 2, activeValueId: metadata.id }] });
  m.value.mockImplementation(async (query: { select?: unknown }) => query.select ? metadata : value);
  return { metadata, value };
}
beforeEach(() => {
  vi.clearAllMocks(); m.raw.mockResolvedValue([]); m.enabled.mockResolvedValue({ id: "enabled" }); m.extension.mockResolvedValue(null);
  m.native.mockImplementation(async (query: { where: { AND: Array<{ id?: string }> } }) => ({ id: query.where.AND[1].id,
    organisationId: "company", version: 4, status: "CLOSED", mergedIntoId: null, queueId: "queue", queue: { restricted: false } }));
});

it("observes final/unanchored native records without creating extension data or copying values", async () => {
  const result = await observeFieldMigrationRecord(context, registry, company, await intent(), anchor);
  expect(result).toEqual({ recordId: "record", nativeRevision: 4, extension: null, result: { kind: "valid", isNull: true, lossy: false, targetFingerprint: checksum(null) } });
  expect(m.value).not.toHaveBeenCalled();
  expect(m.extension).toHaveBeenCalledWith(expect.objectContaining({ where: { organisationId: "company", entityId: "tickets.ticket", recordId: "record" } }));
});

it("converts an exact typed source and returns immutable source references and target fingerprint only", async () => {
  await stored(); const result = await observeFieldMigrationRecord(context, registry, company, await intent(), anchor);
  expect(result).toEqual({ recordId: "record", nativeRevision: 4, extension: { id: uuid(7), revision: 3, slot: { id: uuid(8), revision: 2,
    value: { id: uuid(9), revision: 2, versionId: uuid(5), fingerprint: checksum({ type: "integer", value: 42 }) } } },
    result: { kind: "valid", isNull: false, lossy: false, targetFingerprint: checksum({ type: "decimal", value: "42" }) } });
  expect(m.value).toHaveBeenCalledTimes(2);
  expect(m.value.mock.calls[0][0].select).not.toHaveProperty("integerValue");
  expect(result.extension!.slot!.value).not.toHaveProperty("integerValue"); expect(result.result).not.toHaveProperty("value");
});

it("checks current/written field policy before fetching business columns", async () => {
  const written = customFieldPayloadSchema.parse({ ...source, field: { ...source.field, classification: "restricted", readCapability: "tickets.queue.read", writeCapability: "tickets.queue.manage" } });
  await stored(written); await expect(observeFieldMigrationRecord(context, registry, company, await intent(), anchor)).rejects.toThrow("tickets.queue.read");
  expect(m.value).toHaveBeenCalledTimes(1); expect(m.value.mock.calls[0][0]).toHaveProperty("select");
  m.value.mockClear(); const deniedCurrent = customFieldPayloadSchema.parse({ ...source, field: { ...source.field, readCapability: "tickets.queue.read" } });
  const trusted = await intent(); trusted.source.payload = deniedCurrent;
  await expect(observeFieldMigrationRecord(context, registry, company, trusted, anchor)).rejects.toThrow("tickets.queue.read"); expect(m.value).not.toHaveBeenCalled();
});

it("denies stale/private/foreign/native-readonly anchors before Studio value lookup", async () => {
  const trusted = await intent();
  await expect(observeFieldMigrationRecord(context, registry, company, trusted, { ...anchor, organisationId: "other" })).rejects.toThrow("stale or has changed");
  await expect(observeFieldMigrationRecord(context, registry, company, trusted, { ...anchor, revision: 3 })).rejects.toThrow("stale or has changed");
  await expect(observeFieldMigrationRecord({ ...context, session: { ...session, capabilities: new Set(["studio.definition.publish", "tickets.ticket.read"]) } }, registry, company, trusted, anchor)).rejects.toThrow("tickets.ticket.manage");
  m.native.mockResolvedValue(null); await expect(observeFieldMigrationRecord(context, registry, company, trusted, anchor)).rejects.toThrow("unavailable"); expect(m.extension).not.toHaveBeenCalled();
});

it("requires the target owner's exact opted-in pinned snapshot protocol before storage access", async () => {
  const trusted = await intent(), legacy = registry.describe("tickets.ticket.migration_cohort", 1);
  trusted.ownerQuery = { id: legacy.id, version: legacy.version, schemaHash: legacy.schemaHash, contractHash: legacy.contractHash };
  await expect(observeFieldMigrationRecord(context, registry, company, trusted, anchor)).rejects.toThrow("stale or has changed");
  expect(m.extension).not.toHaveBeenCalled(); expect(m.value).not.toHaveBeenCalled();
});

it("rejects unavailable pointers, wrong generation and corrupted written schema before decoding", async () => {
  const trusted = await intent(), row = await stored();
  row.metadata.schemaVersion.payload = { ...source, storageGeneration: uuid(99) };
  await expect(observeFieldMigrationRecord(context, registry, company, trusted, anchor)).rejects.toThrow("stale or has changed"); expect(m.value).toHaveBeenCalledTimes(1);
  await stored(); m.value.mockResolvedValueOnce(null); await expect(observeFieldMigrationRecord(context, registry, company, trusted, anchor)).rejects.toThrow("stale or has changed");
  const corrupt = await stored(); corrupt.metadata.schemaVersion.checksum = "f".repeat(64);
  await expect(observeFieldMigrationRecord(context, registry, company, trusted, anchor)).rejects.toThrow("stale or has changed");
});

it("retains closed redacted invalid classes for storage/fingerprint/target failures", async () => {
  const trusted = await intent(); await stored(source, { valueType: "string", textValue: "Private value" });
  const invalid = await observeFieldMigrationRecord(context, registry, company, trusted, anchor);
  expect(invalid.result).toEqual({ kind: "invalid", code: "FIELD_STORAGE_INVALID" }); expect(JSON.stringify(invalid)).not.toContain("Private value");
  const row = await stored(); row.metadata.fingerprint = "f".repeat(64);
  expect((await observeFieldMigrationRecord(context, registry, company, trusted, anchor)).result).toEqual({ kind: "invalid", code: "FIELD_STORAGE_INVALID" });
  m.extension.mockResolvedValue(null);
  const required = customFieldPayloadSchema.parse({ ...target, field: { ...target.field, required: true } });
  expect((await observeFieldMigrationRecord(context, registry, company, await intent(source, required), anchor)).result).toEqual({ kind: "invalid", code: "INVALID_TARGET" });
});

it("propagates inaccessible referenced-owner denial even when the source fingerprint is invalid", async () => {
  const reference = customFieldPayloadSchema.parse({ ...source, field: { ...source.field, storage: { type: "reference", entity: ref(2) } } });
  const targetReference = customFieldPayloadSchema.parse({ ...reference, entity: ref(3), storageGeneration: target.storageGeneration });
  const trusted = await intent(reference, targetReference, { kind: "same_type" });
  const row = await stored(reference, { valueType: "reference", integerValue: null, referenceValue: "secret-reference" }); row.metadata.fingerprint = "f".repeat(64);
  m.native.mockResolvedValueOnce({ id: "record", organisationId: "company", version: 4 }).mockResolvedValueOnce(null);
  await expect(observeFieldMigrationRecord(context, registry, company, trusted, anchor)).rejects.toThrow("unavailable");
  expect(m.native).toHaveBeenCalledTimes(2);
});
