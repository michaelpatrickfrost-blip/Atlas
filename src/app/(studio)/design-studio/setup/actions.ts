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
import { withFormFeedback, type FormFeedback } from "@/core/shared/form-feedback";
import { readAdditionalFieldSetup } from "@/core/studio/authoring/field-form-input";
import { prepareAdditionalFieldMigration, collectAdditionalFieldMigration,
  sealAdditionalFieldMigration } from "@/core/studio/authoring/field-migration-lifecycle";
import { readAdditionalFieldMigrationStatus, readAdditionalFieldMigrationRecoveryStatus, publishAdditionalFieldMigration,
  startAdditionalFieldMigrationExecution, executeAdditionalFieldMigrationBatch,
  cutoverAdditionalFieldMigration, cancelAdditionalFieldMigration,
  rollbackAdditionalFieldMigration, finalizeAdditionalFieldMigration } from "@/core/studio/authoring/field-migration-control";

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

export async function saveFieldChange(target: string | undefined, input: unknown) {
  const actor = await requireSession();
  assertCapability(actor, CAP.edit);
  const selected = z.string().min(1).max(100).optional().parse(target);
  const { saveAdditionalFieldEvolutionDraftInTransaction } = await import("@/core/studio/authoring/configuration");
  const { readAdditionalFieldMigrationSetup } = await import("@/core/studio/authoring/field-migration-preview");
  const { additionalFieldEvolutionDraftSchema } = await import("@/core/studio/authoring/field-evolution-contract");
  const request = additionalFieldEvolutionDraftSchema.parse(input);
  await withStudioAuthoringAuthority(actor, CAP.edit, selected, authority => saveAdditionalFieldEvolutionDraftInTransaction(authority, request));
  refresh();
  return readAdditionalFieldMigrationSetup(actor, selected, { definitionId: request.definitionId });
}
export async function previewFieldChange(target: string | undefined, input: unknown) {
  const actor = await requireSession();
  assertCapability(actor, CAP.publish);
  const selected = z.string().min(1).max(100).optional().parse(target);
  const { resolveAdditionalFieldMigrationContext, previewAdditionalFieldMigration } = await import("@/core/studio/authoring/field-migration-preview");
  const context = await resolveAdditionalFieldMigrationContext(actor, selected);
  return previewAdditionalFieldMigration(context.session, context.principal, input);
}

export async function saveFieldRequirementChange(target: string | undefined, input: unknown) {
  const actor = await requireSession();
  assertCapability(actor, CAP.edit);
  const selected = z.string().min(1).max(100).optional().parse(target);
  const { saveAdditionalFieldRequirementEvolutionSchema } = await import("@/core/studio/authoring/field-requirement-input");
  const { saveAdditionalFieldRequirementEvolutionDraftInTransaction, readAdditionalFieldRequirementEvolutionInTransaction }
    = await import("@/core/studio/authoring/field-requirement-authoring");
  const request = saveAdditionalFieldRequirementEvolutionSchema.parse(input);
  const saved = await withStudioAuthoringAuthority(actor, CAP.edit, selected, async authority => {
    await saveAdditionalFieldRequirementEvolutionDraftInTransaction(authority, request);
    return readAdditionalFieldRequirementEvolutionInTransaction(authority, { definitionId: request.definitionId });
  });
  refresh(); return saved;
}

export async function prepareFieldChange(target: string | undefined, input: unknown) {
  const actor = await requireSession();
  assertCapability(actor, CAP.publish);
  return prepareAdditionalFieldMigration(actor, target, input);
}
export async function collectFieldChange(target: string | undefined, input: unknown) {
  const actor = await requireSession();
  assertCapability(actor, CAP.publish);
  return collectAdditionalFieldMigration(actor, target, input);
}
export async function sealFieldChange(target: string | undefined, input: unknown) {
  const actor = await requireSession();
  assertCapability(actor, CAP.publish);
  return sealAdditionalFieldMigration(actor, target, input);
}
export async function readFieldChangeStatus(target: string | undefined, input: unknown) {
  const actor = await requireSession();
  assertCapability(actor, CAP.publish);
  return readAdditionalFieldMigrationStatus(actor, target, input);
}
export async function readFieldChangeRecovery(target: string | undefined, input: unknown) {
  const actor = await requireSession();
  assertCapability(actor, CAP.publish);
  return readAdditionalFieldMigrationRecoveryStatus(actor, target, input);
}
export async function publishFieldChange(target: string | undefined, input: unknown) {
  const actor = await requireSession();
  assertCapability(actor, CAP.publish);
  return publishAdditionalFieldMigration(actor, target, input);
}
export async function startFieldChange(target: string | undefined, input: unknown) {
  const actor = await requireSession();
  assertCapability(actor, CAP.publish);
  return startAdditionalFieldMigrationExecution(actor, target, input);
}
export async function executeFieldChange(target: string | undefined, input: unknown) {
  const actor = await requireSession();
  assertCapability(actor, CAP.publish);
  return executeAdditionalFieldMigrationBatch(actor, target, input);
}
export async function applyFieldChange(target: string | undefined, input: unknown) {
  const actor = await requireSession();
  assertCapability(actor, CAP.publish);
  const result = await cutoverAdditionalFieldMigration(actor, target, input);
  refresh();
  return result;
}
export async function cancelFieldChange(target: string | undefined, input: unknown) {
  const actor = await requireSession();
  assertCapability(actor, CAP.publish);
  return cancelAdditionalFieldMigration(actor, target, input);
}
export async function rollbackFieldChange(target: string | undefined, input: unknown) {
  const actor = await requireSession();
  assertCapability(actor, CAP.publish);
  const result = await rollbackAdditionalFieldMigration(actor, target, input);
  refresh();
  return result;
}
export async function finalizeFieldChange(target: string | undefined, input: unknown) {
  const actor = await requireSession();
  assertCapability(actor, CAP.publish);
  return finalizeAdditionalFieldMigration(actor, target, input);
}


export async function inspectBusinessSetup(form: FormData) {
  const actor = await requireSession();
  assertCapability(actor, CAP.edit);
  const { readSetupDraftEdit } = await import("@/core/studio/authoring/setup-edit-input");
  const { inspectConfigurationDraftEditInTransaction } = await import("@/core/studio/authoring/configuration");
  return withFormFeedback(() => withStudioAuthoringAuthority(actor, CAP.edit, business(form), authority => inspectConfigurationDraftEditInTransaction(authority,
    { definitionRevision: Number(text(form, "definitionRevision")), edit: readSetupDraftEdit(form) })));
}
export async function compareSavedBusinessSetup(form: FormData) {
  const actor = await requireSession();
  assertCapability(actor, CAP.edit);
  const { readSetupDraftEdit } = await import("@/core/studio/authoring/setup-edit-input");
  const { inspectConfigurationDraftEditInTransaction } = await import("@/core/studio/authoring/configuration");
  return withFormFeedback(async () => {
  const result = await withStudioAuthoringAuthority(actor, CAP.edit, business(form), authority => inspectConfigurationDraftEditInTransaction(authority,
    { definitionRevision: Number(text(form, "definitionRevision")), edit: readSetupDraftEdit(form) }, true));
  if (!("savedSummary" in result) || !result.savedSummary || !result.localSummary || !result.changes)
    throw new Error("The saved draft could not be compared. Your changes are kept.");
  return { ...result, savedSummary: result.savedSummary, localSummary: result.localSummary, changes: result.changes };
  });
}
