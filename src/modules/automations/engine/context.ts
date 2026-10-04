import { db } from "@/core/db/client";
import { publicBaseUrl } from "@/core/email/render";

export type LoadedContext = {
  /** What templates show (formatted). */
  display: Record<string, unknown>;
  /** What conditions compare (numbers are plain numbers, money in pounds). */
  raw: Record<string, unknown>;
  ids: { partyId?: string; contactId?: string; orderId?: string; quoteId?: string; shipmentId?: string; invoiceId?: string; caseId?: string; opportunityId?: string; prospectId?: string; ownerUserId?: string; contractId?: string };
};

const gbp = (minor: number | bigint | null | undefined, currency = "GBP") =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(Number(minor ?? 0) / 100);
const pounds = (minor: number | bigint | null | undefined) => Number(minor ?? 0) / 100;
const day = (d?: Date | null) => (d ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(d) : "");

function put(ctx: LoadedContext, path: string, display: unknown, raw: unknown = display) {
  const set = (target: Record<string, unknown>, value: unknown) => {
    const parts = path.split(".");
    let cur = target;
    for (const part of parts.slice(0, -1)) cur = (cur[part] ??= {}) as Record<string, unknown>;
    cur[parts[parts.length - 1]] = value;
  };
  set(ctx.display, display);
  set(ctx.raw, raw);
}

type Payload = Record<string, unknown>;
const str = (v: unknown) => (typeof v === "string" ? v : undefined);

