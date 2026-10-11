import { createHash } from "node:crypto";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/core/db/client";
import { requireSession, type Session } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import type { ManufacturingCostProvider } from "@/core/finance/manufacturing";
import { addQuantity, quantity } from "@/core/shared/quantity";
import { quantityCostMinor, measuredQuantity, componentQuantity } from "@/core/shared/measurement";
import { proportionalValue, outputCost, distributeValue, productionCostAllocation } from "../domain/production-cost";
import { postLedger } from "./ledger";

async function profile(tx: Prisma.TransactionClient, organisationId: string, warehouseId: string) {
  const row = await tx.financeManufacturingProfile.findUnique({ where: { organisationId_warehouseId: { organisationId, warehouseId } } });
  if (!row?.active) return null;
  const entity = await tx.financeEntity.findFirstOrThrow({ where: { id: row.entityId, organisationId } });
  return { ...row, currency: entity.currency };
}
type Profile = NonNullable<Awaited<ReturnType<typeof profile>>>;
async function postValue(tx: Prisma.TransactionClient, session: Session, p: Profile, sourceKey: string, description: string, debitAccount: string, creditAccount: string, value: bigint, sourceId?: string) {
  if (!value) return null;
  return postLedger(tx, session, { entityId: p.entityId, date: new Date(), description, sourceKey, sourceType: "MANUFACTURING", sourceId, currency: p.currency, rate: "1", lines: [
    { accountId: debitAccount, debit: value, credit: 0n, description },
    { accountId: creditAccount, debit: 0n, credit: value, description },
  ] });
}
async function valueBalance(tx: Prisma.TransactionClient, session: Session, p: Profile, productId: string, quantityDelta: number, valueDelta: bigint) {
  const where = { organisationId_warehouseId_productId: { organisationId: session.organisationId, warehouseId: p.warehouseId, productId } };
  const current = await tx.financeStockValue.findUnique({ where });
  if (addQuantity(Number(current?.quantity ?? 0), quantityDelta) < 0 || (current?.valueMinor ?? 0n) + valueDelta < 0n) throw new Error("Inventory valuation would become negative. Review Finance manufacturing values.");
  if (current) {
    const updated = await tx.financeStockValue.updateMany({ where: { ...where.organisationId_warehouseId_productId, version: current.version }, data: { quantity: { increment: quantityDelta }, valueMinor: { increment: valueDelta }, version: { increment: 1 } } });
    if (updated.count !== 1) throw new Error("Inventory valuation changed. Refresh and retry the stock transaction.");
  } else {
    await tx.financeStockValue.create({ data: { organisationId: session.organisationId, entityId: p.entityId, warehouseId: p.warehouseId, productId, quantity: quantityDelta, valueMinor: valueDelta } });
  }
}

