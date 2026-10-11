"use server";
import { withFormFeedback } from "@/core/shared/form-feedback";
import { createHash } from "node:crypto";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { assertModuleEnabled } from "@/core/modules/access";
import { db } from "@/core/db/client";
import { getModule } from "@/core/modules/registry";
import { componentQuantity, measuredQuantity } from "@/core/shared/measurement";
import { addQuantity } from "@/core/shared/quantity";
import { revalidatePath } from "next/cache";

export async function issueProductionMaterial(form: FormData) {
  const session = await requireSession();
  assertCapability(session, "manufacturing.material.issue");
  await assertModuleEnabled(session, "manufacturing");
  await assertModuleEnabled(session, "stock");
  return withFormFeedback(async () => {
const workOrderId = String(form.get("workOrderId") || ""), productId = String(form.get("productId") || ""), entryQuantity = Number(form.get("quantity")), reference = String(form.get("requestKey") || ""), note = String(form.get("reason") || "").trim();
  if (!reference || reference.length > 80 || note.length > 500) throw new Error("Enter a valid material issue reference and reason.");
  const requestKey = `issue:${workOrderId}:${createHash("sha256").update(reference).digest("hex").slice(0, 32)}`;
  await db.$transaction(async tx => {
    const w = await tx.manufacturingWorkOrder.findFirstOrThrow({ where: { organisationId: session.organisationId, id: workOrderId }, include: { productionOrder: true } });
    if (!w.productionOrder.warehouseId || !["RELEASED", "RUNNING"].includes(w.productionOrder.status) || !["READY", "RUNNING", "PAUSED"].includes(w.status)) throw new Error("Issue materials to a released, unfinished operation with a production warehouse.");
    const product = await tx.product.findFirstOrThrow({ where: { organisationId: session.organisationId, id: productId, kind: "PRODUCT" } });
    const measured = measuredQuantity(entryQuantity, String(form.get("enteredUnit") || product.unitOfMeasure), product.unitOfMeasure);
    if (measured.quantity <= 0) throw new Error("Enter a positive material quantity.");
    const recipe = w.productionOrder.definitionId ? await tx.productBomLine.findFirst({ where: { organisationId: session.organisationId, definitionId: w.productionOrder.definitionId, componentProductId: productId } }) : null;
    if (!recipe) throw new Error("Choose a component in this production order’s released recipe.");
    const prior = await tx.inventoryMovement.findUnique({ where: { organisationId_requestKey: { organisationId: session.organisationId, requestKey } } });
    if (!prior) {
      const issued = await tx.inventoryMovement.aggregate({ where: { organisationId: session.organisationId, manufacturingOrderId: w.productionOrderId, productId, delta: { lt: 0 } }, _sum: { delta: true } });
      const planned = componentQuantity(Number(w.productionOrder.quantity), Number(recipe.quantityPerUnit), Number(recipe.scrapPercent));
      if (addQuantity(Math.abs(Number(issued._sum.delta ?? 0)), measured.quantity) > planned) {
        assertCapability(session, "manufacturing.material.override");
        if (!note) throw new Error("Record a reason for material use above the recipe allowance.");
      }
    }
    const provider = getModule("stock")?.stockProvider;
    if (!provider) throw new Error("Inventory is unavailable.");
    const result = await provider.shipStock(session, { requestKey, productId, warehouseId: w.productionOrder.warehouseId, quantity: entryQuantity, enteredUnit: measured.enteredUnit, lotCode: String(form.get("lotCode") || "").trim() || null, serials: String(form.get("serials") || "").split(/[\s,;]+/).filter(Boolean), reason: `Issued to ${w.productionOrder.orderNumber}${note ? ` · ${note}` : ""}`, reference: w.productionOrder.orderNumber, manufacturingOrderId: w.productionOrderId, workOrderId: w.id }, tx);
    if (!result.replayed) await tx.auditEntry.create({ data: { organisationId: session.organisationId, actorUserId: session.userId, action: "manufacturing.material.issued", entityType: "ManufacturingWorkOrder", entityId: w.id, after: { productId, quantity: measured.baseQuantity, enteredQuantity: measured.enteredQuantity, enteredUnit: measured.enteredUnit, movementIds: result.movementIds, reason: note } } });
  }, { isolationLevel: "Serializable", timeout: 20000 });
  revalidatePath("/manufacturing", "layout");
  revalidatePath("/stock", "layout");
  revalidatePath("/finance/manufacturing");
  });
}
