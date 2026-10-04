"use server";

import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { db } from "@/core/db/client";
import { runMrp } from "@/modules/manufacturing/services/mrp-calculation";
import { MANUFACTURING_CAPABILITIES } from "@/core/permissions/capabilities";

/**
 * Run MRP for the current organisation.
 */
export async function runMrpAction() {
  const session = await requireSession();
  assertCapability(session, MANUFACTURING_CAPABILITIES.planRead);

  try {
    const result = await runMrp(session.organisationId, session.userId);
    return {
      success: true,
      runId: result.runId,
      message: `MRP run complete: ${result.plannedOrders.length} planned orders, ${result.shortages.length} shortages`,
    };
  } catch (error) {
    console.error("MRP run failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Firm a planned order (convert to manufacturing order or purchase order).
 */
export async function firmPlannedOrderAction(suggestionId: string) {
  const session = await requireSession();
  assertCapability(session, MANUFACTURING_CAPABILITIES.orderCreate);

  const suggestion = await db.manufacturingSupplySuggestion.findUnique({
    where: { id: suggestionId },
    include: { product: true },
  });

  if (!suggestion) {
    return { success: false, error: "Suggestion not found" };
  }

  if (suggestion.organisationId !== session.organisationId) {
    return { success: false, error: "Unauthorised" };
  }

  if (suggestion.kind === "MAKE") {
    // Create manufacturing order
    const counter = await db.manufacturingCounter.upsert({
      where: { organisationId_kind: { organisationId: session.organisationId, kind: "MO" } },
      update: { value: { increment: 1 } },
      create: { organisationId: session.organisationId, kind: "MO", value: 1 },
    });

    const orderNumber = `MO-${String(counter.value).padStart(6, "0")}`;

    const mo = await db.manufacturingOrder.create({
      data: {
        organisationId: session.organisationId,
        orderNumber,
        productId: suggestion.productId,
        quantity: suggestion.quantity,
        requiredDate: suggestion.neededBy || new Date(),
        plannedStart: suggestion.startBy || new Date(),
        status: "PLANNED",
        createdByUserId: session.userId,
      },
    });

    // Update suggestion
    await db.manufacturingSupplySuggestion.update({
      where: { id: suggestionId },
      data: { status: "FIRMED", resultingOrderId: mo.id },
    });

    return { success: true, orderId: mo.id, orderNumber };
  } else {
    // TODO: Create purchase order via Procurement module
    return { success: false, error: "BUY orders not yet implemented" };
  }
}

/**
 * Dismiss a planned order suggestion.
 */
export async function dismissPlannedOrderAction(suggestionId: string) {
  const session = await requireSession();
  assertCapability(session, MANUFACTURING_CAPABILITIES.planRead);

  const suggestion = await db.manufacturingSupplySuggestion.findUnique({
    where: { id: suggestionId },
  });

  if (!suggestion) {
    return { success: false, error: "Suggestion not found" };
  }

  if (suggestion.organisationId !== session.organisationId) {
    return { success: false, error: "Unauthorised" };
  }

  await db.manufacturingSupplySuggestion.update({
    where: { id: suggestionId },
    data: { status: "DISMISSED" },
  });

  return { success: true };
}
