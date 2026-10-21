"use server";

import { z } from "zod";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { ATLAS_CAPABILITIES } from "@/core/admin/access";
import { STUDIO_CAPABILITIES as CAP } from "@/core/studio/permissions";
import { openStudioBusiness, withStudioAuthoringAuthority } from "@/core/studio/authoring/context";
import { createPageDraftInTransaction, savePageDraftInTransaction, reviewPageDraftInTransaction,
  publishPageDraftInTransaction, restorePageVersionInTransaction, readPageDraftInTransaction } from "@/core/studio/authoring/pages";
import { discoverPageScreensInTransaction } from "@/core/studio/authoring/catalog";
import { pagePreviewChoicesInTransaction } from "@/core/studio/authoring/preview";
import { readDraftPageInTransaction } from "@/core/studio/pages/runtime";
import { screenLayouts } from "./layouts";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { comparePageVersionInTransaction } from "@/core/studio/authoring/page-comparison";

const target = z.string().min(1).max(100).optional();
const text = (form: FormData, name: string) => String(form.get(name) ?? "");
const root = (business?: string) => `/design-studio${business ? `?business=${encodeURIComponent(business)}` : ""}`;
const refresh = () => { revalidatePath("/design-studio", "layout"); revalidatePath("/", "layout"); };

export async function openVisualStudio(form: FormData) {
  const actor = await requireSession();
  assertCapability(actor, CAP.edit);
  assertCapability(actor, ATLAS_CAPABILITIES.staff);
  const opened = await openStudioBusiness(actor, text(form, "organisationId"));
  redirect(root(opened.organisationId));
}
export async function createVisualScreen(form: FormData) {
  const actor = await requireSession();
  assertCapability(actor, CAP.edit);
  const business = target.parse(text(form, "business") || undefined);
  const created = await withStudioAuthoringAuthority(actor, CAP.edit, business, async authority => {
    const screens = await discoverPageScreensInTransaction(authority), screen = screens.find(value => value.entity.id === text(form, "screen"));
    if (!screen) throw new Error("Choose an app available in this business.");
    const layouts = await screenLayouts(authority, screen.entity), layout = layouts.find(value => value.id === text(form, "layout"));
    if (!layout) throw new Error("Choose an approved starting layout.");
    return createPageDraftInTransaction(authority, { name: text(form, "name") || layout.name, payload: layout.page });
  });
  refresh();
  redirect(`/design-studio/${created.id}${business ? `?business=${encodeURIComponent(business)}` : ""}`);
}
export async function saveVisualScreen(business: string | undefined, input: unknown) {
  const actor = await requireSession();
  assertCapability(actor, CAP.edit);
  const result = await withStudioAuthoringAuthority(actor, CAP.edit, target.parse(business), authority => savePageDraftInTransaction(authority, input));
  refresh(); return result;
}
export async function reviewVisualScreen(business: string | undefined, input: unknown) {
  const actor = await requireSession();
  assertCapability(actor, CAP.edit);
  return withStudioAuthoringAuthority(actor, CAP.edit, target.parse(business), async authority => {
    const result = await reviewPageDraftInTransaction(authority, input);
    const parsed = z.object({ revision: z.number().int().nonnegative() }).parse(input);
    return { ...result, revision: parsed.revision };
  });
}
export async function publishVisualScreen(business: string | undefined, input: unknown) {
  const actor = await requireSession();
  assertCapability(actor, CAP.publish);
  const result = await withStudioAuthoringAuthority(actor, CAP.publish, target.parse(business), authority => publishPageDraftInTransaction(authority, input));
  refresh(); return { ...result, versionLabel: `Version ${result.version}` };
}
export async function restoreVisualScreen(business: string | undefined, input: unknown) {
  const actor = await requireSession();
  assertCapability(actor, CAP.publish);
  const result = await withStudioAuthoringAuthority(actor, CAP.publish, target.parse(business), async authority => {
    const activated = await restorePageVersionInTransaction(authority, input);
    const parsed = z.object({ definitionId: z.uuid() }).parse(input);
    const draft = await readPageDraftInTransaction(authority, parsed.definitionId);
    return { revision: draft.revision, definitionRevision: activated.revision, payload: draft.payload, warnings: draft.warnings, activeVersionId: draft.activeVersionId ?? undefined };
  });
  refresh(); return result;
}
export async function previewVisualScreen(business: string | undefined, input: unknown) {
  const actor = await requireSession();
  assertCapability(actor, CAP.read);
  return withStudioAuthoringAuthority(actor, CAP.read, target.parse(business), authority => readDraftPageInTransaction(authority, input));
}
export async function chooseVisualScreenSample(business: string | undefined, payload: unknown) {
  const actor = await requireSession();
  assertCapability(actor, CAP.read);
  return withStudioAuthoringAuthority(actor, CAP.read, target.parse(business), authority => pagePreviewChoicesInTransaction(authority, payload));
}
export async function compareVisualScreen(business: string | undefined, input: unknown) {
  const actor = await requireSession();
  assertCapability(actor, CAP.read);
  return withStudioAuthoringAuthority(actor, CAP.read, target.parse(business), authority => comparePageVersionInTransaction(authority, input));
}
