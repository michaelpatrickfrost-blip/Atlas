"use server";

import { revalidatePath } from "next/cache";
import { runMrp, firmSuggestion, dismissSuggestion } from "@/modules/manufacturing/services/mrp";
import { setForecast, deleteForecast } from "@/modules/manufacturing/services/forecast";

export async function runMrpAction() {
  await runMrp();
  revalidatePath("/manufacturing/plan");
}

export async function firmSuggestionAction(data: FormData) {
  await firmSuggestion(String(data.get("suggestionId")));
  revalidatePath("/manufacturing/plan");
  revalidatePath("/manufacturing/produce");
}

export async function dismissSuggestionAction(data: FormData) {
  await dismissSuggestion(String(data.get("suggestionId")));
  revalidatePath("/manufacturing/plan");
}

export async function setForecastAction(data: FormData) {
  await setForecast({
    productId: String(data.get("productId")),
    periodStart: new Date(String(data.get("periodStart"))),
    quantity: Number(data.get("quantity")),
    notes: String(data.get("notes") || "") || null,
  });
}

export async function deleteForecastAction(data: FormData) {
  await deleteForecast(String(data.get("forecastId")));
}
