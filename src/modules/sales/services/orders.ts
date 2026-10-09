"use server";
import { assertProductsSellable } from "@/core/products/sales-eligibility";
import {guardFinancialCancellation} from '@/core/finance/connections';
import {assertSalesTradingLink} from './trading-check';
import {salesHandoff} from './handoff';
import { assertModuleEnabled } from "@/core/modules/access";

import {commercialSnapshot} from "./revisions";
import {validateConfirmation} from "./confirmation-check";
import {resolveStandardUkVat} from "./tax-check";
import { revalidatePath } from "next/cache";
import { db } from "@/core/db/client";
import { requireSession } from "@/core/auth/session";
import { assertCapability,can } from "@/core/permissions/check";
import { SALES_CAPABILITIES } from "@/core/permissions/capabilities";
import { writeAudit } from "@/core/audit/log";
import { writeActivity } from "@/core/activity/log";
import { emit, DOMAIN_EVENTS } from "@/core/events/bus";
import { formatMoney } from "@/core/shared/money";
import { resolvePrice } from "@/core/pricing/resolve-price";
import { nextOrderReference } from "@/modules/sales/services/orders-queries";
import { checkOrderCredit } from "@/modules/sales/services/credit-check";
import { recalcOrderTotals } from "./order-totals";
import { requiresApproval } from "@/modules/sales/services/order-approval-rules";
import type { OrderChangeType, OrderHoldType, OrderLineType } from "@/generated/prisma/client";

// Queries live in orders-queries.ts — this file is commands only.

async function assertOwnedByOrg(organisationId: string, orderId: string) {
  const order = await db.salesOrder.findFirst({ where: { id: orderId, organisationId }, select: { id: true, commercialStatus: true } });
  if (!order) throw new Error("NOT_FOUND: order does not belong to this organisation");
  return order;
}

async function assertDraft(orderId: string) {
  const order = await db.salesOrder.findUniqueOrThrow({ where: { id: orderId }, select: { commercialStatus: true } });
  if (order.commercialStatus !== "DRAFT") {
    throw new Error("NOT_DRAFT: this action is only available while the order is a draft");
  }
}

async function recordChange(orderId: string, type: OrderChangeType, fromValue: string | null, toValue: string | null, userId: string, reason?: string, lineId?: string) {
  await db.orderChangeEvent.create({ data: { orderId, lineId, type, fromValue, toValue, reason, changedByUserId: userId } });
}

/** Recomputes net/discount/tax/gross from active lines. Called after any
 *  line mutation — order totals are always derived, never hand-edited. */
// ---------- Draft lifecycle ----------

export type CreateDraftOrderInput = {
  partyId: string;
  customerPoReference?: string;
  opportunityId?: string;
  quoteId?: string;
  currency?: string;
  priceListId?: string;
};

export async function createDraftOrder(input: CreateDraftOrderInput) {
  const session = await requireSession();
  assertCapability(session, SALES_CAPABILITIES.orderCreate);
  await assertModuleEnabled(session, "sales");

  const customer = await db.party.findFirstOrThrow({where:{id:input.partyId,organisationId:session.organisationId}});
  if(input.priceListId) await db.priceList.findFirstOrThrow({where:{id:input.priceListId,organisationId:session.organisationId}});
  if(input.opportunityId) await db.opportunity.findFirstOrThrow({where:{id:input.opportunityId,partyId:input.partyId,organisationId:session.organisationId}});
  if(input.quoteId) await db.quote.findFirstOrThrow({where:{id:input.quoteId,partyId:input.partyId,organisationId:session.organisationId}});
  const reference = await nextOrderReference(session.organisationId);

  const order = await db.salesOrder.create({
    data: {
      organisationId: session.organisationId,
      partyId: input.partyId,
      reference,
      ownerUserId: session.userId,
      customerPoReference: input.customerPoReference,
      opportunityId: input.opportunityId,
      quoteId: input.quoteId,
      currency: input.currency ?? customer.preferredCurrency,
      priceListId: input.priceListId,
    },
  });

  await writeAudit({
    organisationId: session.organisationId,
    actorUserId: session.userId,
    action: "order.created",
    entityType: "SalesOrder",
    entityId: order.id,
    after: { reference: order.reference },
  });
  await emit(DOMAIN_EVENTS.salesOrderCreated, { orderId: order.id, organisationId: session.organisationId });

  revalidatePath("/sales/orders");
  return order;
}

