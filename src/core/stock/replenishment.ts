import type { LogisticsActor } from "@/core/logistics/types";
import { writeAudit } from "@/core/audit/log";

/** Stock has increased. Logistics may raise a waiting delivery and its invoice. */
export async function stockReplenished(actor: LogisticsActor, input: { productId: string; warehouseId: string; requestKey: string }) {
  try {
    const { getEnabledModuleIds } = await import("@/core/modules/runtime");
    const { getModule } = await import("@/core/modules/registry");
    if (!(await getEnabledModuleIds(actor.organisationId)).has("logistics")) return;
    await getModule("logistics")?.stockReplenishedConsumer?.(actor, input);
  } catch (error) {
    const message = error instanceof Error ? error.message : "The waiting delivery could not be raised.";
    await writeAudit({
      organisationId: actor.organisationId,
      actorUserId: actor.userId,
      action: "logistics.stock_balance.waiting",
      entityType: "Product",
      entityId: input.productId,
      after: { warehouseId: input.warehouseId, requestKey: input.requestKey, message },
    }).catch(() => undefined);
  }
}