export const manufacturingCostProvider: ManufacturingCostProvider = {
  async materialCosts(session) {
    assertCapability(session, "manufacturing.cost.read");
    assertCapability(session, "finance.ledger.read");
    const [balances, purchases] = await Promise.all([
      db.financeStockValue.findMany({ where: { organisationId: session.organisationId, quantity: { gt: 0 }, warehouse: { manufacturingCostProfiles: { some: { organisationId: session.organisationId, active: true } } } }, include: { entity: { select: { currency: true } } } }),
      db.financeDocumentLine.findMany({ where: { organisationId: session.organisationId, productId: { not: null }, document: { organisationId: session.organisationId, OR: [{ kind: "PO", status: "APPROVED" }, { kind: "RECEIPT", status: "POSTED" }] } }, include: { document: { select: { currency: true, documentDate: true } } }, orderBy: [{ document: { documentDate: "desc" } }, { id: "desc" }], take: 10001 }),
    ]);
    if (purchases.length > 10000) throw new Error("Material cost history exceeds the reviewed scope. Use Finance reports to review the cost basis.");
    const pools = new Map<string, { productId: string; currency: string; quantity: number; value: bigint }>();
    for (const row of balances) {
      const key = `${row.productId}:${row.entity.currency}`, prior = pools.get(key);
      pools.set(key, { productId: row.productId, currency: row.entity.currency, quantity: addQuantity(prior?.quantity ?? 0, Number(row.quantity)), value: (prior?.value ?? 0n) + row.valueMinor });
    }
    const result: import("@/core/finance/manufacturing").MaterialCostBasis[] = [...pools.values()].map(row => ({ productId: row.productId, amountMinor: Number(row.value), quantity: row.quantity, currency: row.currency, source: "CARRYING_VALUE" as const }));
    const keys = new Set(pools.keys());
    for (const row of purchases) {
      const key = `${row.productId}:${row.document.currency}`;
      if (keys.has(key) || !row.productId) continue;
      keys.add(key);
      result.push({ productId: row.productId, amountMinor: Number(row.unitPrice), quantity: Number(row.priceQuantity), currency: row.document.currency, source: "APPROVED_PURCHASE" });
    }
    if (result.some(row => !Number.isSafeInteger(row.amountMinor) || row.quantity <= 0)) throw new Error("Material values exceed the safe estimate scope.");
    return result;
  },
  async validateLoad(organisationId,tx,members){
    const profiles=await tx.financeManufacturingProfile.findMany({where:{organisationId,active:true,warehouseId:{in:members.map(row=>row.warehouseId).filter((id):id is string=>!!id)}}});
    if(!profiles.length)return;
    const first=members[0],p=profiles.find(row=>row.warehouseId===first.warehouseId);
    const rates=(row:typeof first)=>JSON.stringify([row.machineMinorPerHour,row.labourMinorPerHour,row.overheadMinorPerHour,row.machineIncludesLabour,row.machineIncludesOverhead]);
    if(!p||members.some(row=>!row.costBasisCaptured||row.warehouseId!==first.warehouseId||!p.approvedDefinitionIds.includes(row.definitionId??"")||rates(row)!==rates(first)))throw new Error("Costed mixed loads require one warehouse, approved recipes and matching captured machine, labour and overhead rates.");
  },
  async view(session, productionOrderId) {
    assertCapability(session, "manufacturing.cost.read"); assertCapability(session, "finance.ledger.read");
    const order = await db.manufacturingOrder.findFirstOrThrow({ where: { organisationId: session.organisationId, id: productionOrderId }, select: { warehouseId: true } });
    const p = order.warehouseId ? await db.$transaction(tx => profile(tx, session.organisationId, order.warehouseId!)) : null;
    const rows = await db.financeManufacturingValueEntry.findMany({ where: { organisationId: session.organisationId, productionOrderId }, take: 10001 });
    if (rows.length > 10000) throw new Error("This production cost history exceeds the safe scope. Use Finance ledger reports.");
    const sum = (kind: string[], field: "wipMinor" | "inventoryMinor" | "expenseMinor") => rows.filter(row => kind.includes(row.kind)).reduce((value, row) => value + row[field], 0n).toString();
    return { configured: !!p, currency: p?.currency ?? "GBP", wip: rows.reduce((value,row) => value + row.wipMinor, 0n).toString(), materials: sum(["MATERIAL"],"wipMinor"), usage: sum(["USAGE","LOAD_USAGE"],"wipMinor"), finished: sum(["OUTPUT","OUTPUT_ADJUSTMENT"],"inventoryMinor"), scrap: sum(["OUTPUT"],"expenseMinor") };
  },
  async validateRelease(session, tx, warehouseId, definitionId) { const p = await profile(tx, session.organisationId, warehouseId); if (p && !p.approvedDefinitionIds.includes(definitionId)) throw new Error("Approve this recipe’s production rates in Finance → Manufacturing costs before releasing costed production."); },
  async consume(actor, tx, input) {
    const p = await profile(tx, actor.organisationId, input.warehouseId);
    if (!p) return;
    const session = await requireSession();
    if (session.organisationId !== actor.organisationId || session.userId !== actor.userId) throw new Error("Stock valuation requires the current company session.");
    const sourceKey = `stock:${input.movementId}`;
    if (await tx.financeManufacturingValueEntry.findUnique({ where: { organisationId_sourceKey: { organisationId: actor.organisationId, sourceKey } } })) return;
    const balance = await tx.financeStockValue.findUnique({ where: { organisationId_warehouseId_productId: { organisationId: actor.organisationId, warehouseId: input.warehouseId, productId: input.productId } } });
    const physical = await tx.inventoryBalance.findUnique({ where: { warehouseId_productId: { warehouseId: input.warehouseId, productId: input.productId } } });
    if (!balance || Number(balance.quantity) !== addQuantity(Number(physical?.quantity ?? 0), input.quantity) || Number(balance.quantity) < input.quantity) throw new Error("This stock needs a reconciled opening valuation in Finance → Manufacturing costs before it can be issued or shipped.");
    const value = proportionalValue(balance.valueMinor, input.quantity, Number(balance.quantity));
    const isWip = !!input.productionOrderId;
    const journal = await postValue(tx, session, p, sourceKey, isWip ? "Materials issued to production" : "Stock issued", isWip ? p.wipAccountId : input.shipmentId ? p.cogsAccountId : p.scrapAccountId, p.inventoryAccountId, value, input.productionOrderId ?? input.movementId);
    await valueBalance(tx, session, p, input.productId, -input.quantity, -value);
    await tx.financeManufacturingValueEntry.create({ data: { organisationId: actor.organisationId, entityId: p.entityId, warehouseId: input.warehouseId, productId: input.productId, productionOrderId: input.productionOrderId, workOrderId: input.workOrderId, movementId: input.movementId, journalId: journal?.id, sourceKey, kind: isWip ? "MATERIAL" : "ISSUE", quantity: -input.quantity, inventoryMinor: -value, wipMinor: isWip ? value : 0n, expenseMinor: isWip ? 0n : value, actorUserId: actor.userId } });
  },
  async transfer(actor, tx, input) {
    const from = await profile(tx, actor.organisationId, input.fromWarehouseId), to = await profile(tx, actor.organisationId, input.toWarehouseId);
    if (!from && !to) return;
    if (!from || !to || from.entityId !== to.entityId) throw new Error("Configure both warehouses in the same accounting books before moving valued stock between them.");
    const session = await requireSession();
    if (session.organisationId !== actor.organisationId || session.userId !== actor.userId) throw new Error("Stock valuation requires the current company session.");
    const sourceKey = `transfer:${input.outMovementId}`;
    if (await tx.financeManufacturingValueEntry.findUnique({ where: { organisationId_sourceKey: { organisationId: actor.organisationId, sourceKey } } })) return;
    const source = await tx.financeStockValue.findUnique({ where: { organisationId_warehouseId_productId: { organisationId: actor.organisationId, warehouseId: from.warehouseId, productId: input.productId } } });
    const target = await tx.financeStockValue.findUnique({ where: { organisationId_warehouseId_productId: { organisationId: actor.organisationId, warehouseId: to.warehouseId, productId: input.productId } } });
    const sourcePhysical = await tx.inventoryBalance.findUnique({ where: { warehouseId_productId: { warehouseId: from.warehouseId, productId: input.productId } } });
    const targetPhysical = await tx.inventoryBalance.findUnique({ where: { warehouseId_productId: { warehouseId: to.warehouseId, productId: input.productId } } });
    if (!source || Number(source.quantity) !== addQuantity(Number(sourcePhysical?.quantity ?? 0), input.quantity) || Number(target?.quantity ?? 0) !== addQuantity(Number(targetPhysical?.quantity ?? 0), -input.quantity)) throw new Error("Reconcile both warehouses’ stock valuations before transferring this product.");
    const value = proportionalValue(source.valueMinor, input.quantity, Number(source.quantity));
    const journal = from.inventoryAccountId === to.inventoryAccountId ? null : await postValue(tx, session, from, sourceKey, "Inventory transferred between warehouses", to.inventoryAccountId, from.inventoryAccountId, value, input.outMovementId);
    await valueBalance(tx, session, from, input.productId, -input.quantity, -value);
    await valueBalance(tx, session, to, input.productId, input.quantity, value);
    for (const [p, movementId, sign] of [[from,input.outMovementId,-1], [to,input.inMovementId,1]] as const) await tx.financeManufacturingValueEntry.create({ data: { organisationId: actor.organisationId, entityId: p.entityId, warehouseId: p.warehouseId, productId: input.productId, movementId, journalId: journal?.id, sourceKey: sign === -1 ? sourceKey : `${sourceKey}:in`, kind: "TRANSFER", quantity: sign * input.quantity, inventoryMinor: BigInt(sign) * value, actorUserId: actor.userId } });
  },
  async settle(session, tx, input) {
    const p = await profile(tx, session.organisationId, input.warehouseId);
    if (!p) return;
    const sourceKey = `output:${input.workOrderId}:${input.requestKey}`;
    if (await tx.financeManufacturingValueEntry.findUnique({ where: { organisationId_sourceKey: { organisationId: session.organisationId, sourceKey } } })) return;
    const entries = await tx.financeManufacturingValueEntry.findMany({ where: { organisationId: session.organisationId, productionOrderId: input.productionOrderId } });
    if (entries.some(row => row.entityId !== p.entityId)) throw new Error("A production order cannot move between accounting entities after costs have been posted.");
    const wip = entries.reduce((sum, row) => sum + row.wipMinor, 0n);
    let direct = entries.filter(row => row.movementId && input.newMaterialMovementIds.includes(row.movementId)).reduce((sum, row) => sum + row.wipMinor, 0n);
    if (input.reportId) {
      // Actual report genealogy identifies the portion of earlier manual issues
      // consumed by this output; treat it like newly backflushed material.
      const uses = await tx.manufacturingMaterialUse.findMany({ where: { organisationId: session.organisationId, reportId: input.reportId }, include: { stockAllocation: true } });
      const byMovement = new Map<string, number>();
      for (const use of uses) if (use.stockAllocation) byMovement.set(use.stockAllocation.movementId, addQuantity(byMovement.get(use.stockAllocation.movementId) ?? 0, Number(use.quantity)));
      direct = entries.filter(row => row.kind === "MATERIAL" && row.movementId && byMovement.has(row.movementId)).reduce((sum, row) => sum + proportionalValue(row.wipMinor, byMovement.get(row.movementId!)!, -Number(row.quantity)), 0n);
    }
    const currentQuantity = addQuantity(input.goodQuantity, input.scrapQuantity);
    const allocated = productionCostAllocation(wip, direct, currentQuantity, input.remainingBefore, input.finish);
    // Closing after earlier partial receipts must allocate late costs to the goods that
    // remain owned and COGS for goods already issued; it must not label them all scrap.
    if (allocated && currentQuantity === 0 && input.finish) {
      const reports = await tx.manufacturingProductionReport.findMany({ where:{organisationId:session.organisationId,workOrderId:input.workOrderId},include:{movements:{where:{delta:{gt:0}},include:{allocations:true}}} });
      const good = reports.reduce((sum,row)=>addQuantity(sum,Number(row.goodQuantity)),0), scrap = reports.reduce((sum,row)=>addQuantity(sum,Number(row.scrapQuantity)),0);
      const lotIds = [...new Set(reports.flatMap(row=>row.movements.flatMap(movement=>movement.allocations.map(allocation=>allocation.lotId))).filter(Boolean))];
      const positions = lotIds.length ? await tx.stockPosition.findMany({where:{organisationId:session.organisationId,productId:input.productId,lotId:{in:lotIds},quantity:{gt:0}}}) : [];
      const onHand = new Map<string,number>();
      let remainingGood = good;
      for (const position of positions.sort((a,b)=>a.warehouseId.localeCompare(b.warehouseId))) { const retained=Math.min(Number(position.quantity),remainingGood);if(retained>0)onHand.set(position.warehouseId,addQuantity(onHand.get(position.warehouseId)??0,retained));remainingGood=addQuantity(remainingGood,-retained); }
      const weights = [...onHand].map(([warehouseId,quantity])=>({id:`inventory:${warehouseId}`,quantity}));
      if (remainingGood) weights.push({id:"cogs",quantity:remainingGood});
      if (scrap) weights.push({id:"scrap",quantity:scrap});
      if (!weights.length) weights.push({id:"scrap",quantity:1});
      const parts = distributeValue(allocated,weights);
      const inventoryParts: Array<{p:Profile;value:bigint}> = [];
      for (const part of parts.filter(row=>row.id.startsWith("inventory:"))) { const warehouseProfile=await profile(tx,session.organisationId,part.id.slice(10));if(!warehouseProfile||warehouseProfile.entityId!==p.entityId)throw new Error("Review the finished batches’ accounting warehouses before final cost closure.");inventoryParts.push({p:warehouseProfile,value:part.value}); }
      const cogs=parts.find(row=>row.id==="cogs")?.value??0n, scrapCost=parts.find(row=>row.id==="scrap")?.value??0n;
      const journal=await postLedger(tx,session,{entityId:p.entityId,date:new Date(),description:"Final actual cost adjustment after partial production",sourceKey,sourceType:"MANUFACTURING",sourceId:input.productionOrderId,currency:p.currency,rate:"1",lines:[
        ...inventoryParts.filter(row=>row.value).map(row=>({accountId:row.p.inventoryAccountId,debit:row.value,credit:0n,description:"Finished stock actual cost adjustment",productId:input.productId})),
        ...(cogs?[{accountId:p.cogsAccountId,debit:cogs,credit:0n,description:"Issued goods actual cost adjustment"}]:[]),
        ...(scrapCost?[{accountId:p.scrapAccountId,debit:scrapCost,credit:0n,description:"Scrap actual cost adjustment"}]:[]),
        {accountId:p.wipAccountId,debit:0n,credit:allocated,description:"Final WIP closure"},
      ]});
      for(const part of inventoryParts)await valueBalance(tx,session,part.p,input.productId,0,part.value);
      const inventoryMinor=inventoryParts.reduce((sum,row)=>sum+row.value,0n);
      await tx.financeManufacturingValueEntry.create({data:{organisationId:session.organisationId,entityId:p.entityId,warehouseId:p.warehouseId,productId:input.productId,productionOrderId:input.productionOrderId,workOrderId:input.workOrderId,journalId:journal.id,sourceKey,kind:"OUTPUT_ADJUSTMENT",inventoryMinor,wipMinor:-allocated,expenseMinor:cogs+scrapCost,actorUserId:session.userId}});
      return;
    }
    const result = outputCost(allocated, input.goodQuantity, input.scrapQuantity);
    const journal = allocated ? await postLedger(tx, session, { entityId: p.entityId, date: new Date(), description: "Production output and scrap", sourceKey, sourceType: "MANUFACTURING", sourceId: input.productionOrderId, currency: p.currency, rate: "1", lines: [
      ...(result.inventory ? [{ accountId: p.inventoryAccountId, description: "Finished goods", debit: result.inventory, credit: 0n, productId: input.productId }] : []),
      ...(result.scrap ? [{ accountId: p.scrapAccountId, description: "Reported production scrap", debit: result.scrap, credit: 0n }] : []),
      { accountId: p.wipAccountId, description: "WIP transferred", debit: 0n, credit: allocated },
    ] }) : null;
    if (input.goodQuantity) await valueBalance(tx, session, p, input.productId, input.goodQuantity, result.inventory);
    await tx.financeManufacturingValueEntry.create({ data: { organisationId: session.organisationId, entityId: p.entityId, warehouseId: p.warehouseId, productId: input.productId, productionOrderId: input.productionOrderId, workOrderId: input.workOrderId, movementId: input.receiptMovementId, journalId: journal?.id, sourceKey, kind: "OUTPUT", quantity: input.goodQuantity, inventoryMinor: result.inventory, wipMinor: -allocated, expenseMinor: result.scrap, actorUserId: session.userId } });
  },
};

