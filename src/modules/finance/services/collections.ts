"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/core/db/client";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { documentScope, requireFinance } from "./access";
import { financeTransaction } from "./transaction";
import { minor } from "../domain/money";
import { accountingDay } from "../domain/accounting";
import { ageBucket } from "../domain/controls";

export async function getFinanceCollections(input: unknown) {
  const session = await requireSession();
  assertCapability(session, "finance.receivables.read");
  await requireFinance(session, "finance.receivables.read");
  const filter = z.object({ entityId: z.string().optional(), query: z.string().trim().max(100).optional(), view: z.enum(["OVERDUE", "ALL", "PROMISES", "DISPUTED"]).default("OVERDUE"), page: z.number().int().min(0).max(100000).default(0) }).parse(input);
  const organisationId = session.organisationId, today = accountingDay(new Date().toISOString().slice(0, 10)), entities = await db.financeEntity.findMany({ where: { organisationId }, orderBy: { name: "asc" } });
  const entity = filter.entityId ? entities.find(entity => entity.id === filter.entityId) : entities[0];
  if (filter.entityId && !entity) throw new Error("Legal entity is not available.");
  if (!entity) return { entities, entity: null, rows: [], count: 0 };
  const where = { AND: [documentScope(session), { entityId: entity.id, kind: { in: ["AR_INVOICE", "AR_DEBIT"] }, status: "POSTED", settled: { lt: db.financeDocument.fields.gross }, ...(filter.view === "OVERDUE" ? { dueAt: { lt: today } } : {}), ...(["PROMISES", "DISPUTED"].includes(filter.view) ? { collectionActivities: { some: { organisationId, kind: filter.view === "PROMISES" ? "PROMISE" : "DISPUTE" } } } : {}), ...(filter.query ? { OR: [{ reference: { contains: filter.query, mode: "insensitive" as const } }, { party: { name: { contains: filter.query, mode: "insensitive" as const } } }] } : {}) }] };
  const [invoices, count] = await Promise.all([db.financeDocument.findMany({ where, include: { party: { select: { name: true } }, collectionActivities: { where: { organisationId }, orderBy: { createdAt: "desc" }, take: 20 } }, orderBy: [{ dueAt: "asc" }, { id: "asc" }], take: 50, skip: filter.page * 50 }), db.financeDocument.count({ where })]);
  const rows = invoices.map(doc => ({ ...doc, age: ageBucket(doc.dueAt, today), activities: doc.collectionActivities }));
  return { entities, entity, rows, count };
}

export async function recordFinanceCollection(form: FormData) {
  const session = await requireSession();
  assertCapability(session, "finance.receivables.manage");
  await requireFinance(session, "finance.receivables.manage");
  const text = (key: string) => String(form.get(key) ?? "").trim();
  const kind = z.enum(["CALL", "EMAIL", "LETTER", "PROMISE", "DISPUTE", "FOLLOW_UP", "RESOLVED"]).parse(text("kind")), notes = z.string().min(5).max(4000).parse(text("notes"));
  await financeTransaction(async tx => {
    const organisationId = session.organisationId, doc = await tx.financeDocument.findFirstOrThrow({ where: { AND: [documentScope(session), { id: text("documentId"), kind: { in: ["AR_INVOICE", "AR_DEBIT"] }, status: "POSTED" }] } });
    const promisedAmount = kind === "PROMISE" ? minor(text("promisedAmount"), doc.currency) : null, followUpAt = text("followUpAt") ? accountingDay(text("followUpAt")) : null;
    if (kind === "PROMISE" && (!followUpAt || promisedAmount === null || promisedAmount <= 0n || promisedAmount > doc.gross - doc.settled)) throw new Error("A promise needs a date and positive amount within the outstanding balance.");
    const activity = await tx.financeCollectionActivity.create({ data: { organisationId, documentId: doc.id, actorUserId: session.userId, kind, notes, promisedAmount, followUpAt } });
    await tx.financeTimeline.create({ data: { organisationId, documentId: doc.id, actorUserId: session.userId, action: `COLLECTION_${kind}`, detail: notes } });
    await tx.auditEntry.create({ data: { organisationId, actorUserId: session.userId, action: "finance.collection.recorded", entityType: "FinanceCollectionActivity", entityId: activity.id, after: { kind, documentId: doc.id, promisedAmount: promisedAmount?.toString() ?? null, followUpAt: followUpAt?.toISOString() ?? null } } });
  }); revalidatePath("/finance", "layout");
}
