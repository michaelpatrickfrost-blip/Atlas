"use server";
import { withFormFeedback } from "@/core/shared/form-feedback";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { assertModuleEnabled } from "@/core/modules/access";
import { db } from "@/core/db/client";
import { minor } from "../domain/money";
import { postLedger } from "./ledger";
import { revalidatePath } from "next/cache";

export async function saveManufacturingProfile(form: FormData) {
  const session = await requireSession();
  assertCapability(session, "finance.configure");
  await assertModuleEnabled(session, "finance");
  return withFormFeedback(async () => {
const warehouseId = String(form.get("warehouseId") || ""), entityId = String(form.get("entityId") || "");
  const keys = ["inventoryAccountId", "wipAccountId", "cogsAccountId", "scrapAccountId", "absorptionAccountId", "openingAccountId"] as const;
  const accounts = Object.fromEntries(keys.map(key => [key, String(form.get(key) || "")])) as Record<typeof keys[number], string>;
  const approvedDefinitionIds = [...new Set(form.getAll("approvedDefinitionIds").map(String))];
  await db.$transaction(async tx => {
    const entity = await tx.financeEntity.findFirstOrThrow({ where: { organisationId: session.organisationId, id: entityId } });
    const energy = minor(String(form.get("energyRate") || "0"), entity.currency);
    if(energy<0n||energy>100000000n)throw new Error("Enter a valid energy rate in the accounting currency per kWh.");
    await tx.warehouse.findFirstOrThrow({ where: { organisationId: session.organisationId, id: warehouseId } });
    const chart = await tx.financeAccount.findMany({ where: { organisationId: session.organisationId, entityId, id: { in: Object.values(accounts) }, active: true, postingAllowed: true } });
    if (chart.length !== new Set(Object.values(accounts)).size || new Set(Object.values(accounts)).size !== keys.length) throw new Error("Choose six distinct active posting accounts in these books.");
    if (chart.find(row => row.id === accounts.inventoryAccountId)?.control !== "INVENTORY") throw new Error("Use these books’ Inventory control account so purchasing receipts and manufacturing reconcile.");
    for (const key of ["inventoryAccountId", "wipAccountId"] as const) if (chart.find(row => row.id === accounts[key])?.type !== "ASSET") throw new Error("Inventory and WIP must use asset accounts.");
    for (const key of ["cogsAccountId", "scrapAccountId"] as const) if (chart.find(row => row.id === accounts[key])?.type !== "EXPENSE") throw new Error("Cost of sales and scrap must use expense accounts.");
    const definitions = await tx.productDefinition.findMany({ where: { organisationId: session.organisationId, id: { in: approvedDefinitionIds } }, include: { product: { select: { baseCurrency: true } } } });
    if (definitions.length !== approvedDefinitionIds.length || definitions.some(row => row.product.baseCurrency !== entity.currency)) throw new Error("Approve recipes whose rate currency matches these accounting books.");
    const where = { organisationId_warehouseId: { organisationId: session.organisationId, warehouseId } };
    const existing = await tx.financeManufacturingProfile.findUnique({ where });
    if (existing && (existing.entityId !== entityId || keys.some(key => existing[key] !== accounts[key])) && await tx.financeManufacturingValueEntry.count({ where: { organisationId: session.organisationId, warehouseId } })) throw new Error("This warehouse has posted costs. Its books and posting accounts must retain the recorded accounting basis.");
    await tx.financeManufacturingProfile.upsert({ where, create: { organisationId: session.organisationId, warehouseId, entityId, ...accounts, approvedDefinitionIds, energyMinorPerKwh: Number(energy) }, update: { entityId, ...accounts, approvedDefinitionIds, energyMinorPerKwh: Number(energy), version: { increment: 1 } } });
    await tx.auditEntry.create({ data: { organisationId: session.organisationId, actorUserId: session.userId, action: "finance.manufacturing.profile", entityType: "Warehouse", entityId: warehouseId, after: { entityId, ...accounts, approvedDefinitionIds, energyMinorPerKwh: energy.toString() } } });
  }, { isolationLevel: "Serializable" });
  revalidatePath("/finance/manufacturing");
  });
}