export type AddOrderLineInput = {
  orderId: string;
  productId?: string;
  type?: OrderLineType;
  descriptionSnapshot?: string;
  quantity: number;
  discountPercent?: number;
  requestedDeliveryDate?: Date;
};

export async function addOrderLine(input: AddOrderLineInput) {
  const session = await requireSession();
  assertCapability(session, SALES_CAPABILITIES.orderEditDraft);
  await assertModuleEnabled(session, "sales");
  await assertOwnedByOrg(session.organisationId, input.orderId);
  await assertDraft(input.orderId);

  if(!Number.isInteger(input.quantity) || input.quantity<1 || input.quantity>1000000 || (input.discountPercent!=null && (!Number.isFinite(input.discountPercent)||input.discountPercent<0||input.discountPercent>100))) throw new Error("Enter a positive whole quantity and a discount between 0 and 100.");
  const order = await db.salesOrder.findUniqueOrThrow({ where: { id: input.orderId } });
  const lineCount = await db.salesOrderLine.count({ where: { orderId: input.orderId } });

  let unitPriceAmount = 0;
  let priceSource: string | undefined;
  let descriptionSnapshot = input.descriptionSnapshot ?? "";
  let taxCategory: string | undefined;

  if (input.productId) {
    const product = await db.product.findFirstOrThrow({ where: { id: input.productId, organisationId: session.organisationId, active: true, sellable: true } });
    const resolved = await resolvePrice({
      organisationId: session.organisationId,
      productId: input.productId,
      partyId: order.partyId,
      quantity: input.quantity,
      priceListId: order.priceListId,
    });
    if(resolved.currency!==order.currency) throw new Error("This product price uses a different currency. Choose a matching pricelist.");
    unitPriceAmount = resolved.unitPriceAmount;
    priceSource = resolved.source;
    descriptionSnapshot = descriptionSnapshot || product.name;
    taxCategory = product.taxCategory ?? undefined;
  }

  const line = await db.salesOrderLine.create({
    data: {
      orderId: input.orderId,
      lineNumber: lineCount + 1,
      type: input.type ?? "PRODUCT",
      productId: input.productId,
      descriptionSnapshot,
      orderedQuantity: input.quantity,
      unitPriceAmount,
      priceSource,
      discountPercent: input.discountPercent ?? 0,
      netAmount: unitPriceAmount * input.quantity,
      taxCategory,
      requestedDeliveryDate: input.requestedDeliveryDate,
    },
  });

  await recalcOrderTotals(input.orderId,session.organisationId);
  await emit(DOMAIN_EVENTS.salesOrderLineAdded, { orderId: input.orderId, lineId: line.id });

  revalidatePath(`/sales/orders/${input.orderId}`);
  return line;
}

export async function removeOrderLine(lineId: string, orderId: string) {
  const session = await requireSession();
  assertCapability(session, SALES_CAPABILITIES.orderEditDraft);
  await assertModuleEnabled(session, "sales");
  await assertOwnedByOrg(session.organisationId, orderId);
  await assertDraft(orderId);

  await db.salesOrderLine.delete({ where: { id: lineId, orderId } });
  await recalcOrderTotals(orderId,session.organisationId);

  revalidatePath(`/sales/orders/${orderId}`);
}

export async function updateDraftOrderFields(
  orderId: string,
  data: { customerPoReference?: string; requestedDeliveryDate?: Date; internalNotes?: string; customerNotes?: string; deliveryInstructions?: string },
) {
  const session = await requireSession();
  assertCapability(session, SALES_CAPABILITIES.orderEditDraft);
  await assertModuleEnabled(session, "sales");
  await assertOwnedByOrg(session.organisationId, orderId);
  await assertDraft(orderId);

  await db.salesOrder.update({ where: { id: orderId }, data });
  revalidatePath(`/sales/orders/${orderId}`);
}

// ---------- Confirmation ----------

/**
 * Validates, runs the credit check (§28, §35), and either confirms the
 * order or raises an approval request — never both silently. Confirmation
 * snapshots invoice/delivery addresses so later customer changes never
 * rewrite what this order actually shipped to (§5).
 */
