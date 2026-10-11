import { beforeEach, expect, it, vi } from "vitest";
import type { Session } from "@/core/auth/session";
const m = vi.hoisted(() => ({ authority: vi.fn(), compile: vi.fn(), initial: vi.fn(), raw: vi.fn(), definition: vi.fn(), generation: vi.fn(), job: vi.fn(),
  create: vi.fn(), update: vi.fn(), last: vi.fn(), insert: vi.fn(), audit: vi.fn(), module: vi.fn(), observe: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: { studioFieldMigrationPreparation: { findFirst: m.initial } } }));
vi.mock("@/core/modules/access", () => ({ assertModuleEnabled: vi.fn() }));
vi.mock("@/core/studio/fields/migrations/authority", () => ({ withFieldMigrationAuthority: m.authority }));
vi.mock("@/core/studio/fields/migrations/metadata", () => ({ compileFieldMigrationMetadata: m.compile }));
vi.mock("@/core/studio/fields/migrations/observation", () => ({ observeFieldMigrationRecord: vi.fn(), observeRequiredFieldMigrationRecord: m.observe }));
vi.mock("@/core/studio/registry/runtime", () => ({ studioRegistry: () => registry }));
import { CapabilityRegistry } from "@/core/studio/registry/registry";
import { ticketStudioContract } from "@/core/service-work/studio";
import { entityDetailsSchema } from "@/core/studio/registry/entities";
import { checksum } from "@/core/studio/registry/contracts";
import { customFieldPayloadSchema } from "@/core/studio/fields/schema";
import { conditionalFieldPayloadSchema, type VersionedFieldPayload } from "@/core/studio/fields/required-contract";
import { compileCustomField } from "@/core/studio/compiler/fields";
import { compileConditionalCustomField } from "@/core/studio/fields/conditional-compiler";
import { registeredRequiredFactMetadata } from "@/core/studio/fields/required-owner";
import { startFieldMigrationPreparation } from "@/core/studio/fields/migrations/preparation";
import { collectFieldMigrationBatch } from "@/core/studio/fields/migrations/collection";
import type { RequiredFieldMigrationIntent } from "@/core/studio/fields/migrations/required-contracts";
const id = (n: number) => `00000000-0000-4000-8000-${n.toString().padStart(12, "0")}`;
const session: Session = { userId: "actor", userName: "Actor", userEmail: "actor@example.invalid", membershipId: "member", organisationId: "company", organisationName: "Company",
  capabilities: new Set(["studio.definition.publish", "tickets.ticket.read", "tickets.ticket.manage"]) };
const principal = { userId: "actor", membershipId: "member", organisationId: "company", authVersion: 1, sessionVersion: 2, authority: "customer" as const };
const company = { id: "company", kind: "CUSTOMER", status: "ACTIVE", archivedAt: null, isTest: true };
let registry: CapabilityRegistry, source: VersionedFieldPayload, target: VersionedFieldPayload, definition: { id: string; revision: number; activeVersion: object; draft: { id: string; revision: number; payload: unknown } };
let stored: null | { id: string; organisationId: string; intent: RequiredFieldMigrationIntent; intentChecksum: string; state: string; revision: number; review: null };
let rows: { recordId: string; observation: object }[], audits: object[];
let owner: ReturnType<typeof vi.spyOn>;
const tx = { $queryRaw: m.raw, studioDefinition: { findFirst: m.definition }, studioFieldGeneration: { findFirst: m.generation }, moduleState: { findFirst: m.module },
  studioFieldMigrationPreparation: { findFirst: m.job, create: m.create, updateMany: m.update }, studioFieldMigrationObservation: { findFirst: m.last, create: m.insert } };
