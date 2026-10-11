"use server";

import {requireSession} from "@/core/auth/session";
import {assertCapability} from "@/core/permissions/check";
import { revalidatePath } from "next/cache";
import { startWorkOrder, pauseWorkOrder, completeWorkOrder } from "@/modules/manufacturing/services/commands";

export async function startAction(data: FormData) {
  const session=await requireSession();
  assertCapability(session,"manufacturing.work_order.execute");
  await startWorkOrder(String(data.get("workOrderId")), String(data.get("requestKey")));
  revalidatePath("/manufacturing/shop-floor");
}

export async function pauseAction(data: FormData) {
  const session=await requireSession();
  assertCapability(session,"manufacturing.work_order.execute");
  const reason = String(data.get("reason") || "");
  await pauseWorkOrder(String(data.get("workOrderId")), reason || null, String(data.get("requestKey")));
  revalidatePath("/manufacturing/shop-floor");
}

export async function completeAction(data: FormData) {
  const session=await requireSession();
  assertCapability(session,"manufacturing.work_order.execute");
  await completeWorkOrder(
    String(data.get("workOrderId")),
    Number(data.get("goodQuantity") || 0),
    Number(data.get("scrapQuantity") || 0),
    String(data.get("requestKey")),
  );
  revalidatePath("/manufacturing/shop-floor");
  revalidatePath("/manufacturing/produce");
}
