import { describe, expect, it } from "vitest";
import { boughtParts, costToMake, cover, intermediates, rolledCost, standardUnitMinor, usedBy, type MakeDefinition } from "@/modules/products/domain/make";

const buy = (productId: string, purchaseMinor: number): MakeDefinition => ({ productId, supply: "BUY", batchQuantity: 1, yieldPercent: 100, purchaseMinor, lines: [], operations: [] });

describe("product recipes", () => {
  it("keeps confirmed orders and the plan as separate gaps", () => {
    expect(cover(4, 10, 7)).toEqual({ orderGap: 6, planGap: 3 });
    expect(cover(10, 4, 20)).toEqual({ orderGap: 0, planGap: 10 });
  });

  it("rolls a work-in-progress item into the finished cost and the bought parts", () => {
    const catalog = new Map<string, MakeDefinition>([
      ["board", buy("board", 200)],
      ["screw", buy("screw", 10)],
      ["frame", { productId: "frame", supply: "WIP", batchQuantity: 10, yieldPercent: 100, purchaseMinor: 0, lines: [{ componentId: "board", quantityPerUnit: 1, scrapPercent: 0 }], operations: [{ name: "Cut", setupMinutes: 60, runMinutesPerUnit: 6, crewSize: 1, machineMinorPerHour: 6000, labourMinorPerHour: 3000, logisticsMinorPerBatch: 0, machineIncludesLabour: false }] }],
      ["table", { productId: "table", supply: "MAKE", batchQuantity: 5, yieldPercent: 80, purchaseMinor: 0, lines: [{ componentId: "frame", quantityPerUnit: 1, scrapPercent: 0 }, { componentId: "screw", quantityPerUnit: 4, scrapPercent: 25 }], operations: [{ name: "Assemble", setupMinutes: 30, runMinutesPerUnit: 12, crewSize: 2, machineMinorPerHour: 0, labourMinorPerHour: 2000, logisticsMinorPerBatch: 500, machineIncludesLabour: false }] }],
    ]);
    // Frame: board 200 + setup 6000/10 + run 600 + labour (3000/10 + 300) = 200+600+600+300+300 = 2000.
    expect(standardUnitMinor("frame", catalog)).toBe(2000);
    // Table yield 80%: 1.25 frames and 4 * 1.25 * 1.25 screws. Setup shared by batch of 5.
    const unit = standardUnitMinor("table", catalog);
    expect(unit).toBeGreaterThan(2000);
    const two = costToMake("table", 2, catalog);
    expect(two.rows.some((row) => row.kind === "labour" && row.label.includes("Assemble"))).toBe(true);
    expect(two.totalMinor).toBeGreaterThan(unit * 2);
    const parts = boughtParts("table", 8, catalog);
    const board = parts.find((part) => part.componentId === "board");
    const screw = parts.find((part) => part.componentId === "screw");
    expect(board?.quantity).toBeCloseTo(10);
    expect(screw?.quantity).toBeCloseTo(50);
    expect(parts.some((part) => part.componentId === "frame")).toBe(false);
    expect(usedBy("frame", catalog)).toEqual(["table"]);
    const made = intermediates("table", 8, catalog);
    expect(made.find((row) => row.componentId === "frame")?.quantity).toBeCloseTo(10);
    const rolled = rolledCost("table", 8, catalog);
    expect(rolled.hours.run).toBeGreaterThan(0);
    expect(rolled.buckets.material).toBeGreaterThan(0);
  });

  it("does not charge labour again when the machine rate includes the operator", () => {
    const catalog = new Map<string, MakeDefinition>([["job", { productId: "job", supply: "MAKE", batchQuantity: 1, yieldPercent: 100, purchaseMinor: 0, lines: [], operations: [{ name: "Run", setupMinutes: 0, runMinutesPerUnit: 60, crewSize: 2, machineMinorPerHour: 1000, labourMinorPerHour: 5000, logisticsMinorPerBatch: 0, machineIncludesLabour: true }] }]]);
    expect(standardUnitMinor("job", catalog)).toBe(1000);
    expect(costToMake("job", 1, catalog).rows.some((row) => row.kind === "labour")).toBe(false);
    const withOverhead = new Map<string, MakeDefinition>([["job", { ...catalog.get("job")!, operations: [{ ...catalog.get("job")!.operations[0], overheadMinorPerHour: 400, machineIncludesOverhead: false }] }]]);
    expect(standardUnitMinor("job", withOverhead)).toBe(1400);
    expect(standardUnitMinor("job", new Map([["job", { ...withOverhead.get("job")!, operations: [{ ...withOverhead.get("job")!.operations[0], machineIncludesOverhead: true }] }]]))).toBe(1000);
  });

  it("adds a subcontract fee without buying the finished product twice", () => {
    const catalog = new Map<string, MakeDefinition>([
      ["cloth", buy("cloth", 300)],
      ["shirt", { productId: "shirt", supply: "SUBCONTRACT", batchQuantity: 1, yieldPercent: 100, purchaseMinor: 9000, subcontractMinorPerUnit: 500, lines: [{ componentId: "cloth", quantityPerUnit: 2, scrapPercent: 0 }], operations: [] }],
    ]);
    expect(standardUnitMinor("shirt", catalog)).toBe(1100);
    expect(rolledCost("shirt", 4, catalog).buckets.subcontract).toBe(2000);
    expect(rolledCost("shirt", 4, catalog).buckets.material).toBe(2400);
  });

  it("rejects a recipe that loops", () => {
    const catalog = new Map<string, MakeDefinition>([["b", { productId: "b", supply: "MAKE", batchQuantity: 1, yieldPercent: 100, purchaseMinor: 0, lines: [{ componentId: "a", quantityPerUnit: 1, scrapPercent: 0 }], operations: [] }]]);
    expect(() => standardUnitMinor("a", new Map([...catalog, ["a", { productId: "a", supply: "WIP", batchQuantity: 1, yieldPercent: 100, purchaseMinor: 0, lines: [{ componentId: "b", quantityPerUnit: 1, scrapPercent: 0 }], operations: [] }]]))).toThrow(/loops/);
  });
});
