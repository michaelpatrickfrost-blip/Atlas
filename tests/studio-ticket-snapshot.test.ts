import { beforeEach, expect, it, vi } from "vitest";
import type { Session } from "@/core/auth/session";
import type { Prisma } from "@/generated/prisma/client";
const m = vi.hoisted(() => ({ enabled: vi.fn(), member: vi.fn(), unavailable: vi.fn(), count: vi.fn(), rows: vi.fn(), preparation: vi.fn(), raw: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: {} }));
import { ticketStudioContract } from "@/core/service-work/studio";
import { CapabilityRegistry } from "@/core/studio/registry/registry";
const actor: Session = { userId: "actor", userName: "Actor", userEmail: "actor@example.invalid", membershipId: "member",
  organisationId: "company", organisationName: "Company", capabilities: new Set(["tickets.ticket.read", "tickets.ticket.manage"]) };
const preparationId = "00000000-0000-4000-8000-000000000001";
const tx = { moduleState: { findFirst: m.enabled }, membership: { findFirst: m.member },
  serviceWorkItem: { findFirst: m.unavailable, count: m.count, findMany: m.rows },
  studioFieldMigrationPreparation: { findFirst: m.preparation }, $queryRaw: m.raw } as unknown as Prisma.TransactionClient;
function setup(available = true) {
  const registry = new CapabilityRegistry(async () => available); registry.register("tickets", ticketStudioContract);
  const reference = registry.describe("tickets.ticket.field_migration", 1);
  return { registry, reference, run: (input: unknown, session = actor) => registry.invokeQueryInTransaction({ session, transaction: tx }, reference, input) };
}
beforeEach(() => {
  vi.clearAllMocks(); m.enabled.mockResolvedValue({ id: "enabled" }); m.member.mockResolvedValue({ id: "member" });
  m.unavailable.mockResolvedValue(null); m.count.mockResolvedValue(3); m.rows.mockResolvedValue([]);
  m.preparation.mockResolvedValue({ id: preparationId });
  m.raw.mockImplementation(async (strings: TemplateStringsArray) => {
    const sql = strings.join("?");
    return sql.includes("SHOW transaction_isolation") ? [{ transaction_isolation: "serializable" }]
      : sql.includes("AS changed") ? [{ changed: false }] : [];
  });
});

it("preserves exact sealed entity v1/v2/v3 and snapshot v1 hashes captured from the verified server source", () => {
  const { registry } = setup();
  expect([["tickets.ticket", 1], ["tickets.ticket", 2], ["tickets.ticket", 3], ["tickets.ticket.field_migration", 1]].map(([id, version]) => {
    const metadata = registry.describe(String(id), Number(version)); return [metadata.schemaHash, metadata.contractHash];
  })).toEqual([
    ["e563b6536de3ffc03d3e3fc63fc7f9211dc158ce7ee517c944e9efc0ccce2ca6", "7c36b9ab5005060a1310d28cf8e9745b9529aa6c6968e373e27575e4cdc8df27"],
    ["bad9b6f043e62e636d730d5968aeb2799293225e9adcb0d1e6e867ba0a79eb7c", "f9df7435d09d8b076b63571a413ac7bdaaee3c171abeb50391e06185aeb44437"],
    ["19e54bbff7f11ec3731aac432dcbaec97f46a2bb230d3ee5306f903b8ed7e166", "8d7adf708c77c46038e649433680c7f22ab00cee2d5efc140667ece00e70a2af"],
    ["69ec7a8a5e57cdc3278c0dfe9011626022d187d552ac4693e6e5010bc661cfbf", "e2096642c566ef527f3b38b8da6c2795f4dddf461d87cd92af678da6548f2d5c"],
  ]);
});

it("rejects missing/shared but nonserializable transactions before native access", async () => {
  const { registry, reference, run } = setup();
  await expect(registry.invoke(actor, reference, { mode: "preflight" })).rejects.toThrow("shared server transaction");
  await expect(registry.invokeQueryInTransaction({ session: actor }, reference, { mode: "preflight" })).rejects.toThrow("opted-in");
  m.raw.mockResolvedValue([{ transaction_isolation: "read committed" }]);
  await expect(run({ mode: "preflight" })).rejects.toThrow("serializable");
  expect(m.enabled).not.toHaveBeenCalled(); expect(m.count).not.toHaveBeenCalled(); expect(m.rows).not.toHaveBeenCalled();
});

it("requires actual active target membership even for metadata staff", async () => {
  const { run } = setup(); m.member.mockResolvedValue(null);
  await expect(run({ mode: "snapshot" })).rejects.toThrow("MIGRATION_ACCESS_REQUIRED");
  expect(m.member).toHaveBeenCalledWith({ where: { id: "member", organisationId: "company", userId: "actor", active: true,
    organisation: { kind: "CUSTOMER", status: "ACTIVE", archivedAt: null } }, select: { id: true } });
  expect(m.unavailable).not.toHaveBeenCalled(); expect(m.count).not.toHaveBeenCalled(); expect(m.rows).not.toHaveBeenCalled();
});

