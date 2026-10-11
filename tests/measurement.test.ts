import { expect, it } from "vitest";
import { addQuantity, quantity, validQuantity } from "@/core/shared/quantity";
import { measuredQuantity, componentQuantity, quantityCostMinor, compatibleUnits } from "@/core/shared/measurement";
import { commercialLineNet } from "@/modules/sales/domain/uk-sale";

it("converts metric weights with an immutable factor and explicit base unit", () => {
  expect(measuredQuantity("1.25", "tonnes", "kg")).toEqual({ quantity: 1250, baseQuantity: "1250.000000", enteredQuantity: "1.250000", enteredUnit: "tonnes", baseUnit: "kg", conversionFactor: "1000.000000000000" });
  expect(measuredQuantity(1250, "kg", "t").quantity).toBe(1.25);
  expect(measuredQuantity(0.001, "kg", "g").quantity).toBe(1);
  expect(measuredQuantity(0.000001, "t", "kg").quantity).toBe(0.001);
});
it("refuses invented density, pack-size and ambiguous ton conversions", () => {
  expect(() => measuredQuantity(10, "kg", "l")).toThrow(/Cannot convert/);
  expect(() => measuredQuantity(10, "each", "kg")).toThrow(/Cannot convert/);
  expect(() => measuredQuantity(1, "ton", "kg")).toThrow(/Cannot convert/);
  expect(() => measuredQuantity(1, "box", "each")).toThrow(/Cannot convert/);
  expect(measuredQuantity(2.5, "box", "box").quantity).toBe(2.5);
});
it("keeps stock precision explicit instead of silently rounding a measurement", () => {
  expect(() => measuredQuantity(0.000001, "g", "t")).toThrow(/precision/);
  expect(() => quantity(1.0000001)).toThrow(/six decimal/);
  expect(validQuantity(1.000001)).toBe(true);
  expect(validQuantity(NaN)).toBe(false);
  expect(addQuantity(0.1, 0.2, -0.3)).toBe(0);
});
it("handles length, volume and existing unit aliases without losing selections", () => {
  expect(measuredQuantity(1500, "mm", "m").quantity).toBe(1.5);
  expect(measuredQuantity(1.25, "l", "ml").quantity).toBe(1250);
  expect(compatibleUnits("kilograms")[0].id).toBe("kilograms");
});
it("uses base-unit BOM requirements and rounds only at stock precision", () => {
  const line = measuredQuantity(0.0025, "t", "kg");
  expect(componentQuantity(10.5, line.quantity, 2.5)).toBe(26.90625);
  expect(componentQuantity(0.000001, 0.000001, 0)).toBe(0.000001);
  expect(componentQuantity(0.1, 0.2, 0)).toBe(0.02);
});
it("calculates money once from exact weight and a price quantity", () => {
  expect(quantityCostMinor(10.5, 2000n, 1000)).toBe(21n);
  expect(quantityCostMinor(0.1, 15n)).toBe(2n);
  expect(commercialLineNet(15, 0.1, 0)).toBe(2);
  expect(commercialLineNet(12345, 1.25, 10)).toBe(13888);
});

it('keeps fractional BOM quantities and yield precise before stock and money rounding',()=>{
 expect(componentQuantity(10.5,1.23456,0)).toBe(12.96288);
 expect(componentQuantity(10.5,1.23456,0,80)).toBe(16.2036);
});
