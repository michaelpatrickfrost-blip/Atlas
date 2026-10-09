import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  session: { organisationId: "fixture-company", userId: "fixture-planner", capabilities: new Set<string>() },
  requireSession: vi.fn(), enabled: vi.fn(), run: vi.fn(), refresh: vi.fn(),
  latest: vi.fn(), suggestions: vi.fn(),
}));
vi.mock("@/core/auth/session", () => ({ requireSession: mocks.requireSession }));
vi.mock("@/core/modules/access", () => ({ assertModuleEnabled: mocks.enabled }));
vi.mock("@/modules/manufacturing/services/mrp-calculation", () => ({ runMrp: mocks.run }));
vi.mock("@/modules/manufacturing/services/mrp", () => ({ firmSuggestion: vi.fn(), dismissSuggestion: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.refresh }));
vi.mock("@/core/db/client", () => ({ db: {
  manufacturingPlanningRun: { findFirst: mocks.latest },
  manufacturingSupplySuggestion: { findMany: mocks.suggestions },
} }));
vi.mock("@/modules/stock/services/availability", () => ({ readAvailability: vi.fn() }));

import { runMrpAction } from "@/app/(app)/manufacturing/planning/actions";
import { runMrpForm } from "@/app/(app)/manufacturing/planning/form-actions";
import { getMaterialShortages, plannedProposals, readSuggestionDetail } from "@/modules/manufacturing/services/mrp-queries";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.session.capabilities = new Set(["manufacturing.plan.read", "manufacturing.plan.manage"]);
  mocks.requireSession.mockResolvedValue(mocks.session);
  mocks.enabled.mockResolvedValue(undefined);
  mocks.run.mockResolvedValue({ runId: "fixture-run", plannedOrders: [1, 2], shortages: [1] });
});

describe("Run MRP mutation boundary", () => {
  it("rejects a direct read-only action before creating a planning run", async () => {
    mocks.session.capabilities.delete("manufacturing.plan.manage");
    await expect(runMrpAction()).rejects.toThrow("FORBIDDEN");
    expect(mocks.run).not.toHaveBeenCalled();
    expect(mocks.refresh).not.toHaveBeenCalled();
  });
  it("keeps the same boundary on the form endpoint", async () => {
    mocks.session.capabilities.delete("manufacturing.plan.manage");
    await expect(runMrpForm()).rejects.toThrow("FORBIDDEN");
    expect(mocks.run).not.toHaveBeenCalled();
  });
  it("checks the selected workspace app before writing", async () => {
    const disabled = Error("This app is disabled in your workspace.");
    mocks.enabled.mockRejectedValue(disabled);
    await expect(runMrpAction()).rejects.toBe(disabled);
    expect(mocks.enabled).toHaveBeenCalledWith(mocks.session, "manufacturing");
    expect(mocks.run).not.toHaveBeenCalled();
    expect(mocks.refresh).not.toHaveBeenCalled();
  });
  it("rejects missing authentication without running the planner", async () => {
    const unauthenticated = Error("UNAUTHENTICATED");
    mocks.requireSession.mockRejectedValue(unauthenticated);
    await expect(runMrpAction()).rejects.toBe(unauthenticated);
    expect(mocks.run).not.toHaveBeenCalled();
  });
  it("uses the authorised session company and actor, and refreshes connected planning screens", async () => {
    const form = new FormData(); form.set("organisationId", "other-company"); form.set("userId", "other-user");
    await (runMrpForm as unknown as (data: FormData) => Promise<void>)(form);
    expect(mocks.run).toHaveBeenCalledExactlyOnceWith("fixture-company", "fixture-planner");
    expect(mocks.enabled).toHaveBeenCalledWith(mocks.session, "manufacturing");
    expect(new Set(mocks.refresh.mock.calls.flat())).toEqual(new Set([
      "/manufacturing/planning", "/manufacturing/planning/planned-orders", "/manufacturing/planning/shortages",
    ]));
  });
});

