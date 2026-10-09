"use server";
import { requireSession, type Session } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { assertModuleEnabled } from "@/core/modules/access";
import { isModuleEnabled } from "@/core/modules/runtime";
import { projectScope } from "@/core/permissions/work-access";
import { db } from "@/core/db/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { openCustomerProject } from "@/modules/projects/services/open-project";
import { assertCallOffCapacity, loadAgreement, lockAgreement } from "./call-off-balance";
import { resolveStandardUkVat } from "./tax-check";
import { resolvePrice } from "@/core/pricing/resolve-price";
import { confirmOrder } from "./orders";
import { z } from "zod";

const targets = ["opportunity", "quote", "order", "agreement"] as const;

function refresh() {
  revalidatePath("/crm", "layout");
  revalidatePath("/sales", "layout");
  revalidatePath("/projects", "layout");
}

export async function linkCommercialProject(form: FormData) {
  const session = await requireSession();
  const target = String(form.get("target") ?? "");
  if (!targets.includes(target as (typeof targets)[number])) throw new Error("Choose where to attach the project.");
  const recordId = String(form.get("recordId") ?? "");
  const partyId = String(form.get("partyId") ?? "");
  const opportunityId = String(form.get("opportunityId") ?? "") || null;
  const selectedId = String(form.get("projectId") ?? "") || null;
  const name = String(form.get("name") ?? "").trim();
  if (!selectedId && !name) throw new Error("Choose a project or enter a name to create one.");
  await db.$transaction(async (tx) => {
    let project = selectedId ? await tx.project.findFirst({ where: { AND: [projectScope(session), { id: selectedId }] } }) : null;
    if (selectedId && !project) throw new Error("That project is not available.");
    if (!project) {
      assertCapability(session, "projects.manage");
      await assertModuleEnabled(session, "projects");
      if (!partyId) throw new Error("Choose the customer before creating a project.");
      project = await openCustomerProject(tx, session, { name, partyId, opportunityId: target === "opportunity" ? recordId : opportunityId });
    } else if (partyId && project.partyId && project.partyId !== partyId) throw new Error("Choose a project for this customer.");
    if (partyId && !project.partyId) {
      await tx.project.update({ where: { id: project.id }, data: { partyId } });
      project = { ...project, partyId };
    }
    const dealId = target === "opportunity" ? recordId : opportunityId;
    if (dealId && project.opportunityId && project.opportunityId !== dealId) throw new Error("This project already belongs to another opportunity.");
    if (dealId && !project.opportunityId) await tx.project.update({ where: { id: project.id }, data: { opportunityId: dealId } });
    if (target === "quote") {
      assertCapability(session, "sales.quote.create");
      await assertModuleEnabled(session, "sales");
      const quote = await tx.quote.findFirstOrThrow({ where: { id: recordId, organisationId: session.organisationId } });
      if (project.partyId && quote.partyId !== project.partyId) throw new Error("Choose a project for this customer.");
      await tx.quote.update({ where: { id: quote.id }, data: { projectId: project.id } });
      if (quote.opportunityId && !project.opportunityId) await tx.project.update({ where: { id: project.id }, data: { opportunityId: quote.opportunityId } });
    }
    if (target === "order") {
      if (!can(session, "sales.order.edit_draft") && !can(session, "sales.order.amend")) throw new Error("You cannot change this order.");
      await assertModuleEnabled(session, "sales");
      const order = await tx.salesOrder.findFirstOrThrow({ where: { id: recordId, organisationId: session.organisationId } });
      if (["CANCELLED", "CLOSED"].includes(order.commercialStatus)) throw new Error("This order is closed.");
      if (project.partyId && order.partyId !== project.partyId) throw new Error("Choose a project for this customer.");
      if (order.agreementId) {
        const agreement = await tx.salesAgreement.findFirstOrThrow({ where: { id: order.agreementId, organisationId: session.organisationId } });
        if (agreement.projectId && agreement.projectId !== project.id) throw new Error("This call-off agreement already has its own project.");
        if (!agreement.projectId) await tx.salesAgreement.update({ where: { id: agreement.id }, data: { projectId: project.id } });
      }
      await tx.salesOrder.update({ where: { id: order.id }, data: { projectId: project.id, projectReference: project.reference, orderType: order.orderType === "CALL_OFF" ? "CALL_OFF" : "PROJECT" } });
    }
    if (target === "agreement") {
      assertCapability(session, "sales.quote.create");
      await assertModuleEnabled(session, "sales");
      const agreement = await tx.salesAgreement.findFirstOrThrow({ where: { id: recordId, organisationId: session.organisationId } });
      if (project.partyId && agreement.partyId !== project.partyId) throw new Error("Choose a project for this customer.");
      await tx.salesAgreement.update({ where: { id: agreement.id }, data: { projectId: project.id } });
      await tx.salesOrder.updateMany({ where: { organisationId: session.organisationId, agreementId: agreement.id, projectId: null }, data: { projectId: project.id, projectReference: project.reference } });
    }
    if (target === "opportunity") {
      assertCapability(session, "sales.opportunity.manage");
      await tx.opportunity.findFirstOrThrow({ where: { id: recordId, organisationId: session.organisationId } });
    }
    await tx.auditEntry.create({ data: { organisationId: session.organisationId, actorUserId: session.userId, action: "commercial.project_linked", entityType: "Project", entityId: project.id, after: { target, recordId }, workProjectId: project.id } });
  });
  refresh();
}

