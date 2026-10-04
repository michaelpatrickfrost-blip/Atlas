import { roundRatio } from "@/modules/finance/domain/money";

export const SERVICE_CREDIT_REASONS = ["Damage", "Complaint", "Shortage", "Pricing", "Goodwill"] as const;
export type ServiceCreditReason = (typeof SERVICE_CREDIT_REASONS)[number];

/** Net credit plus VAT taken in the same proportion as the invoice line, capped by what the customer still owes. */
export function serviceCreditAmounts(net: bigint, lineNet: bigint, lineTax: bigint, outstanding: bigint) {
  if (net <= 0n) throw new Error("Enter the credit amount.");
  if (lineNet <= 0n) throw new Error("Choose an invoice that still has a value to credit.");
  const tax = roundRatio(net * lineTax, lineNet);
  if (net + tax > outstanding) throw new Error("That credit is more than the customer still owes on this invoice.");
  return { net, tax, gross: net + tax };
}
