"use server";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { db } from "@/core/db/client";
import { revalidatePath } from "next/cache";
import { accountingDay } from "../domain/accounting";
import { documentScope, requireFinance } from "./access";

export async function updatePurchaseArrival(documentId: string, form: FormData) {
  const session = await requireSession();
  assertCapability(session, "finance.purchase.manage");
  await requireFinance(session, "finance.purchase.manage");
  const version = Number(form.get("version")), reason = String(form.get("reason") ?? "").trim();
  const expectedReceiptAt = accountingDay(String(form.get("expectedReceiptAt") ?? ""));
  if (!Number.isInteger(version) || version < 1 || reason.length < 5 || reason.length > 2000) throw new Error("Enter the supplier confirmation or reason for changing the receipt date.");
  await db.$transaction(async tx => {
    const order = await tx.financeDocument.findFirstOrThrow({ where: { AND: [documentScope(session), { id: documentId, kind: "PO", status: { in: ["APPROVED", "PART_RECEIVED"] } }] } });
    const changed = await tx.financeDocument.updateMany({ where: { id: order.id, organisationId: session.organisationId, version, status: order.status }, data: { expectedReceiptAt, version: { increment: 1 } } });
    if (changed.count !== 1) throw new Error("This purchase changed. Refresh before confirming its receipt date.");
    await tx.financeTimeline.create({ data: { organisationId: session.organisationId, documentId, actorUserId: session.userId, action: "RECEIPT_DATE_CONFIRMED", detail: `${expectedReceiptAt.toISOString().slice(0, 10)}: ${reason}` } });
    await tx.auditEntry.create({ data: { organisationId: session.organisationId, actorUserId: session.userId, action: "finance.purchase.receipt_date", entityType: "FinanceDocument", entityId: documentId, before: { expectedReceiptAt: order.expectedReceiptAt?.toISOString() ?? null }, after: { expectedReceiptAt: expectedReceiptAt.toISOString(), reason } } });
  }, { isolationLevel: "Serializable" });
  revalidatePath(`/finance/documents/${documentId}`);
  revalidatePath("/manufacturing/planning");
}
