import { beforeEach, expect, it, vi } from "vitest";
import type { Session } from "@/core/auth/session";
import type { FieldMigrationIntent, FieldMigrationObservation } from "@/core/studio/fields/migrations/contracts";
const m = vi.hoisted(() => ({ initial: vi.fn(), transaction: vi.fn(), resolve: vi.fn(), enabled: vi.fn(), raw: vi.fn(), member: vi.fn(), module: vi.fn(), company: vi.fn(),
  preparation: vi.fn(), update: vi.fn(), generation: vi.fn(), last: vi.fn(), insert: vi.fn(), audit: vi.fn(), unavailable: vi.fn(), count: vi.fn(), rows: vi.fn(), observe: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: { $transaction: m.transaction, studioFieldMigrationPreparation: { findFirst: m.initial } } }));
vi.mock("@/core/studio/fields/principal", () => ({ resolveFieldMigrationPrincipal: m.resolve }));
vi.mock("@/core/modules/access", () => ({ assertModuleEnabled: m.enabled }));
vi.mock("@/core/studio/registry/runtime", () => ({ studioRegistry: () => registry }));
vi.mock("@/core/studio/fields/migrations/observation", () => ({ observeFieldMigrationRecord: m.observe }));
import { CapabilityRegistry } from "@/core/studio/registry/registry";
import { ticketStudioContract } from "@/core/service-work/studio";
import { compileCustomField } from "@/core/studio/compiler/fields";
import { customFieldPayloadSchema } from "@/core/studio/fields/schema";
import { sealFieldMigrationIntent } from "@/core/studio/fields/migrations/contracts";
import { collectFieldMigrationBatch } from "@/core/studio/fields/migrations/collection";
const registry = new CapabilityRegistry(async () => true); registry.register("tickets", ticketStudioContract);
const uuid = (value: number) => `00000000-0000-4000-8000-${value.toString().padStart(12, "0")}`;
const session: Session = { userId: "user", userName: "User", userEmail: "user@example.invalid", membershipId: "member", organisationId: "company", organisationName: "Company",
  capabilities: new Set(["studio.definition.publish", "tickets.ticket.read", "tickets.ticket.manage"]) };
const principal = { organisationId: "company", userId: "user", membershipId: "member", sessionVersion: 2, authVersion: 3, authority: "customer" as const };
const ref = (id: string, version: number) => { const meta = registry.describe(id, version); return { id, version, schemaHash: meta.schemaHash, contractHash: meta.contractHash }; };
const source = customFieldPayloadSchema.parse({ schemaVersion: 1, entity: ref("tickets.ticket", 2), storageGeneration: uuid(1),
  field: { key: "extra", label: "Extra", classification: "confidential", storage: { type: "integer" } } });
const target = customFieldPayloadSchema.parse({ ...source, entity: ref("tickets.ticket", 3), storageGeneration: uuid(2), field: { ...source.field, storage: { type: "decimal" } } });
const request = { preparationId: uuid(3), revision: 0, limit: 1 };
let intent: FieldMigrationIntent;
let saved: { id: string; organisationId: string; intent: FieldMigrationIntent; intentChecksum: string; state: string; revision: number; review: null | { id: string } };
let store: { recordId: string; observation: FieldMigrationObservation }[], audits: unknown[];
const tx = { $queryRaw: m.raw, membership: { findFirst: m.member }, moduleState: { findFirst: m.module }, organisation: { findFirst: m.company },
  studioFieldMigrationPreparation: { findFirst: m.preparation, updateMany: m.update }, studioFieldGeneration: { findFirst: m.generation },
  studioFieldMigrationObservation: { findFirst: m.last, create: m.insert }, auditEntry: { create: m.audit },
  serviceWorkItem: { findFirst: m.unavailable, count: m.count, findMany: m.rows } };
