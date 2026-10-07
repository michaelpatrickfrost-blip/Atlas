"use server";
import { z } from "zod";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { db } from "@/core/db/client";
import { revalidatePath } from "next/cache";
import { createApproval, decideApproval } from "@/core/approvals/service";
import { requireFinance } from "./access";
import { financeTransaction } from "./transaction";
import { CLOSE_TASKS } from "./books";
import { ACCOUNT_TYPES, POSTING_PROFILES, DIMENSIONS, dimensionRulesSchema, accountingDay } from "../domain/accounting";
import { digits } from "../domain/money";
const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
const refresh = () => revalidatePath("/finance", "layout");

export async function getFinanceConfiguration(entityId?: string) {
  const session = await requireSession();
  assertCapability(session, "finance.configure");
  await requireFinance(session, "finance.configure");
  const organisationId = session.organisationId;
  const entities = await db.financeEntity.findMany({ where: { organisationId }, orderBy: { name: "asc" } });
  const entity = entityId ? entities.find(entity => entity.id === entityId) : entities[0];
  if (entityId && !entity) throw new Error("Legal entity is not available.");
  if (!entity) return { entities, entity: null, accounts: [], dimensions: [], periods: [], reopenings: [] };
  const where = { organisationId, entityId: entity.id };
  const [accounts, dimensions, periods, reopenings] = await Promise.all([
    db.financeAccount.findMany({ where, orderBy: { code: "asc" } }),
    db.financeDimensionValue.findMany({ where, orderBy: [{ dimension: "asc" }, { code: "asc" }] }),
    db.financePeriod.findMany({ where, orderBy: { startAt: "desc" } }),
    db.approvalInstance.findMany({ where: { organisationId, subjectType: "PERIOD_REOPEN", subjectId: { in: (await db.financePeriod.findMany({ where, select: { id: true } })).map(period => period.id) }, status: "PENDING" }, include: { steps: true } }),
  ]);
  return { entities, entity, accounts, dimensions, periods, reopenings };
}

export async function saveFinanceEntityDetails(form: FormData) {
  const session = await requireSession();
  assertCapability(session, "finance.configure");
  await requireFinance(session, "finance.configure");
  const data = z.object({ name: z.string().min(1).max(150), registrationNumber: z.string().max(100), registeredAddress: z.string().max(1000), vatNumber: z.string().max(100), country: z.string().regex(/^[A-Z]{2}$/), fiscalStartMonth: z.coerce.number().int().min(1).max(12), matchToleranceBps: z.coerce.number().int().min(0).max(10000) }).parse(Object.fromEntries(["name", "registrationNumber", "registeredAddress", "vatNumber", "country", "fiscalStartMonth", "matchToleranceBps"].map(key => [key, text(form, key)])));
  await financeTransaction(async tx => {
    const where = { id: text(form, "entityId"), organisationId: session.organisationId };
    const before = await tx.financeEntity.findFirstOrThrow({ where });
    await tx.financeEntity.update({ where, data });
    await tx.auditEntry.create({ data: { organisationId: session.organisationId, actorUserId: session.userId, action: "finance.entity.configured", entityType: "FinanceEntity", entityId: before.id, before: { name: before.name, fiscalStartMonth: before.fiscalStartMonth }, after: data } });
  }); refresh();
}

