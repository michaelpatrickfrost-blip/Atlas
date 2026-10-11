import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { Session } from "@/core/auth/session";
const state = vi.hoisted(() => ({ orders: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: { financeDocument: { findMany: state.orders } } }));
vi.mock("@/core/modules/access", () => ({ assertModuleEnabled: vi.fn() }));
import { incomingSupplyProvider } from "@/modules/finance/services/incoming-supply";
const session = { userId: "buyer", organisationId: "tenant", capabilities: new Set(["finance.purchase.read"]) } as Session;
beforeEach(() => { vi.clearAllMocks(); vi.useFakeTimers(); vi.setSystemTime(new Date("2027-01-01T12:00:00Z")); });
afterEach(() => vi.useRealTimers());
const order = { id: "po", expectedReceiptAt: new Date("2027-01-12"), lines: [{ id: "line", productId: "p", quantity: "2.5" }], children: [{ lines: [{ sourceLineId: "line", quantity: "0.75", damagedQuantity: "0.25" }] }] };
it("subtracts received quantities including damage, so rejected goods are not promised as future receipts", async () => {
  state.orders.mockResolvedValue([order]);
  expect((await incomingSupplyProvider(session)).rows).toEqual([{ productId: "p", quantity: 1.75, availableDate: order.expectedReceiptAt, sourceId: "po" }]);
  const where = state.orders.mock.calls[0][0].where;
  expect(where.AND[0].organisationId).toBe("tenant");
  expect(where.AND[1]).toMatchObject({kind:"PO",status:{in:["APPROVED","PART_RECEIVED"]}});
});
it("excludes undated and overdue commitments with an explicit review warning", async () => {
  state.orders.mockResolvedValue([{...order,expectedReceiptAt:null},{...order,expectedReceiptAt:new Date("2026-12-31")}]);
  const result = await incomingSupplyProvider(session); expect(result.rows).toEqual([]);
  expect(result.warnings.join(" ")).toMatch(/no expected receipt date/); expect(result.warnings.join(" ")).toMatch(/overdue/);
});
it("checks purchasing access before querying confidential commitments", async () => {
  await expect(incomingSupplyProvider({...session,capabilities:new Set()})).rejects.toThrow("FORBIDDEN"); expect(state.orders).not.toHaveBeenCalled();
});
