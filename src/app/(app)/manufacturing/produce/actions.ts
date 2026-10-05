"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/core/db/client";
import { requireSession } from "@/core/auth/session";
import { createProductionOrder } from "@/modules/manufacturing/services/commands";

/** Raise a planned production order for a product that has a bill or routing. */
export async function raiseProductionOrderAction(form: FormData) {
  const session = await requireSession();
  const productId = String(form.get("productId") ?? ""), quantity = Number(form.get("quantity")), required = String(form.get("requiredDate") ?? "");
  if (!productId) throw new Error("Choose the product to make.");
  if (!(quantity > 0) || quantity > 1_000_000) throw new Error("Enter a quantity above zero.");
  const product = await db.product.findFirst({ where: { id: productId, organisationId: session.organisationId, kind: "PRODUCT", active: true }, select: { unitOfMeasure: true } });
  if (!product) throw new Error("This product is no longer in the catalogue.");
  const definition = await db.productDefinition.findFirst({ where: { organisationId: session.organisationId, productId, status: "ACTIVE", supply: { not: "BUY" } }, select: { id: true } });
  if (!definition) throw new Error("This product has no bill or routing yet. Open the product, choose Made here and add its components and steps.");
  const requiredDate = required ? new Date(`${required}T00:00:00Z`) : null;
  if (requiredDate && Number.isNaN(requiredDate.getTime())) throw new Error("Enter a valid date.");
  const order = await createProductionOrder({ productId, definitionId: definition.id, quantity, unitOfMeasure: product.unitOfMeasure, requiredDate, notes: String(form.get("notes") ?? "").trim().slice(0, 1000) || null });
  revalidatePath("/manufacturing", "layout");
  revalidatePath(`/products/${productId}`);
  redirect(`/manufacturing/produce/${order.id}`);
}
