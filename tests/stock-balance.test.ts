import { describe, expect, it } from "vitest";
import { coverWaitingStock, type WaitingBalance } from "@/modules/logistics/domain/stock-balance";

const waiting = (overrides: Partial<WaitingBalance> = {}): WaitingBalance => ({
  id: "a",
  open: 10,
  allocated: 0,
  shipped: 0,
  onPick: 0,
  partialAllowed: false,
  short: true,
  promisedAt: 1,
  placedAt: 1,
  ...overrides,
});

describe("stock balance", () => {
  it("keeps a complete order waiting until the shortfall is covered", () => {
    expect(coverWaitingStock(4, [waiting()])).toEqual([]);
    expect(coverWaitingStock(10, [waiting()])).toEqual([{ id: "a", deliver: 10, reserve: 10 }]);
  });

  it("delivers what has come back when a partial delivery is allowed", () => {
    expect(coverWaitingStock(4, [waiting({ partialAllowed: true })])).toEqual([{ id: "a", deliver: 4, reserve: 4 }]);
  });

  it("finishes a balance that is reserved but not yet delivered", () => {
    expect(coverWaitingStock(0, [waiting({ allocated: 10 })])).toEqual([{ id: "a", deliver: 10, reserve: 0 }]);
  });

  it("does not deliver stock the warehouse has already allocated", () => {
    expect(coverWaitingStock(0, [waiting({ allocated: 4, open: 10, partialAllowed: true })])).toEqual([]);
  });

  it("leaves an in-stock order with the warehouse", () => {
    expect(coverWaitingStock(0, [waiting({ allocated: 10, short: false, partialAllowed: true })])).toEqual([]);
  });

  it("serves the earliest promised order first", () => {
    const later = waiting({ id: "b", open: 5, partialAllowed: true, promisedAt: 2 });
    const earlier = waiting({ id: "a", open: 5, partialAllowed: true, promisedAt: 1, placedAt: 9 });
    expect(coverWaitingStock(5, [later, earlier]).map((row) => row.id)).toEqual(["a"]);
  });

  it("does not split a complete order that is already on a pick", () => {
    expect(coverWaitingStock(5, [waiting({ allocated: 5, onPick: 5 })])).toEqual([]);
  });

  it("raises the balance that just arrived while a pick is still open", () => {
    expect(coverWaitingStock(5, [waiting({ allocated: 5, onPick: 5, partialAllowed: true })])).toEqual([{ id: "a", deliver: 5, reserve: 5 }]);
  });

  it("covers what is still outstanding after an earlier delivery", () => {
    expect(coverWaitingStock(5, [waiting({ open: 5, allocated: 5, shipped: 5, partialAllowed: true })])).toEqual([{ id: "a", deliver: 5, reserve: 5 }]);
  });
});
