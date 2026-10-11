import { validQuantity, addQuantity } from "@/core/shared/quantity";
import type { Session } from "@/core/auth/session";
import type { Prisma } from "@/generated/prisma/client";
import type { StockReceiptInput } from "@/core/finance/connections";
import { assertCapability } from "@/core/permissions/check";
import { stockProvider } from "./provider";

export async function receiveFinanceGoods(session: Session, tx: Prisma.TransactionClient, input: StockReceiptInput) {
  assertCapability(session, "stock.manage");
  if (!validQuantity(input.quantity) || input.quantity <= 0) throw new Error("Inventory receipts require a positive quantity with up to six decimal places.");
  const organisationId = session.organisationId, requestKey = `finance-receipt:${input.receiptLineId}`;
  const line = await tx.financeDocumentLine.findFirstOrThrow({ where: { id: input.receiptLineId, organisationId, documentId: input.receiptId, productId: input.productId, document: { kind: "RECEIPT", status: "DRAFT" } } });
  if (addQuantity(Number(line.quantity), -Number(line.damagedQuantity)) !== input.quantity) throw new Error("Inventory acceptance must match the Finance receipt.");
  const result = await stockProvider.receiveStock(session, { requestKey, productId: input.productId, warehouseId: input.warehouseId, quantity: input.quantity, lotCode: input.lotCode, serials: input.serials, reason: "Approved purchasing receipt", reference: input.reference, financeReceiptId: input.receiptId }, tx);
  const movement = await tx.inventoryMovement.findFirstOrThrow({ where: { organisationId, id: result.movementIds[0] } });
  if (!result.replayed) await tx.auditEntry.create({ data: { organisationId, actorUserId: session.userId, action: "stock.finance_receipt", entityType: "InventoryMovement", entityId: movement.id, after: { receiptId: input.receiptId, receiptLineId: input.receiptLineId, warehouseId: input.warehouseId, quantity: input.quantity, lotCode: input.lotCode ?? null } } });
  return movement;
}
