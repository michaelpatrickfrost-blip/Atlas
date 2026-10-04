import type { TaxProvider, TaxResult } from "@/core/tax/types";
import { vatOnNet } from "../domain/uk-sale";

/**
 * UK VAT: 20% on a UK delivery, or when no country has been chosen yet.
 * A delivery address outside the UK is an export and carries no VAT.
 * Zero-rated and exempt products stay at 0% in the UK.
 */
export const resolveStandardUkVat: TaxProvider = async (query): Promise<TaxResult> => {
  return vatOnNet(query.netAmount, query.productTaxCategory, query.deliveryCountry);
};
