"use server";

import { revalidatePath } from "next/cache";
import { setForecast, deleteForecast } from "@/modules/manufacturing/services/forecast";

function refresh() {
  revalidatePath("/manufacturing/planning");
  revalidatePath("/manufacturing/planning/forecast");
  revalidatePath("/manufacturing/planning/planned-orders");
}

export async function setForecastAction(data: FormData) {
  await setForecast({
    productId: String(data.get("productId")),
    periodStart: new Date(String(data.get("periodStart"))),
    quantity: Number(data.get("quantity")),
    notes: String(data.get("notes") || "") || null,
  });
  refresh();
}

export async function deleteForecastAction(data: FormData) {
  await deleteForecast(String(data.get("forecastId")));
  refresh();
}