describe("saved MRP dates", () => {
  it("reads current engine demand fields into the proposal display without modifying saved history", async () => {
    const stored = { demand: [{ demandId: "synthetic-forecast", demandType: "FORECAST", demandQuantity: 10, sourceLabel: "Synthetic forecast" }] };
    const before = JSON.stringify(stored);
    expect(readSuggestionDetail(stored).demand).toEqual([{ sourceId: "synthetic-forecast", sourceType: "FORECAST", quantity: 10, label: "Synthetic forecast" }]);
    mocks.latest.mockResolvedValue({ id: "stored-run", startedAt: new Date(), warnings: [], suggestions: [] });
    mocks.suggestions.mockResolvedValue([{ id: "proposal", productId: "parent", quantity: 10, kind: "MAKE", product: { basePriceAmount: 1000 }, neededBy: new Date(), startBy: null, pegging: stored }]);
    const proposals = await plannedProposals("fixture-company");
    expect(proposals[0].pegging[0]).toMatchObject({ demandId: "synthetic-forecast", demandType: "FORECAST", demandQuantity: 10, sourceLabel: "Synthetic forecast" });
    expect(proposals[0].pegging[0].demandQuantity.toLocaleString("en-GB")).toBe("10");
    expect(JSON.stringify(stored)).toBe(before);
  });
  it("decodes ISO operation and material dates without modifying stored JSON", () => {
    const stored = { operations: [{ start: "2026-10-10T09:00:00.000Z", end: "2026-10-10T12:00:00.000Z" }], materials: [{ requiredBy: "2026-10-11T09:00:00.000Z" }] };
    const before = JSON.stringify(stored), detail = readSuggestionDetail(stored);
    expect(detail.operations[0].start?.getTime()).toBe(Date.parse(stored.operations[0].start));
    expect(detail.operations[0].end?.getTime()).toBe(Date.parse(stored.operations[0].end));
    expect(detail.materials[0].requiredBy?.getTime()).toBe(Date.parse(stored.materials[0].requiredBy));
    expect(JSON.stringify(stored)).toBe(before);
  });
  it("retains legacy demand arrays and absent dates", () => {
    const demand = [{ sourceType: "FORECAST", sourceId: "synthetic", label: "Synthetic", quantity: 4 }];
    expect(readSuggestionDetail(demand)).toMatchObject({ demand, operations: [], materials: [] });
    const detail = readSuggestionDetail({ operations: [{ start: null, end: null }], materials: [{ requiredBy: null }] });
    expect(detail.operations[0].start).toBeNull(); expect(detail.materials[0].requiredBy).toBeNull();
  });
  it("retains current bare demand arrays and firm/safety-stock lineage", () => {
    const stored = [
      { demandId: "synthetic-order", demandType: "FIRM", demandQuantity: 4, sourceLabel: "Synthetic order" },
      { demandId: "synthetic-safety", demandType: "SAFETY_STOCK", demandQuantity: 2, sourceLabel: "Synthetic safety stock" },
    ];
    const before = JSON.stringify(stored);
    expect(readSuggestionDetail(stored).demand).toEqual([
      { sourceId: "synthetic-order", sourceType: "FIRM", quantity: 4, label: "Synthetic order" },
      { sourceId: "synthetic-safety", sourceType: "SAFETY_STOCK", quantity: 2, label: "Synthetic safety stock" },
    ]);
    expect(JSON.stringify(stored)).toBe(before);
  });
  it("renders the chronological component-shortage order from persisted JSON dates, scoped to the selected company", async () => {
    mocks.latest.mockResolvedValue({ id: "stored-run", startedAt: new Date(), warnings: [], suggestions: [] });
    mocks.suggestions.mockResolvedValue([
      { id: "proposal", productId: "parent", kind: "MAKE", product: { name: "Synthetic parent" }, pegging: { materials: [
        { productId: "later", productName: "Later component", quantity: 5, onHand: 0, shortage: 5, requiredBy: "2026-10-12T09:00:00.000Z" },
        { productId: "earlier", productName: "Earlier component", quantity: 5, onHand: 0, shortage: 5, requiredBy: "2026-10-11T09:00:00.000Z" },
      ] } },
    ]);
    const rows = await getMaterialShortages("fixture-company");
    expect(rows.map(row => row.productId)).toEqual(["earlier", "later"]);
    expect(rows.every(row => row.requiredDate instanceof Date)).toBe(true);
    expect(mocks.suggestions).toHaveBeenCalledWith(expect.objectContaining({ where: { organisationId: "fixture-company", runId: "stored-run", status: "PENDING" } }));
  });
  const shortageRows = async (materials: { quantity: number; onHand: number; shortage: number }[], buyQuantity: number) => {
    mocks.latest.mockResolvedValue({ id: "stored-run", startedAt: new Date(), warnings: [], suggestions: [] });
    const due = new Date("2026-10-11T09:00:00Z");
    mocks.suggestions.mockResolvedValue([
      ...materials.map((material, i) => ({ id: `parent-${i}`, productId: `parent-${i}`, kind: "MAKE", product: { name: "Assembly" }, pegging: { materials: [{ ...material, productId: "component", productName: null, productCode: null, requiredBy: due.toISOString() }] } })),
      { id: "purchase", productId: "component", kind: "BUY", quantity: buyQuantity, neededBy: due, product: { name: "Canonical component", code: "PART" }, pegging: {} },
    ]);
    return getMaterialShortages("fixture-company");
  };
  it("counts a component requirement once when its BUY proposal covers the same shortage", async () => {
    const rows = await shortageRows([{ quantity: 10, onHand: 0, shortage: 10 }], 10);
    expect(rows).toMatchObject([{ productId: "component", productName: "Canonical component", productCode: "PART", requiredQuantity: 10, availableQuantity: 0, shortageQuantity: 10 }]);
  });
  it("nets shared component stock once across multiple parent makes", async () => {
    const rows = await shortageRows([{ quantity: 10, onHand: 3, shortage: 7 }, { quantity: 10, onHand: 3, shortage: 7 }], 17);
    expect(rows).toMatchObject([{ requiredQuantity: 20, availableQuantity: 3, shortageQuantity: 17 }]);
  });
  it("retains combined shortages when each parent separately appears covered", async () => {
    const rows = await shortageRows([{ quantity: 10, onHand: 12, shortage: 0 }, { quantity: 10, onHand: 12, shortage: 0 }], 8);
    expect(rows).toMatchObject([{ requiredQuantity: 20, availableQuantity: 12, shortageQuantity: 8, priority: "HIGH" }]);
  });
  it("retains independent direct demand in the component BUY total", async () => {
    const rows = await shortageRows([{ quantity: 10, onHand: 0, shortage: 10 }], 15);
    expect(rows).toMatchObject([{ requiredQuantity: 15, shortageQuantity: 15 }]);
  });
});
