import { beforeEach, expect, it, vi } from "vitest";
import type { Session } from "@/core/auth/session";
import type { Prisma } from "@/generated/prisma/client";
const m = vi.hoisted(() => ({ enabled: vi.fn(), member: vi.fn(), inaccessible: vi.fn(), count: vi.fn(), rows: vi.fn(), raw: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: {} }));
import { ticketStudioContract } from "@/core/service-work/studio";
import { CapabilityRegistry } from "@/core/studio/registry/registry";
import { entityDetailsSchema } from "@/core/studio/registry/entities";
import { checksum } from "@/core/studio/registry/contracts";
const session: Session = { userId: "actor", userName: "Actor", userEmail: "actor@example.invalid", membershipId: "member",
  organisationId: "company", organisationName: "Company", capabilities: new Set(["tickets.ticket.read", "tickets.ticket.manage"]) };
const tx = { $queryRaw: m.raw, membership: { findFirst: m.member }, moduleState: { findFirst: m.enabled },
  serviceWorkItem: { findFirst: m.inaccessible, count: m.count, findMany: m.rows } } as unknown as Prisma.TransactionClient;
function setup(available = true) { const registry = new CapabilityRegistry(async () => available); registry.register("tickets", ticketStudioContract); return registry; }
beforeEach(() => { vi.resetAllMocks(); m.enabled.mockResolvedValue({ id: "enabled" }); m.member.mockResolvedValue({ id: "member" });
  m.inaccessible.mockResolvedValue(null); m.count.mockResolvedValue(2); m.rows.mockResolvedValue([]);
  m.raw.mockImplementation(async strings => strings.join("") === "SHOW transaction_isolation" ? [{ transaction_isolation: "serializable" }] : []); });
