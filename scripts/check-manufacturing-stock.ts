// Live-DB scenario: production completion uses components, receives finished goods, stays repeat-safe.
// Run on a server with DATABASE_URL set: ./node_modules/.bin/tsx scripts/check-manufacturing-stock.ts (creates and then deletes a Test company).
import { db } from "@/core/db/client";
import { wipeCompany } from "@/core/admin/wipe-company";
import { backflushOnCompletion } from "@/modules/manufacturing/services/stock";
import { getModule } from "@/core/modules/registry";

const ok = (label: string, cond: boolean, extra = "") => { console.log(`${cond ? "PASS" : "FAIL"}  ${label} ${extra}`); if (!cond) process.exitCode = 1; };

async function main() {
  const tag = Date.now().toString(36);
  const org = await db.organisation.create({ data: { name: `MFGTEST ${tag}`, slug: `mfgtest-${tag}`, isTest: true } });
  const user = await db.user.create({ data: { name: "T", email: `mfgtest-${tag}@example.invalid`, passwordHash: "x" } });
  const session = { userId: user.id, userName: "T", userEmail: user.email, organisationId: org.id, organisationName: org.name, membershipId: "m", capabilities: new Set<string>() } as never;
  try {
    const wh = await db.warehouse.create({ data: { organisationId: org.id, name: "Main", code: "MAIN" } });
    const mk = (code: string) => db.product.create({ data: { organisationId: org.id, code, name: code, basePriceAmount: 100 } });
    const [flour, sugar, cake] = [await mk("FLOUR"), await mk("SUGAR"), await mk("CAKE")];
    const def = await db.productDefinition.create({ data: { organisationId: org.id, productId: cake.id, version: 1, status: "ACTIVE", supply: "MAKE", batchQuantity: 1, yieldPercent: 100, createdByUserId: user.id } });
    await db.productBomLine.create({ data: { organisationId: org.id, definitionId: def.id, componentProductId: flour.id, quantityPerUnit: 2 } });
    await db.productBomLine.create({ data: { organisationId: org.id, definitionId: def.id, componentProductId: sugar.id, quantityPerUnit: 1 } });
    const mo = await db.manufacturingOrder.create({ data: { organisationId: org.id, orderNumber: `MO-${tag}`, productId: cake.id, definitionId: def.id, quantity: 10, createdByUserId: user.id } });
    const op1 = await db.manufacturingWorkOrder.create({ data: { organisationId: org.id, productionOrderId: mo.id, sequence: 10, operationName: "Mix" } });
    const op2 = await db.manufacturingWorkOrder.create({ data: { organisationId: org.id, productionOrderId: mo.id, sequence: 20, operationName: "Bake" } });

    const stock = getModule("stock")?.stockProvider; if (!stock) throw new Error("stock provider missing");
    const qty = async (id: string) => (await db.inventoryBalance.findFirst({ where: { organisationId: org.id, productId: id, warehouseId: wh.id } }))?.quantity ?? 0;
    await stock.receiveStock(session, { requestKey: `seed-flour-${tag}`, productId: flour.id, warehouseId: wh.id, quantity: 100, reason: "seed", reference: "seed", status: "AVAILABLE" });
    await stock.receiveStock(session, { requestKey: `seed-sugar-${tag}`, productId: sugar.id, warehouseId: wh.id, quantity: 100, reason: "seed", reference: "seed", status: "AVAILABLE" });

    // first (not final) step does not touch stock
    await backflushOnCompletion(session, op1, 4, 0, `r1-${tag}`);
    ok("non-final step leaves stock alone", (await qty(flour.id)) === 100 && (await qty(cake.id)) === 0);

    // final step: 8 good + 2 scrap on the last step => components for 10 units
    await backflushOnCompletion(session, op2, 8, 2, `r2-${tag}`);
    ok("flour used 2 x (8 good + 2 scrap) = 20", (await qty(flour.id)) === 80, `flour=${await qty(flour.id)}`);
    ok("sugar used 1 x 10 = 10", (await qty(sugar.id)) === 90, `sugar=${await qty(sugar.id)}`);
    ok("finished cakes received = 8", (await qty(cake.id)) === 8, `cake=${await qty(cake.id)}`);

    // retry with the same key must not double count
    await backflushOnCompletion(session, op2, 8, 2, `r2-${tag}`);
    ok("repeat with same key is safe", (await qty(flour.id)) === 80 && (await qty(cake.id)) === 8);

    const moves = await db.inventoryMovement.findMany({ where: { organisationId: org.id, manufacturingOrderId: mo.id } });
    ok("3 movements linked to the production order", moves.length === 3, `n=${moves.length}`);
    ok("all linked movements name the work order", moves.every((m) => m.workOrderId === op2.id));
    const o = await db.manufacturingOrder.findUniqueOrThrow({ where: { id: mo.id } });
    ok("order remembers its warehouse", o.warehouseId === wh.id);

    // insufficient components must be refused and change nothing
    let refused = false;
    try { await backflushOnCompletion(session, op2, 100, 0, `r3-${tag}`); } catch { refused = true; }
    ok("not enough components is refused", refused);
    ok("refused attempt changed nothing", (await qty(flour.id)) === 80 && (await qty(cake.id)) === 8);
  } finally {
    await wipeCompany(org.id);
    console.log("cleanup: test companies left =", await db.organisation.count({ where: { slug: { startsWith: "mfgtest-" } } }));
  }
}
main().then(() => process.exit(process.exitCode ?? 0)).catch((e) => { console.error("ERROR", e?.message ?? e); process.exit(1); });
