import { beforeEach, expect, it, vi } from "vitest";
import type { Session } from "@/core/auth/session";
import type { FieldMigrationIntent } from "@/core/studio/fields/migrations/contracts";
const m = vi.hoisted(() => ({ initial: vi.fn(), transaction: vi.fn(), resolve: vi.fn(), enabled: vi.fn(), raw: vi.fn(), member: vi.fn(), module: vi.fn(), company: vi.fn(),
  preparation: vi.fn(), update: vi.fn(), create: vi.fn(), audit: vi.fn(), coverage: vi.fn(), digest: vi.fn(), unavailable: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: { $transaction: m.transaction, studioFieldMigrationPreparation: { findFirst: m.initial } } }));
vi.mock("@/core/studio/fields/principal", () => ({ resolveFieldMigrationPrincipal: m.resolve }));
vi.mock("@/core/modules/access", () => ({ assertModuleEnabled: m.enabled }));
vi.mock("@/core/studio/registry/runtime", () => ({ studioRegistry: () => registry }));
vi.mock("@/core/studio/fields/migrations/coverage", () => ({ validateFieldMigrationSourceCoverage: m.coverage }));
vi.mock("@/core/studio/fields/migrations/archive-digest", () => ({ digestFieldMigrationArchive: m.digest }));
import { CapabilityRegistry } from "@/core/studio/registry/registry";
import { ticketStudioContract } from "@/core/service-work/studio";
import { compileCustomField } from "@/core/studio/compiler/fields";
import { customFieldPayloadSchema } from "@/core/studio/fields/schema";
import { sealFieldMigrationIntent } from "@/core/studio/fields/migrations/contracts";
import { sealFieldMigrationPreparation } from "@/core/studio/fields/migrations/sealing";
const uuid = (value: number) => `00000000-0000-4000-8000-${value.toString().padStart(12, "0")}`;
const registry = new CapabilityRegistry(async () => true); registry.register("tickets", ticketStudioContract);
const ref = (id: string, version: number) => { const meta = registry.describe(id, version); return { id, version, schemaHash: meta.schemaHash, contractHash: meta.contractHash }; };
const session: Session = { userId: "user", userName: "User", userEmail: "user@example.invalid", membershipId: "member", organisationId: "company", organisationName: "Company",
  capabilities: new Set(["studio.definition.publish", "tickets.ticket.read", "tickets.ticket.manage"]) };
const principal = { organisationId: "company", userId: "user", membershipId: "member", sessionVersion: 2, authVersion: 3, authority: "customer" as const };
const source = customFieldPayloadSchema.parse({ schemaVersion: 1, entity: ref("tickets.ticket", 2), storageGeneration: uuid(1),
  field: { key: "extra", label: "Extra", classification: "confidential", storage: { type: "integer" } } });
const target = customFieldPayloadSchema.parse({ ...source, entity: ref("tickets.ticket", 3), storageGeneration: uuid(2), field: { ...source.field, storage: { type: "decimal" } } });
const request = { preparationId: uuid(3), revision: 4 };
let saved: { id: string; organisationId: string; intent: FieldMigrationIntent; intentChecksum: string; state: string; revision: number; review: null | { id: string; review: unknown; checksum: string; createdAt: Date } };
const tx = { $queryRaw: m.raw, membership: { findFirst: m.member }, moduleState: { findFirst: m.module }, organisation: { findFirst: m.company },
  studioFieldMigrationPreparation: { findFirst: m.preparation, updateMany: m.update }, studioFieldMigrationReview: { create: m.create }, auditEntry: { create: m.audit },
  serviceWorkItem: { findFirst: m.unavailable } };
