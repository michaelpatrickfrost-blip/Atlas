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

/** Receives a stored event straight after it is saved. Registered once at server start (src/instrumentation.ts)
 *  so Core never imports a module. If nothing is registered the scheduler tick picks the event up. */
export type EventSink = (eventId: string) => Promise<void>;
const SINK_KEY = "__atlasEventSink";
export function registerEventSink(sink: EventSink) {
  (globalThis as Record<string, unknown>)[SINK_KEY] = sink;
}

async function organisationOf(payload: Record<string, unknown>): Promise<string | null> {
  if (typeof payload.organisationId === "string") return payload.organisationId;
  const { db } = await import("@/core/db/client");
  if (typeof payload.partyId === "string") return (await db.party.findUnique({ where: { id: payload.partyId }, select: { organisationId: true } }))?.organisationId ?? null;
  if (typeof payload.orderId === "string") return (await db.salesOrder.findUnique({ where: { id: payload.orderId }, select: { organisationId: true } }))?.organisationId ?? null;
  return null;
}

/** Every event is kept (durable log for Automations, audit and replay). A failing listener never undoes the business action. */
async function persist(eventName: string, payload: unknown): Promise<void> {
  if (process.env.ATLAS_RUNTIME === "desktop" || !payload || typeof payload !== "object") return;
  try {
    const body = payload as Record<string, unknown>;
    const organisationId = await organisationOf(body);
    if (!organisationId) return;
    const { db } = await import("@/core/db/client");
    const entityKey = Object.keys(body).find((key) => key.endsWith("Id") && key !== "organisationId" && typeof body[key] === "string");
    const row = await db.automationEvent.create({
      data: {
        organisationId, name: eventName, payload: JSON.parse(JSON.stringify({ ...body, organisationId })),
        entityType: entityKey?.replace(/Id$/, "") ?? null, entityId: entityKey ? String(body[entityKey]) : null,
      },
    });
    const sink = (globalThis as Record<string, unknown>)[SINK_KEY] as EventSink | undefined;
    if (sink) void sink(row.id).catch((error) => console.error("[events] automation dispatch failed", error));
  } catch (error) {
    console.error("[events] could not store event", eventName, error);
  }
}

export async function emit(eventName: string, payload: unknown): Promise<void> {
  const list = handlers.get(eventName) ?? [];
  for (const handler of list) {
    await handler(payload);
  }
  await persist(eventName, payload);
}

/** Known domain events. Modules import from here rather than inventing string literals
 *  inline, so the full event surface is discoverable in one place. */
export const DOMAIN_EVENTS = {
  operationalRecordChanged: "operational.record.changed",
  marketingLeadBecameMql: "marketing.lead.became_mql",
  marketingEventRecorded: "marketing.event.recorded",
  serviceCaseCreated: "service.case.created",
  serviceCaseChanged: "service.case.changed",
  serviceCaseReopened: "service.case.reopened",
  serviceTicketCreated: "service.ticket.created",
  serviceDepartmentResponseReady: "service.department.response_ready",
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

  logisticsFulfilmentCreated: "logistics.fulfilment.created",
  logisticsFulfilmentAllocated: "logistics.fulfilment.allocated",
  logisticsFulfilmentShort: "logistics.fulfilment.short",
  logisticsOrderReleased: "logistics.order.released",
  logisticsPickCreated: "logistics.pick.created",
  logisticsPickCompleted: "logistics.pick.completed",
  logisticsPickException: "logistics.pick.exception",
  logisticsPackageCreated: "logistics.package.created",
  logisticsPackCompleted: "logistics.pack.completed",
  logisticsShipmentCreated: "logistics.shipment.created",
  logisticsShipmentDispatched: "logistics.shipment.dispatched",
  logisticsShipmentDelivered: "logistics.shipment.delivered",
  logisticsShipmentException: "logistics.shipment.exception",
  logisticsDeliveryFailed: "logistics.delivery.failed",
  logisticsReceiptCreated: "logistics.receipt.created",
  logisticsReceiptCompleted: "logistics.receipt.completed",
  logisticsReceiptDiscrepancy: "logistics.receipt.discrepancy",
  logisticsReturnCreated: "logistics.return.created",
  logisticsReturnReceived: "logistics.return.received",
  logisticsReturnInspected: "logistics.return.inspected",
  logisticsReturnResolved: "logistics.return.resolved",
  logisticsTransferDispatched: "logistics.transfer.dispatched",
  logisticsTransferReceived: "logistics.transfer.received",

  safetyHazardReported: "safety.hazard.reported",
  safetyRiskCreated: "safety.risk.created",
  safetyRiskApproved: "safety.risk.approved",
  safetyRiskReviewRequired: "safety.risk.review_required",
  safetyIncidentReported: "safety.incident.reported",
  safetyIncidentInvestigationStarted: "safety.incident.investigation_started",
  safetyIncidentClosed: "safety.incident.closed",
  safetyActionCreated: "safety.action.created",
  safetyActionCompleted: "safety.action.completed",
  safetyActionVerified: "safety.action.verified",
  safetyEquipmentHoldAdded: "safety.equipment.hold_added",
  safetyEquipmentHoldRemoved: "safety.equipment.hold_removed",
  safetyPermitAuthorised: "safety.permit.authorised",
  safetyPermitSuspended: "safety.permit.suspended",
  safetyPermitClosed: "safety.permit.closed",
  safetyIsolationApplied: "safety.isolation.applied",
  safetyIsolationCleared: "safety.isolation.cleared",
  safetyTrainingExpiring: "safety.training.expiring",
  safetyStatCheckExpiring: "safety.stat_check.expiring",
  safetyCoshhReviewRequired: "safety.coshh.review_required",
  teamPlannerTeamCreated: "teams.team.created",
  teamPlannerTaskAssigned: "teams.task.assigned",
  planApproved: "plan.approved",
  planScenarioPromoted: "plan.scenario.promoted",
  planDecisionRecorded: "plan.decision.recorded",
  financeInvoiceCreated: "finance.invoice.created",
  financeInvoicePosted: "finance.invoice.posted",
  manufacturingOrderCompleted: "manufacturing.order.completed",
  manufacturingOrderReleased: "manufacturing.order.released",
  contractSent: "contract.sent",
  contractSigned: "contract.signed",
  contractDeclined: "contract.declined",
  csatResponded: "csat.responded",
  emailSent: "email.sent",
  emailFailed: "email.failed",
  marketingCampaignCreated: "marketing.campaign.created",
  marketingCampaignLaunched: "marketing.campaign.launched",
  marketingCampaignCompleted: "marketing.campaign.completed",
  marketingTouchpointCreated: "marketing.touchpoint.created",
  marketingFormSubmitted: "marketing.form.submitted",
  marketingMqlCreated: "marketing.mql.created",
  marketingMqlRecycled: "marketing.mql.recycled",
  marketingEventRegistered: "marketing.event.registered",
  marketingEventAttended: "marketing.event.attended",
  marketingConsentChanged: "marketing.consent.changed",
  marketingExperimentCompleted: "marketing.experiment.completed",
} as const;
