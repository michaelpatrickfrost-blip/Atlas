import { beforeEach, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ saved: { used: 0, made: 0, completed: false, produced: 0, scrap: 0, reports: [] as Array<{ fingerprint: string; requestKey: string }> }, fractional: false, failMaterial: false, failReceipt: false, unfinished: 0, later: 0, manufacturingEnabled: true, inventoryEnabled: true, conflict: false, provider: {} as Record<string, unknown>, session: { organisationId: "tenant", userId: "operator", capabilities: new Set(["manufacturing.work_order.execute"]) } }));
vi.mock("@/core/auth/session", () => ({ requireSession: async () => state.session }));
vi.mock("@/core/modules/access", () => ({ assertModuleEnabled: async () => { if (!state.manufacturingEnabled) throw new Error("Manufacturing app disabled"); } }));
vi.mock("@/core/modules/registry", () => ({ getModule: () => ({ stockProvider: state.provider }) }));
vi.mock("@/core/modules/runtime", () => ({ getEnabledModuleIds: async () => new Set(state.inventoryEnabled ? ["stock"] : []) }));
vi.mock("@/core/stock/replenishment", () => ({ stockReplenished: vi.fn() }));
vi.mock("@/core/audit/log", () => ({ writeAudit: vi.fn() }));
vi.mock("@/core/activity/log", () => ({ writeActivity: vi.fn() }));
vi.mock("@/core/db/client", () => {
  const client = (saved: typeof state.saved) => ({
    saved,
    manufacturingWorkOrder: {
      findFirst: async (query: { where: { sequence?: { lt?: number; gt?: number } } }) => query.where.sequence ? null : ({ id: "step", productionOrderId: "order", sequence: 1, version: 1, status: saved.completed ? "COMPLETE" : "RUNNING", producedQuantity: saved.produced, scrapQuantity: saved.scrap, lastRequestKey: saved.completed ? "request" : null }),
      count: async (query: { where: { sequence?: unknown } }) => query.where.sequence ? state.later : state.unfinished, aggregate: async () => ({ _sum: { scrapQuantity: 0 } }),
      updateMany: async (query: { data: { status: string; producedQuantity: number; scrapQuantity: number } }) => { if (state.conflict) return { count: 0 }; saved.completed = query.data.status === "COMPLETE"; saved.produced = query.data.producedQuantity; saved.scrap = query.data.scrapQuantity; return { count: 1 }; },
    },
    manufacturingProductionReport: { findUnique: async (query: { where: { organisationId_requestKey: { requestKey: string } } }) => saved.reports.find(row => row.requestKey === query.where.organisationId_requestKey.requestKey) ?? null, create: async (query: { data: { fingerprint: string; requestKey: string } }) => { saved.reports.push(query.data); return query.data; } },
    inventoryMovement: { groupBy: async () => saved.used ? [{ productId: "first", _sum: { delta: -saved.used / 2 } }, { productId: "second", _sum: { delta: -saved.used / 2 } }] : [] },
    manufacturingOrder: {
      findFirst: async () => ({ id: "order", orderNumber: "MO-1", productId: "finished", definitionId: "bom", warehouseId: "warehouse", unitOfMeasure: "each", quantity: 2, version: 1, status: "RUNNING" }),
      findFirstOrThrow: async () => ({ id: "order", orderNumber: "MO-1", productId: "finished", definitionId: "bom", warehouseId: "warehouse", unitOfMeasure: "each", quantity: 2, version: 1, status: "RUNNING" }),
      updateMany: async () => ({ count: 1 }),
    },
    warehouse: { findFirst: async () => ({ id: "warehouse" }), findFirstOrThrow: async () => ({ id: "warehouse" }) },
    productBomLine: { findMany: async () => [{ id: "first", componentProductId: "first", quantityPerUnit: state.fractional ? 0.25 : 1, scrapPercent: 0 }, { id: "second", componentProductId: "second", quantityPerUnit: 1, scrapPercent: 0 }] },
    auditEntry: { create: vi.fn() }, activity: { create: vi.fn() },
  });
  return { db: new Proxy({}, { get(_target, key) {
    if (key === "$transaction") return async (work: (tx: ReturnType<typeof client>) => Promise<unknown>) => { const pending = { ...state.saved, reports: [...state.saved.reports] }; const result = await work(client(pending)); state.saved = pending; return result; };
    return client(state.saved)[key as keyof ReturnType<typeof client>];
  } }) };
});
import { completeWorkOrder } from "@/modules/manufacturing/services/commands";
beforeEach(() => {
  state.saved = { used: 0, made: 0, completed: false, produced: 0, scrap: 0, reports: [] as Array<{ fingerprint: string; requestKey: string }> }; state.fractional = false; state.failMaterial = false; state.failReceipt = false; state.unfinished = 0; state.later = 0; state.manufacturingEnabled = true; state.inventoryEnabled = true; state.conflict = false;
  state.provider = {
    shipStock: async (_actor: unknown, command: { productId: string; quantity: number }, tx?: { saved: typeof state.saved }) => { if (state.failMaterial && command.productId === "second") throw new Error("Second material is short"); (tx?.saved ?? state.saved).used += command.quantity; return { movementIds: [command.productId], replayed: false }; },
    stageProduction: async (_actor: unknown, command: { quantity: number }, tx?: { saved: typeof state.saved }) => { if (state.failReceipt) throw new Error("Output receipt refused"); (tx?.saved ?? state.saved).made += command.quantity; return { movementIds: ["output"], replayed: false }; },
  };
});
it("rolls all earlier material issues back if a later material is short", async () => {
  state.failMaterial = true; await expect(completeWorkOrder("step", 2, 0, "request")).rejects.toThrow("Second material");
  expect(state.saved).toMatchObject({ used: 0, made: 0, completed: false });
});
it("rolls stock back if the work-order version conflicts", async () => {
  state.conflict = true; await expect(completeWorkOrder("step", 2, 0, "request")).rejects.toThrow(/changed|updated/);
  expect(state.saved).toMatchObject({ used: 0, made: 0, completed: false });
});
it("commits materials, output and completion once, including a retry", async () => {
  await completeWorkOrder("step", 2, 0, "request"); await completeWorkOrder("step", 2, 0, "request");
  expect(state.saved).toMatchObject({ used: 4, made: 2, completed: true });
});
it.each([NaN, Infinity, -1, 1.0000001])("rejects invalid stock quantities before any issue: %s", async quantity => {
  await expect(completeWorkOrder("step", quantity, 0, "request")).rejects.toThrow();
  expect(state.saved).toMatchObject({ used: 0, made: 0, completed: false });
});
it("rejects output above the production quantity without consuming stock", async () => {
  await expect(completeWorkOrder("step", 3, 0, "request")).rejects.toThrow(/quantity|planned/i);
  expect(state.saved).toMatchObject({ used: 0, made: 0, completed: false });
});
it("does not silently accept changed quantities under a completed request key", async () => {
  await completeWorkOrder("step", 2, 0, "request"); await expect(completeWorkOrder("step", 1, 0, "request")).rejects.toThrow(/request|quantity|reference/i);
  expect(state.saved).toMatchObject({ used: 4, made: 2, completed: true });
});

