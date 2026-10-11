import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Prisma } from "@/generated/prisma/client";
const mock = vi.hoisted(() => ({ membership: vi.fn(), refresh: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: { membership: { findUnique: mock.membership } } }));
vi.mock("@/core/studio/fields/runtime-authority", () => ({ nativeFieldMutationSessionInTransaction: mock.refresh }));
import { sessionForUser, type Session } from "@/core/auth/session";
import { CapabilityRegistry } from "@/core/studio/registry/registry";
import { ticketStudioContract } from "@/core/service-work/studio";
import { ticketPageContract, ticketPagePolicy } from "@/core/service-work/studio-pages";
import { workScope } from "@/core/service-work/access";

// Genuine Session/actual registry/factories/workScope. Fresh authority and SQL
// rows are explicit collaborators: these are not private-row/PG/SSI/live checks.
const cap = "tickets.ticket.read", date = new Date("2026-10-11T01:02:03Z");
const membership = (grants = [cap]) => ({ id: "member", userId: "actor", organisationId: "company", sessionVersion: 2, active: true,
  grantedCapabilities: grants, deniedCapabilities: [] as string[], roles: [], user: { name: "Actor", email: "actor@example.invalid", authVersion: 3, platformAdmin: null },
  organisation: { id: "company", name: "Company", kind: "CUSTOMER", status: "ACTIVE", archivedAt: null, auditAccess: null, restrictedAccessAreas: [] } });
const row = (id = "ticket") => ({ id, organisationId: "company", version: 4, number: "TK-0001", subject: "Business request", status: "NEW", type: "QUESTION", priority: "NORMAL",
  createdAt: date, updatedAt: date, description: "private", resolution: "private", queue: { privateNotes: "private" } });
async function actor(grants = [cap]) { mock.membership.mockResolvedValueOnce(membership(grants)); const session = await sessionForUser("company", "actor"); if (!session) throw new Error("No actor"); return session; }
function fixture() {
  const storage = { moduleState: { findFirst: vi.fn().mockResolvedValue({ id: "tickets" }) }, serviceWorkItem: { findFirst: vi.fn().mockResolvedValue(row()), findMany: vi.fn().mockResolvedValue([row()]) } };
  const transaction = storage as unknown as Prisma.TransactionClient, available = vi.fn(async () => true), registry = new CapabilityRegistry(available);
  registry.register("tickets", { contributions: [...ticketStudioContract.contributions, ...ticketPageContract.contributions] });
  return { storage, transaction, available, registry, source: registry.describe("tickets.ticket.page", 1), callbacks: ticketPageContract.contributions.at(-1)!.pageSource! };
}
const record = { kind: "record" as const, recordId: "ticket" };
const request = (kind: "header" | "list", pageSize = 50, cursor: Record<string, string | number> | null = null) => ({ query: { id: `tickets.ticket.page.${kind}`, version: 1 }, pageSize, cursor });
beforeEach(() => { vi.resetAllMocks(); mock.refresh.mockImplementation(async (session: Session) => ({ session })); });