/** Review the full current on-hand quantity and its total carrying value. Never infer cost from sale price. */
export async function reconcileOpeningStockValue(form: FormData) {
  const session = await requireSession();
  assertCapability(session, "finance.configure");
  assertCapability(session, "finance.journal.post");
  assertCapability(session, "stock.manage");
  await assertModuleEnabled(session, "finance");
  await assertModuleEnabled(session, "stock");
  return withFormFeedback(async () => {
const warehouseId = String(form.get("warehouseId") || ""), productId = String(form.get("productId") || ""), requestKey = String(form.get("requestKey") || ""), reason = String(form.get("reason") || "").trim();
  if (!reason || reason.length > 500 || !requestKey || requestKey.length > 80) throw new Error("Enter a nonnegative total carrying value, reason and reference.");
  await db.$transaction(async tx => {
    const p = await tx.financeManufacturingProfile.findUniqueOrThrow({ where: { organisationId_warehouseId: { organisationId: session.organisationId, warehouseId } } });
    const entity = await tx.financeEntity.findFirstOrThrow({where:{organisationId:session.organisationId,id:p.entityId}});
    const value = minor(String(form.get("totalValue") || ""),entity.currency);
    if(value<0n)throw new Error("The total carrying value must be nonnegative.");
    const product = await tx.product.findFirstOrThrow({ where: { organisationId: session.organisationId, id: productId, kind: "PRODUCT" } });
    const physical = await tx.inventoryBalance.findUnique({ where: { warehouseId_productId: { warehouseId, productId } } });
    const onHand = Number(physical?.quantity ?? 0);
    if (!onHand && value) throw new Error("Stock with zero on hand must have zero carrying value.");
    const sourceKey = `opening:${requestKey}`;
    const previous = await tx.financeManufacturingValueEntry.findUnique({ where: { organisationId_sourceKey: { organisationId: session.organisationId, sourceKey } } });
    if (previous) { if (previous.productId !== productId || previous.warehouseId !== warehouseId || previous.fingerprint !== `${value}:${reason}`) throw new Error("Opening reference already belongs to different details."); return; }
    const where = { organisationId_warehouseId_productId: { organisationId: session.organisationId, warehouseId, productId } };
    const current = await tx.financeStockValue.findUnique({ where });
    const delta = value - (current?.valueMinor ?? 0n);

    const journal = delta ? await postLedger(tx, session, { entityId: p.entityId, date: new Date(), description: `Stock valuation: ${product.code} · ${reason}`, sourceKey, sourceType: "MANUFACTURING", sourceId: productId, currency: entity.currency, rate: "1", lines: [
      { accountId: p.inventoryAccountId, description: reason, debit: delta > 0n ? delta : 0n, credit: delta < 0n ? -delta : 0n, productId },
      { accountId: p.openingAccountId, description: reason, debit: delta < 0n ? -delta : 0n, credit: delta > 0n ? delta : 0n },
    ] }) : null;
    await tx.financeStockValue.upsert({ where, create: { organisationId: session.organisationId, entityId: p.entityId, warehouseId, productId, quantity: onHand, valueMinor: value }, update: { quantity: onHand, valueMinor: value, version: { increment: 1 } } });
    await tx.financeManufacturingValueEntry.create({ data: { organisationId: session.organisationId, entityId: p.entityId, warehouseId, productId, sourceKey, kind: "OPENING", quantity: onHand - Number(current?.quantity ?? 0), inventoryMinor: delta, journalId: journal?.id, fingerprint: `${value}:${reason}`, actorUserId: session.userId } });
    await tx.auditEntry.create({ data: { organisationId: session.organisationId, actorUserId: session.userId, action: "finance.stock.valuation.reconciled", entityType: "Product", entityId: productId, after: { warehouseId, quantity: onHand, value: value.toString(), reason, requestKey } } });
  }, { isolationLevel: "Serializable" });
  revalidatePath("/finance/manufacturing");
  });
}

export async function recordProductionUsage(form: FormData) {
  const session = await requireSession();
  assertCapability(session, "manufacturing.work_order.execute");
  await assertModuleEnabled(session, "manufacturing");
  await assertModuleEnabled(session, "finance");
  return withFormFeedback(async () => {
const { postProductionUsage } = await import("./manufacturing-values");
  await db.$transaction(tx => postProductionUsage(session, tx, { workOrderId: String(form.get("workOrderId") || ""), machineMinutes: Number(form.get("machineMinutes") || 0), personMinutes: Number(form.get("personMinutes") || 0), energyKwh: Number(form.get("energyKwh") || 0), requestKey: String(form.get("requestKey") || "") }), { isolationLevel: "Serializable" });
  revalidatePath("/manufacturing/shop-floor");
  revalidatePath("/finance/manufacturing");
  });
}

export async function recordMachineLoadUsage(form: FormData) {
  const session = await requireSession();
  assertCapability(session, "manufacturing.work_order.execute");
  await assertModuleEnabled(session, "manufacturing");
  await assertModuleEnabled(session, "finance");
  return withFormFeedback(async () => {
const { postMachineLoadUsage } = await import("./manufacturing-values");
  await db.$transaction(tx => postMachineLoadUsage(session, tx, { loadId: String(form.get("loadId") || ""), machineMinutes: Number(form.get("machineMinutes") || 0), personMinutes: Number(form.get("personMinutes") || 0), energyKwh: Number(form.get("energyKwh") || 0), requestKey: String(form.get("requestKey") || "") }), { isolationLevel: "Serializable" });
  revalidatePath("/manufacturing/machine-loads");
  revalidatePath("/finance/manufacturing");
  });
}
