import type { Session } from "@/core/auth/session";
import { getModule } from "@/core/modules/registry";
import { isModuleEnabled } from "@/core/modules/runtime";

export type DeliveredInvoiceLine = { salesOrderId: string; salesOrderLineId: string; quantity: number };
export type DeliveredInvoiceRequest = { shipmentId: string; shipmentReference: string; deliveredAt: Date; lines: DeliveredInvoiceLine[] };

/** Logistics tells Finance that a shipment was delivered. Finance may be off. */
export async function handoffDeliveredShipment(session: Session, request: DeliveredInvoiceRequest): Promise<void> {
  if (!(await isModuleEnabled(session, "finance"))) return;
  if (!request.lines.length) return;
  await getModule("finance")?.deliveryInvoiceConsumer?.(session, request);
}