it("checks native read/manage, entitlement and complete private coverage before IDs or counts", async () => {
  const { run } = setup();
  for (const capabilities of [new Set(["studio.definition.publish"]), new Set(["tickets.ticket.manage"]), new Set(["tickets.ticket.read"])]) {
    await expect(run({ mode: "preflight" }, { ...actor, capabilities })).rejects.toThrow("FORBIDDEN");
  }
  m.enabled.mockResolvedValue(null); await expect(run({ mode: "snapshot" })).rejects.toThrow("DEPENDENCY_BROKEN");
  m.enabled.mockResolvedValue({ id: "enabled" }); m.unavailable.mockResolvedValue({ id: "secret-ticket" });
  await expect(run({ mode: "preflight" })).rejects.toThrow("MIGRATION_ACCESS_REQUIRED");
  await expect(run({ mode: "snapshot" })).rejects.not.toThrow("secret-ticket");
  expect(m.count).not.toHaveBeenCalled(); expect(m.rows).not.toHaveBeenCalled();
  expect(m.unavailable.mock.calls.at(-1)![0].where).toMatchObject({ organisationId: "company", kind: "TICKET", OR: expect.any(Array) });
  expect(m.unavailable.mock.calls.at(-1)![0].where.OR[1]).toEqual({ queue: { restricted: true, members: { none: { organisationId: "company", userId: "actor" } } } });
  await expect(setup(false).run({ mode: "snapshot" })).rejects.toThrow("unavailable");
});

it("pages canonical native anchors without filtering final/merged work or absent extension storage", async () => {
  const { run } = setup();
  m.rows.mockResolvedValue([{ id: "a", organisationId: "company", version: 1 }, { id: "b", organisationId: "company", version: 4 }, { id: "c", organisationId: "company", version: 2 }]);
  expect(await run({ mode: "snapshot", cursor: "previous", limit: 2 })).toEqual({ mode: "snapshot", organisationId: "company", entityId: "tickets.ticket",
    records: [{ recordId: "a", organisationId: "company", revision: 1 }, { recordId: "b", organisationId: "company", revision: 4 }], next: "b" });
  expect(m.rows).toHaveBeenCalledWith({ where: { organisationId: "company", kind: "TICKET", id: { gt: "previous" } },
    select: { id: true, organisationId: true, version: true }, orderBy: { id: "asc" }, take: 3 });
  expect(m.member.mock.invocationCallOrder[0]).toBeLessThan(m.unavailable.mock.invocationCallOrder[0]);
  expect(m.unavailable.mock.invocationCallOrder[0]).toBeLessThan(m.rows.mock.invocationCallOrder[0]);
  m.rows.mockResolvedValue([]); expect(await run({ mode: "snapshot" })).toMatchObject({ records: [], next: null });
  expect(await run({ mode: "preflight" })).toMatchObject({ count: 3, nativeAccessComplete: true });
  expect(m.count).toHaveBeenCalledWith({ where: { organisationId: "company", kind: "TICKET" } });
});

it("does not let clients set tenant/transaction, unbounded pages or malformed preparation IDs", async () => {
  const { run } = setup();
  for (const input of [{ mode: "snapshot", organisationId: "other" }, { mode: "snapshot", transaction: {} }, { mode: "snapshot", limit: 51 },
    { mode: "coverage", preparationId: "other" }, { mode: "unknown" }]) await expect(run(input)).rejects.toThrow();
  expect(m.raw).not.toHaveBeenCalled(); expect(m.rows).not.toHaveBeenCalled();
});

it("requires a scoped noncancelled preparation with explicitly approved source versions before coverage", async () => {
  const { run } = setup(); m.preparation.mockResolvedValue(null);
  await expect(run({ mode: "coverage", preparationId })).rejects.toThrow("MIGRATION_REVIEW_UNAVAILABLE");
  expect(m.preparation).toHaveBeenCalledWith({ where: { id: preparationId, organisationId: "company", entityId: "tickets.ticket",
    state: { in: ["PREPARING", "REVIEWED"] }, OR: [2, 3].map(version => ({ sourceVersion: { payload: { path: ["entity", "version"], equals: version } } })) }, select: { id: true } });
  expect(m.count).not.toHaveBeenCalled(); expect(m.raw.mock.calls.some(([strings]) => strings.join("?").includes("AS changed"))).toBe(false);
});

it("uses both exact sets and native revisions, rejecting changes without returning even equal counts", async () => {
  const { run } = setup();
  expect(await run({ mode: "coverage", preparationId })).toMatchObject({ count: 3, nativeCoverageComplete: true });
  const [sql, ...params] = m.raw.mock.calls.find(([strings]) => strings.join("?").includes("AS changed"))!;
  expect(sql.join("?")).toContain('o."nativeRevision" <> w.version');
  expect(sql.join("?")).toContain("NOT EXISTS"); expect(sql.join("?")).toContain("o.id IS NULL");
  expect(params).toEqual([preparationId, "company", preparationId, "company", "company"]);
  m.count.mockClear(); m.raw.mockImplementation(async (strings: TemplateStringsArray) => strings.join("?").includes("SHOW transaction_isolation")
    ? [{ transaction_isolation: "serializable" }] : strings.join("?").includes("AS changed") ? [{ changed: true }] : []);
  await expect(run({ mode: "coverage", preparationId })).rejects.toThrow("MIGRATION_COHORT_CHANGED"); expect(m.count).not.toHaveBeenCalled();
});

it("adds only version 3 migration opt-in and retains ordinary final-record restrictions", async () => {
  const { registry } = setup();
  for (const version of [1, 2]) expect(registry.describe("tickets.ticket", version).details.record).not.toHaveProperty("migrationSnapshot");
  expect(registry.describe("tickets.ticket", 3).details.record).toMatchObject({ migrationSnapshot: { query: { id: "tickets.ticket.field_migration", version: 1 }, sourceVersions: [2, 3] } });
  m.unavailable.mockResolvedValue({ id: "final", organisationId: "company", version: 3, status: "RESOLVED", mergedIntoId: null, queueId: "queue", queue: { restricted: false } });
  await expect(registry.authoriseRecord({ session: actor, transaction: tx }, registry.describe("tickets.ticket", 3),
    { recordId: "final", intent: "extend", expectedRevision: 3 })).rejects.toThrow("Reopen active ticket");
});
