import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ capabilities: new Set<string>() }));
vi.mock("@/core/auth/session", () => ({ requireSession: async () => ({ organisationId: "tenant", capabilities: state.capabilities }) }));
vi.mock("@/core/modules/runtime", () => ({ isModuleEnabled: async () => true }));
vi.mock("@/core/db/client", () => ({ db: { manufacturingSupplySuggestion: { findMany: async () => [
  { id: "pending", status: "PENDING", kind: "MAKE", product: { name: "Assembly", code: "FIN", unitOfMeasure: "each" } },
  { id: "firmed", status: "FIRMED", kind: "MAKE", product: { name: "Assembly", code: "FIN" }, quantity: 10, pegging: {}, resultingOrderId: "order" },
] } } }));
vi.mock("@/modules/manufacturing/services/mrp-queries", () => ({
  getLatestMrpRun: async () => ({ runId: "run", startedAt: new Date("2026-10-09"), warnings: [] }),
  plannedProposals: async () => [{ id: "pending", productId: "product", quantity: 10, requiredDate: new Date("2026-10-10"), pegging: [], cost: { material: 123456 }, materials: [], operations: [] }],
  readSuggestionDetail: () => ({ cost: { material: 654321 } }),
  buildPlannerCockpit: async () => ({ mrpRun: null, shortageCount: 0, overloadedResources: 0, lateOrders: 0, atRiskDemand: 0, requiringAction: 1, capacity: [], demand7: [], demand30: [], shortagesByPriority: { CRITICAL: [], HIGH: [], NORMAL: [] }, topBottlenecks: [],
    plan: [{ productId: "product", productName: "Assembly", productCode: "FIN", quantity: 10, machineHours: 1, crewHours: 1, totalCostMinor: 987654, neededBy: new Date("2026-10-10"), shortComponents: 0 }], shortages: [], netRequirements: [] }),
}));
vi.mock("@/app/(app)/manufacturing/planning/form-actions", () => ({ runMrpForm: vi.fn() }));
import PlannedOrders from "@/app/(app)/manufacturing/planning/planned-orders/page";
import Cockpit from "@/app/(app)/manufacturing/planning/page";
beforeEach(() => { state.capabilities = new Set(["manufacturing.plan.read"]); });
it("planning access retains operational proposals but redacts pending and actioned costs", async () => {
  const html = renderToStaticMarkup(await PlannedOrders());
  expect(html).toContain("Assembly"); expect(html).toContain("10");
  expect(html).toContain("Cost access is required");
  expect(html).not.toContain("£1,234.56"); expect(html).not.toContain("£6,543.21");
});
it("planning cockpit does not disclose cost cells with planning access alone", async () => {
  const html = renderToStaticMarkup(await Cockpit());
  expect(html).toContain("Assembly"); expect(html).not.toContain("£9,876.54"); expect(html).not.toContain(">Cost</th>");
});
it("independent cost access permits saved totals on both planning screens", async () => {
  state.capabilities.add("manufacturing.cost.read");
  const proposals = renderToStaticMarkup(await PlannedOrders());
  expect(proposals).toContain("£1,234.56"); expect(proposals).toContain("£6,543.21");
  expect(renderToStaticMarkup(await Cockpit())).toContain("£9,876.54");
});