const callOffLines = z.array(z.object({ productId: z.string().min(1), quantity: z.number().int().positive() })).min(1);

type AddressRow = { id: string; partyId: string; type: string; label: string | null; line1: string; line2: string | null; city: string | null; region: string | null; postcode: string | null; country: string | null; active: boolean; isDefaultBilling: boolean; isDefaultDelivery: boolean };

function addressSnapshot(address: AddressRow) {
  return { addressId: address.id, partyId: address.partyId, label: address.label, line1: address.line1, line2: address.line2, city: address.city, region: address.region, postcode: address.postcode, country: address.country };
}

function chooseAddress(addresses: AddressRow[], kind: "invoice" | "delivery") {
  const active = addresses.filter((address) => address.active && address.line1.trim());
  if (kind === "invoice") return active.find((address) => address.isDefaultBilling) ?? active.find((address) => address.type === "BILLING") ?? active[0] ?? null;
  return active.find((address) => address.isDefaultDelivery && address.country) ?? active.find((address) => address.type === "DELIVERY" && address.country) ?? active.find((address) => address.country) ?? null;
}

/** The big order. Later deliveries draw it down; the unreleased quantity is not a shipment and is not planning demand. */
export async function openCallOffOrder(form: FormData) {
  const session = await requireSession();
  assertCapability(session, "sales.order.create");
  await assertModuleEnabled(session, "sales");
  const partyId = String(form.get("partyId") ?? "");
  const endsRaw = String(form.get("endsAt") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(endsRaw)) throw new Error("Choose the date this order runs until.");
  const endsAt = new Date(`${endsRaw}T12:00:00.000Z`);
  const today = new Date().toISOString().slice(0, 10);
  if (endsRaw < today) throw new Error("The order must run until today or later.");
  const customerPoReference = String(form.get("customerPoReference") ?? "").trim().slice(0, 150) || null;
  let inputs: z.infer<typeof callOffLines>;
  try { inputs = callOffLines.parse(JSON.parse(String(form.get("lines") ?? "[]"))); } catch { throw new Error("Add at least one product and a whole quantity."); }
  const party = await db.party.findFirstOrThrow({ where: { id: partyId, organisationId: session.organisationId }, include: { commercialSettings: true, creditProfile: true } });
  if (["ON_HOLD", "INACTIVE", "CLOSED"].includes(party.status)) throw new Error("This customer account is unavailable for new sales.");
  if (party.commercialSettings?.customerPoRequired && !customerPoReference) throw new Error("This customer requires a purchase order number.");
  const products = await db.product.findMany({ where: { organisationId: session.organisationId, id: { in: inputs.map((line) => line.productId) }, active: true, sellable: true } });
  const priced = [];
  for (const [index, input] of inputs.entries()) {
    const product = products.find((item) => item.id === input.productId);
    if (!product) throw new Error("A selected product is unavailable.");
    const price = await resolvePrice({ organisationId: session.organisationId, partyId, productId: product.id, quantity: input.quantity, priceListId: party.commercialSettings?.priceList ?? null });
    if (price.currency !== party.preferredCurrency) throw new Error(`Price for ${product.code} uses ${price.currency}. This customer's sales currency is ${party.preferredCurrency}.`);
    priced.push({ lineNumber: index + 1, productId: product.id, description: product.name, committedQuantity: input.quantity, unitPriceAmount: price.unitPriceAmount, unitOfMeasure: product.unitOfMeasure, currency: price.currency });
  }
  const agreement = await db.salesAgreement.create({
    data: {
      organisationId: session.organisationId, partyId, reference: `CT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, status: "ACTIVE", currency: party.preferredCurrency, startsAt: new Date(), endsAt, paymentTermId: party.creditProfile?.paymentTermId ?? null, customerPoReference, ownerUserId: session.userId,
      lines: { create: priced },
    },
  });
  await db.auditEntry.create({ data: { organisationId: session.organisationId, actorUserId: session.userId, action: "agreement.opened", entityType: "SalesAgreement", entityId: agreement.id, after: { reference: agreement.reference, partyId, lines: priced.length } } });
  refresh();
  redirect(`/sales/agreements/${agreement.id}`);
}

async function createCallOffRelease(session: Awaited<ReturnType<typeof requireSession>>, form: FormData) {
  const agreementId = String(form.get("agreementId") ?? "");
  const opportunityId = String(form.get("opportunityId") ?? "") || null;
  const requested = String(form.get("requestedDeliveryDate") ?? "");
  const requestedDeliveryDate = requested ? new Date(`${requested}T12:00:00.000Z`) : null;
  if (requested && (!/^\d{4}-\d{2}-\d{2}$/.test(requested) || !requestedDeliveryDate || Number.isNaN(requestedDeliveryDate.getTime()))) throw new Error("Choose a valid delivery date.");
  return db.$transaction(async (tx) => {
    await lockAgreement(tx, session.organisationId, agreementId);
    const agreement = await loadAgreement(tx, session.organisationId, agreementId);
    if (opportunityId) await tx.opportunity.findFirstOrThrow({ where: { id: opportunityId, organisationId: session.organisationId, partyId: agreement.partyId } });
    const project = agreement.projectId ? await tx.project.findFirst({ where: { id: agreement.projectId, organisationId: session.organisationId } }) : null;
    const party = await tx.party.findFirstOrThrow({ where: { id: agreement.partyId, organisationId: session.organisationId }, include: { commercialSettings: true, addresses: true } });
    const invoice = chooseAddress(party.addresses, "invoice");
    const delivery = chooseAddress(party.addresses, "delivery");
    if (!invoice || !delivery?.country) throw new Error("Add an invoice address and a delivery address with a country on this customer before delivering.");
    const customerPoReference = String(form.get("customerPoReference") ?? "").trim().slice(0, 150) || agreement.customerPoReference;
    if (party.commercialSettings?.customerPoRequired && !customerPoReference?.trim()) throw new Error("This customer requires a purchase order number.");
    const selected = agreement.lines.flatMap((line) => {
      const quantity = Number(form.get(`qty:${line.id}`) ?? 0);
      return Number.isInteger(quantity) && quantity > 0 ? [{ line, quantity }] : [];
    });
    if (!selected.length) throw new Error("Enter the quantity to deliver this time.");
    const products = await tx.product.findMany({ where: { organisationId: session.organisationId, id: { in: selected.flatMap((item) => item.line.productId ? [item.line.productId] : []) } } });
    const lines = await Promise.all(selected.map(async ({ line, quantity }, index) => {
      const product = products.find((item) => item.id === line.productId);
      if (line.productId && (!product || product.sellable === false || !product.active)) throw new Error("This item is internal or inactive and cannot be used for a new sale.");
      const netAmount = line.unitPriceAmount * quantity;
      const taxCategory = product?.taxCategory ?? "STANDARD";
      const tax = await resolveStandardUkVat({ sellingOrganisationId: session.organisationId, partyId: agreement.partyId, deliveryCountry: delivery.country, productTaxCategory: taxCategory, transactionDate: requestedDeliveryDate ?? new Date(), netAmount });
      const type = product?.kind === "SERVICE" ? "SERVICE" as const : product?.kind === "CHARGE" ? "CHARGE" as const : line.productId ? "PRODUCT" as const : "TEXT" as const;
      return { lineNumber: index + 1, productId: line.productId, type, descriptionSnapshot: line.description, unitOfMeasure: line.unitOfMeasure, orderedQuantity: quantity, unitPriceAmount: line.unitPriceAmount, discountPercent: 0, netAmount, taxAmount: tax.amount, taxCategory, priceSource: `Call-off ${agreement.reference}`, agreementLineId: line.id };
    }));
    await assertCallOffCapacity(tx, { organisationId: session.organisationId, agreementId, partyId: agreement.partyId, pricingPartyId: agreement.pricingPartyId, currency: agreement.currency, lines });
    const netAmount = lines.reduce((sum, line) => sum + line.netAmount, 0), taxAmount = lines.reduce((sum, line) => sum + line.taxAmount, 0);
    const order = await tx.salesOrder.create({
      data: {
        organisationId: session.organisationId, partyId: agreement.partyId, pricingPartyId: agreement.pricingPartyId, opportunityId: opportunityId ?? agreement.opportunityId, projectId: project?.id ?? null, projectReference: project?.reference ?? null, agreementId: agreement.id, orderType: "CALL_OFF", contractReference: agreement.reference, externalReference: agreement.reference, ownerUserId: session.userId, paymentTermId: agreement.paymentTermId, customerPoReference, currency: agreement.currency, requestedDeliveryDate, allowPartialDelivery: true, reference: `SO-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, netAmount, taxAmount, grossAmount: netAmount + taxAmount, invoiceAddressSnapshot: addressSnapshot(invoice), deliveryAddressSnapshot: addressSnapshot(delivery), lines: { create: lines },
      },
    });
    await tx.auditEntry.create({ data: { organisationId: session.organisationId, actorUserId: session.userId, action: "order.call_off_created", entityType: "SalesOrder", entityId: order.id, after: { agreementId, reference: order.reference } } });
    return { orderId: order.id, agreementId };
  });
}