beforeEach(async () => {
  vi.clearAllMocks(); store = []; audits = [];
  m.resolve.mockResolvedValue(session); m.enabled.mockResolvedValue(undefined);
  m.raw.mockImplementation(async (strings: TemplateStringsArray) => {
    const sql = strings.join("?"); return sql.includes("SHOW transaction_isolation") ? [{ transaction_isolation: "serializable" }]
      : sql.includes("atlas_studio_migration_fresh") ? [{ fresh: true }] : [];
  });
  m.member.mockResolvedValue({ id: "member", sessionVersion: 2, user: { authVersion: 3 } }); m.module.mockResolvedValue({ id: "enabled" });
  m.company.mockResolvedValue({ id: "company", kind: "CUSTOMER", status: "ACTIVE", archivedAt: null, isTest: true });
  const compiled = await compileCustomField(session, source, registry), next = await compileCustomField(session, target, registry);
  const sealed = sealFieldMigrationIntent({ schemaVersion: 1, id: uuid(3), organisationId: "company", definitionId: uuid(4), definitionRevision: 7, principal,
    source: { versionId: uuid(6), versionChecksum: compiled.checksum, payload: source }, target: { draftId: uuid(5), draftRevision: 9, compiledChecksum: next.checksum, payload: target },
    conversion: { kind: "integer_to_decimal" }, ownerQuery: ref("tickets.ticket.field_migration", 1) });
  intent = sealed.intent; saved = { id: uuid(3), organisationId: "company", intent, intentChecksum: sealed.checksum, state: "PREPARING", revision: 0, review: null };
  m.initial.mockImplementation(async ({ where }) => where.organisationId === "company" && where.id === saved.id ? structuredClone(saved) : null);
  m.preparation.mockImplementation(async () => structuredClone(saved)); m.generation.mockResolvedValue({ id: uuid(1) });
  m.last.mockImplementation(async () => store.at(-1) ?? null); m.insert.mockImplementation(async ({ data }) => { store.push(data); return data; });
  m.update.mockImplementation(async ({ where, data }) => { if (saved.revision !== where.revision) return { count: 0 }; saved.revision = data.revision; return { count: 1 }; });
  m.audit.mockImplementation(async (entry) => { audits.push(entry); return { id: "audit" }; }); m.unavailable.mockResolvedValue(null); m.count.mockResolvedValue(3);
  m.rows.mockImplementation(async ({ where, take }) => ["a", "b", "c"].filter(id => !where.id || id > where.id.gt).slice(0, take).map(id => ({ id, organisationId: "company", version: 1 })));
  m.observe.mockImplementation(async (_ctx, _registry, _company, _intent, anchor) => ({ recordId: anchor.recordId, nativeRevision: anchor.revision, extension: null,
    result: { kind: "valid", targetFingerprint: "a".repeat(64), isNull: true, lossy: false } }));
  // Transaction simulator verifies orchestration rollback; central acceptance
  // separately proves actual PostgreSQL rollback and immutable insert guards.
  m.transaction.mockImplementation(async (run: (client: typeof tx) => Promise<unknown>) => {
    const before = structuredClone({ saved, store, audits });
    try { return await run(tx); } catch (error) { saved = before.saved; store = before.store; audits = before.audits; throw error; }
  });
});

it("resumes from stored observations across calls and never seals an exhausted page", async () => {
  let result = await collectFieldMigrationBatch(session, request);
  expect(result).toMatchObject({ revision: 1, appended: 1, cursorExhausted: false }); expect(store.map(row => row.recordId)).toEqual(["a"]);
  result = await collectFieldMigrationBatch(session, { ...request, revision: 1 });
  expect(result).toMatchObject({ revision: 2, appended: 1, cursorExhausted: false });
  result = await collectFieldMigrationBatch(session, { ...request, revision: 2 });
  expect(result).toMatchObject({ revision: 3, appended: 1, cursorExhausted: true });
  expect(store.map(row => row.recordId)).toEqual(["a", "b", "c"]); expect(saved.state).toBe("PREPARING"); expect(saved.review).toBeNull(); expect(audits).toHaveLength(3);
  expect(m.transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: "Serializable" });
});

it("lost-response replay does not advance; future revisions and client cursor/tenant/authority are rejected", async () => {
  await collectFieldMigrationBatch(session, request); m.rows.mockClear(); m.insert.mockClear(); m.audit.mockClear();
  expect(await collectFieldMigrationBatch(session, request)).toMatchObject({ revision: 1, replayed: true, appended: 0, cursorExhausted: null });
  expect(m.rows).not.toHaveBeenCalled(); expect(m.insert).not.toHaveBeenCalled(); expect(m.audit).not.toHaveBeenCalled();
  await expect(collectFieldMigrationBatch(session, { ...request, revision: 2 })).rejects.toThrow("stale or has changed");
  for (const input of [{ ...request, cursor: "b" }, { ...request, organisationId: "other" }, { ...request, principal }, { ...request, limit: 51 }])
    await expect(collectFieldMigrationBatch(session, input)).rejects.toThrow();
});

