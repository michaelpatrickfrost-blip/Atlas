"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/core/db/client";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { writeAudit } from "@/core/audit/log";

const SITE_STATUSES = ["PLANNED", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"];
const text = (form: FormData, name: string, max = 300) => String(form.get(name) ?? "").trim().slice(0, max);
const date = (form: FormData, name: string) => { const value = text(form, name, 10); if (!value) return null; const parsed = new Date(`${value}T00:00:00Z`); if (Number.isNaN(parsed.getTime())) throw new Error("Enter a valid date."); return parsed; };

async function site(organisationId: string, id: string) {
  const row = await db.project.findFirst({ where: { id, organisationId, projectType: "SITE" } });
  if (!row) throw new Error("This site no longer exists.");
  return row;
}

export async function saveSiteAction(form: FormData) {
  const session = await requireSession();
  assertCapability(session, "sales.site.manage");
  const before = await site(session.organisationId, text(form, "siteId", 60));
  const name = text(form, "name", 200), status = text(form, "status", 20), partyId = text(form, "partyId", 60);
  if (!name) throw new Error("Enter a site name.");
  if (!SITE_STATUSES.includes(status)) throw new Error("Choose a status.");
  if (!(await db.party.findFirst({ where: { id: partyId, organisationId: session.organisationId }, select: { id: true } }))) throw new Error("Choose a customer from your records.");
  if (partyId !== before.partyId && (await db.quote.count({ where: { projectId: before.id } })) + (await db.salesOrder.count({ where: { projectId: before.id } }))) throw new Error("This site already has quotations or orders for its customer. Remove them before changing the customer.");
  await db.project.update({ where: { id: before.id }, data: { name, status, partyId, notes: String(form.get("notes") ?? "").trim().slice(0, 5000) || null, startAt: date(form, "startAt"), targetAt: date(form, "targetAt") } });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "sales.site.update", entityType: "Project", entityId: before.id, before: { name: before.name, status: before.status }, after: { name, status } });
  revalidatePath("/sales/sites");
  revalidatePath(`/sales/sites/${before.id}`);
}

/** Put a quotation or order on a site, or take it off with an empty site. */
export async function setDocumentSiteAction(form: FormData) {
  const session = await requireSession();
  assertCapability(session, "sales.site.manage");
  const organisationId = session.organisationId, kind = text(form, "kind", 10), documentId = text(form, "documentId", 60), siteId = text(form, "siteId", 60) || null;
  if (kind !== "quote" && kind !== "order") throw new Error("Choose a quotation or an order.");
  if (!documentId) throw new Error(kind === "quote" ? "Choose a quotation." : "Choose an order.");
  const target = siteId ? await site(organisationId, siteId) : null;
  let previous: string | null;
  if (kind === "quote") {
    const quote = await db.quote.findFirst({ where: { id: documentId, organisationId }, select: { projectId: true, partyId: true, pricingPartyId: true } });
    if (!quote) throw new Error("This quotation no longer exists.");
    if (target && target.partyId && ![quote.partyId, quote.pricingPartyId].includes(target.partyId)) throw new Error("That quotation is for a different customer.");
    previous = quote.projectId;
    await db.quote.update({ where: { id: documentId }, data: { projectId: target?.id ?? null } });
  } else {
    const order = await db.salesOrder.findFirst({ where: { id: documentId, organisationId }, select: { projectId: true, partyId: true, pricingPartyId: true, orderType: true } });
    if (!order) throw new Error("This order no longer exists.");
    if (target && target.partyId && ![order.partyId, order.pricingPartyId].includes(target.partyId)) throw new Error("That order is for a different customer.");
    previous = order.projectId;
    await db.salesOrder.update({ where: { id: documentId }, data: { projectId: target?.id ?? null, projectReference: target?.reference ?? null, ...(order.orderType === "CALL_OFF" ? {} : { orderType: target ? "PROJECT" : "STANDARD" }) } });
  }
  await writeAudit({ organisationId, actorUserId: session.userId, action: "sales.site.document_linked", entityType: kind === "quote" ? "Quote" : "SalesOrder", entityId: documentId, before: { projectId: previous }, after: { projectId: target?.id ?? null } });
  for (const id of [target?.id, previous]) if (id) revalidatePath(`/sales/sites/${id}`);
  revalidatePath("/sales/sites");
  revalidatePath(kind === "quote" ? `/sales/quotes/${documentId}` : `/sales/orders/${documentId}`);
}
