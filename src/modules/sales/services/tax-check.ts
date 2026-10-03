import type { TaxProvider, TaxResult } from "@/core/tax/types";

/**
 * Minimal default TaxProvider: UK standard rate (20%) when delivering to the
 * United Kingdom and the line isn't marked zero-rated/exempt; otherwise no
 * tax is calculated and the result says so honestly rather than guessing.
 * See docs/modules/SALES_ORDER_PROCESSING.md §Tax for the real contract this
 * stands in for.
 */
export const resolveStandardUkVat: TaxProvider = async (query): Promise<TaxResult> => {
  const zeroRated = query.productTaxCategory === "ZERO_RATED" || query.productTaxCategory === "EXEMPT";

  if (zeroRated) {
    return { rate: 0, amount: 0, treatment: query.productTaxCategory!, explanation: `${query.productTaxCategory!.replace("_", " ").toLowerCase()} — no VAT applied.` };
  }

  if (query.deliveryCountry && query.deliveryCountry.toUpperCase() !== "UNITED KINGDOM" && query.deliveryCountry.toUpperCase() !== "GB" && query.deliveryCountry.toUpperCase() !== "UK") {
    return { rate: 0, amount: 0, treatment: "UNDETERMINED", explanation: "Delivery outside the UK — tax treatment requires Atlas Tax service." };
  }

  if (!query.deliveryCountry) return {rate:0,amount:0,treatment:"UNDETERMINED",explanation:"Choose a delivery country to determine tax treatment."};
  const rate = 0.2;
  return { rate, amount: Math.round(query.netAmount * rate), treatment: "STANDARD", explanation: "UK standard rate (20%)." };
};