it("approves explicit latest complete coverage without changing older migration or creation contracts", async () => {
  const registry = setup(), record = entityDetailsSchema.parse(registry.describe("tickets.ticket", 8).details).record!;
  for (const version of [1, 2, 3, 4, 5, 6, 7]) expect(entityDetailsSchema.parse(registry.describe("tickets.ticket", version).details).record?.requiredCoverage).toBeUndefined();
  expect(record.requiredCoverage).toEqual({ query: { id: "tickets.ticket.required_coverage", version: 1 }, fieldVersions: [2, 3, 4, 5, 6, 7, 8] });
  expect(record.migrationSnapshot).toEqual(entityDetailsSchema.parse(registry.describe("tickets.ticket", 7).details).record!.migrationSnapshot);
  expect(registry.describe("tickets.ticket", 7).contractHash).toBe("5f69287becebbd7658245afc78b1a1eabf30b297e0613d5a07db7b9ecf9655d8");
  for (const version of record.requiredCoverage!.fieldVersions) {
    const policy = await registry.resolveCurrentRequiredCoverage(session, registry.describe("tickets.ticket", version));
    expect(policy.owner.version).toBe(8); expect(policy.query.id).toBe("tickets.ticket.required_coverage");
  }
  await expect(registry.resolveCurrentRequiredCoverage(session, registry.describe("tickets.ticket", 1))).rejects.toThrow("source is unavailable");
});
it("checks complete private access before counts/IDs and uses all canonical rows in the owning transaction", async () => {
  const registry = setup(), { query } = await registry.resolveCurrentRequiredCoverage(session, registry.describe("tickets.ticket", 7));
  const run = (input: unknown) => registry.invokeQueryInTransaction({ session, transaction: tx }, query, input);
  m.inaccessible.mockResolvedValue({ id: "private-secret" });
  await expect(run({ mode: "preflight" })).rejects.toThrow("MIGRATION_ACCESS_REQUIRED");
  expect(m.count).not.toHaveBeenCalled(); expect(m.rows).not.toHaveBeenCalled();
  m.inaccessible.mockResolvedValue(null);
  expect(await run({ mode: "preflight" })).toEqual({ mode: "preflight", organisationId: "company", entityId: "tickets.ticket", count: 2, nativeAccessComplete: true });
  m.rows.mockResolvedValue([{ id: "a", organisationId: "company", version: 9 }, { id: "b", organisationId: "company", version: 4 }]);
  expect(await run({ mode: "snapshot", limit: 1 })).toMatchObject({ records: [{ recordId: "a", organisationId: "company", revision: 9 }], next: "a" });
  expect(m.rows).toHaveBeenCalledWith({ where: { organisationId: "company", kind: "TICKET" }, select: { id: true, organisationId: true, version: true }, orderBy: { id: "asc" }, take: 2 });
  expect(m.count).toHaveBeenCalledWith({ where: { organisationId: "company", kind: "TICKET" } });
  expect(m.inaccessible.mock.invocationCallOrder.at(-1)!).toBeLessThan(m.rows.mock.invocationCallOrder[0]);
});
it("rejects unpublished permissions, copied hashes, latest unsupported policies, expiry and disabled owners without fallback", async () => {
  const registry = setup(), source = registry.describe("tickets.ticket", 7);
  for (const capabilities of [new Set(["studio.definition.publish"]), new Set(["tickets.ticket.read"]), new Set(["tickets.ticket.manage"])])
    await expect(registry.resolveCurrentRequiredCoverage({ ...session, capabilities }, source)).rejects.toThrow("FORBIDDEN");
  await expect(registry.resolveCurrentRequiredCoverage(session, { ...source, contractHash: "e".repeat(64) })).rejects.toThrow("changed");
  await expect(setup(false).resolveCurrentRequiredCoverage(session, source)).rejects.toThrow("unavailable");
  const owner = ticketStudioContract.contributions.find(c => c.metadata.id === source.id && c.metadata.version === 8)!;
  const expired = setup();
  expired.register("tickets", { contributions: [{ ...owner, metadata: { ...owner.metadata, version: 9, lifecycle: "deprecated", supportedUntil: "2000-01-01T00:00:00.000Z" } }] });
  await expect(expired.resolveCurrentRequiredCoverage(session, source)).rejects.toThrow("expired");
  const details = entityDetailsSchema.parse(owner.metadata.details);
  const changed = { ...details, record: { ...details.record!, requiredCoverage: undefined } };
  // JSON metadata omits optional fields; new unsupported current versions must fail.
  const plain = JSON.parse(JSON.stringify(changed));
  registry.register("tickets", { contributions: [{ ...owner, metadata: { ...owner.metadata, version: 9, details: plain, schemaHash: checksum(plain) } }] });
  await expect(registry.resolveCurrentRequiredCoverage(session, source)).rejects.toThrow("current owner");
});
it("atomically rejects missing/nontransactional/wrong-capability queries and unsupported or duplicate field versions", () => {
  const owner = ticketStudioContract.contributions.find(c => c.metadata.id === "tickets.ticket" && c.metadata.version === 8)!;
  const query = ticketStudioContract.contributions.find(c => c.metadata.id === "tickets.ticket.required_coverage")!;
  for (const replacement of [null, { ...query, metadata: { ...query.metadata, capability: "tickets.ticket.read" } },
    { ...query, metadata: { ...query.metadata, details: { ...query.metadata.details, transaction: undefined } } }]) {
    const registry = new CapabilityRegistry(async () => true);
    expect(() => registry.register("tickets", { contributions: ticketStudioContract.contributions.flatMap(c => c === query ? replacement ? [replacement] : [] : [c]) })).toThrow("transactional owner query");
    expect(() => registry.describe("tickets.ticket", 1)).toThrow("missing");
  }
  const details = entityDetailsSchema.parse(owner.metadata.details);
  for (const fieldVersions of [[99], [1]]) {
    const changed = { ...details, record: { ...details.record!, requiredCoverage: { ...details.record!.requiredCoverage!, fieldVersions } } };
    const registry = new CapabilityRegistry(async () => true);
    expect(() => registry.register("tickets", { contributions: ticketStudioContract.contributions.map(c => c === owner ? { ...owner, metadata: { ...owner.metadata, details: changed, schemaHash: checksum(changed) } } : c) })).toThrow("typed-field owner versions");
  }
  expect(() => entityDetailsSchema.parse({ ...details, record: { ...details.record!, requiredCoverage: { ...details.record!.requiredCoverage!, fieldVersions: [2, 2] } } })).toThrow("Duplicate");
});
it("exposes only bounded read-only preflight/snapshot modes and rejects missing membership or isolation", async () => {
  const registry = setup(), query = registry.describe("tickets.ticket.required_coverage", 1);
  await expect(registry.invoke(session, query, { mode: "preflight" })).rejects.toThrow("shared server transaction");
  for (const input of [{ mode: "coverage", preparationId: "00000000-0000-4000-8000-000000000001" }, { mode: "snapshot", limit: 51 }, { mode: "preflight", organisationId: "foreign" }])
    await expect(registry.invokeQueryInTransaction({ session, transaction: tx }, query, input)).rejects.toThrow();
  expect(m.raw).not.toHaveBeenCalled();
  m.member.mockResolvedValue(null);
  await expect(registry.invokeQueryInTransaction({ session, transaction: tx }, query, { mode: "preflight" })).rejects.toThrow("membership");
  m.member.mockResolvedValue({ id: "member" }); m.raw.mockResolvedValue([{ transaction_isolation: "read committed" }]);
  await expect(registry.invokeQueryInTransaction({ session, transaction: tx }, query, { mode: "preflight" })).rejects.toThrow("serializable");
  expect(m.count).not.toHaveBeenCalled(); expect(m.rows).not.toHaveBeenCalled();
});
