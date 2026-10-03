/**
 * Contract for tax calculation (§18). Sales must not implement every
 * country's VAT rules — see docs/modules/SALES_ORDER_PROCESSING.md §Tax.
 * `resolveStandardUkVat` (src/modules/sales/services/tax-check.ts) is a
 * minimal default implementation (UK standard rate only) so order totals
 * aren't simply zero — a real Tax/Finance module should register a fuller
 * TaxProvider and this default should be retired.
 */
export type TaxQuery = {
  sellingOrganisationId: string;
  partyId: string;
  deliveryCountry: string | null;
  productTaxCategory: string | null;
  transactionDate: Date;
  netAmount: number;
};

export type TaxResult = {
  rate: number; // e.g. 0.2 for 20%
  amount: number;
  treatment: string;
  explanation: string;
};

export type TaxProvider = (query: TaxQuery) => Promise<TaxResult>;
