import { describe, expect, it } from "vitest";
import { MrpEngine } from "@/modules/manufacturing/domain/mrp-engine";
import { DemandSource, DemandType, type MrpInput } from "@/modules/manufacturing/domain/mrp-types";
const date = (day: number) => new Date(Date.UTC(2027, 0, day));
const input = (): MrpInput => ({ demand: [3, 12].map((day, index) => ({ id: `d${index}`, demandType: DemandType.FIRM, source: DemandSource.SALES_ORDER, productId: "p", quantity: 0.3, requiredDate: date(day), sourceId: "sales" })), inventory: new Map(), recipes: new Map(), prices: new Map([["p", 100]]), existingSupply: new Map(), leadTimes: new Map(), safetyStock: new Map(), names: new Map(), datedSupply: [{ productId: "p", quantity: 0.3, availableDate: date(10), sourceId: "approved-po" }] });
describe("dated material supply", () => {
  it("cannot cover early demand with a late purchase and uses its remaining arrival once", () => {
    const result = new MrpEngine(input()).run();
    expect(result.plannedOrders.map(row => [row.quantity, row.requiredDate.getUTCDate()])).toEqual([[0.3, 3]]);
  });
  it("counts a receipt on its requirement day and preserves fractional netting", () => {
    const data = input(); data.datedSupply![0].availableDate = date(3); data.datedSupply![0].quantity = 0.4;
    expect(new MrpEngine(data).run().plannedOrders.map(row => row.quantity)).toEqual([0.2]);
  });
  it("explodes a fractional BOM exactly and nets the component without a floating-point costing rejection", () => {
    const data = input(); data.demand = [{...data.demand[0],productId:'finished',quantity:10.5}]; data.datedSupply=[];
    data.recipes.set('finished',{productId:'finished',definitionId:'recipe',version:1,supply:'MAKE',batchQuantity:0,yieldPercent:100,subcontractMinorPerUnit:0,components:[{componentProductId:'p',quantityPerUnit:1.23456,scrapPercent:0,position:1}],operations:[]});
    data.inventory.set('p',{productId:'p',onHand:5,available:5,allocated:0,qualityHeld:0,safetyStock:0});
    const result = new MrpEngine(data).run();
    expect(result.plannedOrders.find(row=>row.productId==='p')?.quantity).toBe(7.96288);
    expect(result.plannedOrders.find(row=>row.productId==='finished')?.materials?.[0].quantity).toBe(12.96288);
    expect(result.plannedOrders.find(row=>row.productId==='finished')?.plannedCost).toBe(1296);
  });
  it("retains supply review warnings on the saved plan result", () => {
    const data = input(); data.supplyWarnings = ["Confirm overdue supplier receipt dates."];
    expect(new MrpEngine(data).run().warnings).toContain(data.supplyWarnings[0]);
  });
});
