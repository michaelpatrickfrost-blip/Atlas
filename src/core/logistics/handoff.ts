import type { SalesLogisticsEvent } from "@/core/logistics/types";
import { getModule } from "@/core/modules/registry";
import { getEnabledModuleIds } from "@/core/modules/runtime";

/** Sales asks Logistics to consume a commercial event. Logistics may be disabled. */
export async function handoffSalesOrder(event: SalesLogisticsEvent): Promise<void> {
  if (!(await getEnabledModuleIds(event.organisationId)).has("logistics")) return;
  await getModule("logistics")?.salesLogisticsConsumer?.(event);
}

export async function shippedQuantityForLine(organisationId: string, orderId: string, lineId: string): Promise<number> {
  if (!(await getEnabledModuleIds(organisationId)).has("logistics")) return 0;
  const projection = await getModule("logistics")?.fulfilmentProjectionProvider?.({ organisationId, orderId });
  return projection?.lines.find((line) => line.lineId === lineId)?.shippedQuantity ?? 0;
}
