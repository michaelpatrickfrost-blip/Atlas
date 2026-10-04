"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@/generated/prisma/client";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { SALES_CAPABILITIES } from "@/core/permissions/capabilities";
import { assertModuleEnabled } from "@/core/modules/access";
import { db } from "@/core/db/client";
import { emit, DOMAIN_EVENTS } from "@/core/events/bus";
import { positionBeforeCancellation, quotationLinesFrom } from "@/modules/sales/domain/rewind";
import { commercialSnapshot } from "./revisions";
import { shippedQuantityForLine } from "@/core/logistics/handoff";

const json = (value: unknown) => (value == null ? undefined : (value as Prisma.InputJsonValue));

async function liveOrder(organisationId: string, orderId: string) {
  return db.salesOrder.findFirstOrThrow({
    where: { id: orderId, organisationId },
    include: { lines: { orderBy: { lineNumber: "asc" } } },
  });
}

async function assertNothingShipped(organisationId: string, orderId: string, lineIds: string[]) {
  for (const lineId of lineIds) {
    if ((await shippedQuantityForLine(organisationId, orderId, lineId)) > 0) {
      throw new Error("Goods have already left on this order. It cannot be wound back.");
    }
  }
}

/** Puts a cancelled order back to the commercial position saved just before the cancellation. */
export async function restoreCancelledOrder(orderId: string) {
  const session = await requireSession();
  assertCapability(session, SALES_CAPABILITIES.orderCancel);
  await assertModuleEnabled(session, "sales");
  const order = await liveOrder(session.organisationId, orderId);
  if (order.commercialStatus !== "CANCELLED") throw new Error("This order is not cancelled.");
  await assertNothingShipped(session.organisationId, orderId, order.lines.map((line) => line.id));

  const restored = await db.$transaction(async (tx) => {
    const current = await tx.salesOrder.findFirstOrThrow({ where: { id: orderId, organisationId: session.organisationId }, include: { lines: true } });
    if (current.commercialStatus !== "CANCELLED") throw new Error("This order is not cancelled.");
    const finance = await tx.financeDocument.findFirst({
      where: { organisationId: session.organisationId, salesOrderId: orderId, status: { not: "CANCELLED" } },
      select: { reference: true },
    });
    if (finance) throw new Error(`Finance already has ${finance.reference}. Reverse that before putting this order back.`);
    const event = await tx.orderChangeEvent.findFirst({ where: { orderId, type: "CANCELLATION" }, orderBy: { createdAt: "desc" } });
    const revision = await tx.salesOrderRevision.findFirst({
      where: { orderId, reason: "Commercial position before cancellation" },
      orderBy: { revision: "desc" },
    });
    if (!revision) throw new Error("The earlier commercial position was not kept, so this cancellation cannot be wound back.");
    const position = positionBeforeCancellation(revision.snapshot, event?.fromValue ?? null);
    const changed = await tx.salesOrder.updateMany({
      where: { id: orderId, organisationId: session.organisationId, commercialStatus: "CANCELLED", updatedAt: current.updatedAt },
      data: {
        commercialStatus: position.commercialStatus,
        cancelledAt: null,
        netAmount: position.netAmount,
        taxAmount: position.taxAmount,
        grossAmount: position.grossAmount,
        discountAmount: position.discountAmount,
        revision: { increment: 1 },
      },
    });
    if (changed.count !== 1) throw new Error("This order changed. Reload it.");
    for (const line of position.lines) {
      await tx.salesOrderLine.updateMany({
        where: { id: line.id, orderId },
        data: { cancelledQuantity: line.cancelledQuantity, netAmount: line.netAmount, taxAmount: line.taxAmount },
      });
    }
    const saved = await tx.salesOrder.findUniqueOrThrow({ where: { id: orderId }, include: { lines: true } });
    await tx.salesOrderRevision.create({
      data: { orderId, revision: saved.revision, snapshot: commercialSnapshot(saved), reason: "Cancellation wound back", createdByUserId: session.userId },
    });
    await tx.orderChangeEvent.create({
      data: { orderId, type: "STATUS", fromValue: "CANCELLED", toValue: position.commercialStatus, reason: "Cancellation wound back", changedByUserId: session.userId },
    });
    await tx.auditEntry.create({
      data: {
        organisationId: session.organisationId,
        actorUserId: session.userId,
        action: "order.cancellation_reversed",
        entityType: "SalesOrder",
        entityId: orderId,
        before: { status: "CANCELLED" },
        after: { status: position.commercialStatus, revision: saved.revision },
      },
    });
    await tx.domainOutbox.create({
      data: {
        organisationId: session.organisationId,
        eventKey: `sales.order.reinstated:${orderId}:${saved.revision}`,
        eventName: "sales.order.amended",
        payload: { orderId, revision: saved.revision, change: "reinstated" },
      },
    });
    return saved;
  });

  await emit(DOMAIN_EVENTS.salesOrderAmended, { orderId, organisationId: session.organisationId, change: "reinstated" });
  const { handoffSalesOrder } = await import("@/core/logistics/handoff");
  await handoffSalesOrder({
    kind: "amended",
    organisationId: session.organisationId,
    orderId,
    eventKey: `sales.order.reinstated:${orderId}:${restored.revision}`,
    actorUserId: session.userId,
  });
  revalidatePath("/sales/orders");
  revalidatePath(`/sales/orders/${orderId}`);
  revalidatePath("/logistics/fulfil");
}

