"use server";
import { revalidatePath } from "next/cache";
import { runMrpAction, firmPlannedOrderAction, dismissPlannedOrderAction } from "./actions";

function refresh() {
  revalidatePath("/manufacturing/planning");
  revalidatePath("/manufacturing/planning/planned-orders");
  revalidatePath("/manufacturing/planning/shortages");
}

export async function runMrpForm() {
  const result = await runMrpAction();
  if (!result.success) throw new Error(result.error);
  refresh();
}

export async function firmPlannedOrderForm(form: FormData) {
  const result = await firmPlannedOrderAction(String(form.get("suggestionId") ?? ""));
  if (!result.success) throw new Error(result.error);
  refresh();
}

export async function dismissPlannedOrderForm(form: FormData) {
  const result = await dismissPlannedOrderAction(String(form.get("suggestionId") ?? ""));
  if (!result.success) throw new Error(result.error);
  refresh();
}
