import { beforeEach, expect, it, vi } from "vitest";
import type { Session } from "@/core/auth/session";
const m = vi.hoisted(() => ({ enabled: vi.fn(), unavailable: vi.fn(), count: vi.fn(), lock: vi.fn(), transaction: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: { $transaction: m.transaction } }));
import { ticketStudioContract } from "@/core/service-work/studio";
import { CapabilityRegistry } from "@/core/studio/registry/registry";
const actor: Session = { userId: "actor", userName: "Actor", userEmail: "actor@example.invalid", membershipId: "member",
  organisationId: "company", organisationName: "Company", capabilities: new Set(["tickets.ticket.read", "tickets.ticket.manage"]) };
const tx = { moduleState: { findFirst: m.enabled }, serviceWorkItem: { findFirst: m.unavailable, count: m.count }, $queryRaw: m.lock };
function setup(available = true) {
  const registry = new CapabilityRegistry(async () => available); registry.register("tickets", ticketStudioContract);
  return { registry, reference: registry.describe("tickets.ticket.migration_cohort", 1) };
}
beforeEach(() => {
  vi.clearAllMocks(); m.transaction.mockImplementation(async (run: (transaction: typeof tx) => Promise<unknown>) => run(tx));
  m.enabled.mockResolvedValue({ id: "enabled" }); m.unavailable.mockResolvedValue(null); m.count.mockResolvedValue(7); m.lock.mockResolvedValue([]);
});
it("uses one serializable snapshot with module lock and canonical tenant/kind coverage, including absent anchors", async () => {
  const { registry, reference } = setup();
  expect(await registry.invoke(actor, reference, {})).toEqual({ organisationId: "company", entityId: "tickets.ticket", count: 7, accessComplete: true });
  expect(m.transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: "Serializable" });
  expect(m.lock).toHaveBeenCalledTimes(1);
  expect(m.enabled.mock.invocationCallOrder[0]).toBeLessThan(m.unavailable.mock.invocationCallOrder[0]);
  expect(m.unavailable.mock.invocationCallOrder[0]).toBeLessThan(m.count.mock.invocationCallOrder[0]);
  const where = m.unavailable.mock.calls[0][0].where;
  expect(where).toMatchObject({ organisationId: "company", kind: "TICKET", OR: [
    { NOT: { organisationId: "company" } }, { queue: { restricted: true, members: { none: { organisationId: "company", userId: "actor" } } } },
  ] });
  expect(m.unavailable.mock.calls[0][0].select).toEqual({ id: true });
  expect(m.count).toHaveBeenCalledWith({ where: { organisationId: "company", kind: "TICKET" } });
  expect(m.count.mock.calls[0][0].where).not.toHaveProperty("status");
  expect(m.count.mock.calls[0][0].where).not.toHaveProperty("mergedIntoId");
});
it("rejects incomplete scope/private-queue membership before computing any count or exposing identity", async () => {
  const { registry, reference } = setup(); m.unavailable.mockResolvedValue({ id: "private-native-id" });
  await expect(registry.invoke(actor, reference, {})).rejects.toThrow("MIGRATION_ACCESS_REQUIRED");
  try { await registry.invoke(actor, reference, {}); } catch (error) {
    expect(String(error)).not.toContain("private-native-id"); expect(String(error)).not.toContain("7");
  }
  expect(m.count).not.toHaveBeenCalled();
});
it("requires native read and manage, independent of Studio publication", async () => {
  const { registry, reference } = setup();
  for (const capabilities of [new Set(["studio.definition.publish"]), new Set(["tickets.ticket.read"]), new Set(["tickets.ticket.manage"])])
    await expect(registry.invoke({ ...actor, capabilities }, reference, {})).rejects.toThrow("FORBIDDEN");
  expect(m.count).not.toHaveBeenCalled();
});
it("rejects disabled owner/source recheck and strict client scope/native patches", async () => {
  const disabled = setup(false); await expect(disabled.registry.invoke(actor, disabled.reference, {})).rejects.toThrow("unavailable");
  const { registry, reference } = setup();
  for (const input of [{ organisationId: "other" }, { recordId: "private" }, { status: "CLOSED" }, { allowFinal: true }])
    await expect(registry.invoke(actor, reference, input)).rejects.toThrow();
  expect(m.transaction).not.toHaveBeenCalled();
  m.enabled.mockResolvedValue(null); await expect(registry.invoke(actor, reference, {})).rejects.toThrow("unavailable");
  expect(m.unavailable).not.toHaveBeenCalled(); expect(m.count).not.toHaveBeenCalled();
});
it("reports an authorised empty tenant without inventing a business write or conversion permission", async () => {
  const { registry, reference } = setup(); m.count.mockResolvedValue(0);
  expect(await registry.invoke(actor, reference, {})).toMatchObject({ count: 0, accessComplete: true });
  expect(reference.kind).toBe("query"); expect(reference.details).not.toHaveProperty("invoke");
});
