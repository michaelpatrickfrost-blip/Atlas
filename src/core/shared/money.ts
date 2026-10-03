/** Money is stored as integer minor units (pence) + an ISO currency code. */
export function formatMoney(amountMinorUnits: number, currency: string, locale = "en-GB"): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amountMinorUnits / 100);
}
