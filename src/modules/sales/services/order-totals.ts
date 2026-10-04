import { db } from "@/core/db/client";
import { commercialLineNet, settleSale } from "../domain/uk-sale";

export async function recalcOrderTotals(orderId: string, organisationId: string) {
  // Internal recompute step, re-exported only so commands.ts (Quote → Order
  // hand-off) can call it after its own capability checks — never call this
  // directly from a client component.
  const order = await db.salesOrder.findFirstOrThrow({ where: { id: orderId, organisationId }, include: { party: { include: { addresses: true } } } });
  const lines = await db.salesOrderLine.findMany({ where: { orderId } });
  const deliveryAddress = order.party.addresses.find((a) => a.isDefaultDelivery) ?? order.party.addresses[0];
  const country = (order.deliveryAddressSnapshot as { country?: string } | null)?.country ?? deliveryAddress?.country ?? null;
  const active = lines.filter((line) => !["SECTION", "NOTE"].includes(line.type));
  const commercial = active.map((line) => {
    const quantity = line.orderedQuantity - line.cancelledQuantity;
    const net = commercialLineNet(line.unitPriceAmount, quantity, line.discountPercent ?? 0);
    const lineDiscount = line.unitPriceAmount * quantity - net;
    return { line, net, lineDiscount };
  });
  const settlement = settleSale(commercial.map((item) => ({ net: item.net, taxCategory: item.line.taxCategory })), order.headerDiscountPercent ?? 0, country);

  let lineDiscount = 0;
  for (const [index, item] of commercial.entries()) {
    lineDiscount += item.lineDiscount;
    await db.salesOrderLine.update({
      where: { id: item.line.id },
      data: { netAmount: settlement.lines[index].net, taxAmount: settlement.lines[index].tax },
    });
  }

  await db.salesOrder.update({
    where: { id: orderId },
    data: {
      netAmount: settlement.net,
      discountAmount: lineDiscount + settlement.headerDiscount,
      taxAmount: settlement.tax,
      grossAmount: settlement.gross,
    },
  });
}