beforeEach(async () => {
  vi.clearAllMocks(); m.resolve.mockResolvedValue(session); m.enabled.mockResolvedValue(undefined); m.unavailable.mockResolvedValue(null);
  m.raw.mockImplementation(async (strings: TemplateStringsArray) => strings.join("?").includes("SHOW transaction_isolation") ? [{ transaction_isolation: "serializable" }]
    : strings.join("?").includes("AS changed") ? [{ changed: false }] : []);
  m.member.mockResolvedValue({ id: "member", sessionVersion: 2, user: { authVersion: 3 } }); m.module.mockResolvedValue({ id: "enabled" });
  m.company.mockResolvedValue({ id: "company", kind: "CUSTOMER", status: "ACTIVE", archivedAt: null, isTest: true });
  const compiled = await compileCustomField(session, source, registry), next = await compileCustomField(session, target, registry);
  const pinned = sealFieldMigrationIntent({ schemaVersion: 1, id: uuid(3), organisationId: "company", definitionId: uuid(4), definitionRevision: 7, principal,
    source: { versionId: uuid(6), versionChecksum: compiled.checksum, payload: source }, target: { draftId: uuid(5), draftRevision: 9, compiledChecksum: next.checksum, payload: target },
    conversion: { kind: "integer_to_decimal" }, ownerQuery: ref("tickets.ticket.field_migration", 1) });
  saved = { id: pinned.intent.id, organisationId: "company", intent: pinned.intent, intentChecksum: pinned.checksum, state: "PREPARING", revision: 4, review: null };
  m.initial.mockImplementation(async ({ where }) => where.id === saved.id && where.organisationId === saved.organisationId ? structuredClone(saved) : null);
  m.preparation.mockImplementation(async ({ select } = {}) => structuredClone(select ? { ...saved, sourceVersion: { payload: saved.intent.source.payload }, draft: { payload: saved.intent.target.payload } } : saved)); m.coverage.mockResolvedValue(undefined);
  m.digest.mockResolvedValue({ recordCount: 3, observationDigest: "a".repeat(64), summary: { validCount: 2, invalidCount: 1, lossyCount: 1 }, duplicateTarget: false });
  m.create.mockImplementation(async ({ data }) => { saved.review = { ...data, createdAt: new Date() }; return saved.review; });
  m.update.mockImplementation(async ({ where, data }) => { if (saved.revision !== where.revision) return { count: 0 }; saved.state = data.state; saved.revision = data.revision; return { count: 1 }; });
  m.audit.mockResolvedValue({ id: "audit" });
  m.transaction.mockImplementation(async (run: (client: typeof tx) => Promise<unknown>) => {
    const before = structuredClone(saved); try { return await run(tx); } catch (error) { saved = before; throw error; }
  });
});

it("seals failure/loss summary and immutable intent with one revision CAS/Audit after authority and exact coverage, without target writes", async () => {
  const result = await sealFieldMigrationPreparation(session, request);
  expect(result).toMatchObject({ state: "REVIEWED", revision: 5, replayed: false, summary: { validCount: 2, invalidCount: 1, lossyCount: 1 },
    cohort: { recordCount: 3, observationDigest: "a".repeat(64) }, rollbackLimit: "reverse_review_after_target_writes" });
  expect(saved.review?.review).toMatchObject(saved.intent); expect(saved.state).toBe("REVIEWED");
  expect(m.coverage.mock.invocationCallOrder[0]).toBeLessThan(m.digest.mock.invocationCallOrder[0]);
  expect(m.digest.mock.invocationCallOrder[0]).toBeLessThan(m.create.mock.invocationCallOrder[0]);
  expect(m.transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: "Serializable" });
  expect(m.audit).toHaveBeenCalledWith({ data: expect.objectContaining({ action: "studio.field.migration.reviewed", organisationId: "company", actorUserId: "user", entityId: saved.id }) });
});

it("fresh reviewed replay shapes stored review metadata correctly and writes/audits nothing twice", async () => {
  const first = await sealFieldMigrationPreparation(session, request); m.create.mockClear(); m.update.mockClear(); m.audit.mockClear();
  expect(await sealFieldMigrationPreparation(session, request)).toEqual({ ...first, replayed: true });
  expect(m.create).not.toHaveBeenCalled(); expect(m.update).not.toHaveBeenCalled(); expect(m.audit).not.toHaveBeenCalled();
  m.coverage.mockRejectedValue(new Error("FORBIDDEN: private source revoked"));
  await expect(sealFieldMigrationPreparation(session, request)).rejects.toThrow("private source revoked");
});

