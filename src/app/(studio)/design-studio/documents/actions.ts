"use server";

import { z } from "zod";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { STUDIO_CAPABILITIES as CAP } from "@/core/studio/permissions";
import { withStudioAuthoringAuthority } from "@/core/studio/authoring/context";
import { saveTemplateInTransaction } from "@/core/templates/authoring";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { listDocumentPreviewRecordsInTransaction, previewDocumentInTransaction } from "@/core/templates/preview";
import { withFormFeedback } from "@/core/shared/form-feedback";
import { inspectTemplateDraftInTransaction } from "@/core/templates/inspection";

export async function inspectStudioDocumentDraft(business: string | undefined, form: FormData) {
  const actor = await requireSession();
  assertCapability(actor, CAP.edit);
  return withFormFeedback(() => withStudioAuthoringAuthority(actor, CAP.edit, z.string().min(1).max(100).optional().parse(business),
    authority => inspectTemplateDraftInTransaction(authority, form)));
}

export async function compareStudioDocumentDraft(business: string | undefined, form: FormData) {
  const actor = await requireSession();
  assertCapability(actor, CAP.edit);
  return withFormFeedback(() => withStudioAuthoringAuthority(actor, CAP.edit, z.string().min(1).max(100).optional().parse(business),
    authority => inspectTemplateDraftInTransaction(authority, form)));
}

export async function saveStudioDocument(business: string | undefined, form: FormData) {
  const actor = await requireSession();
  assertCapability(actor, CAP.edit);
  return withFormFeedback(async () => {
  const target = z.string().min(1).max(100).optional().parse(business);
  const saved = await withStudioAuthoringAuthority(actor, CAP.edit, target, authority => saveTemplateInTransaction(authority.session, authority.transaction, form));
  revalidatePath("/design-studio", "layout"); revalidatePath("/templates"); revalidatePath("/crm/contracts");
  redirect(`/design-studio/documents/${saved.id}${target ? `?business=${encodeURIComponent(target)}` : ""}`);
  });
}

export async function listStudioDocumentPreviewRecords(business: string | undefined, targets: unknown) {
  const actor = await requireSession();
  assertCapability(actor, CAP.read);
  return withFormFeedback(() => withStudioAuthoringAuthority(actor, CAP.read, z.string().min(1).max(100).optional().parse(business),
    authority => listDocumentPreviewRecordsInTransaction(authority.session, authority.transaction, targets)));
}
export async function previewStudioDocument(business: string | undefined, input: unknown) {
  const actor = await requireSession();
  assertCapability(actor, CAP.read);
  return withFormFeedback(() => withStudioAuthoringAuthority(actor, CAP.read, z.string().min(1).max(100).optional().parse(business),
    authority => previewDocumentInTransaction(authority.session, authority.transaction, input)));
}
