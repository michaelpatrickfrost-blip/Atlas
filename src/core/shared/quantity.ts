/** Stock quantities use a shared base unit and six decimal places. Money and
 * package/serial counts have separate rules. Reject excess precision rather
 * than silently inventing a different physical quantity. */
export const QUANTITY_SCALE = 1_000_000;
export function validQuantity(value: number, max = 1_000_000_000) {
  if (!Number.isFinite(value) || value < 0 || value > max) return false;
  const scaled = value * QUANTITY_SCALE;
  return Number.isSafeInteger(Math.round(scaled)) && Number(value.toFixed(6)) === value;
}
export function quantity(value: number, label = "Quantity", positive = true, max = 1_000_000_000) {
  if (!validQuantity(value, max) || positive && value === 0) throw new Error(`${label} must be ${positive ? "positive" : "zero or positive"}, with at most six decimal places.`);
  return value;
}
export function addQuantity(...values: number[]) {
  const total = values.reduce((sum,value) => {
    if (!Number.isFinite(value) || !Number.isSafeInteger(Math.round(value * QUANTITY_SCALE))) throw new Error("Quantity exceeds exact arithmetic limits.");
    return sum + BigInt(Math.round(value * QUANTITY_SCALE));
  },0n);
  if(total>BigInt(Number.MAX_SAFE_INTEGER)||total<BigInt(Number.MIN_SAFE_INTEGER))throw new Error("Quantity total exceeds exact arithmetic limits.");
  return Number(total) / QUANTITY_SCALE;
}
export function roundedQuantity(value: number) {
  return Math.round(value * QUANTITY_SCALE) / QUANTITY_SCALE;
}
export function formatQuantity(value: number) {
  return value.toLocaleString("en-GB", { maximumFractionDigits: 6 });
}