export async function confirmOrder(orderId: string) {
  const session = await requireSession();
  assertCapability(session, SALES_CAPABILITIES.orderConfirm);
  await assertModuleEnabled(session, "sales");
  const existing = await assertOwnedByOrg(session.organisationId, orderId);
  if (existing.commercialStatus !== "DRAFT" && existing.commercialStatus !== "PENDING_APPROVAL") {
    throw new Error("NOT_CONFIRMABLE: order is not in a confirmable state");
  }

  const order = await db.salesOrder.findUniqueOrThrow({
    where: { id: orderId },
    include: { lines: true, party: { include: { addresses: true, contacts: true, commercialSettings:true } } },
  });

  if(["ON_HOLD","INACTIVE","CLOSED"].includes(order.party.status))throw new Error("This customer account is unavailable for new sales.");
  validateConfirmation({...order,commercialSettings:order.party.commercialSettings});
  const {prepareExportProforma,issueExportProforma}=await import("./proforma");
  await prepareExportProforma(session.organisationId,orderId);
  for(const line of order.lines.filter(l=>!['SECTION','NOTE'].includes(l.type))){const tax=await resolveStandardUkVat({sellingOrganisationId:session.organisationId,partyId:order.partyId,deliveryCountry:(order.deliveryAddressSnapshot as {country?:string}|null)?.country??null,productTaxCategory:line.taxCategory,transactionDate:new Date(),netAmount:line.netAmount});if(tax.treatment==='UNDETERMINED')throw new Error('Tax treatment needs review before this order can be confirmed.');if(tax.amount!==line.taxAmount)throw new Error('Tax totals are out of date. Edit and save the draft before confirming.');}

  const policy=await db.organisation.findUniqueOrThrow({where:{id:session.organisationId},select:{salesPolicy:true}});
  const approvalReason = requiresApproval(order, order.lines,policy.salesPolicy);
  const alreadyApproved = await db.orderApproval.findFirst({ where: { orderId, status: "APPROVED",revision:order.revision } });

  if (approvalReason && !alreadyApproved) {
    if(!await db.orderApproval.findFirst({where:{orderId,status:"PENDING",revision:order.revision}}))await db.orderApproval.create({ data: { orderId, revision:order.revision,reason: approvalReason, requestedByUserId: session.userId } });
    await db.salesOrder.update({ where: { id: orderId }, data: { commercialStatus: "PENDING_APPROVAL" } });
    await writeAudit({
      organisationId: session.organisationId,
      actorUserId: session.userId,
      action: "order.approval_requested",
      entityType: "SalesOrder",
      entityId: orderId,
      after: { reason: approvalReason },
    });
    revalidatePath(`/sales/orders/${orderId}`);
    return { confirmed: false, reason: approvalReason };
  }

  if(order.orderType==="BLANKET")throw new Error("A blanket commitment is a call-off agreement, not a sales order.");
  if(order.orderType==="CALL_OFF"&&!order.agreementId)throw new Error("Choose the call-off agreement before confirming.");
  await assertSalesTradingLink(session.organisationId,order.partyId,order.pricingPartyId);
  await assertProductsSellable(db, session.organisationId, order.lines.map((line) => line.productId));
  const credit = await checkOrderCredit(orderId);
  if (credit.status === "HOLD") {
    await db.orderHold.create({
      data: { orderId, type: "CREDIT", reason: credit.explanation, createdByUserId: session.userId },
    });
    await db.salesOrder.update({ where: { id: orderId }, data: { commercialStatus: "ON_HOLD" } });
    await writeAudit({
      organisationId: session.organisationId,
      actorUserId: session.userId,
      action: "order.credit_hold_added",
      entityType: "SalesOrder",
      entityId: orderId,
      after: { explanation: credit.explanation },
    });
    await emit(DOMAIN_EVENTS.salesOrderHoldAdded, { orderId, type: "CREDIT" });
    revalidatePath(`/sales/orders/${orderId}`);
    return { confirmed: false, reason: credit.explanation };
  }

  const confirmed=await db.$transaction(async tx=>{
   await assertProductsSellable(tx, session.organisationId, order.lines.map((line) => line.productId));
   if(order.orderType==='CALL_OFF'&&order.agreementId){const {assertCallOffCapacity,lockAgreement}=await import('./call-off-balance');await lockAgreement(tx,session.organisationId,order.agreementId);await assertCallOffCapacity(tx,{organisationId:session.organisationId,agreementId:order.agreementId,partyId:order.partyId,pricingPartyId:order.pricingPartyId,currency:order.currency,orderId,lines:order.lines});}
   const confirmed=await tx.salesOrder.update({where:{id:orderId,organisationId:session.organisationId,updatedAt:order.updatedAt,commercialStatus:order.commercialStatus},data:{commercialStatus:'CONFIRMED',confirmationDate:new Date()}});
   await issueExportProforma(tx,session.organisationId,orderId);
   await tx.salesOrderRevision.create({data:{orderId,revision:confirmed.revision,snapshot:commercialSnapshot({...confirmed,lines:order.lines}),reason:'Order confirmation',createdByUserId:session.userId}});
   await tx.orderChangeEvent.create({data:{orderId,type:'STATUS',fromValue:order.commercialStatus,toValue:'CONFIRMED',changedByUserId:session.userId}});
   await tx.auditEntry.create({data:{organisationId:session.organisationId,actorUserId:session.userId,action:'order.confirmed',entityType:'SalesOrder',entityId:orderId,before:{status:order.commercialStatus},after:{status:'CONFIRMED',reference:confirmed.reference,grossAmount:confirmed.grossAmount,revision:confirmed.revision}}});
   await tx.domainOutbox.create({data:{organisationId:session.organisationId,eventKey:`sales.order.confirmed:${orderId}:${confirmed.revision}`,eventName:DOMAIN_EVENTS.salesOrderConfirmed,payload:JSON.parse(JSON.stringify(salesHandoff(confirmed)))}});
   return confirmed;
  });
  await writeActivity({
    organisationId: session.organisationId,
    type: DOMAIN_EVENTS.salesOrderConfirmed,
    summary: `Order ${confirmed.reference} confirmed — ${formatMoney(confirmed.grossAmount, confirmed.currency)}`,
    entityType: "SalesOrder",
    entityId: orderId,
    partyId: confirmed.partyId,
  });
  await emit(DOMAIN_EVENTS.salesOrderConfirmed, { orderId, organisationId: session.organisationId });
  if (order.orderType === "CALL_OFF") {
    const { handoffDeliveredShipment } = await import("@/core/finance/handoff");
    await handoffDeliveredShipment(session, {
      shipmentId: `call-off-release:${orderId}`,
      shipmentReference: confirmed.reference,
      deliveredAt: order.requestedDeliveryDate ?? new Date(),
      lines: order.lines.flatMap((line) => line.orderedQuantity > line.cancelledQuantity && !["SECTION", "NOTE"].includes(line.type) ? [{ salesOrderId: orderId, salesOrderLineId: line.id, quantity: line.orderedQuantity - line.cancelledQuantity }] : []),
    });
  }
  const { handoffSalesOrder } = await import("@/core/logistics/handoff");
  await handoffSalesOrder({ kind: "confirmed", organisationId: session.organisationId, orderId, eventKey: `sales.order.confirmed:${orderId}:${confirmed.revision}`, actorUserId: session.userId });
  const restockProducts = order.lines.filter((line) => line.invoiceWhenInStock && line.productId).map((line) => line.productId!);
  if (restockProducts.length) {
    const { invoiceWhenBackInStock } = await import("@/modules/finance/services/restock-invoice");
    await invoiceWhenBackInStock(session, restockProducts);
  }

  revalidatePath("/sales/orders");
  revalidatePath(`/sales/orders/${orderId}`);
  return { confirmed: true };
}

