/** Currency amounts use their explicit exponent; quantity precision is independent. */
export const currencyDigits: Record<string, number> = { GBP: 2, EUR: 2, USD: 2, CAD: 2, AUD: 2, CHF: 2, JPY: 0, KWD: 3, BHD: 3 };
export function digits(currency: string) {
  const value = currencyDigits[currency];
  if (value === undefined) throw new Error(`Currency ${currency} requires an explicit supported exponent.`);
  return value;
}
export function formatMoney(amountMinorUnits: number, currency: string, locale = "en-GB"): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amountMinorUnits / 10 ** digits(currency));
}
