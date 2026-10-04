/** Shipping facts stored on the shared product. Weights are grams, sizes millimetres, volume millilitres. */
export type ProductMeasures = {
  netWeightGrams: number | null;
  grossWeightGrams: number | null;
  lengthMm: number | null;
  widthMm: number | null;
  heightMm: number | null;
  volumeMl: number | null;
  unitsPerPack: number | null;
  packsPerLayer: number | null;
  layersPerPallet: number | null;
  stackable: boolean | null;
  originCountry: string | null;
  commodityCode: string | null;
  customsDescription: string | null;
  hazardClass: string | null;
  unNumber: string | null;
};

export type ShipLoad = {
  netGrams: number | null;
  grossGrams: number | null;
  volumeMl: number | null;
  packs: number | null;
  pallets: number | null;
};

const blank = (): ProductMeasures => ({
  netWeightGrams: null, grossWeightGrams: null, lengthMm: null, widthMm: null, heightMm: null, volumeMl: null,
  unitsPerPack: null, packsPerLayer: null, layersPerPallet: null, stackable: null,
  originCountry: null, commodityCode: null, customsDescription: null, hazardClass: null, unNumber: null,
});

function optionalNumber(value: unknown, label: string, scale: number, maximum: number) {
  if (value == null || String(value).trim() === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > maximum) throw new Error(`${label} must be between 0 and ${maximum.toLocaleString("en-GB")}.`);
  return Math.round(parsed * scale);
}

function text(value: unknown, maximum: number) {
  const cleaned = String(value ?? "").trim().slice(0, maximum);
  return cleaned || null;
}

export function measuresFromInput(input: {
  netKg?: unknown; grossKg?: unknown; lengthMm?: unknown; widthMm?: unknown; heightMm?: unknown; volumeLitres?: unknown;
  unitsPerPack?: unknown; packsPerLayer?: unknown; layersPerPallet?: unknown; itemsPerPallet?: unknown; stackable?: unknown;
  originCountry?: unknown; commodityCode?: unknown; customsDescription?: unknown; hazardClass?: unknown; unNumber?: unknown;
}): ProductMeasures {
  const measures: ProductMeasures = {
    ...blank(),
    netWeightGrams: optionalNumber(input.netKg, "Net weight", 1000, 100_000),
    grossWeightGrams: optionalNumber(input.grossKg, "Gross weight", 1000, 100_000),
    lengthMm: optionalNumber(input.lengthMm, "Length", 1, 20_000),
    widthMm: optionalNumber(input.widthMm, "Width", 1, 20_000),
    heightMm: optionalNumber(input.heightMm, "Height", 1, 20_000),
    volumeMl: optionalNumber(input.volumeLitres, "Volume", 1000, 100_000),
    unitsPerPack: optionalNumber(input.unitsPerPack, "Units per pack", 1, 100_000),
    packsPerLayer: optionalNumber(input.packsPerLayer, "Packs per layer", 1, 10_000),
    layersPerPallet: optionalNumber(input.layersPerPallet, "Layers per pallet", 1, 100),
    originCountry: text(input.originCountry, 2)?.toUpperCase() ?? null,
    commodityCode: text(input.commodityCode, 20)?.toUpperCase() ?? null,
    customsDescription: text(input.customsDescription, 240),
    hazardClass: text(input.hazardClass, 40),
    unNumber: text(input.unNumber, 8)?.toUpperCase().replace(/^UN/, "") ?? null,
  };
  const stack = String(input.stackable ?? "").trim().toLowerCase();
  measures.stackable = stack === "yes" ? true : stack === "no" ? false : null;
  if (measures.originCountry && !/^[A-Z]{2}$/.test(measures.originCountry)) throw new Error("Country of origin is a two-letter code, such as GB.");
  if (measures.commodityCode && !/^[A-Z0-9.]{4,20}$/.test(measures.commodityCode)) throw new Error("Commodity code uses letters, numbers and dots.");
  if (measures.unNumber && !/^\d{4}$/.test(measures.unNumber)) throw new Error("UN number is four digits.");
  if (measures.unNumber) measures.unNumber = `UN${measures.unNumber}`;
  if (measures.grossWeightGrams != null && measures.netWeightGrams != null && measures.grossWeightGrams < measures.netWeightGrams) throw new Error("Gross weight includes the pack, so it cannot be below the net weight.");
  const sides = [measures.lengthMm, measures.widthMm, measures.heightMm].filter((side) => side != null);
  if (sides.length > 0 && sides.length < 3) throw new Error("Enter length, width and height together.");
  if (sides.some((side) => side === 0)) throw new Error("Size must be greater than zero.");
  if ([measures.unitsPerPack, measures.packsPerLayer, measures.layersPerPallet].some((value) => value === 0)) throw new Error("Pack quantities must be at least 1.");
  const directPallet = optionalNumber(input.itemsPerPallet, "Items on a pallet", 1, 1_000_000);
  const breakdown = measures.unitsPerPack != null && measures.packsPerLayer != null && measures.layersPerPallet != null;
  if (!breakdown && directPallet) {
    if (measures.unitsPerPack && directPallet % measures.unitsPerPack !== 0) throw new Error("Items on a pallet must be a whole number of packs.");
    if (measures.unitsPerPack) measures.packsPerLayer = directPallet / measures.unitsPerPack;
    else measures.unitsPerPack = directPallet;
    measures.packsPerLayer ??= 1;
    measures.layersPerPallet ??= 1;
  }
  return measures;
}

