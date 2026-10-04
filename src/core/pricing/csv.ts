import { parseCsv } from "@/core/shared/csv";

export type PriceCsvRow = {
  line: number;
  productCode: string;
  minimumQuantity: number;
  unitPrice: number;
  discountPercent: number;
  validFrom: string;
  validTo: string;
};

export type PriceCsvIssue = { line: number; productCode: string; message: string };

const aliases: Record<"productCode" | "minimumQuantity" | "unitPrice" | "discountPercent" | "validFrom" | "validTo", string[]> = {
  productCode: ["productcode", "product_code", "code", "sku"],
  minimumQuantity: ["minimumquantity", "minimum_quantity", "quantity", "min_qty", "qty"],
  unitPrice: ["unitprice", "unit_price", "price"],
  discountPercent: ["discountpercent", "discount_percent", "discount", "discount%"],
  validFrom: ["validfrom", "valid_from", "from"],
  validTo: ["validto", "valid_to", "until", "to"],
};

function headerKey(headers: string[], names: string[]) {
  return headers.find((header) => names.includes(header.toLowerCase().replace(/^\uFEFF/, "").trim()));
}

/** Read a price spreadsheet. Empty price cells are skipped so a full product sheet can be filled in and uploaded without wiping other rows. */
export function readPriceCsv(text: string): { rows: PriceCsvRow[]; skipped: number; issues: PriceCsvIssue[] } {
  const parsed = parseCsv(text);
  const headers = Object.keys(parsed[0] ?? {});
  const productHeader = headerKey(headers, aliases.productCode);
  const priceHeader = headerKey(headers, aliases.unitPrice);
  if (!productHeader || !priceHeader) throw new Error("The spreadsheet needs product code and price columns.");
  const quantityHeader = headerKey(headers, aliases.minimumQuantity);
  const discountHeader = headerKey(headers, aliases.discountPercent);
  const fromHeader = headerKey(headers, aliases.validFrom);
  const toHeader = headerKey(headers, aliases.validTo);
  const rows: PriceCsvRow[] = [];
  const issues: PriceCsvIssue[] = [];
  const seen = new Set<string>();
  let skipped = 0;

  parsed.forEach((record, index) => {
    const line = index + 2;
    const productCode = (record[productHeader] ?? "").trim();
    const priceText = (record[priceHeader] ?? "").trim();
    if (!productCode && !priceText) {
      skipped += 1;
      return;
    }
    if (!productCode) {
      issues.push({ line, productCode: "", message: "Enter a product code." });
      return;
    }
    if (!priceText) {
      skipped += 1;
      return;
    }
    const cleaned = priceText.replace(/[£$€,\s]/g, "");
    const quantityText = quantityHeader ? (record[quantityHeader] ?? "").trim() : "";
    const minimumQuantity = quantityText ? Number(quantityText) : 1;
    const validFrom = fromHeader ? (record[fromHeader] ?? "").trim() : "";
    const validTo = toHeader ? (record[toHeader] ?? "").trim() : "";
    const key = `${productCode.toLowerCase()}:${minimumQuantity}`;
    if (seen.has(key)) {
      issues.push({ line, productCode, message: "This product and quantity is already in the file." });
      return;
    }
    seen.add(key);
    if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) {
      issues.push({ line, productCode, message: "Enter a price with up to two decimal places." });
      return;
    }
    if (!Number.isInteger(minimumQuantity) || minimumQuantity < 1 || minimumQuantity > 1_000_000) {
      issues.push({ line, productCode, message: "Quantity must be a whole number of at least 1." });
      return;
    }
    if ((validFrom && !/^\d{4}-\d{2}-\d{2}$/.test(validFrom)) || (validTo && !/^\d{4}-\d{2}-\d{2}$/.test(validTo))) {
      issues.push({ line, productCode, message: "Dates must be YYYY-MM-DD." });
      return;
    }
    if (validFrom && validTo && validFrom > validTo) {
      issues.push({ line, productCode, message: "The start date is after the end date." });
      return;
    }
    const unitPrice = Number(cleaned);
    if (Math.round(unitPrice * 100) > 2147483647) {
      issues.push({ line, productCode, message: "That price is too large." });
      return;
    }
    const discountText = discountHeader ? (record[discountHeader] ?? "").trim().replace(/%/g, "") : "";
    const discountPercent = discountText ? Number(discountText) : 0;
    if (discountText && (!/^\d+(\.\d{1,2})?$/.test(discountText) || discountPercent > 100)) {
      issues.push({ line, productCode, message: "Enter a discount from 0 to 100, with up to two decimal places." });
      return;
    }
    rows.push({ line, productCode, minimumQuantity, unitPrice, discountPercent, validFrom, validTo });
  });

  if (!rows.length && !issues.length) throw new Error("The spreadsheet has no prices to import. Blank rows are left unchanged.");
  return { rows, skipped, issues };
}

export function priceDates(from: string, to: string) {
  const validFrom = from ? new Date(`${from}T00:00:00.000Z`) : null;
  const validTo = to ? new Date(`${to}T23:59:59.999Z`) : null;
  if ((validFrom && Number.isNaN(validFrom.getTime())) || (validTo && Number.isNaN(validTo.getTime()))) throw new Error("Enter valid dates.");
  return { validFrom, validTo };
}
