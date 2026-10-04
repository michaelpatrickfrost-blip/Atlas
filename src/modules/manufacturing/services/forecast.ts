"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/core/db/client";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { writeAudit } from "@/core/audit/log";
import { MANUFACTURING_CAPABILITIES as C } from "@/core/permissions/capabilities";

/** §33: forecast demand. CRM Opportunities carry a deal value, not a
 * product/quantity line (see docs/modules/MANUFACTURING_COVERAGE.md), so there
 * is nothing upstream yet to consume automatically. Manufacturing owns a
 * plain planner-entered monthly quantity per product instead of blocking on
 * that — `runMrp()` treats it as demand alongside confirmed sales orders. */
export async function listForecasts(organisationId: string, monthsAhead = 6) {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setMonth(end.getMonth() + monthsAhead);
  const rows = await db.manufacturingDemandForecast.findMany({
    where: { organisationId, periodStart: { gte: start, lt: end } },
    include: { product: { select: { name: true, code: true } } },
    orderBy: [{ periodStart: "asc" }, { product: { name: "asc" } }],
  });
  return rows.map((r) => ({ id: r.id, productId: r.productId, product: r.product.name, productCode: r.product.code, periodStart: r.periodStart, quantity: Number(r.quantity), notes: r.notes }));
}

export async function setForecast(input: { productId: string; periodStart: Date; quantity: number; notes?: string | null }) {
  const session = await requireSession();
  assertCapability(session, C.planManage);
  if (input.quantity < 0) throw new Error("Forecast quantity cannot be negative.");
  const periodStart = new Date(input.periodStart);
  periodStart.setDate(1);
  periodStart.setHours(0, 0, 0, 0);
  const saved = await db.manufacturingDemandForecast.upsert({
    where: { organisationId_productId_periodStart: { organisationId: session.organisationId, productId: input.productId, periodStart } },
    create: { organisationId: session.organisationId, productId: input.productId, periodStart, quantity: input.quantity, notes: input.notes ?? null, createdByUserId: session.userId },
    update: { quantity: input.quantity, notes: input.notes ?? null },
  });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "manufacturing.forecast.set", entityType: "ManufacturingDemandForecast", entityId: saved.id, after: { productId: input.productId, periodStart, quantity: input.quantity } });
  revalidatePath("/manufacturing/plan");
}

export async function deleteForecast(forecastId: string) {
  const session = await requireSession();
  assertCapability(session, C.planManage);
  const deleted = await db.manufacturingDemandForecast.deleteMany({ where: { id: forecastId, organisationId: session.organisationId } });
  if (!deleted.count) throw new Error("This forecast line no longer exists.");
  revalidatePath("/manufacturing/plan");
}
