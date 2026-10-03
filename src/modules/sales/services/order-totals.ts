import { db } from "@/core/db/client";
import { resolveStandardUkVat } from "./tax-check";
export async function recalcOrderTotals(orderId: string, organisationId: string) {
  // Internal recompute step, re-exported only so commands.ts (Quote → Order
  // hand-off) can call it after its own capability checks — never call this
  // directly from a client component.
  const order = await db.salesOrder.findFirstOrThrow({ where: { id: orderId, organisationId }, include: { party: { include: { addresses: true } } } });
  const lines = await db.salesOrderLine.findMany({ where: { orderId } });

  let net = 0;
  let discount = 0;
  let tax = 0;
  const deliveryAddress = order.party.addresses.find((a) => a.isDefaultDelivery) ?? order.party.addresses[0];

  for (const line of lines) {
    if(["SECTION","NOTE"].includes(line.type))continue;
    const activeQuantity = line.orderedQuantity - line.cancelledQuantity;
    const grossLine = line.unitPriceAmount * activeQuantity;
    const lineDiscount = Math.round((grossLine * (line.discountPercent ?? 0)) / 100);
    const lineNet = grossLine - lineDiscount;
    const taxResult = await resolveStandardUkVat({
      sellingOrganisationId: order.organisationId,
      partyId: order.partyId,
      deliveryCountry: (order.deliveryAddressSnapshot as {country?:string}|null)?.country ?? deliveryAddress?.country ?? null,
      productTaxCategory: line.taxCategory,
      transactionDate: new Date(),
      netAmount: lineNet,
    });

    net += lineNet;
    discount += lineDiscount;
    tax += taxResult.amount;

    await db.salesOrderLine.update({ where: { id: line.id }, data: { netAmount: lineNet, taxCategory: line.taxCategory ?? taxResult.treatment, taxAmount: taxResult.amount } });
  }

  await db.salesOrder.update({
    where: { id: orderId },
    data: { netAmount: net, discountAmount: discount, taxAmount: tax, grossAmount: net + tax },
  });
}

