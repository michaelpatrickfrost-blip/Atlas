import { describe, expect, it } from "vitest";
import { calculatedVolumeMl, measuresFromInput, shipLoad, sumLoads, unitsPerPallet } from "@/core/products/physical";

const box = measuresFromInput({ netKg: "1.25", grossKg: "1.4", lengthMm: "200", widthMm: "100", heightMm: "50", unitsPerPack: "10", packsPerLayer: "8", layersPerPallet: "5", originCountry: "gb", stackable: "yes" });

describe("product measures for logistics", () => {
  it("stores weight in grams and builds a pallet from pack, layer and height", () => {
    expect(box.netWeightGrams).toBe(1250);
    expect(box.grossWeightGrams).toBe(1400);
    expect(box.originCountry).toBe("GB");
    expect(calculatedVolumeMl(box)).toBe(1000);
    const load = shipLoad(box, 100);
    expect(load.grossGrams).toBe(140_000);
    expect(load.volumeMl).toBe(100_000);
    expect(load.packs).toBe(10);
    expect(load.pallets).toBe(1);
  });

  it("keeps an entered volume when the shape is not a plain box", () => {
    const bottle = measuresFromInput({ lengthMm: "80", widthMm: "80", heightMm: "250", volumeLitres: "0.75" });
    expect(calculatedVolumeMl(bottle)).toBe(1600);
    expect(shipLoad(bottle, 4).volumeMl).toBe(3000);
  });

  it("does not invent a total when one part has no weight", () => {
    const empty = measuresFromInput({});
    const total = sumLoads([{ ...box, quantity: 2 }, { ...empty, quantity: 3 }]);
    expect(total.grossGrams).toBeNull();
    expect(total.netGrams).toBeNull();
  });

  it("stores a pallet quantity when the layer breakdown is unknown", () => {
    const pallet = measuresFromInput({ itemsPerPallet: "48" });
    expect(unitsPerPallet(pallet)).toBe(48);
    const mixed = measuresFromInput({ unitsPerPack: "12", itemsPerPallet: "48" });
    expect(unitsPerPallet(mixed)).toBe(48);
    expect(mixed.packsPerLayer).toBe(4);
  });

  it("rejects a gross weight below the product itself", () => {
    expect(() => measuresFromInput({ netKg: "2", grossKg: "1" })).toThrow(/Gross weight/);
  });
});