/** Cubic size when all three sides are known. One millilitre is 1,000 cubic millimetres. */
export function calculatedVolumeMl(measures: Pick<ProductMeasures, "lengthMm" | "widthMm" | "heightMm">) {
  if (!(measures.lengthMm && measures.widthMm && measures.heightMm)) return null;
  return Math.round(measures.lengthMm * measures.widthMm * measures.heightMm / 1000);
}

export function eachVolumeMl(measures: Pick<ProductMeasures, "lengthMm" | "widthMm" | "heightMm" | "volumeMl">) {
  return measures.volumeMl ?? calculatedVolumeMl(measures);
}

export function unitsPerPallet(measures: Pick<ProductMeasures, "unitsPerPack" | "packsPerLayer" | "layersPerPallet">) {
  if (!(measures.unitsPerPack && measures.packsPerLayer && measures.layersPerPallet)) return null;
  return measures.unitsPerPack * measures.packsPerLayer * measures.layersPerPallet;
}

/** Weight, volume and pallet count for a quantity of this product. Missing facts stay blank rather than being guessed. */
export function shipLoad(measures: ProductMeasures, quantity: number): ShipLoad {
  if (!(quantity > 0)) return { netGrams: null, grossGrams: null, volumeMl: null, packs: null, pallets: null };
  const perPallet = unitsPerPallet(measures);
  const volume = eachVolumeMl(measures);
  return {
    netGrams: measures.netWeightGrams == null ? null : measures.netWeightGrams * quantity,
    grossGrams: measures.grossWeightGrams == null ? null : measures.grossWeightGrams * quantity,
    volumeMl: volume == null ? null : volume * quantity,
    packs: measures.unitsPerPack ? Math.ceil(quantity / measures.unitsPerPack) : null,
    pallets: perPallet ? Math.ceil(quantity / perPallet) : null,
  };
}

/** Adds loads. A missing weight or volume on any line leaves that total blank. */
export function sumLoads(rows: Array<ProductMeasures & { quantity: number }>): ShipLoad {
  const totals = { netGrams: 0, grossGrams: 0, volumeMl: 0, packs: 0, pallets: 0 };
  const known = { netGrams: true, grossGrams: true, volumeMl: true, packs: true, pallets: true };
  if (!rows.length) return { netGrams: null, grossGrams: null, volumeMl: null, packs: null, pallets: null };
  for (const row of rows) {
    const load = shipLoad(row, row.quantity);
    for (const key of Object.keys(totals) as Array<keyof typeof totals>) {
      if (load[key] == null) known[key] = false;
      else totals[key] += load[key];
    }
  }
  return {
    netGrams: known.netGrams ? totals.netGrams : null,
    grossGrams: known.grossGrams ? totals.grossGrams : null,
    volumeMl: known.volumeMl ? totals.volumeMl : null,
    packs: known.packs ? totals.packs : null,
    pallets: known.pallets ? totals.pallets : null,
  };
}