it("denies missing/foreign jobs and forged stored principal before touching source rows", async () => {
  await expect(collectFieldMigrationBatch(session, { ...request, preparationId: uuid(9) })).rejects.toThrow("stale or has changed");
  await expect(collectFieldMigrationBatch({ ...session, organisationId: "other" }, request)).rejects.toThrow("stale or has changed");
  saved.intent = { ...intent, principal: { ...principal, userId: "other" } }; saved.intentChecksum = sealFieldMigrationIntent(saved.intent).checksum;
  await expect(collectFieldMigrationBatch(session, request)).rejects.toThrow("FORBIDDEN"); expect(m.rows).not.toHaveBeenCalled(); expect(store).toHaveLength(0);
});

it("requires renewed principal, field/live data, Studio/source and complete native access before even replay", async () => {
  await collectFieldMigrationBatch(session, request);
  m.resolve.mockRejectedValueOnce(new Error("FORBIDDEN: revoked")); await expect(collectFieldMigrationBatch(session, request)).rejects.toThrow("revoked");
  m.company.mockResolvedValue({ id: "company", kind: "CUSTOMER", status: "ACTIVE", archivedAt: null, isTest: false });
  await expect(collectFieldMigrationBatch(session, request)).rejects.toThrow("studio.test.live_data");
  m.company.mockResolvedValue({ id: "company", kind: "CUSTOMER", status: "ACTIVE", archivedAt: null, isTest: true });
  m.module.mockResolvedValue(null); await expect(collectFieldMigrationBatch(session, request)).rejects.toThrow("unavailable"); m.module.mockResolvedValue({ id: "enabled" });
  m.unavailable.mockResolvedValue({ id: "private" }); await expect(collectFieldMigrationBatch(session, request)).rejects.toThrow("MIGRATION_ACCESS_REQUIRED"); expect(store).toHaveLength(1);
});

it("rejects stale source/draft, modified compiled pin, sealed/cancelled jobs, and failed revision CAS", async () => {
  m.raw.mockImplementation(async (strings: TemplateStringsArray) => strings.join("?").includes("atlas_studio_migration_fresh") ? [{ fresh: false }] : []);
  await expect(collectFieldMigrationBatch(session, request)).rejects.toThrow("stale or has changed");
  m.raw.mockImplementation(async (strings: TemplateStringsArray) => strings.join("?").includes("SHOW transaction_isolation") ? [{ transaction_isolation: "serializable" }] : [{ fresh: true }]);
  saved.intent = { ...intent, target: { ...intent.target, compiledChecksum: "f".repeat(64) } }; saved.intentChecksum = sealFieldMigrationIntent(saved.intent).checksum;
  await expect(collectFieldMigrationBatch(session, request)).rejects.toThrow("stale or has changed"); saved.intent = intent; saved.intentChecksum = sealFieldMigrationIntent(intent).checksum;
  saved.state = "CANCELLED"; await expect(collectFieldMigrationBatch(session, request)).rejects.toThrow("stale or has changed"); saved.state = "PREPARING";
  saved.review = { id: saved.id }; await expect(collectFieldMigrationBatch(session, request)).rejects.toThrow("stale or has changed"); saved.review = null;
  m.update.mockResolvedValue({ count: 0 }); await expect(collectFieldMigrationBatch(session, request)).rejects.toThrow("stale or has changed"); expect(store).toHaveLength(0);
});

it("rolls back the whole page and revision on a later private/reference/observation failure", async () => {
  m.observe.mockResolvedValueOnce({ recordId: "a", nativeRevision: 1, extension: null, result: { kind: "invalid", code: "INVALID_SOURCE" } })
    .mockRejectedValueOnce(new Error("FORBIDDEN: referenced owner"));
  await expect(collectFieldMigrationBatch(session, { ...request, limit: 2 })).rejects.toThrow("referenced owner");
  expect(m.insert).toHaveBeenCalledTimes(1); expect(store).toHaveLength(0); expect(saved.revision).toBe(0); expect(audits).toHaveLength(0);
});

it("rolls back observations and revision on Audit failure, then retries the same stored cursor", async () => {
  m.audit.mockRejectedValueOnce(new Error("Audit unavailable")); await expect(collectFieldMigrationBatch(session, request)).rejects.toThrow("Audit unavailable");
  expect(store).toHaveLength(0); expect(saved.revision).toBe(0);
  expect(await collectFieldMigrationBatch(session, request)).toMatchObject({ appended: 1, revision: 1 }); expect(store.map(row => row.recordId)).toEqual(["a"]);
});
