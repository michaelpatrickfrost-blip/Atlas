import { beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({
  session: {
    organisationId: "company",
    userId: "user",
    capabilities: new Set<string>(),
  },
  enabled: vi.fn(),
  models: Object.fromEntries(
    [
      "qualityHold",
      "nonConformance",
      "nonConformanceAction",
      "qualityInspection",
      "maintenanceEquipment",
      "maintenanceWorkOrder",
      "fleetVehicle",
      "inventoryBalance",
      "stockPosition",
    ].map((name) => [
      name,
      { findMany: vi.fn(), count: vi.fn(), groupBy: vi.fn() },
    ]),
  ),
}));
vi.mock("@/core/auth/session", () => ({
  requireSession: async () => m.session,
}));
vi.mock("@/core/modules/access", () => ({ assertModuleEnabled: m.enabled }));
vi.mock("@/core/modules/runtime", () => ({
  enabledModulesForSession: async () => new Set(["maintenance", "fleet"]),
}));
vi.mock("@/core/db/client", () => ({ db: m.models }));
vi.mock("@/core/shared/operational-forms", () => ({ members: async () => [] }));
import { qualityToday } from "@/modules/quality/services/queries";
import { maintenanceRegister } from "@/modules/maintenance/services/queries";
import { stockBusinessPlanning } from "@/modules/stock/services/business-planning";
import type { Session } from "@/core/auth/session";
beforeEach(() => {
  vi.clearAllMocks();
  m.enabled.mockResolvedValue(undefined);
  m.session.capabilities = new Set();
  for (const model of Object.values(m.models)) {
    model.findMany.mockResolvedValue([]);
    model.count.mockResolvedValue(73);
    model.groupBy.mockResolvedValue([]);
  }
});
it("Quality attention separates completion due dates from effectiveness reviews and counts beyond the page", async () => {
  m.session.capabilities = new Set([
    "quality.today.read",
    "quality.hold.read",
    "quality.ncr.read",
  ]);
  const data = await qualityToday();
  expect(data.holdCount).toBe(73);
  expect(data.dueCount).toBe(73);
  expect(data.activeHolds).toHaveLength(0);
  const where = m.models.nonConformanceAction.findMany.mock.calls[0][0].where;
  expect(where.organisationId).toBe("company");
  expect(where.OR).toEqual([
    {
      status: { in: ["OPEN", "INEFFECTIVE"] },
      dueDate: { lte: expect.any(Date) },
    },
    { status: "DONE", effectivenessReviewDate: { lte: expect.any(Date) } },
  ]);
  expect(m.models.nonConformanceAction.count).toHaveBeenCalledWith({ where });
});
it("Quality home never reads independent holds or NCRs without their capability", async () => {
  m.session.capabilities.add("quality.today.read");
  const data = await qualityToday();
  expect(data.holdCount).toBe(0);
  expect(data.ncrCount).toBe(0);
  expect(m.models.qualityHold.findMany).not.toHaveBeenCalled();
  expect(m.models.nonConformance.count).not.toHaveBeenCalled();
  expect(m.models.qualityInspection.findMany).not.toHaveBeenCalled();
});
it("Maintenance searches and pages older work while keeping vehicle identities behind Fleet access", async () => {
  m.session.capabilities.add("maintenance.work.read");
  const data = await maintenanceRegister({
    q: "Mixer",
    page: "2",
    status: "overdue",
    mine: "1",
  });
  expect(data.count).toBe(73);
  const query = m.models.maintenanceWorkOrder.findMany.mock.calls[0][0];
  expect(query.skip).toBe(100);
  expect(query.take).toBe(50);
  expect(query.where.AND).toEqual(
    expect.arrayContaining([
      { organisationId: "company", vehicleId: null },
      { assigneeUserId: "user" },
    ]),
  );
  expect(JSON.stringify(query.where)).not.toContain("registration");
  expect(query.include.vehicle).toBeUndefined();
  expect(m.models.fleetVehicle.findMany).not.toHaveBeenCalled();
  m.session.capabilities.add("fleet.vehicle.read");
  await maintenanceRegister({ q: "VEH-1" });
  expect(
    JSON.stringify(
      m.models.maintenanceWorkOrder.findMany.mock.calls[1][0].where,
    ),
  ).toContain("registration");
  expect(m.models.fleetVehicle.findMany).toHaveBeenCalledOnce();
});
it("Planning stock excludes held production and transit, without counting a Quality hold twice", async () => {
  m.models.inventoryBalance.groupBy.mockResolvedValue([
    { productId: "product", _sum: { quantity: 30 } },
  ]);
  m.models.qualityHold.groupBy.mockResolvedValue([
    { productId: "product", _sum: { quantity: 4 } },
  ]);
  m.models.stockPosition.groupBy.mockResolvedValue([
    { productId: "product", status: "QUARANTINE", _sum: { quantity: 4 } },
    { productId: "product", status: "BLOCKED", _sum: { quantity: 10 } },
    { productId: "product", status: "IN_TRANSIT", _sum: { quantity: 2 } },
  ]);
  const result = await stockBusinessPlanning(
    { ...m.session, capabilities: new Set(["stock.read"]) } as Session,
    {
      purpose: "forecast",
      startsOn: "2026-10-01",
      endsOn: "2027-09-30",
      historyStartsOn: "2025-10-01",
      productIds: ["product"],
    },
  );
  expect(result.stock).toEqual([{ productId: "product", quantity: 14 }]);
  for (const model of ["inventoryBalance", "qualityHold", "stockPosition"])
    expect(m.models[model].groupBy.mock.calls[0][0].where.organisationId).toBe(
      "company",
    );
});
