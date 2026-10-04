import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { chosenCourierColumns, courierTable, nestDecision, packQuantity, palletLimit, palletLoad, palletSpaces } from "@/modules/logistics/domain/handling";
import { allocationStatus, assessOtif, dispatchMovesToDelivery, explainShortage, holdLabel, matchCarrier, normalisedTracking, orderLots, overReceiptDecision, quantityDecision, releaseDecision, replenishmentNeed, shortageText, verifyScan, warehouseSteps, weightVariance } from "@/modules/logistics/domain/operations";
import { stockProvider } from "@/modules/stock/services/provider";

describe("logistics decisions", () => {
  it("separates commercial commitment from a physical short", () => {
    expect(allocationStatus({ required: 200, allocated: 0, blocked: false, pickableRemaining: 50 })).toBe("UNALLOCATED");
    expect(allocationStatus({ required: 200, allocated: 160, blocked: false, pickableRemaining: 10 })).toBe("PART_ALLOCATED");
    expect(allocationStatus({ required: 200, allocated: 160, blocked: false, pickableRemaining: 0 })).toBe("SHORT");
    expect(allocationStatus({ required: 200, allocated: 200, blocked: false, pickableRemaining: 0 })).toBe("ALLOCATED");
    expect(allocationStatus({ required: 200, allocated: 200, blocked: true, pickableRemaining: 0 })).toBe("BLOCKED");
  });

  it("explains a shortage instead of saying insufficient stock", () => {
    const view = explainShortage({ required: 200, allocated: 160, availableNow: 160, reservedElsewhere: 420, incoming: [{ quantity: 100, when: "Monday" }] });
    expect(view.short).toBe(40);
    expect(shortageText(view).join("\n")).toContain("40 units short");
    expect(shortageText(view).join("\n")).toContain("100 · Monday");
    expect(view.actions).toContain("Wait for incoming stock");
    expect(shortageText(view).join(" ")).not.toContain("Insufficient stock");
  });

  it("keeps credit holds free of financial amounts", () => {
    expect(holdLabel("CREDIT")).toBe("Credit hold");
    expect(releaseDecision(["Credit hold"]).message).toBe("Blocked\n\nCredit hold");
    expect(releaseDecision(["Credit hold"]).message).not.toMatch(/£|\d/);
  });

  it("stops a wrong scan", () => {
    const result = verifyScan({ phase: "product", expected: "CP1/1", scanned: "CP2/1" });
    expect(result).toEqual({ ok: false, title: "Wrong item", expected: "CP1/1", scanned: "CP2/1" });
  });

  it("supports short picks and forbids over-picks until allowed", () => {
    expect(quantityDecision({ required: 20, scanned: 18, policy: "PROHIBITED" }).outcome).toBe("short");
    expect(quantityDecision({ required: 20, scanned: 22, policy: "PROHIBITED" }).allowed).toBe(false);
    expect(quantityDecision({ required: 20, scanned: 22, policy: "ALLOWED" }).allowed).toBe(true);
  });

  it("keeps delivery separate until the company asks dispatch to record it", () => {
    expect(dispatchMovesToDelivery(false)).toBe(false);
    expect(dispatchMovesToDelivery(true)).toBe(true);
  });

  it("uses one workflow with three warehouse modes", () => {
    expect(warehouseSteps("SIMPLE")).toEqual(["Pick", "Ship"]);
    expect(warehouseSteps("STANDARD")).toEqual(["Pick", "Pack", "Ship"]);
    expect(warehouseSteps("ADVANCED")).toContain("Wave");
  });

  it("picks the earliest expiry first", () => {
    const ordered = orderLots("FEFO", [
      { code: "L2", expiresOn: "2026-12-01", quantity: 5, sequence: 1 },
      { code: "L1", expiresOn: "2026-10-01", quantity: 5, sequence: 2 },
    ]);
    expect(ordered[0]?.code).toBe("L1");
  });

  it("explains the carrier it chose", () => {
    const choice = matchCarrier([{ name: "Light parcels", priority: 1, explanation: "Orders under 20 kg use DPD", carrierCode: "DPD", serviceLevel: "NEXT_DAY", match: { maxWeightGrams: 20000 } }], { weightGrams: 8000, customerId: "c", region: null, pallet: false });
    expect(choice).toMatchObject({ carrierCode: "DPD", explanation: "Orders under 20 kg use DPD" });
  });

  it("does not invent on-time when no promise exists", () => {
    const result = assessOtif({ promisedOn: null, deliveredAt: new Date(), ordered: 10, delivered: 10, fullPercent: 100 });
    expect(result.onTime).toBeNull();
    expect(result.inFull).toBe(true);
    expect(result.otif).toBeNull();
  });

  it("normalises carrier codes and flags weight, replenishment and over-receipt", () => {
    expect(normalisedTracking("out for delivery")).toBe("Out for delivery");
    expect(weightVariance(12800, 14200)?.review).toBe(true);
    expect(replenishmentNeed({ pickFace: 8, required: 20, bulk: 160 })).toEqual({ quantity: 12, from: "Bulk", to: "Pick face" });
    expect(overReceiptDecision({ expected: 100, received: 110, tolerancePercent: 5, mode: "TOLERANCE" }).accepted).toBe(false);
  });

  it("packs only what was picked and nests cartons onto a pallet", () => {
    expect(packQuantity({ picked: 8, packed: 3, requested: 6 })).toEqual({ ok: false, message: "Only 5 can still be packed." });
    expect(packQuantity({ picked: 8, packed: 3, requested: 5 })).toEqual({ ok: true, quantity: 5 });
    expect(nestDecision({ parentCanContain: false, parentStatus: "PACKED", sameOrder: true }).ok).toBe(false);
    expect(nestDecision({ parentCanContain: true, parentStatus: "PACKED", sameOrder: true })).toEqual({ ok: true });
    expect(palletSpaces([{ typeCode: "PALLET", packageType: "PALLET", parentId: null }, { typeCode: "CARTON", packageType: "CARTON", parentId: "pal" }])).toBe(1);
    expect(palletLoad(100, 48)).toEqual({ full: 2, loose: 4, perPallet: 48 });
    expect(palletLimit("PALLET", 60, 48).ok).toBe(false);
    expect(palletLimit("CARTON", 60, 48)).toEqual({ ok: true });
  });

  it("keeps a courier file to the columns that were chosen", () => {
    const table = courierTable([{ customer: "Northbridge", customerPo: "PO-19", item: "Gully", quantity: 4, lengthMm: 1200, tracking: "HIDE" }], ["customer", "customerPo", "item", "quantity", "lengthMm"]);
    expect(table[0]).toEqual(["Customer", "Customer PO", "Item", "Quantity", "Length mm"]);
    expect(table[1]).toEqual(["Northbridge", "PO-19", "Gully", 4, 1200]);
    expect(chosenCourierColumns(["tracking", "not-a-column"])).toEqual(["tracking"]);
  });

  it("depends on the stock contract rather than stock internals", () => {
    expect(Object.keys(stockProvider).sort()).toEqual(["executeMovement", "getAvailability", "getLocations", "getLots", "getReservations", "getSerials", "receiveStock", "releaseReservation", "reportDiscrepancy", "requestReservation", "returnStock", "shipStock"]);
    const source = ["demand.ts", "work.ts", "shipping.ts", "inbound.ts", "returns.ts"].map((file) => readFileSync(`src/modules/logistics/services/${file}`, "utf8")).join("\n");
    expect(source).not.toContain("@/modules/stock/");
    expect(source).not.toContain("@/modules/finance/");
    expect(source).not.toContain("@/modules/sales/services");
  });
});
