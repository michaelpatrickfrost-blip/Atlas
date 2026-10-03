/** Strips whitespace and uppercases a tax registration number so formatting
 *  differences ("GB 123 4567 89" vs "gb123456789") don't prevent matching or
 *  duplicate detection (§19, §33). This is normalisation, not validation. */
export function normalizeTaxNumber(raw: string): string {
  return raw.replace(/\s+/g, "").toUpperCase();
}

/** Format-only check for a UK VAT number (9 or 12 digits, optional GB prefix).
 *  This confirms shape, nothing more — it is never treated as verification.
 *  See docs/CUSTOMER_MASTER.md §VAT for the honest verified/not-verified
 *  distinction. */
export function isPlausibleUkVatFormat(raw: string): boolean {
  const normalized = normalizeTaxNumber(raw).replace(/^GB/, "");
  return /^\d{9}$/.test(normalized) || /^\d{12}$/.test(normalized) || /^(GD|HA)\d{3}$/.test(normalized);
}
