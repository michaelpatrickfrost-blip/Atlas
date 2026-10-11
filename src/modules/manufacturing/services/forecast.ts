"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/core/db/client";
import { requireSession } from "@/core/auth/session";
import { assertModuleEnabled } from "@/core/modules/access";
import { assertCapability } from "@/core/permissions/check";
import { writeAudit } from "@/core/audit/log";
import { MANUFACTURING_CAPABILITIES as C } from "@/core/permissions/capabilities";

/** Monthly total demand. Confirmed gross bookings consume both manual and
 * published S&OP forecasts. The demand workbench reviews Sales history and
 * assumptions; approved S&OP rows are changed through their owning cycle. */
export async function listForecasts(organisationId: string, monthsAhead = 6) {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + monthsAhead);
  const rows = await db.manufacturingDemandForecast.findMany({
    where: { organisationId, periodStart: { gte: start, lt: end } },
    include: { product: { select: { name: true, code: true } } },
    orderBy: [{ periodStart: "asc" }, { product: { name: "asc" } }],
  });
  return rows.map((r) => ({ id: r.id, productId: r.productId, product: r.product.name, productCode: r.product.code, periodStart: r.periodStart, quantity: Number(r.quantity), notes: r.notes, published: Boolean(r.sourceSopVersionId) }));
}

export async function setForecast(input: { productId: string; periodStart: Date; quantity: number; notes?: string | null }) {
  const session = await requireSession();
  assertCapability(session, C.planManage);
  await assertModuleEnabled(session, "manufacturing");
  if (!Number.isFinite(input.quantity) || input.quantity < 0 || input.quantity > 1_000_000_000) throw new Error("Enter a finite non-negative forecast quantity.");
  if (!Number.isFinite(new Date(input.periodStart).getTime())) throw new Error("Enter a valid forecast month.");
  if (!await db.product.findFirst({ where: { id: input.productId, organisationId: session.organisationId, active: true, kind: "PRODUCT" } })) throw new Error("Choose an active product in this company.");
  const periodStart = new Date(input.periodStart);
  periodStart.setUTCDate(1);
  periodStart.setUTCHours(0, 0, 0, 0);
  await db.$transaction(async (tx) => {
  const prior = await tx.manufacturingDemandForecast.findFirst({ where: { organisationId: session.organisationId, productId: input.productId, periodStart } });
  if (prior?.sourceSopVersionId) throw new Error("Approved S&OP demand must be revised and published through S&OP.");
  const saved = await tx.manufacturingDemandForecast.upsert({
    where: { organisationId_productId_periodStart: { organisationId: session.organisationId, productId: input.productId, periodStart } },
    create: { organisationId: session.organisationId, productId: input.productId, periodStart, quantity: input.quantity, notes: input.notes ?? null, createdByUserId: session.userId },
    update: { quantity: input.quantity, notes: input.notes ?? null, sourceSopVersionId: null },
  });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "manufacturing.forecast.set", entityType: "ManufacturingDemandForecast", entityId: saved.id, after: { productId: input.productId, periodStart, quantity: input.quantity } }, tx);
  }, { isolationLevel: "Serializable" });
  revalidatePath("/manufacturing/planning/forecast");
}

export async function deleteForecast(forecastId: string) {
  const session = await requireSession();
  assertCapability(session, C.planManage);
  await assertModuleEnabled(session, "manufacturing");
  const deleted = await db.manufacturingDemandForecast.deleteMany({ where: { id: forecastId, organisationId: session.organisationId, sourceSopVersionId: null } });
  if (!deleted.count) throw new Error("This forecast no longer exists or is approved S&OP demand. Revise approved demand through S&OP.");
  revalidatePath("/manufacturing/planning/forecast");
}
