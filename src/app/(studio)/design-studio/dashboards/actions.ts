"use server";

import { z } from "zod";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { STUDIO_CAPABILITIES as CAP } from "@/core/studio/permissions";
import { withStudioAuthoringAuthority } from "@/core/studio/authoring/context";
import { createBusinessViewDraftInTransaction, saveBusinessViewDraftInTransaction,
  reviewBusinessViewDraftInTransaction, publishBusinessViewDraftInTransaction,
  restoreBusinessViewVersionInTransaction, loadBusinessViewMetricsInTransaction,
  loadBusinessViewSliceInTransaction } from "@/modules/analytics/services/studio-business-view";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const selected = (business: unknown) => z.string().min(1).max(100).optional().parse(business);
const refresh = () => { revalidatePath("/design-studio", "layout"); revalidatePath("/home"); revalidatePath("/business-dashboards", "layout"); };
export async function createBusinessDashboard(form: FormData) {
  const actor = await requireSession();
  assertCapability(actor, CAP.edit);
  const business = selected(String(form.get("business") ?? "") || undefined);
  const name = z.string().trim().min(1).max(150).parse(form.get("name"));
  const metricId = z.string().min(1).max(100).parse(form.get("measure"));
  const created = await withStudioAuthoringAuthority(actor, CAP.edit, business, authority =>
    createBusinessViewDraftInTransaction(authority, { name, period: "90", widgets: [{
      id: crypto.randomUUID(), metricId, visual: "bar", wide: true,
    }], refreshSeconds: 0, filters: { from: "", to: "", search: "" } }));
  refresh();
  redirect(`/design-studio/dashboards/${created.definitionId}${business ? `?business=${encodeURIComponent(business)}` : ""}`);
}
export async function saveBusinessDashboard(business: string | undefined, input: unknown) {
  const actor = await requireSession();
  assertCapability(actor, CAP.edit);
  const result = await withStudioAuthoringAuthority(actor, CAP.edit, selected(business), authority => saveBusinessViewDraftInTransaction(authority, input));
  refresh(); return result;
}
export async function reviewBusinessDashboard(business: string | undefined, input: unknown) {
  const actor = await requireSession();
  assertCapability(actor, CAP.edit);
  return withStudioAuthoringAuthority(actor, CAP.edit, selected(business), authority => reviewBusinessViewDraftInTransaction(authority, input));
}
export async function publishBusinessDashboard(business: string | undefined, input: unknown) {
  const actor = await requireSession();
  assertCapability(actor, CAP.publish);
  const result = await withStudioAuthoringAuthority(actor, CAP.publish, selected(business), authority => publishBusinessViewDraftInTransaction(authority, input));
  refresh(); return result;
}
export async function restoreBusinessDashboard(business: string | undefined, input: unknown) {
  const actor = await requireSession();
  assertCapability(actor, CAP.publish);
  const result = await withStudioAuthoringAuthority(actor, CAP.publish, selected(business), authority => restoreBusinessViewVersionInTransaction(authority, input));
  refresh(); return result;
}
export async function loadBusinessDashboardMetrics(business: string | undefined, period: unknown) {
  const actor = await requireSession();
  assertCapability(actor, CAP.read);
  return withStudioAuthoringAuthority(actor, CAP.read, selected(business), authority => loadBusinessViewMetricsInTransaction(authority, period));
}
export async function loadBusinessDashboardSlice(business: string | undefined, input: unknown) {
  const actor = await requireSession();
  assertCapability(actor, CAP.read);
  return withStudioAuthoringAuthority(actor, CAP.read, selected(business), authority => loadBusinessViewSliceInTransaction(authority, input));
}
