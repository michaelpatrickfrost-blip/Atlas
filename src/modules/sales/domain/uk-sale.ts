/** UK sales VAT and the order-level discount taken off before VAT. */

export const UK_VAT_RATE = 0.2;

const UK_COUNTRIES = new Set([
  "GB",
  "UK",
  "GBR",
  "UNITED KINGDOM",
  "GREAT BRITAIN",
  "ENGLAND",
  "SCOTLAND",
  "WALES",
  "NORTHERN IRELAND",
]);

export function normaliseCountry(country: string | null | undefined) {
  return (country ?? "").trim().toUpperCase().replace(/\./g, "").replace(/\s+/g, " ");
}

/** A blank address is a UK sale. VAT is removed only when the address is outside the UK. */
export function isUkSaleCountry(country: string | null | undefined) {
  const value = normaliseCountry(country);
  return value.length === 0 || UK_COUNTRIES.has(value);
}

export function vatOnNet(netAmount: number, productTaxCategory: string | null | undefined, deliveryCountry: string | null | undefined) {
  if (productTaxCategory === "ZERO_RATED" || productTaxCategory === "EXEMPT") {
    const label = productTaxCategory.replaceAll("_", " ").toLowerCase();
    return { rate: 0, amount: 0, treatment: productTaxCategory, explanation: `${label} — no VAT applied.` };
  }
  if (!isUkSaleCountry(deliveryCountry)) {
    return { rate: 0, amount: 0, treatment: "EXPORT", explanation: "Delivery outside the UK — no VAT." };
  }
  return { rate: UK_VAT_RATE, amount: Math.round(netAmount * UK_VAT_RATE), treatment: "STANDARD", explanation: "UK VAT (20%)." };
}

export function parseHeaderDiscount(value: unknown) {
  if (value == null || value === "") return 0;
  const percent = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(percent) || percent < 0 || percent > 100) throw new Error("Enter an overall discount between 0 and 100, or remove it.");
  return Math.round(percent * 1000) / 1000;
}

export type SaleLine = { net: number; taxCategory: string | null | undefined };

export type SettledSale = {
  goods: number;
  headerDiscount: number;
  percent: number;
  net: number;
  tax: number;
  gross: number;
  lines: { net: number; tax: number; treatment: string; share: number }[];
};

/** Spread an overall discount across the lines, then calculate VAT on what remains. */
export function settleSale(lines: SaleLine[], headerDiscountPercent: number, deliveryCountry: string | null | undefined): SettledSale {
  const percent = parseHeaderDiscount(headerDiscountPercent);
  const goods = lines.reduce((sum, line) => sum + line.net, 0);
  const headerDiscount = goods > 0 ? Math.min(goods, Math.round((goods * percent) / 100)) : 0;
  const shares = allocate(lines.map((line) => line.net), headerDiscount);
  const settled = lines.map((line, index) => {
    const net = line.net - shares[index];
    const tax = vatOnNet(net, line.taxCategory, deliveryCountry);
    return { net, tax: tax.amount, treatment: tax.treatment, share: shares[index] };
  });
  const net = settled.reduce((sum, line) => sum + line.net, 0);
  const tax = settled.reduce((sum, line) => sum + line.tax, 0);
  return { goods, headerDiscount, percent, net, tax, gross: net + tax, lines: settled };
}

export function commercialLineNet(unitAmount: number, quantity: number, discountPercent: number) {
  return Math.round(unitAmount * quantity * (1 - (discountPercent || 0) / 100));
}

export function presentationTotals(input: {
  lines: { type?: string; unitAmount: number; quantity: number; discountPercent: number; optional?: boolean }[];
  netAmount: number;
  headerDiscountPercent?: number | null;
  deliveryCountry?: string | null;
}) {
  const goods = input.lines
    .filter((line) => !line.optional && !["SECTION", "NOTE"].includes(line.type ?? ""))
    .reduce((sum, line) => sum + commercialLineNet(line.unitAmount, line.quantity, line.discountPercent), 0);
  const overallDiscount = (input.headerDiscountPercent ?? 0) > 0 ? Math.max(0, goods - input.netAmount) : 0;
  return { overallDiscount, vatLabel: isUkSaleCountry(input.deliveryCountry) ? "VAT" : "No VAT", goods };
}

function allocate(amounts: number[], discount: number) {
  if (discount <= 0 || amounts.length === 0) return amounts.map(() => 0);
  const total = amounts.reduce((sum, amount) => sum + amount, 0);
  if (total <= 0) return amounts.map(() => 0);
  const capped = Math.min(discount, total);
  const raw = amounts.map((amount) => (amount * capped) / total);
  const shares = raw.map((amount) => Math.floor(amount));
  let left = capped - shares.reduce((sum, amount) => sum + amount, 0);
  const order = raw
    .map((amount, index) => ({ index, fraction: amount - Math.floor(amount) }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index);
  for (const item of order) {
    if (left <= 0) break;
    if (shares[item.index] < amounts[item.index]) {
      shares[item.index] += 1;
      left -= 1;
    }
  }
  return shares;
}
