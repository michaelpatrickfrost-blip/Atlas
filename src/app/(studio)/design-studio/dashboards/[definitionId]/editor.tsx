"use client";

import Link from "next/link";
import { z } from "zod";
import { useCallback, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Globe, History, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/service-fields";
import { Studio, type AnalyticsStudioActions } from "@/modules/analytics/components/studio";
import type { AnalyticsResult } from "@/core/analytics/types";
import type { BusinessMeasureReference } from '@/modules/analytics/services/business-view-inspection-contract';
import type { BusinessViewDraft } from "@/modules/analytics/services/business-view-contract";
import { saveBusinessDashboard, reviewBusinessDashboard, publishBusinessDashboard,
  restoreBusinessDashboard, loadBusinessDashboardMetrics, loadBusinessDashboardSlice, inspectBusinessDashboard, compareSavedBusinessDashboard } from "../actions";

const emptyDataRequest = z.strictObject({ widgets: z.array(z.never()).max(0),
  filters: z.strictObject({ from: z.literal(""), to: z.literal(""), search: z.literal("") }) });

function feedback(error: unknown) {
  if (error instanceof Error && /CONFLICT|REVIEW_CHANGED/.test(error.message)) return "Someone else saved this dashboard. Your changes are kept; reopen the saved design to compare.";
  if (error instanceof Error && /FORBIDDEN|CAPABILITY|UNAUTHORI/.test(error.message)) return "Your current access does not allow this change. Check your dashboard design permissions.";
  if (error instanceof Error && error.name === "ZodError") return "Check the selected measures and dashboard settings before saving.";
  if (error instanceof Error && /RUNTIME.*NOT_READY|runtime.*support|compatible.*runtime/i.test(error.message)) return "Dashboard publication is waiting for the compatible platform update. Your saved design is kept.";
  return error instanceof Error ? error.message : "The dashboard could not be updated. Your design is kept.";
}
export function BusinessDashboardEditor({ draft, metrics, company, business, canEdit, canPublish, measureReferences = [] }: {
  draft: BusinessViewDraft; metrics: AnalyticsResult[]; measureReferences?: BusinessMeasureReference[]; company: string; business?: string; canEdit: boolean; canPublish: boolean;
}) {
  const router = useRouter();
  const [observed, setObserved] = useState({ revision: draft.revision, definitionRevision: draft.definitionRevision, activeVersionId: draft.activeVersionId });
  const [dirty, setDirty] = useState(false), [review, setReview] = useState<{ revision: number; warnings: string[] } | null>(null);
  const [acknowledge, setAcknowledge] = useState(false), [versionId, setVersionId] = useState("");
  const [confirmRestore, setConfirmRestore] = useState(false), [message, setMessage] = useState(""), [error, setError] = useState("");
  const [pending, start] = useTransition();
  const onDirtyChange = useCallback((changed: boolean) => { setDirty(changed); if (changed) { setReview(null); setAcknowledge(false); } }, []);
  const adoptHead = useCallback((head: typeof observed) => { setObserved(head); setReview(null); setAcknowledge(false); setConfirmRestore(false); }, []);
  const actions = useMemo<AnalyticsStudioActions>(() => ({
    saveAction: async () => { throw new Error("Use Save draft for this business dashboard."); },
    deleteAction: async () => { throw new Error("This is a versioned business dashboard."); },
    loadMetricsAction: period => loadBusinessDashboardMetrics(business, period),
    loadSliceAction: input => loadBusinessDashboardSlice(business, input),
    loadDataAction: async input => {
      if (!emptyDataRequest.safeParse(input).success)
        throw new Error("Choose a registered business measure for this dashboard.");
      return {};
    },
    loadGoalsAction: async () => [],
  }), [business]);
  const controls = useMemo(() => ({ definitionId: draft.definitionId, revision: observed.revision, definitionRevision: observed.definitionRevision, business, maxWidgets: 8, measureReferences,
    inspect: async (input: Parameters<typeof inspectBusinessDashboard>[1]) => {
      const result = await inspectBusinessDashboard(business, { ...(typeof input === 'object' && input !== null ? input : {}), definitionId: draft.definitionId });
      if ('error' in result) throw new Error(result.error); return result;
    },
    compareSavedDraft: async (input: Parameters<typeof compareSavedBusinessDashboard>[1]) => {
      const result = await compareSavedBusinessDashboard(business, { ...(typeof input === 'object' && input !== null ? input : {}), definitionId: draft.definitionId });
      if ('error' in result) throw new Error(result.error); return result;
    },
    onSavedHeadChange: adoptHead,
    saveDraft: async (input: Parameters<typeof saveBusinessDashboard>[1]) => {
      const result = await saveBusinessDashboard(business, { ...(typeof input === "object" && input !== null ? input : {}), definitionId: draft.definitionId });
      if ('error' in result) throw new Error(result.error); return result;
    }, onDirtyChange }), [business, draft.definitionId, observed.revision, observed.definitionRevision, onDirtyChange, adoptHead, measureReferences]);
  function run(operation: "review" | "publish" | "restore") {
    if (pending || dirty || (operation === "publish" && review?.revision !== observed.revision)) return;
    setError(""); setMessage("");
    start(async () => {
      try {
        if (operation === "review") {
          const checked = await reviewBusinessDashboard(business, { definitionId: draft.definitionId, revision: observed.revision });
          setReview({ revision: observed.revision, warnings: checked.warnings }); setAcknowledge(false);
          setMessage(checked.warnings.length ? "Review the notes before making this design live." : "The saved dashboard is ready to publish.");
        } else if (operation === "publish") {
          await publishBusinessDashboard(business, { definitionId: draft.definitionId, revision: observed.revision, acknowledgeWarnings: acknowledge });
          setReview(null); setMessage(`Published to ${company}'s Home.`); router.refresh();
        } else {
          if (!versionId || !confirmRestore) return;
          await restoreBusinessDashboard(business, { definitionId: draft.definitionId, versionId, definitionRevision: observed.definitionRevision });
          setConfirmRestore(false); setReview(null); setMessage("The selected previous design is live again."); router.refresh();
        }
      } catch (failure) { setError(feedback(failure)); }
    });
  }
  const suffix = business ? `?business=${encodeURIComponent(business)}` : "";
  return <div className="mx-auto max-w-[1600px] space-y-6 px-5 py-7 md:px-9">
    <Link href={`/design-studio/dashboards${suffix}`} className="inline-flex items-center gap-2 text-sm text-slate-500"><ArrowLeft size={16}/>Business dashboards</Link>
    <header className="flex flex-wrap items-center justify-between gap-5 rounded-3xl border border-blue-100 bg-white p-6">
      <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Dashboard designer · {company}</p>
        <h1 className="mt-2 text-2xl font-semibold">Arrange your business at a glance.</h1><p className="mt-2 text-sm text-slate-500">Save a draft, review it, then make it live for your team.</p></div>
      <span className={`rounded-full px-4 py-2 text-xs font-semibold ${draft.activeVersionId ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"}`}>{draft.activeVersionId ? "Live design · editing a draft" : "Draft design"}</span>
    </header>
    <fieldset disabled={pending} className="min-w-0 border-0 p-0">
      <Studio key={`${draft.revision}:${draft.definitionRevision}`} company={company} metrics={metrics} period={draft.content.period} canManage={canEdit}
        selectedId={draft.definitionId} startEditing dashboards={[{ id: draft.definitionId, name: draft.content.name,
          widgets: draft.content.widgets, filters: draft.content.filters, refreshSeconds: draft.content.refreshSeconds,
          updatedAt: draft.updatedAt, updatedLabel: "Saved draft" }]} serverActions={actions} workspaceHref="/design-studio/dashboards" businessDraft={controls}/>
    </fieldset>
    <section aria-label="Publish business dashboard" className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8">
      <div className="flex items-center gap-3"><ShieldCheck className="text-blue-600"/><div><h2 className="text-lg font-semibold">Review and go live</h2><p className="mt-1 text-sm text-slate-500">Your current live design stays available while you edit.</p></div></div>
      {dirty && <p className="mt-4 text-sm text-amber-800">Save your changes before reviewing or publishing.</p>}
      {review && <div role="status" className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-5"><p className="flex items-center gap-2 font-medium text-blue-900"><Check size={16}/>Saved design reviewed</p>
        {review.warnings.length > 0 && <><ul className="mt-3 space-y-2 text-sm text-blue-900">{review.warnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul>
          <label className="mt-4 flex gap-2 text-sm"><input type="checkbox" checked={acknowledge} onChange={event => setAcknowledge(event.target.checked)}/>I have reviewed these notes.</label></>}</div>}
      <div className="mt-5 flex flex-wrap gap-3">{canEdit && <Button disabled={pending || dirty} onClick={() => run("review")}>Review saved design</Button>}
        {canPublish && <Button variant="primary" disabled={pending || dirty || review?.revision !== observed.revision || (!!review?.warnings.length && !acknowledge)} onClick={() => run("publish")}><Globe size={16}/>Go live for this business</Button>}
        {!business && draft.activeVersionId && <Link className="inline-flex items-center rounded-xl px-3 text-sm font-medium text-blue-600" href={`/business-dashboards/${draft.definitionId}`}>Open live dashboard</Link>}</div>
      {draft.versions.length > 0 && canPublish && <details className="mt-7 border-t border-slate-100 pt-5"><summary className="flex cursor-pointer items-center gap-2 text-sm font-semibold"><History size={16}/>Previous published designs</summary>
        <div className="mt-4 grid max-w-xl gap-4"><label className="grid gap-2 text-sm">Choose a design<select aria-label="Choose a design" className={inputClass} value={versionId} onChange={event => { setVersionId(event.target.value); setConfirmRestore(false); }}><option value="">Choose a published version</option>{draft.versions.map(version => <option key={version.id} value={version.id}>Version {version.version}{version.id === draft.activeVersionId ? " · currently live" : ""}</option>)}</select></label>
          <label className="flex gap-2 text-sm"><input type="checkbox" checked={confirmRestore} onChange={event => setConfirmRestore(event.target.checked)}/>Make this previous design live for the business.</label>
          <Button disabled={pending || dirty || !versionId || !confirmRestore} onClick={() => run("restore")}>Restore selected design</Button></div></details>}
      <p role="alert" className="mt-4 text-sm text-red-700">{error}</p><p role="status" className="mt-4 text-sm text-blue-700">{message}</p>
    </section>
  </div>;
}
