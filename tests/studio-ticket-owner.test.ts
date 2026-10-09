import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Session } from "@/core/auth/session";
import type { Prisma } from "@/generated/prisma/client";
const state = vi.hoisted(() => ({ moduleState: { findFirst: vi.fn() }, serviceWorkItem: { findFirst: vi.fn(), findMany: vi.fn() }, serviceQueueMember: { findFirst: vi.fn() }, $queryRaw: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: state }));
import { ticketStudioContract } from "@/core/service-work/studio";
import { CapabilityRegistry } from "@/core/studio/registry/registry";
const session: Session = { userId: "agent", userName: "Agent", userEmail: "a@example.test", organisationId: "tenant-a", organisationName: "A", membershipId: "m", capabilities: new Set(["tickets.ticket.read", "tickets.ticket.manage"]) };
const transaction = state as unknown as Prisma.TransactionClient;
const native = { id: "ticket", organisationId: "tenant-a", version: 4, kind: "TICKET", status: "IN_PROGRESS", mergedIntoId: null, queueId: "private", queue: { restricted: true }, number: "TKT-000004", subject: "Restricted request", type: "INCIDENT", priority: "NORMAL", createdAt: new Date("2026-10-01"), updatedAt: new Date("2026-10-09") };
const setup = () => { const registry = new CapabilityRegistry(async () => true); registry.register("tickets", ticketStudioContract); return registry; };
const write = (registry: CapabilityRegistry, expectedRevision = 4) => registry.authoriseRecord({ session, transaction }, registry.describe("tickets.ticket", 1), { recordId: "ticket", intent: "extend", expectedRevision });
beforeEach(() => { vi.resetAllMocks(); state.moduleState.findFirst.mockResolvedValue({ id: "enabled" }); state.serviceWorkItem.findFirst.mockResolvedValue(native); state.serviceWorkItem.findMany.mockResolvedValue([native]); state.serviceQueueMember.findFirst.mockResolvedValue({ id: "member" }); state.$queryRaw.mockResolvedValue([{ id: "ticket" }]); });
describe("Tickets Studio owner", () => {
  it("uses canonical TICKET and original tenant/private workScope, exposing only approved projection", async () => {
    const registry = setup();
    const result = await registry.invoke(session, registry.describe("tickets.ticket.get", 1), { recordId: "ticket" });
    expect(result).toEqual({ id: "ticket", revision: 4, href: "/tickets/ticket", fields: { number: native.number, subject: native.subject, status: native.status, type: native.type, priority: native.priority, created_at: native.createdAt.toISOString(), updated_at: native.updatedAt.toISOString() } });
    const call = state.serviceWorkItem.findFirst.mock.calls[0][0];
    expect(call.where.AND[0].organisationId).toBe("tenant-a");
    expect(call.where.AND[0].AND[1].OR).toContainEqual({ queue: { members: { some: { organisationId: "tenant-a", userId: "agent" } } } });
    expect(call.where.AND[1]).toEqual({ id: "ticket", kind: "TICKET" });
    expect(call.select).not.toHaveProperty("context"); expect(call.select).not.toHaveProperty("entries");
    state.serviceWorkItem.findFirst.mockResolvedValue(null);
    await expect(registry.invoke(session, registry.describe("tickets.ticket.get", 1), { recordId: "private-other" })).rejects.toThrow("unavailable");
  });
  it("validates bounded keyset queries and never uses caller-supplied tenant or unrestricted fields", async () => {
    const registry = setup(), reference = registry.describe("tickets.ticket.list", 1);
    state.serviceWorkItem.findMany.mockResolvedValue([{ ...native, id: "second" }, native]);
    expect(await registry.invoke(session, reference, { limit: 1 })).toMatchObject({ records: [{ id: "second" }], next: { id: "second", updated_at: native.updatedAt.toISOString() } });
    expect(state.serviceWorkItem.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 2, orderBy: [{ updatedAt: "desc" }, { id: "desc" }] }));
    await expect(registry.invoke(session, reference, { limit: 1000 })).rejects.toThrow();
    await expect(registry.invoke(session, reference, { organisationId: "tenant-b" })).rejects.toThrow();
    await expect(registry.invoke(session, reference, { search: "a", fields: ["description"] })).rejects.toThrow();
  });
  it("requires real company enablement even for Atlas staff, including inside a write transaction", async () => {
    state.moduleState.findFirst.mockResolvedValue(null); const registry = setup();
    await expect(write(registry)).rejects.toThrow("unavailable");
    expect(state.moduleState.findFirst).toHaveBeenCalledWith({ where: { organisationId: "tenant-a", moduleId: "tickets", enabled: true, entitled: true }, select: { id: true } });
    expect(state.serviceWorkItem.findFirst).not.toHaveBeenCalled();
  });
  it("locks then rechecks canonical work without any native mutation", async () => {
    const registry = setup(); expect(await write(registry)).toEqual({ recordId: "ticket", organisationId: "tenant-a", revision: 4 });
    expect(state.$queryRaw).toHaveBeenCalledTimes(2); expect(state.serviceWorkItem.findFirst).toHaveBeenCalledTimes(2);
    expect(state.serviceQueueMember.findFirst).toHaveBeenCalledWith({ where: { organisationId: "tenant-a", queueId: "private", userId: "agent" }, select: { id: true } });
  });
  it.each(["RESOLVED", "CLOSED", "CANCELLED"])("rejects extension writes to %s tickets", async status => {
    state.serviceWorkItem.findFirst.mockResolvedValue({ ...native, status }); await expect(write(setup())).rejects.toThrow("Reopen");
  });
  it("rejects merged tickets, restricted-queue non-members and stale revisions", async () => {
    const registry = setup(); state.serviceWorkItem.findFirst.mockResolvedValue({ ...native, mergedIntoId: "other" });
    await expect(write(registry)).rejects.toThrow("Reopen");
    state.serviceWorkItem.findFirst.mockResolvedValue(native); state.serviceQueueMember.findFirst.mockResolvedValue(null);
    await expect(write(registry)).rejects.toThrow("restricted queue");
    await expect(write(registry, 3)).rejects.toThrow("record changed");
    state.serviceWorkItem.findFirst.mockResolvedValueOnce(native).mockResolvedValueOnce({ ...native, version: 5 });
    await expect(write(registry)).rejects.toThrow("record changed");
  });
});
