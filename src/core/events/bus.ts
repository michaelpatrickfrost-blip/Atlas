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
  salesOpportunityWon: "sales.opportunity.won",
  salesQuoteSent: "sales.quote.sent",
  salesOrderConfirmed: "sales.order.confirmed",
} as const;
