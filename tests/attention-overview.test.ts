import { beforeEach, expect, it, vi } from "vitest";
import type { Session } from "@/core/auth/session";
const state = vi.hoisted(() => ({ customer: vi.fn(), operations: vi.fn(), work: vi.fn(), modules: vi.fn() }));
vi.mock("@/core/modules/runtime", () => ({ getNavigableModules: state.modules }));
vi.mock("@/core/customers/attention", () => ({ getCustomerAttentionItems: state.customer }));
import { getAttentionItems, getAttentionOverview } from "@/core/attention/aggregate";
const session = { userId: "viewer", organisationId: "tenant", capabilities: new Set() } as Session;
const item = (id: string, severity: string) => ({ id, label: id, href: `/records/${id}`, severity });
beforeEach(() => {
  vi.clearAllMocks(); state.customer.mockResolvedValue([]); state.operations.mockResolvedValue([]); state.work.mockResolvedValue([]);
  state.modules.mockResolvedValue([{ name: "Operations", attentionProvider: state.operations }, { name: "Work", attentionProvider: state.work }]);
});
it("puts urgent work first regardless of module catalogue order", async () => {
  state.customer.mockResolvedValue([item("awareness", "info")]); state.operations.mockResolvedValue([item("review", "warning")]); state.work.mockResolvedValue([item("urgent", "critical")]);
  const result = await getAttentionOverview(session);
  expect(result.items.map(row => row.id)).toEqual(["urgent", "review", "awareness"]);
  expect(result.items[0].source).toBe("Work"); expect(result.unavailableSources).toBe(0);
});
it("keeps working sources when another module fails and marks the list incomplete", async () => {
  state.operations.mockRejectedValue(new Error("private server diagnostics")); state.work.mockResolvedValue([item("task", "warning")]);
  const result = await getAttentionOverview(session);
  expect(result).toMatchObject({ unavailableSources: 1, items: [{ id: "task" }] });
  expect(JSON.stringify(result)).not.toContain("private server diagnostics");
});
it("does not present a failed empty result as a healthy empty queue", async () => {
  state.customer.mockRejectedValue(new Error("unavailable"));
  expect(await getAttentionOverview(session)).toEqual({ items: [], unavailableSources: 1 });
});
it("uses only authorised navigable module providers and passes the signed-in scope", async () => {
  state.modules.mockResolvedValue([{ name: "Work", attentionProvider: state.work }]); await getAttentionOverview(session);
  expect(state.modules).toHaveBeenCalledWith(session); expect(state.operations).not.toHaveBeenCalled();
  expect(state.work).toHaveBeenCalledWith({ organisationId: "tenant", session });
});
it("deduplicates the same action and retains the highest severity", async () => {
  state.customer.mockResolvedValue([item("same", "info")]); state.work.mockResolvedValue([item("same", "critical")]);
  expect((await getAttentionOverview(session)).items).toEqual([{ ...item("same", "critical"), source: "Work" }]);
});
it("retains the item-only contract", async () => {
  state.work.mockResolvedValue([item("task", "warning")]); expect(await getAttentionItems(session)).toEqual([{ ...item("task", "warning"), source: "Work" }]);
});
