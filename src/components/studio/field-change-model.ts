import { friendlyFieldConversionSchema, type FriendlyFieldConversion } from "@/core/studio/authoring/field-evolution-contract";
import type { AdditionalFieldSetup } from "@/core/studio/authoring/field-setup-contract";

export function fieldChangeConversion(source: AdditionalFieldSetup["type"], target: AdditionalFieldSetup["type"], form: FormData): FriendlyFieldConversion {
  if (source === target) return { kind: "same_type" };
  if (source === "integer" && target === "decimal") return { kind: "integer_to_decimal" };
  if (source === "date" && target === "datetime") return { kind: "date_to_datetime", timezone: "UTC", time: "start_of_day" };
  if (source === "datetime" && target === "date") return { kind: "datetime_to_date", timezone: "UTC",
    loss: form.get("conversion.allowTimeLoss") === "on" ? "allow_time_loss" : "reject" };
  if (source === "string" && target === "enum") {
    const values = form.getAll("conversion.from"), choices = form.getAll("conversion.to");
    if (values.length !== choices.length || values.some(value => typeof value !== "string") || choices.some(value => typeof value !== "string"))
      throw new Error("Choose one target choice for each existing text.");
    return friendlyFieldConversionSchema.parse({ kind: "string_to_enum", mapping: values.flatMap((from, index) =>
      from === "" ? [] : [{ from, toChoice: Number(choices[index]) }]), unmapped: form.get("conversion.unmapped") === "empty" ? "empty" : "reject" });
  }
  throw new Error("There is no approved conversion between these kinds of detail. Choose the current kind or an available conversion.");
}
export function fieldChangeChoices(source: AdditionalFieldSetup["type"], target: AdditionalFieldSetup, form: FormData) {
  if (source !== target.type || (target.type !== "enum" && target.type !== "multi_enum")) return undefined;
  const values = form.getAll("previousChoice");
  if (values.length !== target.settings.choices.length || values.some(value => typeof value !== "string" || (value !== "new" && !/^(?:0|[1-9]\d*)$/.test(value))))
    throw new Error("Choose the previous choice or New choice for every row.");
  return values.map(value => value === "new" ? null : Number(value));
}