/** Called only by Finance's approved purchasing-receipt transaction. Its journal already debits Inventory. */
export async function valuePurchaseReceipt(session: Session, tx: Prisma.TransactionClient, input: { movementId: string; warehouseId: string; productId: string; quantity: number; valueMinor: bigint; entityId: string; journalId?: string }) {
  const p = await profile(tx, session.organisationId, input.warehouseId);
  if (!p) return;
  if (p.entityId !== input.entityId) throw new Error("Receive into a warehouse belonging to these accounting books.");
  const sourceKey = `receipt:${input.movementId}`;
  if (await tx.financeManufacturingValueEntry.findUnique({ where: { organisationId_sourceKey: { organisationId: session.organisationId, sourceKey } } })) return;
  const physical = await tx.inventoryBalance.findUnique({ where: { warehouseId_productId: { warehouseId: input.warehouseId, productId: input.productId } } });
  const valued = await tx.financeStockValue.findUnique({ where: { organisationId_warehouseId_productId: { organisationId: session.organisationId, warehouseId: input.warehouseId, productId: input.productId } } });
  if (Number(valued?.quantity ?? 0) !== addQuantity(Number(physical?.quantity ?? 0), -input.quantity)) throw new Error("Reconcile the warehouse’s existing stock valuation before receiving this purchase.");
  await valueBalance(tx, session, p, input.productId, input.quantity, input.valueMinor);
  await tx.financeManufacturingValueEntry.create({ data: { organisationId: session.organisationId, entityId: p.entityId, warehouseId: p.warehouseId, productId: input.productId, movementId: input.movementId, journalId: input.journalId, sourceKey, kind: "PURCHASE", quantity: input.quantity, inventoryMinor: input.valueMinor, actorUserId: session.userId } });
}