export async function decideApproval(approvalId: string, orderId: string, approve: boolean,decisionReason="") {
  const session = await requireSession();
  assertCapability(session, SALES_CAPABILITIES.orderApprovalApprove);
  await assertModuleEnabled(session, "sales");
  await assertOwnedByOrg(session.organisationId, orderId);

  const order=await db.salesOrder.findFirstOrThrow({where:{id:orderId,organisationId:session.organisationId}});
  if(order.commercialStatus!=="PENDING_APPROVAL")throw new Error("This order is no longer awaiting approval.");
  if(!approve&&!decisionReason.trim())throw new Error("Give a reason for rejecting this approval.");
  await db.orderApproval.update({
    where: { id: approvalId, orderId, status: "PENDING",revision:order.revision },
    data: { status: approve ? "APPROVED" : "REJECTED", decidedByUserId: session.userId, decidedAt: new Date(),decisionReason:decisionReason.trim().slice(0,1000)||null },
  });

  if (!approve) {
    await db.salesOrder.update({ where: { id: orderId }, data: { commercialStatus: "DRAFT" } });
  }

  await writeAudit({
    organisationId: session.organisationId,
    actorUserId: session.userId,
    action: approve ? "order.approval_approved" : "order.approval_rejected",
    entityType: "SalesOrder",
    entityId: orderId,
  });

  revalidatePath(`/sales/orders/${orderId}`);

  if (approve && can(session,SALES_CAPABILITIES.orderConfirm)) {
    return confirmOrder(orderId);
  }
}