vi.mock("@/core/audit/log", () => ({ writeAudit: m.audit }));
const request = { operationId: id(3), definitionId: id(4), definitionRevision: 7, draftRevision: 9, conversion: { kind: "integer_to_decimal" } };
const collect = (revision = 0) => collectFieldMigrationBatch(session, { preparationId: id(3), revision, limit: 1 });
beforeEach(async () => {
  vi.resetAllMocks(); rows = []; audits = []; stored = null;
  registry = new CapabilityRegistry(async () => true); registry.register("tickets", ticketStudioContract);
  // Test-only future owner, not actual owning callback acceptance. Full authority/
  // metadata providers and real condition inputs are covered by their own suites.
  const entity = ticketStudioContract.contributions.find(c => c.metadata.id === "tickets.ticket" && c.metadata.version === 8)!;
  const snapshot = ticketStudioContract.contributions.find(c => c.metadata.id === "tickets.ticket.field_migration" && c.metadata.version === 3)!;
  const details = entityDetailsSchema.parse(entity.metadata.details); details.record!.migrationSnapshot = { ...details.record!.migrationSnapshot!,
    sourceVersions: [2, 3, 4, 5, 6, 7, 8, 9], query: { id: snapshot.metadata.id, version: 4 }, intentVersions: [1, 2] };
  registry.register("tickets", { contributions: [{ ...entity, metadata: { ...entity.metadata, version: 9, details, schemaHash: checksum(details) } },
    { metadata: { ...snapshot.metadata, version: 4, details: { ...snapshot.metadata.details, fieldMigration: { entityId: "tickets.ticket", purpose: "snapshot", intentVersions: [1, 2] } } }, run: vi.fn() }] });
  const ref = (version: number) => { const r = registry.describe("tickets.ticket", version); return { id: r.id, version, schemaHash: r.schemaHash, contractHash: r.contractHash }; };
  source = customFieldPayloadSchema.parse({ schemaVersion: 1, entity: ref(2), storageGeneration: id(1), field: { key: "extra", label: "Extra", classification: "confidential", storage: { type: "integer" } } });
  target = conditionalFieldPayloadSchema.parse({ ...source, schemaVersion: 2, entity: ref(9), storageGeneration: id(2), field: { ...source.field, storage: { type: "decimal" } },
    requiredIf: { match: "all", predicates: [{ source: { kind: "native", fieldId: "status" }, operator: "present" }] } });
  m.compile.mockImplementation(async (_context, _registry, _company, definitionId, input: VersionedFieldPayload) => input.schemaVersion === 1
    ? compileCustomField(session, input, registry) : compileConditionalCustomField({ session, registry, definitionId,
      resolveMetadata: predicate => predicate.kind === "native" ? registeredRequiredFactMetadata(session, registry, input.entity, predicate.fieldId) : Promise.reject(new Error("No field inputs in routing fixture")) }, input));
  const a = await m.compile(null, registry, company, id(4), source), b = await m.compile(null, registry, company, id(4), target); target = b.payload;
  definition = { id: id(4), revision: 7, activeVersion: { id: id(5), payload: source, checksum: a.checksum, compiledPlan: a.plan }, draft: { id: id(6), revision: 9, payload: target } };
  m.definition.mockImplementation(async () => definition); m.generation.mockResolvedValue({ id: id(1) }); m.module.mockResolvedValue({ id: "module" });
  m.raw.mockImplementation(async (strings: TemplateStringsArray) => strings.join("?").includes("atlas_studio_migration_fresh") ? [{ fresh: true }] : []);
  m.initial.mockImplementation(async () => stored); m.job.mockImplementation(async () => structuredClone(stored));
  m.create.mockImplementation(async ({ data }) => { stored = { ...data, state: "PREPARING", revision: 0, review: null }; return { id: data.id, state: "PREPARING", revision: 0 }; });
  m.last.mockImplementation(async () => rows.at(-1) ?? null); m.insert.mockImplementation(async ({ data }) => { rows.push(data); return data; });
  m.update.mockImplementation(async ({ where, data }) => { if (!stored || stored.revision !== where.revision) return { count: 0 }; stored.revision = data.revision; return { count: 1 }; });
  m.audit.mockImplementation(async data => { audits.push(data); });
  m.authority.mockImplementation(async (_session, _principal, run) => {
    const before = structuredClone({ stored, rows, audits });
    try { return await run({ session, principal, company, transaction: tx }); } catch (error) { stored = before.stored; rows = before.rows; audits = before.audits; throw error; }
  });
  owner = vi.spyOn(registry, "invokeQueryInTransaction").mockImplementation(async (_context, _reference, input: unknown) => {
    const request = input as { mode: string; cursor?: string };
    return request.mode === "preflight" ? {} : { mode: "snapshot", organisationId: "company", entityId: "tickets.ticket", records: request.cursor ? [] : [{ recordId: "a", organisationId: "company", revision: 7 }], next: request.cursor ? null : "a" };
  });
  m.observe.mockResolvedValue({ recordId: "a", nativeRevision: 7, extension: null,
    requirement: { sourceEvaluationChecksum: "a".repeat(64), targetEvaluationChecksum: "b".repeat(64), targetRequired: true }, result: { kind: "invalid", code: "FIELD_REQUIRED" } });
});
it("derives format2 solely from saved source/draft, pins its approved callback and persists requirement evidence through the existing collection/CAS/Audit", async () => {
  await startFieldMigrationPreparation(session, principal, request);
  expect(stored?.intent).toMatchObject({ schemaVersion: 2, source: { payload: source }, target: { payload: target }, ownerQuery: { version: 4 } });
  expect(await collect()).toMatchObject({ revision: 1, appended: 1, cursorExhausted: false }); expect(rows[0].observation).toMatchObject({ requirement: { targetRequired: true }, result: { code: "FIELD_REQUIRED" } });
  expect(m.observe).toHaveBeenCalledWith({ session, transaction: tx }, stored?.intent, { recordId: "a", organisationId: "company", revision: 7 });
  m.insert.mockClear(); m.observe.mockClear(); expect(await collect()).toMatchObject({ replayed: true, appended: 0 }); expect(m.insert).not.toHaveBeenCalled(); expect(m.observe).not.toHaveBeenCalled();
  expect(await collect(1)).toMatchObject({ revision: 2, appended: 0, cursorExhausted: true }); expect(stored?.state).toBe("PREPARING");
});
it("rejects client format/authority and unsaved canonicalisation without silently editing a draft or writing an archive", async () => {
  for (const extra of [{ schemaVersion: 2 }, { intentVersion: 2 }, { organisationId: "other" }, { principal }])
    await expect(startFieldMigrationPreparation(session, principal, { ...request, ...extra })).rejects.toThrow();
  // Persisted metadata with omitted defaults differs from the compiled canonical packet.
  const sparse = structuredClone(target); delete (sparse.field as Partial<typeof sparse.field>).help; definition.draft.payload = sparse;
  await expect(startFieldMigrationPreparation(session, principal, request)).rejects.toThrow("stale or has changed"); expect(m.create).not.toHaveBeenCalled(); expect(rows).toHaveLength(0);
});
it("rolls back conditional observations and revision on Audit failure; lost response repeats no next page", async () => {
  await startFieldMigrationPreparation(session, principal, request); m.audit.mockRejectedValueOnce(new Error("Audit unavailable"));
  await expect(collect()).rejects.toThrow("Audit unavailable"); expect(rows).toHaveLength(0); expect(stored?.revision).toBe(0);
  expect(await collect()).toMatchObject({ revision: 1, appended: 1 });
  owner.mockRejectedValueOnce(new Error("FORBIDDEN: private native cohort")); await expect(collect()).rejects.toThrow("private native cohort"); expect(rows).toHaveLength(1); expect(stored?.revision).toBe(1);
});