export async function productionCostView(session: Session, productionOrderId?: string) {
  assertCapability(session, "manufacturing.cost.read");
  assertCapability(session, "finance.ledger.read");
  const profiles = await db.financeManufacturingProfile.findMany({ where: { organisationId: session.organisationId, active: true } });
  const entries = await db.financeManufacturingValueEntry.findMany({ where: { organisationId: session.organisationId, ...(productionOrderId ? { productionOrderId } : {}) }, orderBy: { createdAt: "desc" }, take: 10001 });
  if (entries.length > 10000) throw new Error("Choose an individual production order to inspect its cost history.");
  return { configured: profiles.length > 0, wip: entries.reduce((sum, row) => sum + row.wipMinor, 0n), entries };
}

export async function postProductionUsage(session: Session, tx: Prisma.TransactionClient, input: { workOrderId: string; machineMinutes: number; personMinutes: number; energyKwh: number; requestKey: string }) {
  assertCapability(session, "manufacturing.work_order.execute");
  for (const value of [input.machineMinutes, input.personMinutes, input.energyKwh]) quantity(value, "Actual usage", false);
  if (!input.requestKey || input.requestKey.length > 80) throw new Error("A usage reference is required.");
  const w = await tx.manufacturingWorkOrder.findFirstOrThrow({ where: { organisationId: session.organisationId, id: input.workOrderId }, include: { productionOrder: true } });
  const sourceKey = `usage:${w.id}:${input.requestKey}`;
  const fingerprint = createHash("sha256").update(JSON.stringify(input)).digest("hex");
  const prior = await tx.financeManufacturingValueEntry.findUnique({ where: { organisationId_sourceKey: { organisationId: session.organisationId, sourceKey } } });
  if (prior) { if (prior.fingerprint !== fingerprint) throw new Error("This usage reference already belongs to different details."); return; }
  if (!["RUNNING", "PAUSED"].includes(w.status)) throw new Error("Record actual usage while this operation is running or paused.");
  if (!w.productionOrder.warehouseId) throw new Error("Set the production order’s warehouse before recording costs.");
  const p = await profile(tx, session.organisationId, w.productionOrder.warehouseId);
  if (!p) throw new Error("Configure this warehouse’s production costing in Finance first.");
  if (!w.costBasisCaptured) throw new Error("This operation was released before cost snapshots were supported. Review its cost basis with Finance before recording actual usage.");
  if (!p.approvedDefinitionIds.includes(w.productionOrder.definitionId ?? "")) throw new Error("Approve this released recipe’s cost basis in Finance before recording actual usage.");
  if (w.machineLoadId && (input.machineMinutes || input.energyKwh)) throw new Error("Record shared machine and energy usage against the complete machine load.");
  const value = quantityCostMinor(input.machineMinutes, BigInt(w.machineMinorPerHour + (w.machineIncludesOverhead ? 0 : w.overheadMinorPerHour)), 60) + (w.machineIncludesLabour ? 0n : quantityCostMinor(input.personMinutes, BigInt(w.labourMinorPerHour), 60)) + quantityCostMinor(input.energyKwh, BigInt(p.energyMinorPerKwh));
  const journal = await postValue(tx, session, p, sourceKey, "Actual production time and energy", p.wipAccountId, p.absorptionAccountId, value, w.productionOrderId);
  await tx.financeManufacturingValueEntry.create({ data: { organisationId: session.organisationId, entityId: p.entityId, warehouseId: p.warehouseId, productionOrderId: w.productionOrderId, workOrderId: w.id, sourceKey, kind: "USAGE", wipMinor: value, journalId: journal?.id, machineMinutes: input.machineMinutes, personMinutes: input.personMinutes, energyKwh: input.energyKwh, fingerprint, actorUserId: session.userId } });
}

