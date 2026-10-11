"use server";
import { withFormFeedback } from "@/core/shared/form-feedback";

import {requireSession} from "@/core/auth/session";
import {assertCapability} from "@/core/permissions/check";
import { revalidatePath } from "next/cache";
import { startWorkOrder, pauseWorkOrder, completeWorkOrder } from "@/modules/manufacturing/services/commands";

export async function startAction(data: FormData) {
  const session=await requireSession();
  assertCapability(session,"manufacturing.work_order.execute");
  return withFormFeedback(async () => {
await startWorkOrder(String(data.get("workOrderId")), String(data.get("requestKey")));
  revalidatePath("/manufacturing/shop-floor");
  });
}

export async function pauseAction(data: FormData) {
  const session=await requireSession();
  assertCapability(session,"manufacturing.work_order.execute");
  return withFormFeedback(async () => {
const reason = String(data.get("reason") || "");
  await pauseWorkOrder(String(data.get("workOrderId")), reason || null, String(data.get("requestKey")));
  revalidatePath("/manufacturing/shop-floor");
  });
}

export async function completeAction(data: FormData) {
  const session=await requireSession();
  assertCapability(session,"manufacturing.work_order.execute");
  return withFormFeedback(async () => {
await completeWorkOrder(
    String(data.get("workOrderId")),
    Number(data.get("goodQuantity") || 0),
    Number(data.get("scrapQuantity") || 0),
    String(data.get("requestKey")),
    { createBackorder: data.get("createBackorder") === "on", finish: data.get("reportMode") !== "partial", enteredUnit: String(data.get("enteredUnit") || "") || undefined, lotCode: String(data.get("lotCode") || "") || undefined, serials: String(data.get("serials") || "").split(/[\s,;]+/).filter(Boolean), shortCloseReason: String(data.get("shortCloseReason") || "") || undefined },
  );
  revalidatePath("/manufacturing/shop-floor");
  revalidatePath("/manufacturing/produce");
  });
}