// ---------- Amendment (post-confirmation) ----------

export async function amendLineQuantity(lineId: string, orderId: string, newQuantity: number, reason: string) {
  const session = await requireSession();
  assertCapability(session, SALES_CAPABILITIES.orderAmend);
  await assertModuleEnabled(session, "sales");
  await assertOwnedByOrg(session.organisationId, orderId);
  await assertDraft(orderId);

  const line = await db.salesOrderLine.findFirstOrThrow({ where: { id: lineId, orderId } });
  await db.salesOrderLine.update({ where: { id: lineId }, data: { orderedQuantity: newQuantity } });
  await recalcOrderTotals(orderId,session.organisationId);

  await recordChange(orderId, "QUANTITY", String(line.orderedQuantity), String(newQuantity), session.userId, reason, lineId);
  await writeAudit({
    organisationId: session.organisationId,
    actorUserId: session.userId,
    action: "order.line_quantity_amended",
    entityType: "SalesOrderLine",
    entityId: lineId,
    before: { orderedQuantity: line.orderedQuantity },
    after: { orderedQuantity: newQuantity },
  });
  await emit(DOMAIN_EVENTS.salesOrderLineChanged, { orderId, lineId });
  await emit(DOMAIN_EVENTS.salesOrderAmended, { orderId });

  revalidatePath(`/sales/orders/${orderId}`);
}

export async function overrideLinePrice(lineId: string, orderId: string, newUnitPriceAmount: number, reason: string) {
  const session = await requireSession();
  assertCapability(session, SALES_CAPABILITIES.orderPriceOverride);
  await assertModuleEnabled(session, "sales");
  await assertOwnedByOrg(session.organisationId, orderId);
  await assertDraft(orderId);

  const line = await db.salesOrderLine.findFirstOrThrow({ where: { id: lineId, orderId } });
  await db.salesOrderLine.update({ where: { id: lineId }, data: { unitPriceAmount: newUnitPriceAmount, priceSource: `Manual override — ${reason}` } });
  await recalcOrderTotals(orderId,session.organisationId);

  await recordChange(
    orderId,
    "PRICE_OVERRIDE",
    formatMoney(line.unitPriceAmount, "GBP"),
    formatMoney(newUnitPriceAmount, "GBP"),
    session.userId,
    reason,
    lineId,
  );
  await writeAudit({
    organisationId: session.organisationId,
    actorUserId: session.userId,
    action: "order.line_price_overridden",
    entityType: "SalesOrderLine",
    entityId: lineId,
    before: { unitPriceAmount: line.unitPriceAmount },
    after: { unitPriceAmount: newUnitPriceAmount, reason },
  });
  await emit(DOMAIN_EVENTS.salesOrderLineChanged, { orderId, lineId });

  revalidatePath(`/sales/orders/${orderId}`);
}

export async function amendRequestedDate(orderId: string, newDate: Date, reason: string) {
  const session = await requireSession();
  assertCapability(session, SALES_CAPABILITIES.orderAmend);
  await assertModuleEnabled(session, "sales");
  await assertOwnedByOrg(session.organisationId, orderId);

  const order = await db.salesOrder.findUniqueOrThrow({ where: { id: orderId } });
  await assertDraft(orderId);
  await db.salesOrder.update({ where: { id: orderId }, data: { requestedDeliveryDate: newDate } });

  await recordChange(
    orderId,
    "REQUESTED_DATE",
    order.requestedDeliveryDate?.toLocaleDateString("en-GB") ?? null,
    newDate.toLocaleDateString("en-GB"),
    session.userId,
    reason,
  );
  await emit(DOMAIN_EVENTS.salesOrderAmended, { orderId });

  revalidatePath(`/sales/orders/${orderId}`);
}

// ---------- Cancellation ----------

