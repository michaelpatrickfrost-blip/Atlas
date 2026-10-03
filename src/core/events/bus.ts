/**
 * Minimal in-process domain event bus. Atlas is one application today, so this is
 * intentionally a synchronous emitter rather than a message broker — the contract
 * (named events, typed payloads) is what must survive a future move to a real queue,
 * not the transport. See docs/MODULE_SPEC.md §Events.
 */

type Handler = (payload: unknown) => void | Promise<void>;

const handlers = new Map<string, Handler[]>();

export function on(eventName: string, handler: Handler): void {
  const list = handlers.get(eventName) ?? [];
  list.push(handler);
  handlers.set(eventName, list);
}

export async function emit(eventName: string, payload: unknown): Promise<void> {
  const list = handlers.get(eventName) ?? [];
  for (const handler of list) {
    await handler(payload);
  }
}

/** Known domain events. Modules import from here rather than inventing string literals
 *  inline, so the full event surface is discoverable in one place. */
export const DOMAIN_EVENTS = {
  salesProspectCreated: "sales.prospect.created",
  salesProspectAssigned: "sales.prospect.assigned",
  salesProspectQualified: "sales.prospect.qualified",
  salesProspectDisqualified: "sales.prospect.disqualified",
  salesProspectNurtured: "sales.prospect.nurtured",
  salesProspectConverted: "sales.prospect.converted",

  salesOpportunityCreated: "sales.opportunity.created",
  salesOpportunityStageChanged: "sales.opportunity.stage_changed",
  salesOpportunityValueChanged: "sales.opportunity.value_changed",
  salesOpportunityCloseDateChanged: "sales.opportunity.close_date_changed",
  salesOpportunityWon: "sales.opportunity.won",
  salesOpportunityLost: "sales.opportunity.lost",

  salesActivityCompleted: "sales.activity.completed",

  salesQuoteSent: "sales.quote.sent",
  salesQuoteAccepted: "sales.quote.accepted",

  salesOrderCreated: "sales.order.created",
  salesOrderConfirmed: "sales.order.confirmed",
  salesOrderAmended: "sales.order.amended",
  salesOrderCancelled: "sales.order.cancelled",
  salesOrderClosed: "sales.order.closed",
  salesOrderHoldAdded: "sales.order.hold_added",
  salesOrderHoldReleased: "sales.order.hold_released",
  salesOrderLineAdded: "sales.order.line_added",
  salesOrderLineChanged: "sales.order.line_changed",
  salesOrderLineCancelled: "sales.order.line_cancelled",

  customerCreated: "customer.created",
  customerUpdated: "customer.updated",
  customerActivated: "customer.activated",
  customerOnHold: "customer.on_hold",
  customerCreditLimitChanged: "customer.credit_limit_changed",

  customerContactCreated: "customer.contact.created",
  customerAddressCreated: "customer.address.created",

  customerTaxRegistrationAdded: "customer.tax_registration.added",
  customerTaxRegistrationVerified: "customer.tax_registration.verified",

  customerBankAccountAdded: "customer.bank_account.added",
  customerBankAccountChanged: "customer.bank_account.changed",

  customerDirectDebitCreated: "customer.direct_debit.created",
  customerDirectDebitCancelled: "customer.direct_debit.cancelled",
} as const;