export async function postMachineLoadUsage(session: Session, tx: Prisma.TransactionClient, input: { loadId: string; machineMinutes: number; personMinutes: number; energyKwh: number; requestKey: string }) {
  assertCapability(session, "manufacturing.work_order.execute");
  for (const value of [input.machineMinutes, input.personMinutes, input.energyKwh]) quantity(value, "Actual usage", false);
  if (!input.requestKey || input.requestKey.length > 80) throw new Error("A usage reference is required.");
  const load = await tx.manufacturingMachineLoad.findFirstOrThrow({ where: { organisationId: session.organisationId, id: input.loadId }, include: { workOrders: { include: { productionOrder: true } } } });
  const first = load.workOrders[0];
  if (!first?.productionOrder.warehouseId) throw new Error("This machine load needs a production warehouse.");
  const p = await profile(tx, session.organisationId, first.productionOrder.warehouseId);
  if (!p) throw new Error("Configure the load’s warehouse costing in Finance.");
  const sourceKey = `load-usage:${load.id}:${input.requestKey}`;
  const fingerprint = createHash("sha256").update(JSON.stringify(input)).digest("hex");
  const previous = await tx.financeManufacturingValueEntry.findFirst({ where: { organisationId: session.organisationId, sourceKey: { startsWith: `${sourceKey}:` } } });
  if (previous) { if (previous.fingerprint !== fingerprint) throw new Error("Shared usage reference already belongs to different details."); return; }
  const rates = (w: typeof first) => JSON.stringify([w.machineMinorPerHour, w.labourMinorPerHour, w.overheadMinorPerHour, w.machineIncludesLabour, w.machineIncludesOverhead]);
  if (load.status !== "RUNNING" || load.workOrders.some(w => !["RUNNING", "PAUSED"].includes(w.status) || Number(w.producedQuantity) || Number(w.scrapQuantity))) throw new Error("Record the shared cycle’s actual usage before its first output report. After output starts, record any individual additional labour against its operation.");
  if (load.workOrders.some(w => !w.costBasisCaptured || !p.approvedDefinitionIds.includes(w.productionOrder.definitionId ?? "") || w.productionOrder.warehouseId !== p.warehouseId || rates(w) !== rates(first))) throw new Error("Shared cost reporting requires one warehouse and matching approved machine, labour and overhead rates.");
  const value = quantityCostMinor(input.machineMinutes, BigInt(first.machineMinorPerHour + (first.machineIncludesOverhead ? 0 : first.overheadMinorPerHour)), 60) + (first.machineIncludesLabour ? 0n : quantityCostMinor(input.personMinutes, BigInt(first.labourMinorPerHour), 60)) + quantityCostMinor(input.energyKwh, BigInt(p.energyMinorPerKwh));
  const weights = load.workOrders.map(w => ({ id: w.id, quantity: measuredQuantity(componentQuantity(Number(w.loadedQuantity ?? w.productionOrder.quantity), Number(w.loadPerUnit), 0), w.loadUnit!, load.unitOfMeasure).quantity }));
  const allocations = distributeValue(value, weights);
  const journal = await postValue(tx, session, p, sourceKey, `Actual shared usage · ${load.reference}`, p.wipAccountId, p.absorptionAccountId, value, load.id);
  for (const w of load.workOrders) await tx.financeManufacturingValueEntry.create({ data: { organisationId: session.organisationId, entityId: p.entityId, warehouseId: p.warehouseId, productionOrderId: w.productionOrderId, workOrderId: w.id, sourceKey: `${sourceKey}:${w.id}`, kind: "LOAD_USAGE", wipMinor: allocations.find(row => row.id === w.id)!.value, journalId: journal?.id, fingerprint, actorUserId: session.userId } });
  await tx.auditEntry.create({ data: { organisationId: session.organisationId, actorUserId: session.userId, action: "finance.machine_load.usage", entityType: "ManufacturingMachineLoad", entityId: load.id, after: { ...input, value: value.toString(), weights, allocations: allocations.map(row => ({ ...row, value: row.value.toString() })) } } });
}
