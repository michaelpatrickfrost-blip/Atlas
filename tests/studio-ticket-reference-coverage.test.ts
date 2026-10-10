import { beforeEach, expect, it, vi } from "vitest";
import type { Prisma } from "@/generated/prisma/client";
import type { Session } from "@/core/auth/session";
const m = vi.hoisted(() => ({ module: vi.fn(), member: vi.fn(), unavailable: vi.fn(), preparation: vi.fn(), raw: vi.fn(), count: vi.fn(), rows: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: {} }));
import { ticketStudioContract } from "@/core/service-work/studio";
import { CapabilityRegistry } from "@/core/studio/registry/registry";
import { customFieldPayloadSchema } from "@/core/studio/fields/schema";
import { entityDetailsSchema } from "@/core/studio/registry/entities";
const registry = new CapabilityRegistry(async () => true); registry.register("tickets", ticketStudioContract);
const actor: Session = { userId: "actor", userName: "Actor", userEmail: "actor@example.invalid", membershipId: "member", organisationId: "company", organisationName: "Company",
  capabilities: new Set(["tickets.ticket.read", "tickets.ticket.manage"]) };
const ref = (version: number) => { const meta = registry.describe("tickets.ticket", version); return { id: meta.id, version, schemaHash: meta.schemaHash, contractHash: meta.contractHash }; };
const source = customFieldPayloadSchema.parse({ schemaVersion: 1, entity: ref(2), storageGeneration: "00000000-0000-4000-8000-000000000001",
  field: { key: "extra_link", label: "Related ticket", classification: "confidential", storage: { type: "reference", entity: ref(1) } } });
const target = customFieldPayloadSchema.parse({ ...source, entity: ref(4), storageGeneration: "00000000-0000-4000-8000-000000000002" });
const preparationId = "00000000-0000-4000-8000-000000000003";
const tx = { $queryRaw: m.raw, moduleState: { findFirst: m.module }, membership: { findFirst: m.member },
  serviceWorkItem: { findFirst: m.unavailable, count: m.count, findMany: m.rows }, studioFieldMigrationPreparation: { findFirst: m.preparation } } as unknown as Prisma.TransactionClient;
const query = registry.describe("tickets.ticket.field_migration", 2);
const run = (session = actor) => registry.invokeQueryInTransaction({ session, transaction: tx }, query, { mode: "reference_coverage", preparationId });
let saved: { id: string; intent: unknown; sourceVersion: { payload: unknown }; draft: { payload: unknown } };
beforeEach(() => {
  vi.clearAllMocks(); m.module.mockResolvedValue({ id: "module" }); m.member.mockResolvedValue({ id: "member" }); m.unavailable.mockResolvedValue(null); m.count.mockResolvedValue(3); m.rows.mockResolvedValue([]);
  saved = { id: preparationId, intent: { ownerQuery: { id: "tickets.ticket.field_migration", version: 2 } }, sourceVersion: { payload: structuredClone(source) }, draft: { payload: structuredClone(target) } };
  m.preparation.mockImplementation(async () => saved);
  m.raw.mockImplementation(async (strings: TemplateStringsArray) => strings.join("?").includes("SHOW transaction_isolation") ? [{ transaction_isolation: "serializable" }]
    : strings.join("?").includes("AS changed") ? [{ changed: false }] : []);
});

it("explicit v4/query v2 opt-in proves same canonical native reference coverage with no values, referenced IDs/counts or writes", async () => {
  expect(entityDetailsSchema.parse(registry.describe("tickets.ticket", 4).details).record?.migrationSnapshot).toEqual({ query: { id: query.id, version: 2 }, sourceVersions: [2, 3, 4], referenceVersions: [1, 2, 3, 4] });
  expect(await run()).toEqual({ organisationId: "company", entityId: "tickets.ticket", mode: "reference_coverage", nativeReferenceCoverageComplete: true });
  expect(m.preparation).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ id: preparationId, organisationId: "company", entityId: "tickets.ticket", state: { in: ["PREPARING", "REVIEWED"] } }) }));
  expect(m.count).not.toHaveBeenCalled(); expect(m.rows).not.toHaveBeenCalled();
});

