import { z } from "zod";
import { readAdditionalFieldSetup } from "./field-form-input";

/** Friendly form values only; authority and retained policies stay server-owned. */
export function readSetupDraftEdit(form: FormData) {
  const text = (name: string) => {
    const values = form.getAll(name);
    if (values.length > 1 || values.some(value => typeof value !== "string")) throw new Error("Enter each setting once.");
    return String(values[0] ?? "");
  };
  const kind = z.enum(["customField", "entityProfile", "recordType"]).parse(text("kind"));
  const observed = text("revision");
  if (!/^(?:0|[1-9]\d*)$/.test(observed)) throw new Error("Reopen the saved setup before checking it.");
  const identity = { definitionId: z.uuid().parse(text("definitionId")), revision: z.number().int().nonnegative().max(2147483646).parse(Number(observed)) };
  if (kind === "customField") return form.get("fieldSettings") === "on" ? { ...identity, mode: "fieldSettings" as const, setup: readAdditionalFieldSetup(form) }
    : { ...identity, mode: "fieldPresentation" as const, label: z.string().trim().min(1).max(100).parse(text("label")), help: z.string().max(500).parse(text("help")) };
  const page = text("page"), required = form.getAll("requiredField");
  const requiredFieldDefinitionIds = z.array(z.uuid()).max(100).refine(values => new Set(values).size === values.length, "Choose each additional field once.").parse(required);
  const choices = { pageDefinitionId: page === "inherit" && kind === "recordType" ? undefined : page ? z.uuid().parse(page) : null, requiredFieldDefinitionIds };
  return kind === "entityProfile" ? { ...identity, ...choices, mode: "base" as const }
    : { ...identity, ...choices, mode: "type" as const, label: z.string().trim().min(1).max(100).parse(text("label")), help: z.string().max(500).parse(text("help")) };
}
export type SetupDraftComparison = { revision: number; definitionRevision: number; warnings: string[];
  savedSummary: { label: string; value: string }[]; localSummary: { label: string; value: string }[]; changes: string[] };
