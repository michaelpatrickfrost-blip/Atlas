import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Session } from "@/core/auth/session";
const state = vi.hoisted(() => ({
  enabled: new Set(["sales", "finance"]), context: vi.fn(), sales: vi.fn(), finance: vi.fn(), customer: vi.fn(),
}));
vi.mock("@/core/modules/runtime", () => ({ getEnabledModuleIds: async () => state.enabled }));
vi.mock("@/core/modules/registry", () => ({
  getModule: (id: string) => id === "sales" ? { recordContextProvider: state.context } : undefined,
  getImplementedModules: () => [{ id: "sales", recordRelationshipProvider: state.sales }, { id: "finance", recordRelationshipProvider: state.finance }],
}));
vi.mock("@/core/customers/relationships", () => ({ customerRecordRelationships: state.customer }));
import { loadRecordRelationships } from "@/core/relationships/load";
const session = { userId: "u", organisationId: "tenant", capabilities: new Set(["sales.order.read"]) } as Session;
const record = { moduleId: "sales", type: "order", id: "order" };
const link = { id: "i", title: "Invoice", kind: "Invoice", href: "/finance/documents/i", direction: "downstream" };
beforeEach(() => {
  vi.clearAllMocks(); state.enabled = new Set(["sales", "finance"]);
  state.context.mockResolvedValue({ record, anchors: [] });
  for (const provider of [state.sales, state.finance, state.customer]) provider.mockResolvedValue({ links: [] });
});
describe("record relationship authority", () => {
  it("does not query contributors until the source owner authorises the record", async () => {
    state.context.mockResolvedValue(null);
    expect(await loadRecordRelationships(session, record)).toBeNull();
    expect(state.finance).not.toHaveBeenCalled(); expect(state.customer).not.toHaveBeenCalled();
  });
  it("keeps an optional source lookup failure from breaking the record page", async () => {
    state.context.mockRejectedValue(new Error("database unavailable"));
    expect(await loadRecordRelationships(session, record)).toEqual({ links: [], unavailable: true, hasMore: false });
    expect(state.finance).not.toHaveBeenCalled();
  });
  it("does not query a disabled source or target module", async () => {
    state.enabled.delete("sales"); expect(await loadRecordRelationships(session, record)).toBeNull(); expect(state.context).not.toHaveBeenCalled();
    state.enabled.add("sales"); state.enabled.delete("finance"); await loadRecordRelationships(session, record); expect(state.finance).not.toHaveBeenCalled();
  });
  it("passes authenticated identity to each owner and deduplicates links", async () => {
    state.finance.mockResolvedValue({ links: [link, link] });
    expect((await loadRecordRelationships(session, record))?.links).toEqual([link]);
    expect(state.finance).toHaveBeenCalledWith(session, { record, anchors: [] });
  });
  it("keeps healthy related records visible when another owner fails", async () => {
    state.sales.mockRejectedValue(new Error("internal credentials must never render"));
    state.finance.mockResolvedValue({ links: [link], hasMore: true });
    expect(await loadRecordRelationships(session, record)).toEqual({ links: [link], unavailable: true, hasMore: true });
  });
  it("excludes external and protocol-relative relationship URLs", async () => {
    state.finance.mockResolvedValue({ links: [link, { ...link, href: "https://other.test" }, { ...link, href: "//other.test" }, { ...link, href: "/\\other.test" }] });
    expect((await loadRecordRelationships(session, record))?.links).toEqual([link]);
  });
});
