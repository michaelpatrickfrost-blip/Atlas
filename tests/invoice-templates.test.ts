import { describe, expect, it } from "vitest";
import { buildProformaFacts, exportReadyMessage, formatKg, formatVolume, normaliseBlocks, presetBlocks, readExportHeader } from "@/modules/sales/domain/invoice-templates";
import type { ProductMeasures } from "@/core/products/physical";

const measures = (patch: Partial<ProductMeasures> = {}): ProductMeasures => ({
  netWeightGrams: 2500, grossWeightGrams: 2800, lengthMm: 400, widthMm: 300, heightMm: 200, volumeMl: 24000,
  unitsPerPack: 10, packsPerLayer: null, layersPerPallet: null, stackable: null, originCountry: "GB", commodityCode: "7308.90",
  customsDescription: null, hazardClass: null, unNumber: null, ...patch,
});

const line = (patch: Partial<ProductMeasures> | null = {}) => ({
  type: "PRODUCT", description: "Frame", code: "FR-1", quantity: 4, unitAmount: 1000, netAmount: 4000,
  measures: patch === null ? null : measures(patch),
});

describe("invoice templates and export proforma", () => {
  it("keeps a domestic invoice to the address and commercial details", () => {
    expect(normaliseBlocks("DOMESTIC", ["deliveryAddress", "unknown", "customerPo"])).toEqual(["invoiceAddress", "deliveryAddress", "customerPo"]);
  });

  it("always asks an export template for weight, volume and customs facts", () => {
    const blocks = normaliseBlocks("EXPORT", ["notifyParty"]);
    expect(blocks).toEqual(expect.arrayContaining(["netWeight", "grossWeight", "volume", "commodityCode", "countryOfOrigin", "incoterms", "notifyParty"]));
    expect(presetBlocks("EXPORT")).toContain("volume");
  });

  it("multiplies product weight and volume by the quantity sold", () => {
    const facts = buildProformaFacts({
      blocks: presetBlocks("EXPORT"),
      lines: [line(), { type: "NOTE", description: "Handle upright", code: null, quantity: 1, unitAmount: 0, netAmount: 0, measures: null }],
      header: readExportHeader({ incoterms: "fob", namedPlace: "Felixstowe", portOfLoading: "Felixstowe", portOfDischarge: "Rotterdam", packageCount: "2", packageType: "Pallets", shippingMarks: "NB / 1", reasonForExport: "Sale", buyerEori: "DE123456789", buyerVat: "DE123" }),
      destinationCountry: "DE", invoiceAddress: { line1: "Buyer" }, deliveryAddress: { line1: "Warehouse", country: "DE" }, sellerEori: "GB123456789000",
    });
    expect(facts.lines).toHaveLength(1);
    expect(facts.totals).toMatchObject({ netGrams: 10000, grossGrams: 11200, volumeMl: 96000 });
    expect(facts.missing).toEqual([]);
    expect(formatKg(facts.totals.netGrams)).toBe("10.000 kg");
    expect(formatVolume(facts.totals.volumeMl)).toContain("m³");
  });

  it("names the missing export facts instead of inventing them", () => {
    const facts = buildProformaFacts({
      blocks: presetBlocks("EXPORT"), lines: [line({ volumeMl: null, lengthMm: null, widthMm: null, heightMm: null, commodityCode: null })],
      header: readExportHeader({}), destinationCountry: null, invoiceAddress: null, deliveryAddress: null, sellerEori: null,
    });
    expect(facts.totals.volumeMl).toBeNull();
    expect(exportReadyMessage(facts.missing)).toContain("volume for FR-1");
    expect(facts.missing).toEqual(expect.arrayContaining(["commodity code for FR-1", "invoice address", "Incoterms", "exporter EORI"]));
  });

  it("rejects an Incoterms code that is not in the rule list", () => {
    expect(() => readExportHeader({ incoterms: "DOOR" })).toThrow("Incoterms");
  });
});
