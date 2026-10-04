import { shipLoad, type ProductMeasures } from "@/core/products/physical";

/** What a customer invoice or export proforma can print. Export sales raise the proforma with the sale. */
export const INVOICE_BLOCKS = [
  { key: "invoiceAddress", label: "Invoice address", group: "Addresses" },
  { key: "deliveryAddress", label: "Delivery / consignee address", group: "Addresses" },
  { key: "notifyParty", label: "Notify party", group: "Addresses" },
  { key: "customerPo", label: "Customer purchase order", group: "Commercial" },
  { key: "paymentTerms", label: "Payment terms", group: "Commercial" },
  { key: "incoterms", label: "Incoterms and named place", group: "Export" },
  { key: "countryOfDestination", label: "Country of destination", group: "Export" },
  { key: "countryOfOrigin", label: "Country of origin", group: "Export" },
  { key: "commodityCode", label: "Commodity code", group: "Export" },
  { key: "netWeight", label: "Net weight", group: "Export" },
  { key: "grossWeight", label: "Gross weight", group: "Export" },
  { key: "volume", label: "Volume", group: "Export" },
  { key: "packages", label: "Packages and packing", group: "Export" },
  { key: "marks", label: "Shipping marks and numbers", group: "Export" },
  { key: "ports", label: "Port of loading and discharge", group: "Export" },
  { key: "exporterIdentity", label: "Exporter name, address and EORI", group: "Export" },
  { key: "buyerIdentity", label: "Buyer VAT and EORI", group: "Export" },
  { key: "reasonForExport", label: "Reason for export", group: "Export" },
] as const;

export type InvoiceBlock = (typeof INVOICE_BLOCKS)[number]["key"];
export type InvoiceTemplateKind = "DOMESTIC" | "EXPORT";

export const INCOTERMS = ["EXW", "FCA", "CPT", "CIP", "DAP", "DPU", "DDP", "FAS", "FOB", "CFR", "CIF"] as const;

/** Customs and the customer expect these on an export proforma. A domestic invoice does not. */
export const EXPORT_REQUIRED: InvoiceBlock[] = [
  "invoiceAddress", "deliveryAddress", "incoterms", "countryOfDestination", "countryOfOrigin",
  "commodityCode", "netWeight", "grossWeight", "volume", "exporterIdentity",
];

export const PROFORMA_STATEMENT = "Proforma invoice. This is not a tax invoice. It is raised with the sale for export, payment and the customer's records.";

export function presetBlocks(kind: InvoiceTemplateKind): InvoiceBlock[] {
  if (kind === "DOMESTIC") return ["invoiceAddress", "deliveryAddress", "customerPo", "paymentTerms"];
  return INVOICE_BLOCKS.map((block) => block.key);
}

export function normaliseBlocks(kind: InvoiceTemplateKind, requested: string[]): InvoiceBlock[] {
  const known = new Set<string>(INVOICE_BLOCKS.map((block) => block.key));
  const chosen = requested.filter((key): key is InvoiceBlock => known.has(key));
  const required = kind === "EXPORT" ? EXPORT_REQUIRED : (["invoiceAddress"] as InvoiceBlock[]);
  const merged = new Set<InvoiceBlock>([...required, ...chosen]);
  return INVOICE_BLOCKS.map((block) => block.key).filter((key) => merged.has(key));
}

export function blockGroups() {
  return (["Addresses", "Commercial", "Export"] as const).map((group) => ({
    group,
    blocks: INVOICE_BLOCKS.filter((block) => block.group === group),
  }));
}

export function hasBlock(blocks: readonly string[], key: InvoiceBlock) {
  return blocks.includes(key);
}

export type ExportHeader = {
  incoterms: string | null;
  namedPlace: string | null;
  portOfLoading: string | null;
  portOfDischarge: string | null;
  packageCount: number | null;
  packageType: string | null;
  marks: string | null;
  reasonForExport: string | null;
  buyerEori: string | null;
  buyerVat: string | null;
};

export function readExportHeader(input: Record<string, unknown>): ExportHeader {
  const text = (key: string, max: number) => {
    const value = String(input[key] ?? "").trim().slice(0, max);
    return value || null;
  };
  const incoterms = text("incoterms", 3)?.toUpperCase() ?? null;
  if (incoterms && !INCOTERMS.includes(incoterms as (typeof INCOTERMS)[number])) throw new Error("Choose an Incoterms rule.");
  const countRaw = String(input.packageCount ?? "").trim();
  let packageCount: number | null = null;
  if (countRaw) {
    const count = Number(countRaw);
    if (!Number.isInteger(count) || count < 1 || count > 100000) throw new Error("Package count must be a whole number.");
    packageCount = count;
  }
  const buyerEori = text("buyerEori", 20)?.toUpperCase().replace(/\s+/g, "") ?? null;
  if (buyerEori && !/^[A-Z0-9]{4,20}$/.test(buyerEori)) throw new Error("Buyer EORI uses letters and numbers.");
  return {
    incoterms,
    namedPlace: text("namedPlace", 120),
    portOfLoading: text("portOfLoading", 120),
    portOfDischarge: text("portOfDischarge", 120),
    packageCount,
    packageType: text("packageType", 40),
    marks: text("shippingMarks", 500),
    reasonForExport: text("reasonForExport", 240),
    buyerEori,
    buyerVat: text("buyerVat", 40)?.toUpperCase().replace(/\s+/g, "") ?? null,
  };
}

