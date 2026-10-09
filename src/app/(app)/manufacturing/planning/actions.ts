"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { assertModuleEnabled } from "@/core/modules/access";
import { runMrp } from "@/modules/manufacturing/services/mrp-calculation";
import { firmSuggestion, dismissSuggestion } from "@/modules/manufacturing/services/mrp";
import { MANUFACTURING_CAPABILITIES } from "@/core/permissions/capabilities";

/** Run the rich MRP engine for the current organisation (BOM explosion, netting,
 * per-order hours/machinery/materials/cost), then refresh the planning pages. */
export async function runMrpAction() {
  const session = await requireSession();
  assertCapability(session, MANUFACTURING_CAPABILITIES.planManage);
  for (const capability of ["sales.order.read", "stock.read", "core.products.read", "customers.read"]) assertCapability(session, capability);
  for (const moduleId of ["manufacturing", "sales", "stock", "products"]) await assertModuleEnabled(session, moduleId);

  try {
    const result = await runMrp(session.organisationId, session.userId);
    revalidatePath("/manufacturing/planning");
    revalidatePath("/manufacturing");
    revalidatePath("/manufacturing/planning/planned-orders");
    revalidatePath("/manufacturing/planning/shortages");
    return {
      success: true,
      runId: result.runId,
      message: `MRP run complete: ${result.plannedOrders.length} planned orders, ${result.shortages.length} shortages`,
    };
  } catch (error) {
    console.error("MRP run failed:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/** Firm a MAKE proposal into a real production order. Delegates to the shared,
 * tested firmer so the order number, pegging and shortage note are produced the
 * same way everywhere, and so Buy/Transfer proposals are handed off correctly. */
export async function firmPlannedOrderAction(suggestionId: string) {
  const session = await requireSession();
  assertCapability(session, MANUFACTURING_CAPABILITIES.planFirm);
  try {
    const order = await firmSuggestion(suggestionId);
    revalidatePath("/manufacturing/planning/planned-orders");
    revalidatePath("/manufacturing/planning");
    return { success: true, orderId: order.id, orderNumber: order.orderNumber };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function dismissPlannedOrderAction(suggestionId: string) {
  const session = await requireSession();
  assertCapability(session, MANUFACTURING_CAPABILITIES.planManage);
  try {
    await dismissSuggestion(suggestionId);
    revalidatePath("/manufacturing/planning/planned-orders");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