export async function cancelOrder(orderId: string, reason: string) {
  const session = await requireSession();
  assertCapability(session, SALES_CAPABILITIES.orderCancel);
  await assertModuleEnabled(session, "sales");
  await assertOwnedByOrg(session.organisationId, orderId);

  if(!reason.trim())throw new Error('Enter a cancellation reason.');
  await db.$transaction(async tx=>{
    const order=await tx.salesOrder.findFirstOrThrow({where:{id:orderId,organisationId:session.organisationId},include:{lines:true}});
    await guardFinancialCancellation(session,tx,orderId);if(['CANCELLED','CLOSED'].includes(order.commercialStatus))throw new Error('This order is already cancelled or closed.');
    const changed=await tx.salesOrder.updateMany({where:{id:orderId,organisationId:session.organisationId,updatedAt:order.updatedAt},data:{commercialStatus:'CANCELLED',cancelledAt:new Date(),revision:{increment:1},netAmount:0,taxAmount:0,grossAmount:0,discountAmount:0}});
    if(changed.count!==1)throw new Error('This order changed. Reload before cancelling.');
    if(!await tx.salesOrderRevision.findUnique({where:{orderId_revision:{orderId,revision:order.revision}}}))await tx.salesOrderRevision.create({data:{orderId,revision:order.revision,snapshot:commercialSnapshot(order),reason:'Commercial position before cancellation',createdByUserId:session.userId}});
    for(const line of order.lines)await tx.salesOrderLine.update({where:{id:line.id},data:{cancelledQuantity:line.orderedQuantity,netAmount:0,taxAmount:0}});
    const cancelled=await tx.salesOrder.findUniqueOrThrow({where:{id:orderId},include:{lines:true}});
    await tx.salesOrderRevision.create({data:{orderId,revision:cancelled.revision,snapshot:commercialSnapshot(cancelled),reason,createdByUserId:session.userId}});
    await tx.orderChangeEvent.create({data:{orderId,type:'CANCELLATION',changedByUserId:session.userId,fromValue:order.commercialStatus,toValue:'CANCELLED',reason}});
    await tx.auditEntry.create({data:{organisationId:session.organisationId,actorUserId:session.userId,action:'order.cancelled',entityType:'SalesOrder',entityId:orderId,before:{grossAmount:order.grossAmount,status:order.commercialStatus},after:{reason,status:'CANCELLED',revision:cancelled.revision}}});
    await tx.domainOutbox.create({data:{organisationId:session.organisationId,eventKey:`sales.order.cancelled:${orderId}:${cancelled.revision}`,eventName:'sales.order.cancelled',payload:{orderId,revision:cancelled.revision,reason}}});
  },{isolationLevel:'Serializable'});
  await emit(DOMAIN_EVENTS.salesOrderCancelled, { orderId, organisationId: session.organisationId });
  const cancelledOrder = await db.salesOrder.findFirst({ where: { id: orderId, organisationId: session.organisationId }, select: { revision: true } });
  const { handoffSalesOrder } = await import("@/core/logistics/handoff");
  await handoffSalesOrder({ kind: "cancelled", organisationId: session.organisationId, orderId, eventKey: `sales.order.cancelled:${orderId}:${cancelledOrder?.revision ?? 0}`, actorUserId: session.userId });

  revalidatePath("/sales/orders");
  revalidatePath(`/sales/orders/${orderId}`);
}

export async function deleteOrder(orderId: string) {
  const session = await requireSession();
  assertCapability(session, SALES_CAPABILITIES.orderEditDraft);
  await assertModuleEnabled(session, "sales");
  await assertOwnedByOrg(session.organisationId, orderId);

  const order = await db.salesOrder.findFirstOrThrow({where:{id:orderId,organisationId:session.organisationId}});
  if(order.commercialStatus!=='DRAFT')throw new Error('Only draft orders can be deleted.');

  await db.$transaction(async tx=>{
    await tx.salesOrderLine.deleteMany({where:{orderId}});
    await tx.salesOrderRevision.deleteMany({where:{orderId}});
    await tx.orderChangeEvent.deleteMany({where:{orderId}});
    await tx.orderHold.deleteMany({where:{orderId}});
    await tx.orderApproval.deleteMany({where:{orderId}});
    await tx.salesOrder.delete({where:{id:orderId}});
    await tx.auditEntry.create({data:{organisationId:session.organisationId,actorUserId:session.userId,action:'order.deleted',entityType:'SalesOrder',entityId:orderId,before:{reference:order.reference,status:order.commercialStatus},after:{}}});
  });

  revalidatePath("/sales/orders");
}

