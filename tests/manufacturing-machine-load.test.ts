import { expect, it } from "vitest";
import { machineLoadPlan, type LoadMember } from "@/modules/manufacturing/domain/machine-load";
const machine = { id: "machine", loadCapacity: 1000, loadUnit: "kg", processProfiles: ["A"] };
const member = (id: string, quantity: number, loadPerUnit: number): LoadMember => ({ id, quantity, loadPerUnit, processProfile: "A", loadUnit: "kg", timingMode: "BATCH", cycleMinutes: 120, coolingMinutes: 30, setupMinutes: 10, eligibleResourceIds: ["machine"], resourceId: "machine" });
it("combines different SKUs into one full cycle by their actual capacity footprints", () => {
  const plan = machineLoadPlan(machine, [member("pipes", 100, 2), member("fittings", 50, 1.5)]);
  expect(plan).toMatchObject({ occupiedCapacity: 275, durationMinutes: 160, unit: "kg" });
  expect(plan.weights).toEqual([{ id: "pipes", quantity: 200 }, { id: "fittings", quantity: 75 }]);
});
it("converts a tonnes footprint into the machine’s kg capacity", () => {
  expect(machineLoadPlan(machine, [member("a", 10, 2), { ...member("b", 10, 0.001), loadUnit: "t" }]).occupiedCapacity).toBe(30);
});
it.each([
  { processProfile: "B" }, { cycleMinutes: 121 }, { coolingMinutes: 31 }, { eligibleResourceIds: ["other"] }, { loadUnit: "l" }, { timingMode: "PER_UNIT" }, { loadPerUnit: null },
])("rejects incompatible process, machine, timing or capacity units: %j", changes => {
  expect(() => machineLoadPlan(machine, [member("a", 10, 2), { ...member("b", 10, 2), ...changes }])).toThrow();
});
it("refuses overcapacity and duplicate work orders", () => {
  expect(() => machineLoadPlan(machine, [member("a", 400, 2), member("b", 101, 2)])).toThrow(/hold|capacity/);
  expect(() => machineLoadPlan(machine, [member("same", 10, 2), member("same", 10, 2)])).toThrow(/different/);
});