export async function raiseCallOff(form: FormData) {
  const session = await requireSession();
  assertCapability(session, "sales.order.create");
  await assertModuleEnabled(session, "sales");
  const { orderId } = await createCallOffRelease(session, form);
  refresh();
  redirect(`/sales/orders/${orderId}`);
}

async function requireCallOffBooks(session: Session, currency: string) {
  if (!(await isModuleEnabled(session, "finance"))) throw new Error("Turn on Finance before this delivery can be invoiced.");
  const books = await db.financeEntity.findFirst({ where: { organisationId: session.organisationId, currency }, select: { id: true } });
  if (!books) throw new Error(`Set up finance books in ${currency} before this quantity can be invoiced. Open Finance, create the books, then deliver again.`);
}

function callOffInvoiceLines(orderId: string, lines: { id: string; type: string; orderedQuantity: number; cancelledQuantity: number }[]) {
  return lines.flatMap((line) => line.orderedQuantity > line.cancelledQuantity && !["SECTION", "NOTE"].includes(line.type) ? [{ salesOrderId: orderId, salesOrderLineId: line.id, quantity: line.orderedQuantity - line.cancelledQuantity }] : []);
}

/** Raises the draft invoice for a confirmed call-off delivery that does not have one yet. */
export async function invoiceCallOffDelivery(form: FormData) {
  const session = await requireSession();
  assertCapability(session, "sales.order.confirm");
  await assertModuleEnabled(session, "sales");
  const orderId = String(form.get("orderId") ?? "");
  const order = await db.salesOrder.findFirst({ where: { id: orderId, organisationId: session.organisationId, orderType: "CALL_OFF" }, include: { lines: true } });
  if (!order?.agreementId) throw new Error("This delivery is not on a call-off order.");
  if (order.commercialStatus !== "CONFIRMED") throw new Error("Confirm the delivery before it can be invoiced.");
  await requireCallOffBooks(session, order.currency);
  const { handoffDeliveredShipment } = await import("@/core/finance/handoff");
  await handoffDeliveredShipment(session, { shipmentId: `call-off-release:${order.id}`, shipmentReference: order.reference, deliveredAt: order.requestedDeliveryDate ?? new Date(), lines: callOffInvoiceLines(order.id, order.lines) });
  const invoice = await db.financeDocument.findFirst({ where: { organisationId: session.organisationId, salesOrderId: order.id, kind: "AR_INVOICE", status: { not: "CANCELLED" } }, select: { id: true } });
  if (!invoice) throw new Error("Finance did not raise a draft invoice for this delivery.");
  refresh();
  redirect(`/sales/agreements/${order.agreementId}`);
}