/** Cancels the remaining open quantity on one line — §39: already-shipped
 *  quantity is never simply deleted. Since no Logistics module exists yet,
 *  "shipped" is always 0 today, so the maximum cancellable is the full
 *  remaining open quantity; the cap is computed so it keeps working once a
 *  real fulfilment projection exists. */
export async function cancelLineRemaining(lineId: string, orderId: string, cancelQuantity: number, reason: string) {
  const session = await requireSession();
  assertCapability(session, SALES_CAPABILITIES.orderCancel);
  await assertModuleEnabled(session, "sales");
  await assertOwnedByOrg(session.organisationId, orderId);

  const cancellable=await db.salesOrder.findFirstOrThrow({where:{id:orderId,organisationId:session.organisationId}});if(cancellable.commercialStatus!=='DRAFT')throw new Error('Confirmed line cancellation requires a revision and fulfilment/Finance review; use the guarded whole-order cancellation.');
  const line = await db.salesOrderLine.findFirstOrThrow({ where: { id: lineId, orderId } });
  const { shippedQuantityForLine } = await import("@/core/logistics/handoff");
  const shippedQuantity = await shippedQuantityForLine(session.organisationId, orderId, lineId);
  const maxCancellable = line.orderedQuantity - line.cancelledQuantity - shippedQuantity;
  if (cancelQuantity > maxCancellable) {
    throw new Error(`VALIDATION: maximum cancellable quantity is ${maxCancellable}`);
  }

  await db.salesOrderLine.update({ where: { id: lineId }, data: { cancelledQuantity: line.cancelledQuantity + cancelQuantity } });
  await recalcOrderTotals(orderId,session.organisationId);

  await recordChange(orderId, "QUANTITY", String(line.cancelledQuantity), String(line.cancelledQuantity + cancelQuantity), session.userId, reason, lineId);
  await emit(DOMAIN_EVENTS.salesOrderLineCancelled, { orderId, lineId });

  revalidatePath(`/sales/orders/${orderId}`);
}

// ---------- Holds ----------

export async function addHold(orderId: string, type: OrderHoldType, reason: string) {
  const session = await requireSession();
  assertCapability(session, SALES_CAPABILITIES.orderHoldManage);
  await assertModuleEnabled(session, "sales");
  await assertOwnedByOrg(session.organisationId, orderId);

  await db.orderHold.create({ data: { orderId, type, reason, createdByUserId: session.userId } });
  await db.salesOrder.update({ where: { id: orderId }, data: { commercialStatus: "ON_HOLD" } });

  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "order.hold_added", entityType: "SalesOrder", entityId: orderId, after: { type, reason } });
  await emit(DOMAIN_EVENTS.salesOrderHoldAdded, { orderId, type });
  const { handoffSalesOrder } = await import("@/core/logistics/handoff");
  await handoffSalesOrder({ kind: "hold_added", organisationId: session.organisationId, orderId, eventKey: `sales.order.hold_added:${orderId}:${type}:${Date.now()}`, actorUserId: session.userId });

  revalidatePath(`/sales/orders/${orderId}`);
}

export async function releaseHold(holdId: string, orderId: string) {
  const session = await requireSession();
  assertCapability(session, SALES_CAPABILITIES.orderHoldManage);
  await assertModuleEnabled(session, "sales");
  await assertOwnedByOrg(session.organisationId, orderId);

  await db.orderHold.update({ where: { id: holdId, orderId, releasedAt: null }, data: { releasedByUserId: session.userId, releasedAt: new Date() } });

  const openHolds = await db.orderHold.count({ where: { orderId, releasedAt: null } });
  if (openHolds === 0) {
    const order = await db.salesOrder.findUniqueOrThrow({where:{id:orderId}});
    await db.salesOrder.update({ where: { id: orderId }, data: { commercialStatus: order.confirmationDate ? "CONFIRMED" : "DRAFT" } });
  }

  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "order.hold_released", entityType: "SalesOrder", entityId: orderId });
  await emit(DOMAIN_EVENTS.salesOrderHoldReleased, { orderId, holdId });
  const { handoffSalesOrder } = await import("@/core/logistics/handoff");
  await handoffSalesOrder({ kind: "hold_released", organisationId: session.organisationId, orderId, eventKey: `sales.order.hold_released:${holdId}`, actorUserId: session.userId });

  revalidatePath(`/sales/orders/${orderId}`);
}
