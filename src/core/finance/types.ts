/** Legacy credit/projection types retained for Sales compatibility. Finance is now
 * registered. The live connections use exact BigInt amounts and source identities
 * in core/finance/connections.ts; these older numeric projection interfaces are
 * not evidence of an implemented provider. Sales' credit check still needs the
 * reconciled Finance exposure policy; Customer Master's limits/holds remain real.
 */

export type CreditCheckResult = {
  status: "CLEAR" | "WARNING" | "HOLD";
  creditLimitAmount: number;
  currentExposureAmount: number;
  thisOrderAmount: number;
  projectedExposureAmount: number;
  currency: string;
  explanation: string;
};

export type CreditProvider = (orderId: string) => Promise<CreditCheckResult>;

export type InvoiceProjectionEntry = {
  reference: string;
  amount: number;
  currency: string;
  status: "DRAFT" | "DUE" | "PAID" | "OVERDUE";
  dueDate: Date | null;
};

export type InvoiceProjection = {
  orderId: string;
  invoices: InvoiceProjectionEntry[];
  remainingToInvoiceAmount: number;
};

export type InvoicingProvider = (orderId: string) => Promise<InvoiceProjection | null>;

export type PaymentProjection = {
  orderId: string;
  orderValueAmount: number;
  invoicedAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  currency: string;
};

export type PaymentStatusProvider = (orderId: string) => Promise<PaymentProjection | null>;

export type ReceivablesProvider = (partyId: string) => Promise<{ outstandingAmount: number; overdueAmount: number; currency: string } | null>;

/** Events a future Finance module would publish; Sales only ever
 *  subscribes (§51). */
export const FINANCE_EVENT_NAMES = [
  "finance.invoice.created",
  "finance.invoice.posted",
  "finance.invoice.paid",
  "finance.credit_note.created",
  "finance.customer.credit_hold_added",
  "finance.customer.credit_hold_released",
  "finance.payment.received",
] as const;
