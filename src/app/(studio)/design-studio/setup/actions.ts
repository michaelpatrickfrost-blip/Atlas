"use server";

import { z } from "zod";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { STUDIO_CAPABILITIES as CAP } from "@/core/studio/permissions";
import { withStudioAuthoringAuthority } from "@/core/studio/authoring/context";
import { createAdditionalFieldDraftInTransaction, createBaseProfileDraftInTransaction, createRecordTypeDraftInTransaction,
  saveAdditionalFieldDraftInTransaction, configureAdditionalFieldDraftInTransaction, saveBaseProfileDraftInTransaction, saveRecordTypeDraftInTransaction,
  reviewConfigurationDraftInTransaction, goLiveConfigurationDraftInTransaction, activateConfigurationVersionInTransaction } from "@/core/studio/authoring/configuration";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { FormFeedback } from "@/core/shared/form-feedback";
import { readAdditionalFieldSetup } from "@/core/studio/authoring/field-form-input";

const text = (form: FormData, name: string) => String(form.get(name) ?? "");
const business = (form: FormData) => z.string().min(1).max(100).optional().parse(text(form, "business") || undefined);
const suffix = (target?: string) => target ? `?business=${encodeURIComponent(target)}` : "";
const identity = (form: FormData) => ({ definitionId: text(form, "definitionId"), revision: Number(text(form, "revision")) });
const selection = (form: FormData, inherit = false) => ({ pageDefinitionId: text(form, "page") === "inherit" && inherit ? undefined : text(form, "page") || null,
  requiredFieldDefinitionIds: form.getAll("requiredField").map(value => String(value)) });
const refresh = () => { revalidatePath("/design-studio", "layout"); revalidatePath("/", "layout"); };

export async function createBusinessSetup(form: FormData) {
  const actor = await requireSession();
  assertCapability(actor, CAP.edit);
  const target = business(form), kind = z.enum(["field", "base", "type"]).parse(text(form, "kind"));
  const created = await withStudioAuthoringAuthority(actor, CAP.edit, target, authority => kind === "field"
    ? createAdditionalFieldDraftInTransaction(authority, readAdditionalFieldSetup(form))
    : kind === "base" ? createBaseProfileDraftInTransaction(authority, selection(form))
    : createRecordTypeDraftInTransaction(authority, { label: text(form, "label"), help: text(form, "help"), ...selection(form, true) }));
  refresh(); redirect(`/design-studio/setup/${created.id}${suffix(target)}`);
}
export async function saveBusinessSetup(form: FormData) {
  const actor = await requireSession();
  assertCapability(actor, CAP.edit);
  const target = business(form), kind = z.enum(["customField", "entityProfile", "recordType"]).parse(text(form, "kind"));
  await withStudioAuthoringAuthority(actor, CAP.edit, target, authority => kind === "customField"
    ? form.get("fieldSettings") === "on"
      ? configureAdditionalFieldDraftInTransaction(authority, { ...identity(form), setup: readAdditionalFieldSetup(form) })
      : saveAdditionalFieldDraftInTransaction(authority, { ...identity(form), label: text(form, "label"), help: text(form, "help") })
    : kind === "entityProfile" ? saveBaseProfileDraftInTransaction(authority, { ...identity(form), ...selection(form) })
    : saveRecordTypeDraftInTransaction(authority, { ...identity(form), label: text(form, "label"), help: text(form, "help"), ...selection(form, true) }));
  refresh();
}
export async function reviewBusinessSetup(form: FormData): Promise<FormFeedback> {
  const actor = await requireSession();
  assertCapability(actor, CAP.edit);
  const reviewed = await withStudioAuthoringAuthority(actor, CAP.edit, business(form), authority => reviewConfigurationDraftInTransaction(authority, identity(form)));
  refresh();
  return { error: reviewed.warnings.length ? `Review these points before going live: ${reviewed.warnings.join(" ")}` : "" };
}
export async function goLiveBusinessSetup(form: FormData) {
  const actor = await requireSession();
  assertCapability(actor, CAP.publish);
  await withStudioAuthoringAuthority(actor, CAP.publish, business(form), authority => goLiveConfigurationDraftInTransaction(authority,
    { ...identity(form), acknowledgeWarnings: form.get("acknowledgeWarnings") === "on" }));
  refresh();
}
export async function restoreBusinessSetup(form: FormData) {
  const actor = await requireSession();
  assertCapability(actor, CAP.publish);
  if (form.get("confirm") !== "on") throw new Error("Confirm that you want to restore this version.");
  await withStudioAuthoringAuthority(actor, CAP.publish, business(form), authority => activateConfigurationVersionInTransaction(authority,
    { definitionId: text(form, "definitionId"), versionId: text(form, "versionId"), definitionRevision: Number(text(form, "definitionRevision")) }));
  refresh();
}
