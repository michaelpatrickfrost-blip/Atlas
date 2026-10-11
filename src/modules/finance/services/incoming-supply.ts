import type { IncomingSupplyProvider } from "@/core/supply/incoming";
import { addQuantity } from "@/core/shared/quantity";
import { db } from "@/core/db/client";
import { documentScope, requireFinance } from "./access";

export const incomingSupplyProvider: IncomingSupplyProvider = async session => {
  await requireFinance(session, "finance.purchase.read");
  const orders = await db.financeDocument.findMany({
    where: { AND: [documentScope(session), { kind: "PO", status: { in: ["APPROVED", "PART_RECEIVED"] } }] },
    include: { lines: { where: { organisationId: session.organisationId, product: { organisationId: session.organisationId, kind: "PRODUCT" } } }, children: { where: { organisationId: session.organisationId, kind: "RECEIPT", status: "POSTED" }, include: { lines: { where: { organisationId: session.organisationId } } } } },
    take: 10001,
  });
  if (orders.length > 10000) throw new Error("Open purchasing supply exceeds the reviewed planning scope.");
  const rows: Awaited<ReturnType<IncomingSupplyProvider>>["rows"] = [];
  let undated = 0, overdue = 0;
  const today = new Date(); today.setUTCHours(0, 0, 0, 0);
  for (const order of orders) {
    const remaining = order.lines.flatMap(line => {
      const received = order.children.flatMap(receipt => receipt.lines).filter(receipt => receipt.sourceLineId === line.id).reduce((sum, receipt) => addQuantity(sum, Number(receipt.quantity)), 0);
      const quantity = Math.max(0, addQuantity(Number(line.quantity), -received));
      return quantity > 0 && line.productId ? [{ productId: line.productId, quantity }] : [];
    });
    if (!remaining.length) continue;
    if (!order.expectedReceiptAt) { undated++; continue; }
    if (order.expectedReceiptAt < today) { overdue++; continue; }
    for (const line of remaining) rows.push({ ...line, availableDate: order.expectedReceiptAt, sourceId: order.id });
  }
  return { rows, warnings: [
    ...(undated ? [`${undated} approved purchase order(s) have no expected receipt date and are excluded from MRP supply. Set their supplier receipt date in Purchasing.`] : []),
    ...(overdue ? [`${overdue} approved purchase order(s) are overdue and are excluded from MRP supply. Confirm a revised supplier receipt date before relying on them.`] : []),
  ] };
};
