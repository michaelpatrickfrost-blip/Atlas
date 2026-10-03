"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/core/db/client";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { SALES_CAPABILITIES } from "@/core/permissions/capabilities";
import { writeAudit } from "@/core/audit/log";
import { writeActivity } from "@/core/activity/log";
import { emit, DOMAIN_EVENTS } from "@/core/events/bus";
import { formatMoney } from "@/core/shared/money";
import type { OpportunityStage } from "@/generated/prisma/client";

export async function moveOpportunityStage(opportunityId: string, stage: OpportunityStage) {
  const session = await requireSession();
  assertCapability(session, SALES_CAPABILITIES.opportunityManage);

  const before = await db.opportunity.findFirstOrThrow({
    where: { id: opportunityId, organisationId: session.organisationId },
  });

  const after = await db.opportunity.update({
    where: { id: opportunityId },
    data: { stage },
  });

  await writeAudit({
    organisationId: session.organisationId,
    actorUserId: session.userId,
    action: "opportunity.stage_changed",
    entityType: "Opportunity",
    entityId: opportunityId,
    before: { stage: before.stage },
    after: { stage: after.stage },
  });

  if (stage === "WON") {
    await writeActivity({
      organisationId: session.organisationId,
      type: DOMAIN_EVENTS.salesOpportunityWon,
      summary: `${session.userName} won ${after.name}`,
      entityType: "Opportunity",
      entityId: opportunityId,
      partyId: after.partyId,
      metadata: { valueAmount: after.valueAmount, valueCurrency: after.valueCurrency },
    });
    await emit(DOMAIN_EVENTS.salesOpportunityWon, { opportunityId, organisationId: session.organisationId });
  }

  revalidatePath("/sales/pipeline");
}

export async function sendQuote(quoteId: string) {
  const session = await requireSession();
  assertCapability(session, SALES_CAPABILITIES.quoteCreate);

  const quote = await db.quote.update({
    where: { id: quoteId },
    data: { status: "SENT" },
  });

  await writeActivity({
    organisationId: session.organisationId,
    type: DOMAIN_EVENTS.salesQuoteSent,
    summary: `Quote ${quote.reference} sent — ${formatMoney(quote.totalAmount, quote.totalCurrency)}`,
    entityType: "Quote",
    entityId: quote.id,
    partyId: quote.partyId,
  });

  revalidatePath("/sales/quotes");
}

export async function confirmSalesOrderFromQuote(quoteId: string) {
  const session = await requireSession();
  assertCapability(session, SALES_CAPABILITIES.orderManage);

  const quote = await db.quote.findFirstOrThrow({
    where: { id: quoteId, organisationId: session.organisationId },
  });

  const reference = `SO-${Math.floor(1000 + Math.random() * 9000)}`;

  const order = await db.salesOrder.create({
    data: {
      organisationId: session.organisationId,
      partyId: quote.partyId,
      quoteId: quote.id,
      reference,
      totalAmount: quote.totalAmount,
      totalCurrency: quote.totalCurrency,
    },
  });

  await db.quote.update({ where: { id: quote.id }, data: { status: "ACCEPTED" } });

  await writeActivity({
    organisationId: session.organisationId,
    type: DOMAIN_EVENTS.salesOrderConfirmed,
    summary: `Sales order ${order.reference} confirmed — ${formatMoney(order.totalAmount, order.totalCurrency)}`,
    entityType: "SalesOrder",
    entityId: order.id,
    partyId: order.partyId,
  });
  await emit(DOMAIN_EVENTS.salesOrderConfirmed, { orderId: order.id, organisationId: session.organisationId });

  revalidatePath("/sales/orders");
  revalidatePath("/sales/quotes");
}