export type ProformaLine = {
  description: string;
  code: string | null;
  quantity: number;
  unitAmount: number;
  netAmount: number;
  originCountry: string | null;
  commodityCode: string | null;
  netGrams: number | null;
  grossGrams: number | null;
  volumeMl: number | null;
  packs: number | null;
};

function addressPresent(value: unknown) {
  return Boolean(value && typeof value === "object" && "line1" in value && String((value as { line1?: string }).line1 ?? "").trim());
}

function add(values: Array<number | null>) {
  if (!values.length || values.some((value) => value == null)) return null;
  return values.reduce<number>((sum, value) => sum + (value ?? 0), 0);
}

export function buildProformaFacts(input: {
  blocks: readonly string[];
  lines: Array<{ type: string; description: string; code?: string | null; quantity: number; unitAmount: number; netAmount: number; measures: ProductMeasures | null }>;
  header: ExportHeader;
  destinationCountry: string | null;
  invoiceAddress: unknown;
  deliveryAddress: unknown;
  sellerEori: string | null;
}) {
  const missing: string[] = [];
  const lines: ProformaLine[] = input.lines.filter((line) => !["SECTION", "NOTE"].includes(line.type)).map((line) => {
    const load = line.measures ? shipLoad(line.measures, line.quantity) : { netGrams: null, grossGrams: null, volumeMl: null, packs: null, pallets: null };
    const label = line.code || line.description || "a product";
    if (hasBlock(input.blocks, "netWeight") && load.netGrams == null) missing.push(`net weight for ${label}`);
    if (hasBlock(input.blocks, "grossWeight") && load.grossGrams == null) missing.push(`gross weight for ${label}`);
    if (hasBlock(input.blocks, "volume") && load.volumeMl == null) missing.push(`volume for ${label}`);
    if (hasBlock(input.blocks, "countryOfOrigin") && !line.measures?.originCountry) missing.push(`country of origin for ${label}`);
    if (hasBlock(input.blocks, "commodityCode") && !line.measures?.commodityCode) missing.push(`commodity code for ${label}`);
    return {
      description: line.description, code: line.code ?? null, quantity: line.quantity, unitAmount: line.unitAmount, netAmount: line.netAmount,
      originCountry: line.measures?.originCountry ?? null, commodityCode: line.measures?.commodityCode ?? null,
      netGrams: load.netGrams, grossGrams: load.grossGrams, volumeMl: load.volumeMl, packs: load.packs,
    };
  });
  if (hasBlock(input.blocks, "invoiceAddress") && !addressPresent(input.invoiceAddress)) missing.push("invoice address");
  if (hasBlock(input.blocks, "deliveryAddress") && !addressPresent(input.deliveryAddress)) missing.push("consignee address");
  if (hasBlock(input.blocks, "incoterms") && !input.header.incoterms) missing.push("Incoterms");
  if (hasBlock(input.blocks, "incoterms") && !input.header.namedPlace) missing.push("Incoterms place");
  if (hasBlock(input.blocks, "countryOfDestination") && !input.destinationCountry) missing.push("country of destination");
  if (hasBlock(input.blocks, "ports") && (!input.header.portOfLoading || !input.header.portOfDischarge)) missing.push("ports of loading and discharge");
  if (hasBlock(input.blocks, "packages") && !input.header.packageCount) missing.push("number of packages");
  if (hasBlock(input.blocks, "marks") && !input.header.marks) missing.push("shipping marks");
  if (hasBlock(input.blocks, "exporterIdentity") && !input.sellerEori) missing.push("exporter EORI");
  if (hasBlock(input.blocks, "buyerIdentity") && !input.header.buyerEori && !input.header.buyerVat) missing.push("buyer EORI or VAT number");
  if (hasBlock(input.blocks, "reasonForExport") && !input.header.reasonForExport) missing.push("reason for export");
  return {
    lines,
    totals: {
      netGrams: add(lines.map((line) => line.netGrams)),
      grossGrams: add(lines.map((line) => line.grossGrams)),
      volumeMl: add(lines.map((line) => line.volumeMl)),
      packs: add(lines.map((line) => line.packs)),
    },
    missing,
  };
}

export function exportReadyMessage(missing: string[]) {
  if (!missing.length) return null;
  return `This export proforma still needs ${missing.join(", ")}.`;
}

export function formatKg(grams: number | null) {
  if (grams == null) return "—";
  return `${(grams / 1000).toLocaleString("en-GB", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} kg`;
}

export function formatVolume(ml: number | null) {
  if (ml == null) return "—";
  const cubic = ml / 1_000_000;
  if (cubic >= 0.001) return `${cubic.toLocaleString("en-GB", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} m³`;
  return `${(ml / 1000).toLocaleString("en-GB", { maximumFractionDigits: 3 })} litres`;
}

export function measuresOf(product: Partial<ProductMeasures> | null | undefined): ProductMeasures | null {
  if (!product) return null;
  return {
    netWeightGrams: product.netWeightGrams ?? null,
    grossWeightGrams: product.grossWeightGrams ?? null,
    lengthMm: product.lengthMm ?? null,
    widthMm: product.widthMm ?? null,
    heightMm: product.heightMm ?? null,
    volumeMl: product.volumeMl ?? null,
    unitsPerPack: product.unitsPerPack ?? null,
    packsPerLayer: product.packsPerLayer ?? null,
    layersPerPallet: product.layersPerPallet ?? null,
    stackable: product.stackable ?? null,
    originCountry: product.originCountry ?? null,
    commodityCode: product.commodityCode ?? null,
    customsDescription: product.customsDescription ?? null,
    hazardClass: product.hazardClass ?? null,
    unNumber: product.unNumber ?? null,
  };
}
