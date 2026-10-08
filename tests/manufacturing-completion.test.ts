import { beforeEach, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ saved: { used: 0, made: 0, completed: false }, failMaterial: false, failReceipt: false, unfinished: 0, later: 0, inventoryEnabled: true, conflict: false, provider: {} as Record<string, unknown>, session: { organisationId: "tenant", userId: "operator", capabilities: new Set(["manufacturing.work_order.execute"]) } }));
vi.mock("@/core/auth/session", () => ({ requireSession: async () => state.session }));
vi.mock("@/core/modules/registry", () => ({ getModule: () => ({ stockProvider: state.provider }) }));
vi.mock("@/core/modules/runtime", () => ({ getEnabledModuleIds: async () => new Set(state.inventoryEnabled ? ["stock"] : []) }));
vi.mock("@/core/stock/replenishment", () => ({ stockReplenished: vi.fn() }));
vi.mock("@/core/audit/log", () => ({ writeAudit: vi.fn() }));
vi.mock("@/core/activity/log", () => ({ writeActivity: vi.fn() }));
vi.mock("@/core/db/client", () => {
  const client = (saved: typeof state.saved) => ({
    saved,
    manufacturingWorkOrder: {
      findFirst: async () => ({ id: "step", productionOrderId: "order", sequence: 1, version: 1, status: saved.completed ? "COMPLETE" : "RUNNING", producedQuantity: saved.completed ? 2 : 0, scrapQuantity: 0, lastRequestKey: saved.completed ? "request" : null }),
      count: async (query: { where: { sequence?: unknown } }) => query.where.sequence ? state.later : state.unfinished, aggregate: async () => ({ _sum: { scrapQuantity: 0 } }),
      updateMany: async () => { if (state.conflict) return { count: 0 }; saved.completed = true; return { count: 1 }; },
    },
    manufacturingOrder: {
      findFirst: async () => ({ id: "order", orderNumber: "MO-1", productId: "finished", definitionId: "bom", warehouseId: "warehouse", quantity: 2, version: 1, status: "RUNNING" }),
      findFirstOrThrow: async () => ({ id: "order", orderNumber: "MO-1", productId: "finished", definitionId: "bom", warehouseId: "warehouse", quantity: 2, version: 1, status: "RUNNING" }),
      updateMany: async () => ({ count: 1 }),
    },
    warehouse: { findFirst: async () => ({ id: "warehouse" }), findFirstOrThrow: async () => ({ id: "warehouse" }) },
    productBomLine: { findMany: async () => [{ id: "first", componentProductId: "first", quantityPerUnit: 1, scrapPercent: 0 }, { id: "second", componentProductId: "second", quantityPerUnit: 1, scrapPercent: 0 }] },
    auditEntry: { create: vi.fn() }, activity: { create: vi.fn() },
  });
  return { db: new Proxy({}, { get(_target, key) {
    if (key === "$transaction") return async (work: (tx: ReturnType<typeof client>) => Promise<unknown>) => { const pending = { ...state.saved }; const result = await work(client(pending)); state.saved = pending; return result; };
    return client(state.saved)[key as keyof ReturnType<typeof client>];
  } }) };
});
import { completeWorkOrder } from "@/modules/manufacturing/services/commands";
beforeEach(() => {
  state.saved = { used: 0, made: 0, completed: false }; state.failMaterial = false; state.failReceipt = false; state.unfinished = 0; state.later = 0; state.inventoryEnabled = true; state.conflict = false;
  state.provider = {
    shipStock: async (_actor: unknown, command: { productId: string; quantity: number }, tx?: { saved: typeof state.saved }) => { if (state.failMaterial && command.productId === "second") throw new Error("Second material is short"); (tx?.saved ?? state.saved).used += command.quantity; },
    receiveStock: async (_actor: unknown, command: { quantity: number }, tx?: { saved: typeof state.saved }) => { if (state.failReceipt) throw new Error("Output receipt refused"); (tx?.saved ?? state.saved).made += command.quantity; },
  };
});
it("rolls all earlier material issues back if a later material is short", async () => {
  state.failMaterial = true; await expect(completeWorkOrder("step", 2, 0, "request")).rejects.toThrow("Second material");
  expect(state.saved).toEqual({ used: 0, made: 0, completed: false });
});
it("rolls stock back if the work-order version conflicts", async () => {
  state.conflict = true; await expect(completeWorkOrder("step", 2, 0, "request")).rejects.toThrow(/changed|updated/);
  expect(state.saved).toEqual({ used: 0, made: 0, completed: false });
});
it("commits materials, output and completion once, including a retry", async () => {
  await completeWorkOrder("step", 2, 0, "request"); await completeWorkOrder("step", 2, 0, "request");
  expect(state.saved).toEqual({ used: 4, made: 2, completed: true });
});
it.each([NaN, Infinity, -1, 1.5])("rejects invalid stock quantities before any issue: %s", async quantity => {
  await expect(completeWorkOrder("step", quantity, 0, "request")).rejects.toThrow();
  expect(state.saved).toEqual({ used: 0, made: 0, completed: false });
});
it("rejects output above the production quantity without consuming stock", async () => {
  await expect(completeWorkOrder("step", 3, 0, "request")).rejects.toThrow(/quantity|planned/i);
  expect(state.saved).toEqual({ used: 0, made: 0, completed: false });
});
it("does not silently accept changed quantities under a completed request key", async () => {
  await completeWorkOrder("step", 2, 0, "request"); await expect(completeWorkOrder("step", 1, 0, "request")).rejects.toThrow(/request|quantity/i);
  expect(state.saved).toEqual({ used: 4, made: 2, completed: true });
});

it("rolls material issues and progress back if the finished-goods receipt fails", async () => {
  state.failReceipt = true; await expect(completeWorkOrder("step", 2, 0, "request")).rejects.toThrow("Output receipt");
  expect(state.saved).toEqual({ used: 0, made: 0, completed: false });
});
it("refuses final output until the other routing steps are complete", async () => {
  state.unfinished = 1; await expect(completeWorkOrder("step", 2, 0, "request")).rejects.toThrow("other routing steps");
  expect(state.saved).toEqual({ used: 0, made: 0, completed: false });
});
it("does not book stock when the Inventory app is disabled", async () => {
  state.inventoryEnabled = false; await expect(completeWorkOrder("step", 2, 0, "request")).rejects.toThrow("Inventory app");
  expect(state.saved).toEqual({ used: 0, made: 0, completed: false });
});
it("completes an intermediate routing step without booking finished goods", async () => {
  state.later = 1; await completeWorkOrder("step", 2, 0, "request");
  expect(state.saved).toEqual({ used: 0, made: 0, completed: true });
});
