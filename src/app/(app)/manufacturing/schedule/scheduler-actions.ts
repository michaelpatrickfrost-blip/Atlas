"use server";

import { revalidatePath } from "next/cache";
import { schedulePreview, rescheduleWorkOrder, setWorkOrderLock } from "@/modules/manufacturing/services/scheduler";

export async function previewMoveAction(workOrderId: string, newStartISO: string, resourceId: string | null, workCentreId: string | null) {
  return schedulePreview(workOrderId, new Date(newStartISO), resourceId, workCentreId);
}

export async function commitMoveAction(workOrderId: string, newStartISO: string, resourceId: string | null, workCentreId: string | null, force: boolean) {
  await rescheduleWorkOrder(workOrderId, new Date(newStartISO), resourceId, workCentreId, force);
  revalidatePath("/manufacturing/schedule");
  revalidatePath("/manufacturing/produce");
  revalidatePath("/manufacturing/shop-floor");
}

export async function toggleLockAction(workOrderId: string, locked: boolean) {
  await setWorkOrderLock(workOrderId, locked);
  revalidatePath("/manufacturing/schedule");
}
