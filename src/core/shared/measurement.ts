import { validQuantity } from "./quantity";

const UNITS = [
  { id: "each", dimension: "count", factor: 1n, label: "Each", aliases: ["ea", "unit", "units", "pcs", "piece", "pieces"] },
  { id: "mg", dimension: "mass", factor: 1n, label: "Milligrams", aliases: ["milligram", "milligrams"] },
  { id: "g", dimension: "mass", factor: 1_000n, label: "Grams", aliases: ["gram", "grams"] },
  { id: "kg", dimension: "mass", factor: 1_000_000n, label: "Kilograms", aliases: ["kilogram", "kilograms", "kgs"] },
  { id: "t", dimension: "mass", factor: 1_000_000_000n, label: "Tonnes", aliases: ["tonne", "tonnes", "metric ton", "metric tons"] },
  { id: "mm", dimension: "length", factor: 1n, label: "Millimetres", aliases: ["millimetre", "millimetres"] },
  { id: "cm", dimension: "length", factor: 10n, label: "Centimetres", aliases: ["centimetre", "centimetres"] },
  { id: "m", dimension: "length", factor: 1_000n, label: "Metres", aliases: ["metre", "metres"] },
  { id: "ml", dimension: "volume", factor: 1n, label: "Millilitres", aliases: ["millilitre", "millilitres"] },
  { id: "l", dimension: "volume", factor: 1_000n, label: "Litres", aliases: ["litre", "litres"] },
] as const;
const unit = (value: string) => UNITS.find(row => row.id === value.trim().toLowerCase() || (row.aliases as readonly string[]).includes(value.trim().toLowerCase()));

export function compatibleUnits(base: string) {
  const found = unit(base);
  return found ? [{ id: base, label: `${found.label} (${base})` }, ...UNITS.filter(row => row.dimension === found.dimension && row.id !== found.id).map(row => ({ id: row.id, label: `${row.label} (${row.id})` }))] : [{ id: base, label: base }];
}
export function sameUnit(a: string, b: string) {
  return unit(a)?.id ? unit(a)?.id === unit(b)?.id : a.trim().toLowerCase() === b.trim().toLowerCase();
}
export function scaledQuantity(value: number | string) {
  const number = Number(value);
  if (!validQuantity(number)) throw new Error("Use a non-negative quantity with at most six decimal places.");
  return BigInt(Math.round(number * 1_000_000));
}
export function decimalQuantity(value: bigint) {
  const sign = value < 0n ? "-" : "", absolute = value < 0n ? -value : value;
  return `${sign}${absolute / 1_000_000n}.${String(absolute % 1_000_000n).padStart(6, "0")}`;
}

/** Convert once to the product's stock unit. Dimension and precision must agree;
 * never infer a density, package size, short ton or manufacturing yield. */
export function measuredQuantity(value: number | string, enteredUnit: string, baseUnit: string) {
  const entered = scaledQuantity(value), from = unit(enteredUnit), to = unit(baseUnit);
  if (!sameUnit(enteredUnit, baseUnit) && (!from || !to || from.dimension !== to.dimension)) throw new Error(`Cannot convert ${enteredUnit} to ${baseUnit}. Choose a compatible unit.`);
  const numerator = from?.factor ?? 1n, denominator = to?.factor ?? 1n;
  const converted = entered * numerator;
  if (converted % denominator !== 0n) throw new Error(`This quantity is smaller than the precision of ${baseUnit}. Use a finer stock unit for this product.`);
  const base = converted / denominator;
  if (base > 1_000_000_000_000_000n) throw new Error("The converted stock quantity is too large.");
  const factor = numerator * 1_000_000_000_000n / denominator;
  return { quantity: Number(base) / 1_000_000, baseQuantity: decimalQuantity(base), enteredQuantity: decimalQuantity(entered), enteredUnit, baseUnit,
    conversionFactor: `${factor / 1_000_000_000_000n}.${String(factor % 1_000_000_000_000n).padStart(12, "0")}` };
}

/** Sum exact scaled requirements before any stock-precision rounding. */
export function componentQuantity(output: number, perUnit: number, scrapPercent: number, yieldPercent = 100) {
  const q = scaledQuantity(output), rate = scaledQuantity(perUnit);
  if (!Number.isFinite(scrapPercent) || scrapPercent < 0 || scrapPercent > 100) throw new Error("Scrap must be between zero and 100 percent.");
  const scrap = BigInt(Math.round(scrapPercent * 10_000));
  if (!Number.isFinite(yieldPercent) || yieldPercent <= 0 || yieldPercent > 100) throw new Error("Yield must be greater than zero and at most 100 percent.");
  const yieldRate = BigInt(Math.round(yieldPercent * 10_000));
  if (yieldRate <= 0n) throw new Error("Yield must be at least 0.0001 percent.");
  const denominator = 1_000_000n * 1_000_000n * yieldRate;
  const numerator = q * rate * (1_000_000n + scrap) * 1_000_000n;
  // Requirements round upwards only to one millionth of the stock unit; actual
  // measured movements are never rounded or rounded to whole units.
  return Number((numerator + denominator - 1n) / denominator) / 1_000_000;
}

export function quantityCostMinor(quantity: number, minorPerPriceUnit: bigint, priceQuantity: number = 1) {
  const numerator = scaledQuantity(quantity) * minorPerPriceUnit, denominator = scaledQuantity(priceQuantity);
  if (denominator <= 0n || minorPerPriceUnit < 0n) throw new Error("Enter a valid price and price quantity.");
  return (numerator + denominator / 2n) / denominator;
}