/** Copies the order onto a draft quotation and, when the order is still live, cancels that order. */
export async function returnOrderToQuote(orderId: string) {
  const session = await requireSession();
  assertCapability(session, SALES_CAPABILITIES.quoteCreate);
  assertCapability(session, SALES_CAPABILITIES.orderCancel);
  await assertModuleEnabled(session, "sales");
  const order = await liveOrder(session.organisationId, orderId);
  if (order.commercialStatus === "CLOSED") throw new Error("A closed order stays closed.");
  if (order.orderType === "CALL_OFF" || order.agreementId) throw new Error("A call-off stays on its agreement. It cannot become a quotation.");
  await assertNothingShipped(session.organisationId, orderId, order.lines.map((line) => line.id));

  const quoteId = await db.$transaction(async (tx) => {
    const current = await tx.salesOrder.findFirstOrThrow({
      where: { id: orderId, organisationId: session.organisationId },
      include: { lines: { orderBy: { lineNumber: "asc" } } },
    });
    if (current.commercialStatus === "CLOSED") throw new Error("A closed order stays closed.");
    const finance = await tx.financeDocument.findFirst({
      where: { organisationId: session.organisationId, salesOrderId: orderId, status: { not: "CANCELLED" } },
      select: { reference: true },
    });
    if (finance) throw new Error(`Finance already has ${finance.reference}. Reverse that before turning this order into a quotation.`);
    const source = current.commercialStatus === "CANCELLED"
      ? ((await tx.salesOrderRevision.findFirst({ where: { orderId, reason: "Commercial position before cancellation" }, orderBy: { revision: "desc" } }))?.snapshot as { lines?: unknown[] } | undefined)?.lines ?? []
      : current.lines;
    const lines = quotationLinesFrom(source);
    const netAmount = lines.reduce((sum, line) => sum + line.netAmount, 0);
    const taxAmount = lines.reduce((sum, line) => sum + line.taxAmount, 0);
    const quoteFields = {
      partyId: current.partyId,
      pricingPartyId: current.pricingPartyId,
      opportunityId: current.opportunityId,
      projectId: current.projectId,
      status: "DRAFT" as const,
      kind: "STANDARD" as const,
      customerNotes: current.customerNotes,
      externalReference: current.externalReference,
      customerPoReference: current.customerPoReference,
      tags: current.tags,
      deliveryInstructions: current.deliveryInstructions,
      financeInstructions: current.financeInstructions,
      invoiceAddressSnapshot: json(current.invoiceAddressSnapshot),
      deliveryAddressSnapshot: json(current.deliveryAddressSnapshot),
      priceListId: current.priceListId,
      paymentTermId: current.paymentTermId,
      invoiceAssignmentId: current.invoiceAssignmentId,
      headerDiscountPercent: current.headerDiscountPercent ?? 0,
      netAmount,
      taxAmount,
      totalAmount: netAmount + taxAmount,
      totalCurrency: current.currency,
      expiryDate: new Date(Date.now() + 30 * 86_400_000),
    };
    const quoteLines = lines.map((line) => ({
      lineNumber: line.lineNumber,
      type: line.type,
      optional: false,
      description: line.description,
      quantity: line.quantity,
      unitAmount: line.unitAmount,
      discountPercent: line.discountPercent,
      netAmount: line.netAmount,
      taxAmount: line.taxAmount,
      taxCategory: line.taxCategory,
      priceSource: line.priceSource ?? "Returned from order",
      unitOfMeasure: line.unitOfMeasure,
      productId: line.productId,
      invoiceWhenInStock: line.invoiceWhenInStock,
      currency: current.currency,
    }));
    let id = current.quoteId;
    if (id) {
      const quote = await tx.quote.findFirst({ where: { id, organisationId: session.organisationId } });
      if (!quote) id = null;
      else {
        await tx.quoteLine.deleteMany({ where: { quoteId: quote.id } });
        await tx.quote.update({ where: { id: quote.id }, data: { ...quoteFields, lines: { create: quoteLines } } });
      }
    }
    if (!id) {
      const created = await tx.quote.create({
        data: {
          ...quoteFields,
          organisationId: session.organisationId,
          ownerUserId: session.userId,
          reference: `Q-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
          lines: { create: quoteLines },
        },
      });
      id = created.id;
    }
    if (current.commercialStatus !== "CANCELLED") {
      if (!await tx.salesOrderRevision.findUnique({ where: { orderId_revision: { orderId, revision: current.revision } } })) {
        await tx.salesOrderRevision.create({
          data: { orderId, revision: current.revision, snapshot: commercialSnapshot(current), reason: "Commercial position before cancellation", createdByUserId: session.userId },
        });
      }
      const changed = await tx.salesOrder.updateMany({
        where: { id: orderId, organisationId: session.organisationId, updatedAt: current.updatedAt },
        data: { commercialStatus: "CANCELLED", cancelledAt: new Date(), quoteId: null, revision: { increment: 1 }, netAmount: 0, taxAmount: 0, grossAmount: 0, discountAmount: 0 },
      });
      if (changed.count !== 1) throw new Error("This order changed. Reload it.");
      for (const line of current.lines) {
        await tx.salesOrderLine.update({ where: { id: line.id }, data: { cancelledQuantity: line.orderedQuantity, netAmount: 0, taxAmount: 0 } });
      }
      const cancelled = await tx.salesOrder.findUniqueOrThrow({ where: { id: orderId }, include: { lines: true } });
      await tx.salesOrderRevision.create({
        data: { orderId, revision: cancelled.revision, snapshot: commercialSnapshot(cancelled), reason: "Returned to a quotation", createdByUserId: session.userId },
      });
      await tx.orderChangeEvent.create({
        data: { orderId, type: "CANCELLATION", fromValue: current.commercialStatus, toValue: "CANCELLED", reason: "Returned to a quotation", changedByUserId: session.userId },
      });
      await tx.domainOutbox.create({
        data: {
          organisationId: session.organisationId,
          eventKey: `sales.order.returned:${orderId}:${cancelled.revision}`,
          eventName: "sales.order.cancelled",
          payload: { orderId, revision: cancelled.revision, reason: "Returned to a quotation" },
        },
      });
    } else if (current.quoteId) {
      await tx.salesOrder.updateMany({ where: { id: orderId, organisationId: session.organisationId }, data: { quoteId: null } });
    }
    await tx.auditEntry.create({
      data: {
        organisationId: session.organisationId,
        actorUserId: session.userId,
        action: "order.returned_to_quote",
        entityType: "Quote",
        entityId: id,
        before: { orderId, status: current.commercialStatus },
        after: { quoteId: id, orderReference: current.reference },
      },
    });
    return id;
  }, { isolationLevel: "Serializable" });

  if (order.commercialStatus !== "CANCELLED") {
    await emit(DOMAIN_EVENTS.salesOrderCancelled, { orderId, organisationId: session.organisationId });
    const cancelled = await db.salesOrder.findFirst({ where: { id: orderId, organisationId: session.organisationId }, select: { revision: true } });
    const { handoffSalesOrder } = await import("@/core/logistics/handoff");
    await handoffSalesOrder({
      kind: "cancelled",
      organisationId: session.organisationId,
      orderId,
      eventKey: `sales.order.returned:${orderId}:${cancelled?.revision ?? 0}`,
      actorUserId: session.userId,
    });
  }
  revalidatePath("/sales/orders");
  revalidatePath(`/sales/orders/${orderId}`);
  revalidatePath("/sales/quotes");
  revalidatePath(`/sales/quotes/${quoteId}`);
  return quoteId;
}

export async function saveOrderHashtags(orderId: string, tags: string[]) {
  const session = await requireSession();
  await assertModuleEnabled(session, "sales");
  const order = await db.salesOrder.findFirst({ where: { id: orderId, organisationId: session.organisationId }, select: { commercialStatus: true } });
  if (!order) throw new Error("NOT_FOUND: order does not belong to this organisation");
  if (order.commercialStatus === "CANCELLED" || order.commercialStatus === "CLOSED") throw new Error("Hashtags stay as they were on a closed order.");
  if (order.commercialStatus === "DRAFT") assertCapability(session, SALES_CAPABILITIES.orderEditDraft);
  else assertCapability(session, SALES_CAPABILITIES.orderAmend);
  await db.salesOrder.updateMany({ where: { id: orderId, organisationId: session.organisationId }, data: { tags } });
  await db.auditEntry.create({
    data: {
      organisationId: session.organisationId,
      actorUserId: session.userId,
      action: "order.hashtags_updated",
      entityType: "SalesOrder",
      entityId: orderId,
      after: { tags },
    },
  });
  revalidatePath(`/sales/orders/${orderId}`);
  revalidatePath("/sales/orders");
}