/** Loads the records an event is about so conditions and templates can use real fields. Missing modules simply add nothing. */
export async function loadContext(organisationId: string, eventName: string, payload: Payload): Promise<LoadedContext> {
  const ctx: LoadedContext = { display: {}, raw: {}, ids: {} };
  const ids = ctx.ids;
  ids.orderId = str(payload.orderId); ids.quoteId = str(payload.quoteId); ids.shipmentId = str(payload.shipmentId); ids.invoiceId = str(payload.invoiceId);
  ids.caseId = str(payload.caseId); ids.opportunityId = str(payload.opportunityId); ids.prospectId = str(payload.prospectId); ids.partyId = str(payload.partyId);
  ids.contactId = str(payload.contactId); ids.contractId = str(payload.contractId);
  put(ctx, "event.name", eventName);
  for (const [k, v] of Object.entries(payload)) if (["string", "number", "boolean"].includes(typeof v) && k !== "organisationId") put(ctx, k, v);

  if (ids.orderId) {
    const o = await db.salesOrder.findFirst({ where: { id: ids.orderId, organisationId }, include: { _count: { select: { lines: true } } } });
    if (o) {
      ids.partyId ??= o.partyId; ids.ownerUserId = o.ownerUserId; ids.contactId ??= o.orderContactId ?? o.invoiceContactId ?? undefined; ids.quoteId ??= o.quoteId ?? undefined; ids.opportunityId ??= o.opportunityId ?? undefined;
      put(ctx, "order.reference", o.reference); put(ctx, "order.total", gbp(o.grossAmount, o.currency), pounds(o.grossAmount)); put(ctx, "order.type", o.orderType);
      put(ctx, "order.status", o.commercialStatus); put(ctx, "order.lines", o._count.lines); put(ctx, "order.deliveryDate", day(o.promisedDeliveryDate ?? o.requestedDeliveryDate), (o.promisedDeliveryDate ?? o.requestedDeliveryDate)?.toISOString() ?? "");
    }
  }
  if (ids.quoteId) {
    const q = await db.quote.findFirst({ where: { id: ids.quoteId, organisationId } });
    if (q) {
      ids.partyId ??= q.partyId; ids.ownerUserId ??= q.ownerUserId ?? undefined; ids.opportunityId ??= q.opportunityId ?? undefined;
      put(ctx, "quote.reference", q.reference); put(ctx, "quote.total", gbp(q.netAmount + q.taxAmount), pounds(q.netAmount + q.taxAmount));
      put(ctx, "quote.link", `${publicBaseUrl()}/quote/${q.id}`);
    }
  }
  if (ids.shipmentId) {
    const s = await db.shipment.findFirst({ where: { id: ids.shipmentId, organisationId }, include: { sources: { take: 1 } } });
    if (s) {
      ids.partyId ??= s.partyId;
      put(ctx, "shipment.reference", s.reference); put(ctx, "shipment.tracking", s.trackingNumber ?? ""); put(ctx, "shipment.carrier", s.carrierCode);
      ids.orderId ??= s.sources[0]?.salesOrderId;
      if (!ctx.display.order && ids.orderId) {
        const o = await db.salesOrder.findFirst({ where: { id: ids.orderId, organisationId } });
        if (o) { ids.ownerUserId ??= o.ownerUserId; ids.contactId ??= o.orderContactId ?? undefined; put(ctx, "order.reference", o.reference); put(ctx, "order.total", gbp(o.grossAmount, o.currency), pounds(o.grossAmount)); put(ctx, "order.type", o.orderType); put(ctx, "order.status", o.commercialStatus); }
      }
    }
  }
  if (ids.invoiceId) {
    const d = await db.financeDocument.findFirst({ where: { id: ids.invoiceId, organisationId } });
    if (d) { ids.partyId ??= d.partyId ?? undefined; ids.orderId ??= d.salesOrderId ?? undefined; put(ctx, "invoice.reference", d.reference); put(ctx, "invoice.total", gbp(d.gross, d.currency), Number(d.gross) / 100); put(ctx, "invoice.dueDate", day(d.dueAt), d.dueAt?.toISOString() ?? ""); }
  }
  if (ids.caseId) {
    const c = await db.serviceCase.findFirst({ where: { id: ids.caseId, organisationId } });
    if (c) { ids.partyId ??= c.partyId; ids.contactId ??= c.contactId ?? undefined; ids.ownerUserId ??= c.ownerUserId; put(ctx, "case.number", c.number); put(ctx, "case.subject", c.subject); put(ctx, "case.status", c.status); put(ctx, "case.priority", c.priority); put(ctx, "case.type", c.type); }
  }
  if (ids.opportunityId) {
    const o = await db.opportunity.findFirst({ where: { id: ids.opportunityId, organisationId } });
    if (o) { ids.partyId ??= o.partyId; ids.ownerUserId ??= o.ownerUserId; ids.contactId ??= o.primaryContactId ?? undefined; put(ctx, "opportunity.name", o.name); put(ctx, "opportunity.value", gbp(o.valueAmount, o.valueCurrency), pounds(o.valueAmount)); }
  }
  if (ids.prospectId) {
    const p = await db.prospect.findFirst({ where: { id: ids.prospectId, organisationId } });
    if (p) { ids.ownerUserId ??= p.ownerUserId ?? undefined; put(ctx, "prospect.company", p.companyName); put(ctx, "prospect.source", p.source ?? ""); if (p.email) { put(ctx, "contact.email", p.email); put(ctx, "contact.firstName", p.contactFirstName ?? ""); put(ctx, "contact.name", `${p.contactFirstName ?? ""} ${p.contactSurname ?? ""}`.trim()); } if (p.partyId) ids.partyId ??= p.partyId; }
  }
  if (ids.contractId) {
    const c = await db.contractDocument.findFirst({ where: { id: ids.contractId, organisationId } });
    if (c) { ids.partyId ??= c.partyId ?? undefined; ids.contactId ??= c.contactId ?? undefined; put(ctx, "contract.title", c.title); put(ctx, "contract.status", c.status); }
  }
  const manufacturingId = str(payload.manufacturingOrderId);
  if (manufacturingId) {
    const m = await db.manufacturingOrder.findFirst({ where: { id: manufacturingId, organisationId }, include: { product: { select: { name: true } } } });
    if (m) { put(ctx, "production.number", m.orderNumber); put(ctx, "production.product", m.product.name); put(ctx, "production.quantity", Number(m.quantity)); }
  }
  if (ids.partyId) {
    const party = await db.party.findFirst({ where: { id: ids.partyId, organisationId }, select: { name: true } });
    if (party) {
      const address = await db.address.findFirst({ where: { partyId: ids.partyId, country: { not: null } }, select: { country: true } });
      put(ctx, "customer.name", party.name); put(ctx, "customer.country", address?.country ?? "");
    }
    if (!ids.contactId) {
      const c = await db.contact.findFirst({ where: { partyId: ids.partyId, status: "ACTIVE", email: { not: null } }, orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] });
      ids.contactId = c?.id;
    }
  }
  if (ids.contactId) {
    const c = await db.contact.findFirst({ where: { id: ids.contactId, party: { organisationId } } });
    if (c) { put(ctx, "contact.firstName", c.preferredName || c.firstName); put(ctx, "contact.name", `${c.firstName} ${c.surname}`); put(ctx, "contact.email", c.email ?? ""); ids.partyId ??= c.partyId; }
  }
  const caseId = ids.caseId; void caseId;
  const csatId = str(payload.responseId);
  if (csatId) {
    const r = await db.csatResponse.findFirst({ where: { id: csatId, organisationId } });
    if (r) { put(ctx, "csat.score", r.score ?? 0); put(ctx, "csat.comment", r.comment ?? ""); ids.partyId ??= r.partyId ?? undefined; }
  }
  return ctx;
}