describe("Tickets explicit ordinary-read Page owner", () => {
  it("retains every old contract hash and explicitly supports only genuine typed source versions2–9", () => {
    const f = fixture(), before = new CapabilityRegistry(async () => true); before.register("tickets", ticketStudioContract);
    for (const contribution of ticketStudioContract.contributions) expect(f.registry.describe(contribution.metadata.id, contribution.metadata.version)).toEqual(before.describe(contribution.metadata.id, contribution.metadata.version));
    const policy = f.registry.describePageSource(f.source).policy;
    expect(policy).toMatchObject({ entity: { id: "tickets.ticket", version: 9 }, variants: true, fieldSourceVersions: [2, 3, 4, 5, 6, 7, 8, 9] });
    expect(policy.fieldSourceVersions).not.toContain(1); expect(f.registry.describe("tickets.ticket", 1).details.record).not.toHaveProperty("fieldPolicy");
    expect(policy.facts.map(fact => fact.id)).toEqual(["status", "priority"]); expect(policy.commands).toEqual([]);
    expect(mock.refresh).not.toHaveBeenCalled(); expect(f.storage.serviceWorkItem.findFirst).not.toHaveBeenCalled();
  });
  it("uses current Read/private canonical scope and exact version+timestamp before any protected projection", async () => {
    const session = await actor(), f = fixture(), result = await f.registry.invokePageRead({ session, transaction: f.transaction }, f.source, record, request("header"));
    expect(result.anchor).toEqual({ kind: "record", organisationId: "company", recordId: "ticket", revision: `4@${date.toISOString()}`, nativeRevision: 4 });
    expect(result.output.rows[0].values).toEqual({ number: "TK-0001", subject: "Business request", status: "NEW", type: "QUESTION", priority: "NORMAL", created_at: date.toISOString(), updated_at: date.toISOString() });
    expect(JSON.stringify(result)).not.toContain("private"); expect(session.capabilities.has("tickets.ticket.manage")).toBe(false);
    const protectedRead = f.storage.serviceWorkItem.findFirst.mock.calls.find(([args]) => args.select.subject)?.[0];
    expect(protectedRead).toMatchObject({ where: { AND: [{ AND: [workScope(session), { kind: "TICKET", queue: { organisationId: "company" } }] }, { id: "ticket", version: 4, updatedAt: date }] } });
    expect(protectedRead.select.description).toBeUndefined(); expect(protectedRead.select.resolution).toBeUndefined();
    expect(mock.refresh.mock.invocationCallOrder[0]).toBeLessThan(f.storage.moduleState.findFirst.mock.invocationCallOrder[0]);
    expect(f.storage.moduleState.findFirst.mock.invocationCallOrder[0]).toBeLessThan(f.storage.serviceWorkItem.findFirst.mock.invocationCallOrder[0]);
  });
  it("denies copy/missing context, client tenant/query overrides and current revoked grants/module before native data", async () => {
    const session = await actor(), f = fixture();
    for (const context of [{ session }, { session: { ...session }, transaction: f.transaction }]) await expect(f.registry.invokePageRead(context, f.source, record, request("header"))).rejects.toThrow("genuine");
    await expect(f.registry.invokePageRead({ session, transaction: f.transaction }, f.source, { ...record, organisationId: "foreign" }, request("header"))).rejects.toThrow();
    await expect(f.registry.invokePageRead({ session, transaction: f.transaction }, f.source, record, { ...request("header"), recordId: "foreign" })).rejects.toThrow();
    expect(mock.refresh).not.toHaveBeenCalled();
    const revoked = await actor([]); mock.refresh.mockResolvedValueOnce({ session: revoked });
    await expect(f.registry.invokePageRead({ session, transaction: f.transaction }, f.source, record, request("header"))).rejects.toThrow("FORBIDDEN");
    f.storage.moduleState.findFirst.mockResolvedValueOnce(null);
    await expect(f.registry.invokePageRead({ session, transaction: f.transaction }, f.source, record, request("header"))).rejects.toThrow("unavailable");
    expect(f.storage.serviceWorkItem.findFirst).not.toHaveBeenCalled();
  });
  it("fails revoked private access, foreign rows and stale actual revisions before protected header columns", async () => {
    const session = await actor();
    for (const outcome of [null, { ...row(), organisationId: "foreign" }]) {
      const f = fixture(); f.storage.serviceWorkItem.findFirst.mockResolvedValueOnce(outcome);
      await expect(f.registry.invokePageRead({ session, transaction: f.transaction }, f.source, record, request("header"))).rejects.toThrow("unavailable");
      expect(f.storage.serviceWorkItem.findFirst.mock.calls.some(([args]) => args.select.subject)).toBe(false);
    }
    const f = fixture(); f.storage.serviceWorkItem.findFirst.mockResolvedValueOnce(row()).mockResolvedValueOnce({ ...row(), version: 5 });
    await expect(f.registry.invokePageRead({ session, transaction: f.transaction }, f.source, record, request("header"))).rejects.toThrow("changed");
    expect(f.storage.serviceWorkItem.findFirst.mock.calls.some(([args]) => args.select.subject)).toBe(false);
  });
  it("anchors bounded list cursors inside canonical private scope, with deterministic descending pagination", async () => {
    const session = await actor(), f = fixture(); f.storage.serviceWorkItem.findMany.mockResolvedValue([row("one"), row("two")]);
    const result = await f.registry.invokePageRead({ session, transaction: f.transaction }, f.source, { kind: "list" }, request("list", 1, { id: "ticket", updatedAt: date.toISOString() }));
    expect(result.output.rows.map(record => record.id)).toEqual(["one"]); expect(result.output.nextCursor).toEqual({ id: "one", updatedAt: date.toISOString() });
    expect(f.storage.serviceWorkItem.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 2, orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      where: { AND: [{ AND: [workScope(session), { kind: "TICKET", queue: { organisationId: "company" } }] }, { OR: [{ updatedAt: { lt: date } }, { updatedAt: date, id: { lt: "ticket" } }] }] } }));
    f.storage.serviceWorkItem.findFirst.mockResolvedValueOnce(null);
    await expect(f.registry.invokePageRead({ session, transaction: f.transaction }, f.source, { kind: "list" }, request("list", 1, { id: "private", updatedAt: date.toISOString() }))).rejects.toThrow("cursor changed");
    expect(f.storage.serviceWorkItem.findMany).toHaveBeenCalledTimes(1);
    await expect(f.registry.invokePageRead({ session, transaction: f.transaction }, f.source, record, request("list"))).rejects.toThrow("scope");
  });
  it("rejects undeclared projection fields and actual foreign/mismatched output anchors without enabling native writes", async () => {
    const session = await actor(), f = fixture(), anchor = { kind: "record" as const, organisationId: "company", recordId: "ticket", revision: `4@${date.toISOString()}`, nativeRevision: 4 };
    await expect(f.callbacks.projectQueryOutput({ session, transaction: f.transaction }, anchor, request("header"), { rows: [{ id: "ticket", values: { ...row(), description: "private" } }], nextCursor: null })).rejects.toThrow();
    await expect(f.registry.invoke(session, f.source, {})).rejects.toThrow("descriptive");
    expect(ticketPagePolicy.queries.every(query => query.columns.every(column => Boolean(column.label)))).toBe(true);
  });
});