export async function saveFinanceAccount(form: FormData) {
  const session = await requireSession();
  assertCapability(session, "finance.configure");
  await requireFinance(session, "finance.configure");
  const organisationId = session.organisationId, entityId = text(form, "entityId"), id = text(form, "id");
  const control = text(form, "control") || null, currencyRestriction = text(form, "currencyRestriction") || null;
  const rules = dimensionRulesSchema.parse(Object.fromEntries(DIMENSIONS.map(key => [key, text(form, key) || "OPTIONAL"])));
  const data = { code: z.string().regex(/^[A-Z0-9.-]{1,20}$/).parse(text(form, "code")), name: z.string().min(1).max(150).parse(text(form, "name")), type: z.enum(ACCOUNT_TYPES).parse(text(form, "type")), description: z.string().max(1000).parse(text(form, "description")), subType: z.string().max(100).parse(text(form, "subType")), parentId: text(form, "parentId") || null, active: form.get("active") === "on", postingAllowed: form.get("postingAllowed") === "on", currencyRestriction, control, dimensionRules: rules };
  if (currencyRestriction) digits(currencyRestriction);
  if (control && (!(control in POSTING_PROFILES) || POSTING_PROFILES[control as keyof typeof POSTING_PROFILES] !== data.type || !data.postingAllowed)) throw new Error("Posting profile must use a posting account of the appropriate account type.");
  await financeTransaction(async tx => {
    await tx.financeEntity.findFirstOrThrow({ where: { id: entityId, organisationId } });
    const before = id ? await tx.financeAccount.findFirstOrThrow({ where: { id, organisationId, entityId } }) : null;
    if (before && (before.type !== data.type || before.control !== data.control || before.currencyRestriction !== data.currencyRestriction) && await tx.financeJournalLine.count({ where: { organisationId, accountId: id } })) throw new Error("Account type, posting profile and currency are fixed once transactions exist. Create a new account for future use.");
    if ((!data.active || !data.postingAllowed) && id && await tx.financeBank.count({ where: { organisationId, accountId: id } })) throw new Error("A linked bank account must retain an active posting account.");
    if (control && data.active && await tx.financeAccount.count({ where: { organisationId, entityId, control, active: true, ...(id ? { id: { not: id } } : {}) } })) throw new Error("This posting profile already has an active account.");
    if (data.parentId) {
      let parentId: string | null = data.parentId; const seen = new Set(id ? [id] : []);
      while (parentId) {
        if (seen.has(parentId)) throw new Error("Account groups cannot contain a cycle."); seen.add(parentId);
        const parent: { parentId: string | null; postingAllowed: boolean } = await tx.financeAccount.findFirstOrThrow({ where: { organisationId, entityId, id: parentId, type: data.type }, select: { parentId: true, postingAllowed: true } });
        if (parent.postingAllowed) throw new Error("Choose a non-posting group as the parent account.");
        parentId = parent.parentId;
      }
    }
    const account = before ? await tx.financeAccount.update({ where: { id, organisationId }, data }) : await tx.financeAccount.create({ data: { ...data, organisationId, entityId } });
    await tx.auditEntry.create({ data: { organisationId, actorUserId: session.userId, action: before ? "finance.account.updated" : "finance.account.created", entityType: "FinanceAccount", entityId: account.id, before: before ? { name: before.name, active: before.active, postingAllowed: before.postingAllowed, dimensionRules: before.dimensionRules } : undefined, after: data } });
  }); refresh();
}

export async function saveFinanceDimension(form: FormData) {
  const session = await requireSession();
  assertCapability(session, "finance.configure");
  await requireFinance(session, "finance.configure");
  const organisationId = session.organisationId, entityId = text(form, "entityId");
  const dimension = z.enum(["department", "costCentre"]).parse(text(form, "dimension")), code = z.string().regex(/^[A-Za-z0-9 _.-]{1,100}$/).parse(text(form, "code")), name = z.string().min(1).max(150).parse(text(form, "name")), active = form.get("active") === "on";
  await financeTransaction(async tx => {
    await tx.financeEntity.findFirstOrThrow({ where: { id: entityId, organisationId } });
    const value = await tx.financeDimensionValue.upsert({ where: { entityId_dimension_code: { entityId, dimension, code } }, create: { organisationId, entityId, dimension, code, name, active }, update: { name, active } });
    await tx.auditEntry.create({ data: { organisationId, actorUserId: session.userId, action: "finance.dimension.configured", entityType: "FinanceDimensionValue", entityId: value.id, after: { dimension, code, name, active } } });
  }); refresh();
}

export async function createFinancePeriod(form: FormData) {
  const session = await requireSession();
  assertCapability(session, "finance.period.manage");
  await requireFinance(session, "finance.period.manage");
  const organisationId = session.organisationId, entityId = text(form, "entityId"), startAt = accountingDay(text(form, "startAt")), endAt = accountingDay(text(form, "endAt"), true);
  if (startAt >= endAt) throw new Error("Period end must follow its start.");
  await financeTransaction(async tx => {
    await tx.financeEntity.findFirstOrThrow({ where: { id: entityId, organisationId } });
    if (await tx.financePeriod.count({ where: { organisationId, entityId, startAt: { lte: endAt }, endAt: { gte: startAt } } })) throw new Error("Financial periods cannot overlap. Existing period dates are preserved.");
    const period = await tx.financePeriod.create({ data: { organisationId, entityId, name: z.string().min(1).max(100).parse(text(form, "name")), startAt, endAt, allowedSources: [] } });
    await tx.financeCloseTask.createMany({ data: CLOSE_TASKS.map(name => ({ organisationId, entityId, periodId: period.id, name })) });
    await tx.auditEntry.create({ data: { organisationId, actorUserId: session.userId, action: "finance.period.created", entityType: "FinancePeriod", entityId: period.id, after: { startAt: startAt.toISOString(), endAt: endAt.toISOString() } } });
  }); refresh();
}

