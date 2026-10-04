"use server";

import { revalidatePath } from "next/cache";
import { saveShift, deleteShift } from "@/modules/manufacturing/services/shifts";

const DAY_VALUES: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

export async function saveShiftAction(data: FormData) {
  const days = data.getAll("days").map((d) => DAY_VALUES[String(d)]);
  await saveShift({
    workCentreId: String(data.get("workCentreId")),
    resourceId: String(data.get("resourceId") || "") || null,
    label: String(data.get("label") || ""),
    daysOfWeek: days,
    start: String(data.get("start")),
    end: String(data.get("end")),
    crewCount: Number(data.get("crewCount") || 1),
  });
  revalidatePath("/manufacturing/schedule");
}

export async function deleteShiftAction(data: FormData) {
  await deleteShift(String(data.get("shiftId")));
  revalidatePath("/manufacturing/schedule");
}