it("rejects client summaries/authority, foreign and stale PREPARING requests before aggregating", async () => {
  for (const input of [{ ...request, reviewed: true }, { ...request, summary: {} }, { ...request, organisationId: "other" }, { ...request, principal }])
    await expect(sealFieldMigrationPreparation(session, input)).rejects.toThrow();
  await expect(sealFieldMigrationPreparation({ ...session, organisationId: "other" }, request)).rejects.toThrow("stale or has changed");
  for (const revision of [3, 5]) await expect(sealFieldMigrationPreparation(session, { ...request, revision })).rejects.toThrow("stale or has changed");
  saved.state = "CANCELLED"; await expect(sealFieldMigrationPreparation(session, request)).rejects.toThrow("stale or has changed");
  expect(m.digest).not.toHaveBeenCalled(); expect(m.create).not.toHaveBeenCalled();
});

it("revoked principals and stale/native/written coverage abort before summary or review writes", async () => {
  m.resolve.mockRejectedValueOnce(new Error("FORBIDDEN: revoked")); await expect(sealFieldMigrationPreparation(session, request)).rejects.toThrow("revoked");
  m.coverage.mockRejectedValue(new Error("REVIEW_CHANGED")); await expect(sealFieldMigrationPreparation(session, request)).rejects.toThrow("REVIEW_CHANGED");
  expect(m.digest).not.toHaveBeenCalled(); expect(m.create).not.toHaveBeenCalled();
});

it("blocks unique collisions and reference fields until owner reference review exists", async () => {
  const uniqueIntent = { ...saved.intent, target: { ...saved.intent.target, payload: { ...target, field: { ...target.field, unique: true } } } };
  saved.intent = uniqueIntent; saved.intentChecksum = sealFieldMigrationIntent(uniqueIntent).checksum;
  m.digest.mockResolvedValue({ recordCount: 2, observationDigest: "a".repeat(64), summary: { validCount: 2, invalidCount: 0, lossyCount: 0 }, duplicateTarget: true });
  await expect(sealFieldMigrationPreparation(session, request)).rejects.toThrow("MIGRATION_UNIQUENESS_CONFLICT");
  const referenceSource = customFieldPayloadSchema.parse({ ...source, field: { ...source.field, storage: { type: "reference", entity: source.entity } } });
  const referenceTarget = customFieldPayloadSchema.parse({ ...target, field: { ...target.field, storage: referenceSource.field.storage } });
  saved.intent = { ...saved.intent, source: { ...saved.intent.source, payload: referenceSource }, target: { ...saved.intent.target, payload: referenceTarget }, conversion: { kind: "same_type" } };
  saved.intentChecksum = sealFieldMigrationIntent(saved.intent).checksum; m.digest.mockClear();
  await expect(sealFieldMigrationPreparation(session, request)).rejects.toThrow("MIGRATION_REFERENCE_REVIEW_REQUIRED"); expect(m.digest).not.toHaveBeenCalled(); expect(m.create).not.toHaveBeenCalled();
});

it("Audit or revision CAS failure rolls back the immutable review and state, and same request can retry", async () => {
  m.audit.mockRejectedValueOnce(new Error("Audit unavailable")); await expect(sealFieldMigrationPreparation(session, request)).rejects.toThrow("Audit unavailable");
  expect(saved.review).toBeNull(); expect(saved.state).toBe("PREPARING"); expect(saved.revision).toBe(4);
  m.update.mockResolvedValueOnce({ count: 0 }); await expect(sealFieldMigrationPreparation(session, request)).rejects.toThrow("stale or has changed"); expect(saved.review).toBeNull();
  expect(await sealFieldMigrationPreparation(session, request)).toMatchObject({ state: "REVIEWED", revision: 5 });
});

it("does not replay a corrupted review or a different aggregate", async () => {
  await sealFieldMigrationPreparation(session, request); saved.review!.checksum = "f".repeat(64);
  await expect(sealFieldMigrationPreparation(session, request)).rejects.toThrow("stale or has changed");
});

