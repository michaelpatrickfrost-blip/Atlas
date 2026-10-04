import { describe, expect, it } from "vitest";
import { assertDrawFits, openCommitment } from "../src/modules/sales/domain/call-off";

const lines = [{ key: "sp1", committed: 100 }, { key: "ri1", committed: 40 }];

describe("call-off commitment", () => {
  it("reduces remaining by live call-offs and releases a cancelled order when it is omitted", () => {
    const open = openCommitment(lines, [
      { key: "sp1", quantity: 30, orderId: "draft" },
      { key: "sp1", quantity: 20, orderId: "confirmed" },
    ]);
    expect(open.find((line) => line.key === "sp1")).toMatchObject({ released: 50, remaining: 50 });
    expect(open.find((line) => line.key === "ri1")?.remaining).toBe(40);
  });

  it("ignores the order being edited so a draft can keep its own quantity", () => {
    const open = openCommitment(lines, [{ key: "sp1", quantity: 80, orderId: "draft" }], "draft");
    expect(open[0].remaining).toBe(100);
    expect(() => assertDrawFits(lines, [{ key: "sp1", quantity: 80, orderId: "other" }], [{ key: "sp1", quantity: 30, label: "Pipe" }], "draft")).toThrow(/Only 20 remains on Pipe/);
  });

  it("rejects a product that is not on the agreement and a second draw of the same line", () => {
    expect(() => assertDrawFits(lines, [], [{ key: "missing", quantity: 1 }])).toThrow(/not on the call-off agreement/);
    expect(() => assertDrawFits(lines, [], [{ key: "sp1", quantity: 1 }, { key: "sp1", quantity: 1 }])).toThrow(/once on an order/);
  });
});