/** Takes a quantity off the big order, confirms that delivery, and raises a draft invoice for those items only. */
export async function deliverAndInvoiceCallOff(form: FormData) {
  const session = await requireSession();
  assertCapability(session, "sales.order.create");
  assertCapability(session, "sales.order.confirm");
  await assertModuleEnabled(session, "sales");
  if (!String(form.get("requestedDeliveryDate") ?? "")) throw new Error("Choose the delivery date.");
  const agreementId = String(form.get("agreementId") ?? "");
  const agreement = await db.salesAgreement.findFirst({ where: { id: agreementId, organisationId: session.organisationId }, select: { currency: true } });
  if (!agreement) throw new Error("This call-off order was not found.");
  await requireCallOffBooks(session, agreement.currency);
  const released = await createCallOffRelease(session, form);
  let confirmed = false;
  try {
    confirmed = (await confirmOrder(released.orderId)).confirmed;
  } catch (error) {
    const saved = await db.salesOrder.findFirst({ where: { id: released.orderId, organisationId: session.organisationId }, select: { commercialStatus: true } });
    if (saved?.commercialStatus !== "CONFIRMED") throw error;
    confirmed = true;
  }
  if (confirmed) {
    const invoice = await db.financeDocument.findFirst({ where: { organisationId: session.organisationId, salesOrderId: released.orderId, kind: "AR_INVOICE", status: { not: "CANCELLED" } }, select: { id: true } });
    if (!invoice) throw new Error("The delivery is confirmed, but Finance did not raise a draft invoice. Use Raise the invoice on this delivery once the books are ready.");
  }
  refresh();
  redirect(`/sales/agreements/${released.agreementId}`);
}