export async function setFinancePeriodExceptions(form: FormData) {
  const session = await requireSession();
  assertCapability(session, "finance.period.manage");
  assertCapability(session, "finance.configure");
  await requireFinance(session, "finance.period.manage");
  const allowedSources = z.array(z.enum(["AP_INVOICE", "AR_INVOICE", "AP_CREDIT", "AR_CREDIT", "AP_DEBIT", "AR_DEBIT", "RECEIPT", "BANK", "DEPRECIATION", "REVERSAL", "EXPENSE"])).max(11).parse(form.getAll("allowedSources").map(String));
  await financeTransaction(async tx => {
    const organisationId = session.organisationId, period = await tx.financePeriod.findFirstOrThrow({ where: { id: text(form, "periodId"), organisationId, state: { in: ["OPEN", "SOFT_CLOSED"] } } });
    const reason = z.string().min(5).max(2000).parse(text(form, "reason"));
    await tx.financePeriod.update({ where: { id: period.id, organisationId }, data: { allowedSources: [...new Set(allowedSources)], version: { increment: 1 } } });
    await tx.auditEntry.create({ data: { organisationId, actorUserId: session.userId, action: "finance.period.exceptions_changed", entityType: "FinancePeriod", entityId: period.id, before: { allowedSources: period.allowedSources }, after: { allowedSources, reason } } });
  }); refresh();
}

export async function requestFinancePeriodReopen(form: FormData) {
  const session = await requireSession();
  assertCapability(session, "finance.period.manage");
  await requireFinance(session, "finance.period.manage");
  const reason = z.string().min(5).max(2000).parse(text(form, "reason"));
  await financeTransaction(async tx => {
    const organisationId = session.organisationId, initial = await tx.financePeriod.findFirstOrThrow({ where: { id: text(form, "periodId"), organisationId, state: { in: ["SOFT_CLOSED", "CLOSED"] } }, include: { entity: true } });
    let period = initial;
    const prior = await tx.approvalInstance.findFirst({ where: { organisationId, subjectType: "PERIOD_REOPEN", subjectId: period.id, subjectVersion: period.version } });
    if (prior && !["REJECTED", "INFORMATION"].includes(prior.status)) throw new Error("This period version already has a reopening request. Review its approval outcome.");
    if (prior) period = await tx.financePeriod.update({ where: { id: period.id, organisationId, version: period.version }, data: { version: { increment: 1 } }, include: { entity: true } });
    await createApproval(tx, session, { subjectType: "PERIOD_REOPEN", subjectId: period.id, subjectVersion: period.version, amount: 0n, currency: period.entity.currency, context: { entityId: period.entityId, reason, originalState: period.state } });
  }); refresh();
}

export async function decideFinancePeriodReopen(form: FormData) {
  const session = await requireSession();
  assertCapability(session, "finance.period.manage");
  assertCapability(session, "finance.approval.decide");
  await requireFinance(session, "finance.period.manage");
  const reason = z.string().min(5).max(2000).parse(text(form, "reason")), decision = z.enum(["APPROVED", "REJECTED"]).parse(text(form, "decision"));
  await financeTransaction(async tx => {
    const organisationId = session.organisationId, instance = await tx.approvalInstance.findFirstOrThrow({ where: { id: text(form, "approvalId"), organisationId, subjectType: "PERIOD_REOPEN", status: "PENDING" } });
    const period = await tx.financePeriod.findFirstOrThrow({ where: { id: instance.subjectId, organisationId, version: instance.subjectVersion, state: { in: ["SOFT_CLOSED", "CLOSED"] } } });
    const result = await decideApproval(tx, session, instance.id, decision, reason);
    if (result.status === "APPROVED") {
      await tx.financePeriod.update({ where: { id: period.id, organisationId, version: period.version }, data: { state: "OPEN", version: { increment: 1 } } });
      await tx.auditEntry.create({ data: { organisationId, actorUserId: session.userId, action: "finance.period.reopened", entityType: "FinancePeriod", entityId: period.id, before: { state: period.state }, after: { state: "OPEN", reason, approvalId: instance.id, requesterUserId: instance.requesterUserId } } });
    }
  }); refresh();
}
