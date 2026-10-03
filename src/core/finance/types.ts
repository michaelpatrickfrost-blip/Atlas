/**
 * Contracts for a future Finance module. Sales must never write directly to
 * accounting tables or invent invoice/payment data (§27, §54). See
 * docs/modules/SALES_ORDER_PROCESSING.md §Finance contract.
 *
 * CreditProvider is the one exception that has a real implementation today
 * (src/modules/sales/services/credit-check.ts) — it's backed directly by
 * Customer Master's own CustomerCreditProfile (limit, hold) rather than a
 * Finance module, because that data already exists and is real. The other
 * three provider types have no implementation; the order record simply
 * hides its Finance tab until a real Finance module registers one.
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