async function referenceIntent(version = 1) {
  const payload = customFieldPayloadSchema.parse({ ...source, field: { ...source.field, storage: { type: "reference", entity: ref("tickets.ticket", version) } } });
  const next = customFieldPayloadSchema.parse({ ...payload, entity: ref("tickets.ticket", 4), storageGeneration: target.storageGeneration });
  const compiled = await compileCustomField(session, payload, registry), compiledNext = await compileCustomField(session, next, registry);
  const sealed = sealFieldMigrationIntent({ ...saved.intent, source: { ...saved.intent.source, payload, versionChecksum: compiled.checksum },
    target: { ...saved.intent.target, payload: next, compiledChecksum: compiledNext.checksum }, conversion: { kind: "same_type" }, ownerQuery: ref("tickets.ticket.field_migration", 2) });
  saved.intent = sealed.intent; saved.intentChecksum = sealed.checksum;
}

it.each([1, 2, 3, 4])("seals explicitly approved native reference version %i after source and actual owner protocol, through the same digest/CAS/Audit", async version => {
  await referenceIntent(version);
  expect(await sealFieldMigrationPreparation(session, request)).toMatchObject({ state: "REVIEWED", revision: 5, replayed: false });
  const targetProof = m.raw.mock.calls.findIndex(([strings]) => strings.join("?").includes('v."referenceValue"'));
  expect(targetProof).toBeGreaterThan(-1);
  expect(m.coverage.mock.invocationCallOrder[0]).toBeLessThan(m.raw.mock.invocationCallOrder[targetProof]);
  expect(m.raw.mock.invocationCallOrder[targetProof]).toBeLessThan(m.digest.mock.invocationCallOrder[0]);
  expect(m.create).toHaveBeenCalledTimes(1); expect(m.audit).toHaveBeenCalledTimes(1);
});

it("missing/foreign/written-target changes and private revocation abort before aggregate and cannot replay an old reference review", async () => {
  await referenceIntent();
  const first = await sealFieldMigrationPreparation(session, request); m.create.mockClear(); m.update.mockClear(); m.audit.mockClear();
  expect(await sealFieldMigrationPreparation(session, request)).toEqual({ ...first, replayed: true });
  m.digest.mockClear();
  m.raw.mockImplementation(async (strings: TemplateStringsArray) => strings.join("?").includes("SHOW transaction_isolation") ? [{ transaction_isolation: "serializable" }]
    : strings.join("?").includes("AS changed") ? [{ changed: true }] : []);
  await expect(sealFieldMigrationPreparation(session, request)).rejects.toThrow("MIGRATION_REFERENCE_COVERAGE_CHANGED");
  m.unavailable.mockResolvedValue({ id: "private" });
  await expect(sealFieldMigrationPreparation(session, request)).rejects.toThrow("MIGRATION_ACCESS_REQUIRED");
  expect(m.digest).not.toHaveBeenCalled(); expect(m.create).not.toHaveBeenCalled(); expect(m.update).not.toHaveBeenCalled(); expect(m.audit).not.toHaveBeenCalled();
});

it("reference opt-in cannot use an old pinned query or unsupported target version", async () => {
  await referenceIntent(); saved.intent.ownerQuery = ref("tickets.ticket.field_migration", 1); saved.intentChecksum = sealFieldMigrationIntent(saved.intent).checksum;
  await expect(sealFieldMigrationPreparation(session, request)).rejects.toThrow();
  await referenceIntent();
  for (const storage of [saved.intent.source.payload.field.storage, saved.intent.target.payload.field.storage]) {
    if (storage.type !== "reference") throw new Error("Reference fixture required");
    storage.entity.version = 99;
  }
  saved.intentChecksum = sealFieldMigrationIntent(saved.intent).checksum;
  await expect(sealFieldMigrationPreparation(session, request)).rejects.toThrow("MIGRATION_REFERENCE_REVIEW_REQUIRED");
  expect(m.digest).not.toHaveBeenCalled(); expect(m.create).not.toHaveBeenCalled();
});
