"use server";

import { revalidatePath } from "next/cache";
import { startWorkOrder, pauseWorkOrder, completeWorkOrder } from "@/modules/manufacturing/services/commands";

export async function startAction(data: FormData) {
  await startWorkOrder(String(data.get("workOrderId")), String(data.get("requestKey")));
  revalidatePath("/manufacturing/shop-floor");
}

export async function pauseAction(data: FormData) {
  const reason = String(data.get("reason") || "");
  await pauseWorkOrder(String(data.get("workOrderId")), reason || null, String(data.get("requestKey")));
  revalidatePath("/manufacturing/shop-floor");
}

export async function completeAction(data: FormData) {
  await completeWorkOrder(
    String(data.get("workOrderId")),
    Number(data.get("goodQuantity") || 0),
    Number(data.get("scrapQuantity") || 0),
    String(data.get("requestKey")),
  );
  revalidatePath("/manufacturing/shop-floor");
  revalidatePath("/manufacturing/produce");
}
