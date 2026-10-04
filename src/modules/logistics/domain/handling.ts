/** Handling units and courier files. No database access. */

export const DEFAULT_HANDLING_TYPES = [
  { code: "PALLET", name: "Pallet", lengthMm: 1200, widthMm: 1000, heightMm: 150, tareWeightGrams: 25000, canContain: true },
  { code: "CARTON", name: "Carton", lengthMm: 400, widthMm: 300, heightMm: 300, tareWeightGrams: 200, canContain: false },
  { code: "BOX", name: "Box", lengthMm: 300, widthMm: 200, heightMm: 200, tareWeightGrams: 150, canContain: false },
  { code: "CRATE", name: "Crate", lengthMm: 600, widthMm: 400, heightMm: 400, tareWeightGrams: 2000, canContain: true },
  { code: "STILLAGE", name: "Stillage", lengthMm: 1200, widthMm: 1000, heightMm: 800, tareWeightGrams: 35000, canContain: true },
  { code: "IBC", name: "IBC", lengthMm: 1200, widthMm: 1000, heightMm: 1160, tareWeightGrams: 60000, canContain: false },
  { code: "ROLL_CAGE", name: "Roll cage", lengthMm: 800, widthMm: 700, heightMm: 1800, tareWeightGrams: 30000, canContain: true },
  { code: "CONTAINER", name: "Container", lengthMm: 6058, widthMm: 2438, heightMm: 2591, tareWeightGrams: 2300000, canContain: true },
] as const;

const PALLET_CODES = new Set(["PALLET", "STILLAGE", "ROLL_CAGE", "CONTAINER"]);

export function packQuantity(input: { picked: number; packed: number; requested: number }): { ok: true; quantity: number } | { ok: false; message: string } {
  if (!Number.isSafeInteger(input.requested) || input.requested <= 0) return { ok: false, message: "Enter the quantity to pack." };
  const open = input.picked - input.packed;
  if (input.requested > open) return { ok: false, message: `Only ${Math.max(0, open)} can still be packed.` };
  return { ok: true, quantity: input.requested };
}

export function nestDecision(input: { parentCanContain: boolean; parentStatus: string; sameOrder: boolean }): { ok: true } | { ok: false; message: string } {
  if (!input.sameOrder) return { ok: false, message: "That handling unit belongs to another order." };
  if (!input.parentCanContain) return { ok: false, message: "That handling unit cannot hold other units. Choose a pallet, crate, stillage, roll cage or container." };
  if (["LOADED", "IN_TRANSIT", "DELIVERED"].includes(input.parentStatus)) return { ok: false, message: "That handling unit has already left the pack bench." };
  return { ok: true };
}

export function palletSpaces(units: Array<{ typeCode: string | null; packageType: string; parentId: string | null }>): number {
  return units.filter((unit) => !unit.parentId && PALLET_CODES.has(unit.typeCode ?? unit.packageType)).length;
}

export const COURIER_COLUMNS = [
  ["shipment", "Shipment"],
  ["customer", "Customer"],
  ["customerPo", "Customer PO"],
  ["order", "Sales order"],
  ["deliveryDate", "Delivery date"],
  ["address1", "Address"],
  ["address2", "Address line 2"],
  ["city", "City"],
  ["region", "County"],
  ["postcode", "Postcode"],
  ["country", "Country"],
  ["instructions", "Delivery instructions"],
  ["itemCode", "SKU"],
  ["item", "Item"],
  ["quantity", "Quantity"],
  ["itemsPerPallet", "Items per pallet"],
  ["unit", "Unit"],
  ["handlingUnit", "Handling unit"],
  ["handlingType", "Handling unit type"],
  ["parentUnit", "Parent handling unit"],
  ["lengthMm", "Length mm"],
  ["widthMm", "Width mm"],
  ["heightMm", "Height mm"],
  ["weightKg", "Weight kg"],
  ["carrier", "Carrier"],
  ["service", "Service"],
  ["tracking", "Tracking"],
] as const;

export const DEFAULT_COURIER_COLUMNS = ["customer", "customerPo", "deliveryDate", "address1", "city", "postcode", "country", "itemCode", "item", "quantity", "itemsPerPallet", "handlingUnit", "handlingType", "lengthMm", "widthMm", "heightMm", "weightKg", "carrier", "tracking"];

export function palletLoad(quantity: number, itemsPerPallet: number | null): { full: number; loose: number; perPallet: number | null } {
  if (!itemsPerPallet || itemsPerPallet < 1) return { full: 0, loose: quantity, perPallet: null };
  return { full: Math.floor(quantity / itemsPerPallet), loose: quantity % itemsPerPallet, perPallet: itemsPerPallet };
}

export function palletLimit(typeCode: string, quantity: number, itemsPerPallet: number | null): { ok: true } | { ok: false; message: string } {
  if (typeCode !== "PALLET" || !itemsPerPallet || quantity <= itemsPerPallet) return { ok: true };
  return { ok: false, message: `This SKU packs ${itemsPerPallet} to a pallet. Split the rest onto another pallet.` };
}

const COURIER_LABELS = Object.fromEntries(COURIER_COLUMNS);

export function chosenCourierColumns(raw: string[]): string[] {
  const known = new Set(COURIER_COLUMNS.map(([key]) => key));
  const chosen = raw.filter((key) => known.has(key as typeof COURIER_COLUMNS[number][0]));
  return chosen.length ? chosen : [...DEFAULT_COURIER_COLUMNS];
}

export function courierTable(records: Array<Record<string, string | number>>, columns: string[]): Array<Array<string | number>> {
  const chosen = chosenCourierColumns(columns);
  return [chosen.map((key) => COURIER_LABELS[key] ?? key), ...records.map((record) => chosen.map((key) => record[key] ?? ""))];
}

export function addressPart(snapshot: unknown, key: "line1" | "line2" | "city" | "region" | "postcode" | "country"): string {
  if (!snapshot || typeof snapshot !== "object") return "";
  const value = (snapshot as Record<string, unknown>)[key];
  return typeof value === "string" ? value.trim() : "";
}