it("rolls material issues and progress back if the finished-goods receipt fails", async () => {
  state.failReceipt = true; await expect(completeWorkOrder("step", 2, 0, "request")).rejects.toThrow("Output receipt");
  expect(state.saved).toMatchObject({ used: 0, made: 0, completed: false });
});
it("refuses final output until the other routing steps are complete", async () => {
  state.unfinished = 1; await expect(completeWorkOrder("step", 2, 0, "request")).rejects.toThrow("other routing steps");
  expect(state.saved).toMatchObject({ used: 0, made: 0, completed: false });
});
it("does not book stock when the Inventory app is disabled", async () => {
  state.inventoryEnabled = false; await expect(completeWorkOrder("step", 2, 0, "request")).rejects.toThrow("Inventory app");
  expect(state.saved).toMatchObject({ used: 0, made: 0, completed: false });
});
it("completes an intermediate routing step without booking finished goods", async () => {
  state.later = 1; await completeWorkOrder("step", 2, 0, "request");
  expect(state.saved).toMatchObject({ used: 0, made: 0, completed: true });
});

it("books fractional material consumption without rounding it into whole stock", async () => {
  state.fractional = true; await completeWorkOrder("step", 2, 0, "request");
  expect(state.saved).toMatchObject({ used: 2.5, made: 2, completed: true });
});

it("refuses direct completion when Manufacturing is disabled", async () => {
  state.manufacturingEnabled = false; await expect(completeWorkOrder("step", 2, 0, "request")).rejects.toThrow("disabled");
  expect(state.saved).toMatchObject({ used: 0, made: 0, completed: false });
});

it("reports partial output twice and replays the first report after the second without consuming twice", async () => {
 await completeWorkOrder("step", 1, 0, "partial-1", { finish: false });
 expect(state.saved).toMatchObject({ made: 1, used: 2, completed: false });
 await completeWorkOrder("step", 1, 0, "partial-2");
 await completeWorkOrder("step", 1, 0, "partial-1", { finish: false });
 expect(state.saved).toMatchObject({ made: 2, used: 4, completed: true });
 expect(state.saved.reports).toHaveLength(2);
 await expect(completeWorkOrder("step", 0.5, 0, "partial-1", { finish: false })).rejects.toThrow(/different/);
});
it("requires a reason before closing an operation short", async () => {
 await expect(completeWorkOrder("step", 1, 0, "short")).rejects.toThrow(/reason/);
 expect(state.saved.made).toBe(0);
 await completeWorkOrder("step", 1, 0, "short", { shortCloseReason: "Remaining pieces damaged before loading" });
 expect(state.saved).toMatchObject({ made: 1, used: 2, completed: true });
});