it("rejects old normal invocation/old query mode, absent transaction and nonserializable context", async () => {
  await expect(registry.invoke(actor, query, { mode: "reference_coverage", preparationId })).rejects.toThrow("shared server transaction");
  await expect(registry.invokeQueryInTransaction({ session: actor, transaction: tx }, registry.describe(query.id, 1), { mode: "reference_coverage", preparationId })).rejects.toThrow();
  m.raw.mockResolvedValue([{ transaction_isolation: "read committed" }]); await expect(run()).rejects.toThrow("serializable");
  expect(m.preparation).not.toHaveBeenCalled();
});

it("native capability, source availability, actual member and complete private guards precede preparation/target details", async () => {
  await expect(run({ ...actor, capabilities: new Set(["tickets.ticket.read"]) })).rejects.toThrow("tickets.ticket.manage");
  m.module.mockResolvedValue(null); await expect(run()).rejects.toThrow("unavailable"); m.module.mockResolvedValue({ id: "module" });
  m.member.mockResolvedValue(null); await expect(run()).rejects.toThrow("MIGRATION_ACCESS_REQUIRED"); m.member.mockResolvedValue({ id: "member" });
  m.unavailable.mockResolvedValue({ id: "private" }); await expect(run()).rejects.toThrow("MIGRATION_ACCESS_REQUIRED");
  expect(m.preparation).not.toHaveBeenCalled(); expect(m.raw.mock.calls.some(([strings]) => strings.join("?").includes('v."referenceValue"'))).toBe(false);
});

it("requires a scoped fresh-state preparation pinning query v2, target v4 and approved same-entity reference versions", async () => {
  m.preparation.mockResolvedValueOnce(null); await expect(run()).rejects.toThrow("MIGRATION_REVIEW_UNAVAILABLE");
  saved.intent = { ownerQuery: { id: query.id, version: 1 } }; await expect(run()).rejects.toThrow("MIGRATION_REFERENCE_COVERAGE_CHANGED"); saved.intent = { ownerQuery: { id: query.id, version: 2 } };
  for (const payload of [{ ...target, entity: ref(3) }, { ...target, field: { ...target.field, storage: { type: "integer" } } },
    { ...target, field: { ...target.field, storage: { type: "reference", entity: { ...ref(1), id: "other.record" } } } },
    { ...target, field: { ...target.field, storage: { type: "reference", entity: { ...ref(1), version: 99 } } } }]) {
    saved.draft.payload = payload; await expect(run()).rejects.toThrow("MIGRATION_REFERENCE_COVERAGE_CHANGED");
  }
});

it("missing/malformed/foreign/wrong-kind/written-target changes are generic denial, never authorised failure counts", async () => {
  m.raw.mockImplementation(async (strings: TemplateStringsArray) => strings.join("?").includes("SHOW transaction_isolation") ? [{ transaction_isolation: "serializable" }]
    : strings.join("?").includes("AS changed") ? [{ changed: true }] : []);
  await expect(run()).rejects.toThrow("MIGRATION_REFERENCE_COVERAGE_CHANGED"); expect(m.count).not.toHaveBeenCalled();
});

it("new query retains bounded preflight/snapshot/native coverage protocol without modifying old contracts", async () => {
  expect(await registry.invokeQueryInTransaction({ session: actor, transaction: tx }, query, { mode: "preflight" })).toMatchObject({ count: 3, nativeAccessComplete: true });
  expect(await registry.invokeQueryInTransaction({ session: actor, transaction: tx }, query, { mode: "snapshot", limit: 1 })).toMatchObject({ records: [], next: null });
});
