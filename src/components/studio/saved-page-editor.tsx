"use client";

import { startTransition, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { pagePayloadSchema, type PagePayload } from "@/core/studio/pages/schema";
import { createDesignPageDisplayModel, type PagePresentationCatalog } from "@/core/studio/pages/design-model";
import type { PageDisplayModel } from "@/core/studio/pages/render-model";
import { StudioPageEditor, type PageEditorCanvasProps, type PageEditorFieldChoice, type PageEditorPaletteItem, type PageEditorPreset, type PageEditorSaveResult } from "./page-editor";
import { PageRenderer } from "./page-renderer";
import { EmbeddedBusinessView } from "@/modules/analytics/components/embedded-business-view";
import type { PageDraftComparisonPresentation } from "@/core/studio/authoring/page-draft-presentation";
import type { PageEditorConditions } from "./page-conditions-model";

type Version = { id: string; label: string; publishedAt?: string };
type EditorPresentation = { catalog: PagePresentationCatalog; palette: readonly PageEditorPaletteItem[]; fields: readonly PageEditorFieldChoice[]; conditions?: PageEditorConditions };
type SavedDraftComparison = { presentation: PageDraftComparisonPresentation; revision: number; definitionRevision: number; activeVersionId: string | null; payload: PagePayload; model: PageDisplayModel; changes: string[]; warnings: string[] };
type Review = { revision: number; payload: PagePayload; warnings: string[]; changes?: string[] };
export type SavedPageEditorProps = {
  business: { id: string; name: string; workspaceHref: string };
  draft: { id: string; name: string; revision: number; definitionRevision: number; activeVersionId: string | null; versions: Version[]; payload: PagePayload; warnings: string[] };
  catalog: PagePresentationCatalog; palette: readonly PageEditorPaletteItem[]; fields: readonly PageEditorFieldChoice[]; presets: readonly PageEditorPreset[];
  scope: "list" | "record";
  conditions?: PageEditorConditions;
  callbacks: {
    save(input: { revision: number; payload: PagePayload }): Promise<{ revision: number; definitionRevision?: number; warnings: string[] }>;
    review(input: { revision: number }): Promise<Review>;
    inspect?(input: { revision: number; definitionRevision: number; payload: PagePayload }): Promise<{
      revision: number; definitionRevision: number; payload: PagePayload; warnings: string[];
    }>;
    publish(input: { revision: number; acknowledgeWarnings: boolean }): Promise<{ versionId: string; versionLabel?: string; revision: number; definitionRevision: number; warnings?: string[] }>;
    restore(input: { versionId: string; definitionRevision: number }): Promise<{ revision: number; definitionRevision: number; payload: PagePayload; warnings: string[]; activeVersionId?: string; versionLabel?: string }>;
    preview(input: { payload: PagePayload; recordId?: string; formFactor: PageDisplayModel["formFactor"] }): Promise<PageDisplayModel>;
    chooseSample(): Promise<{ id: string; label: string }[]>;
    compareSavedDraft?(input: { revision: number; definitionRevision: number; payload: PagePayload; formFactor: PageDisplayModel["formFactor"] }): Promise<SavedDraftComparison>;
    compare?(input: { versionId: string; definitionRevision: number; formFactor: PageDisplayModel["formFactor"] }): Promise<{
      versionId: string; definitionRevision: number; label: string; model: PageDisplayModel;
    }>;
  };
};
const pageKey = (page: PagePayload) => JSON.stringify(page);
const reviewHeadKey = (head: { revision: number; definitionRevision: number; payload: PagePayload }) => `${head.revision}:${head.definitionRevision}:${pageKey(head.payload)}`;
const revision = (value: number) => Number.isSafeInteger(value) && value >= 0;
type Dialog = { kind: "publish"; review: Review; pageKey: string } | { kind: "restore"; version: Version; definitionRevision: number }
  | { kind: "savedDraft"; saved: SavedDraftComparison; local: PageDisplayModel; localKey: string; expectedRevision: number; expectedDefinitionRevision: number }
  | { kind: "compare"; label: string; previous: PageDisplayModel; current: PageDisplayModel };

/** Client adapter only. Callbacks come from the trusted client route adapter;
 * no browser metadata grants publication or business-record authority. */
export function SavedPageEditor(props: SavedPageEditorProps) {
  const [identity] = useState(`${props.business.id}:${props.draft.id}`), sameIdentity = identity === `${props.business.id}:${props.draft.id}`;
  const [presentation, setPresentation] = useState<EditorPresentation>(() => ({ catalog: props.catalog, fields: props.fields, palette: props.palette, conditions: props.conditions }));
  const [page, setPage] = useState(() => structuredClone(props.draft.payload));
  const [head, setHead] = useState(() => ({ revision: props.draft.revision, definitionRevision: props.draft.definitionRevision, payload: structuredClone(props.draft.payload), warnings: props.draft.warnings }));
  const [versions, setVersions] = useState(props.draft.versions), [activeVersionId, setActiveVersionId] = useState(props.draft.activeVersionId);
  const [review, setReview] = useState<Review | null>(null), [reviewing, setReviewing] = useState(true), [feedback, setFeedback] = useState("");
  const [operation, setOperation] = useState<"save" | "publish" | "restore" | "preview" | "samples" | "compare" | null>(null);
  const [dialog, setDialog] = useState<Dialog | null>(null), [acknowledge, setAcknowledge] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState(""), [samples, setSamples] = useState<{ id: string; label: string }[]>([]), [recordId, setRecordId] = useState("");
  const [formFactor, setFormFactor] = useState<PageDisplayModel["formFactor"]>(props.draft.payload.formFactors[0]);
  const [actualPreview, setActualPreview] = useState<{ key: string; recordId: string; model: PageDisplayModel } | null>(null);
  const [alternateSamples, setAlternateSamples] = useState(false);
  const current = useRef({ page, head, identity, formFactor }), reviewEpoch = useRef(0), previewEpoch = useRef(0);
  const inspectionEpoch = useRef(0), comparisonEpoch = useRef(0), comparedHeadWithoutReview = useRef<string | null>(null);
  const [inspection, setInspection] = useState<{ key: string; message: string; warnings: string[] } | null>(null);
  useEffect(() => { current.current = { page, head, identity: `${props.business.id}:${props.draft.id}`, formFactor }; }, [page, head, props.business.id, props.draft.id, formFactor]);
  const dirty = pageKey(page) !== pageKey(head.payload), busy = operation !== null;
  const reviewed = review !== null && review.revision === head.revision && pageKey(review.payload) === pageKey(head.payload);
  const shape = pagePayloadSchema.safeParse(page), key = `${head.revision}:${head.definitionRevision}:${pageKey(page)}`;
  // Pure shape feedback is immediate. Metadata checks are bounded/debounced and
  // cannot replace the separate saved-head review required to publish.
  const checkMessage = !shape.success ? "Check the highlighted design settings: " + shape.error.issues.slice(0, 3).map(issue => issue.message).join(" ")
    : inspection?.key === key ? inspection.message : "Checking your latest draft…";
  useEffect(() => {
    const epoch = ++inspectionEpoch.current;
    if (!sameIdentity || !dirty || !props.callbacks.inspect || operation !== null || !pagePayloadSchema.safeParse(page).success) return;
    const captured = structuredClone(page), capturedKey = pageKey(captured), expected = head;
    let cancelled = false;
    const timer = setTimeout(() => {
      startTransition(async () => {
        try {
          const result = await props.callbacks.inspect!({ revision: expected.revision, definitionRevision: expected.definitionRevision, payload: captured });
          if (cancelled || epoch !== inspectionEpoch.current || current.current.identity !== identity || pageKey(current.current.page) !== capturedKey
            || current.current.head.revision !== expected.revision || current.current.head.definitionRevision !== expected.definitionRevision) return;
          if (result.revision !== expected.revision || result.definitionRevision !== expected.definitionRevision
            || pageKey(pagePayloadSchema.parse(result.payload)) !== pageKey(pagePayloadSchema.parse(captured))) throw new Error("Changed draft check");
          setInspection({ key: `${expected.revision}:${expected.definitionRevision}:${capturedKey}`, message: "Draft checks passed. Save this design before reviewing and publishing.", warnings: result.warnings });
        } catch (error) {
          if (cancelled || epoch !== inspectionEpoch.current || current.current.identity !== identity || pageKey(current.current.page) !== capturedKey
            || current.current.head.revision !== expected.revision || current.current.head.definitionRevision !== expected.definitionRevision) return;
          const message = error instanceof Error && /^(CONFLICT|FORBIDDEN|DEPENDENCY_BROKEN):/.test(error.message)
            ? "This draft could not be checked against the current saved screen and access. Your changes are kept."
            : error instanceof Error ? error.message : "This draft could not be checked. Your changes are kept.";
          setInspection({ key: `${expected.revision}:${expected.definitionRevision}:${capturedKey}`, message, warnings: [] });
        }
      });
    }, 450);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [page, head, dirty, sameIdentity, identity, operation, props.callbacks.inspect]);
  const titleId = useId();
  const applyReview = async (expected: typeof head, epoch: number, cancelled: () => boolean = () => false) => {
    try {
      const result = await props.callbacks.review({ revision: expected.revision });
      if (cancelled() || epoch !== reviewEpoch.current || current.current.identity !== identity) return;
      if (result.revision !== expected.revision || pageKey(result.payload) !== pageKey(expected.payload)
        || current.current.head.revision !== expected.revision) throw new Error("Stale review");
      setReview(result);
    } catch {
      if (!cancelled() && epoch === reviewEpoch.current && current.current.identity === identity) { setReview(null); setFeedback("The saved draft could not be reviewed. Your design is kept. Recheck the saved draft before publishing."); }
    } finally { if (!cancelled() && epoch === reviewEpoch.current && current.current.identity === identity) setReviewing(false); }
  };
  useEffect(() => {
    // A comparison choice only adopts client state. The original saved review
    // persists validation, so it must remain an explicit action for this head.
    if (!sameIdentity || comparedHeadWithoutReview.current === reviewHeadKey(head)) return;
    const epoch = ++reviewEpoch.current;
    let cancelled = false;
    void Promise.resolve().then(async () => {
      if (cancelled) return;
      setReview(null); setReviewing(true);
      await applyReview(head, epoch, () => cancelled);
    });
    return () => { cancelled = true; };
    // Each exact acknowledged saved head is checked once. Edits cannot mutate it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [head.revision, head.definitionRevision, head.payload, sameIdentity, props.callbacks.review]);
  const change = (next: PagePayload) => {
    current.current.page = next; setPage(next); setDialog(null); setReview(null); setActualPreview(null); setFeedback("");
    reviewEpoch.current++; previewEpoch.current++; setReviewing(false);
    inspectionEpoch.current++; comparisonEpoch.current++; setInspection(null);
  };
  const save = async (submitted: PagePayload): Promise<PageEditorSaveResult> => {
    if (!sameIdentity || busy) return { status: "invalid", message: "This editor is busy. Your changes are kept." };
    const expected = current.current.head.revision;
    setOperation("save"); setFeedback("");
    try {
      const result = await props.callbacks.save({ revision: expected, payload: structuredClone(submitted) });
      if (current.current.identity !== identity) return { status: "invalid", message: "Reopen the selected business screen. Your changes are kept." };
      if (!revision(result.revision) || result.revision <= expected || (result.definitionRevision !== undefined && !revision(result.definitionRevision)) || current.current.head.revision !== expected) throw new Error("Invalid saved acknowledgement");
      const next = { revision: result.revision, definitionRevision: result.definitionRevision ?? current.current.head.definitionRevision, payload: structuredClone(submitted), warnings: result.warnings };
      current.current.head = next; setHead(next); setReview(null);
      return { status: "saved", message: "Draft saved. Review it before making it live." };
    } catch {
      setFeedback("Saving could not be confirmed. Your changes are kept. Recheck the saved draft before trying again.");
      return { status: "conflict", message: "Your changes are kept. The saved draft may have changed; recheck it before trying again." };
    } finally { setOperation(null); }
  };
  const openPublish = async (submitted: PagePayload) => {
    if (!sameIdentity || busy || dirty || !reviewed || pageKey(submitted) !== pageKey(head.payload)) return;
    const expected = head, key = pageKey(submitted), epoch = ++reviewEpoch.current;
    setReviewing(true); setFeedback("");
    try {
      const result = await props.callbacks.review({ revision: expected.revision });
      if (current.current.identity !== identity || epoch !== reviewEpoch.current || current.current.head.revision !== expected.revision || pageKey(current.current.page) !== key) return;
      if (result.revision !== expected.revision || pageKey(result.payload) !== key) throw new Error("Stale review");
      setReview(result); setAcknowledge(false); setDialog({ kind: "publish", review: result, pageKey: key });
    } catch { setReview(null); setFeedback("This saved draft needs a fresh review. Your design is kept."); }
    finally { setReviewing(false); }
  };
  const confirmPublish = async () => {
    if (!dialog || dialog.kind !== "publish" || busy || !sameIdentity || dirty || !reviewed || dialog.review.revision !== current.current.head.revision
      || dialog.pageKey !== pageKey(current.current.page) || (dialog.review.warnings.length > 0 && !acknowledge)) return;
    const approved = dialog.review;
    setOperation("publish"); setFeedback("");
    try {
      const result = await props.callbacks.publish({ revision: approved.revision, acknowledgeWarnings: acknowledge });
      if (current.current.identity !== identity) return;
      if (!revision(result.revision) || !revision(result.definitionRevision) || result.revision < approved.revision || !result.versionId) throw new Error("Invalid publication acknowledgement");
      setActiveVersionId(result.versionId);
      setVersions(prior => prior.some(version => version.id === result.versionId) ? prior : [...prior, { id: result.versionId, label: result.versionLabel ?? "Published design" }]);
      const next = { ...current.current.head, revision: result.revision, definitionRevision: result.definitionRevision, warnings: result.warnings ?? approved.warnings };
      current.current.head = next; setHead(next); setDialog(null); setFeedback("Your reviewed design is now live for this business.");
    } catch { setFeedback("Publishing could not be confirmed. Your draft is kept. Recheck the live design before trying again."); setDialog(null); setReview(null); }
    finally { setOperation(null); }
  };
  const confirmRestore = async () => {
    if (!dialog || dialog.kind !== "restore" || busy || dirty || !sameIdentity) return;
    const selected = dialog.version;
    setOperation("restore"); setFeedback("");
    try {
      const result = await props.callbacks.restore({ versionId: selected.id, definitionRevision: dialog.definitionRevision });
      if (current.current.identity !== identity) return;
      if (!revision(result.revision) || !revision(result.definitionRevision)) throw new Error("Invalid restore acknowledgement");
      const next = { revision: result.revision, definitionRevision: result.definitionRevision, payload: result.payload, warnings: result.warnings };
      current.current.head = next; setHead(next); setActiveVersionId(result.activeVersionId ?? selected.id);
      // Restoring changes the live pointer only. Never replace the local design.
      setDialog(null); setReview(null); setActualPreview(null);
      setFeedback(`Live screen restored to ${result.versionLabel ?? selected.label}. Your current draft is kept.`);
    } catch { setDialog(null); setFeedback("Restore could not be confirmed. Your current draft is kept. Recheck the live design before trying again."); }
    finally { setOperation(null); }
  };
  const loadSamples = async () => {
    if (busy || !sameIdentity) return;
    setOperation("samples"); setFeedback("");
    try {
      const choices = await props.callbacks.chooseSample();
      if (current.current.identity !== identity) return;
      if (choices.length > 50 || new Set(choices.map(choice => choice.id)).size !== choices.length || choices.some(choice => !choice.id || !choice.label)) throw new Error("Invalid sample choices");
      setSamples(choices); setRecordId(choices[0]?.id ?? ""); setActualPreview(null);
      if (!choices.length) setFeedback("There are no accessible records to preview yet. The design canvas still shows labelled samples.");
    } catch { setFeedback("Records could not be loaded. The design canvas still shows labelled samples."); }
    finally { setOperation(null); }
  };
  const preview = async () => {
    if (busy || !sameIdentity || (props.scope === "record" && !samples.some(sample => sample.id === recordId))) return;
    const captured = structuredClone(current.current.page), key = pageKey(captured), selected = props.scope === "record" ? recordId : "", size = formFactor, epoch = ++previewEpoch.current;
    setOperation("preview"); setFeedback("");
    try {
      const model = await props.callbacks.preview({ payload: captured, ...(selected ? { recordId: selected } : {}), formFactor: size });
      if (current.current.identity !== identity || epoch !== previewEpoch.current || pageKey(current.current.page) !== key) return;
      if (model.formFactor !== size) throw new Error("Preview size changed");
      setActualPreview({ key, recordId: selected, model });
    } catch { setActualPreview(null); setFeedback("This record preview is unavailable. Your design is kept and labelled samples remain available."); }
    finally { setOperation(null); }
  };
  const compare = async () => {
    if (busy || !sameIdentity || !selectedVersion || !props.callbacks.compare) return;
    const captured = structuredClone(current.current.page), key = pageKey(captured), selected = selectedVersion,
      expectedHead = current.current.head.definitionRevision, size = formFactor;
    setOperation("compare"); setFeedback("");
    try {
      const result = await props.callbacks.compare({ versionId: selected, definitionRevision: expectedHead, formFactor: size });
      if (current.current.identity !== identity || pageKey(current.current.page) !== key || current.current.head.definitionRevision !== expectedHead) return;
      if (result.versionId !== selected || result.definitionRevision !== expectedHead || result.model.formFactor !== size) throw new Error("Changed comparison");
      setDialog({ kind: "compare", label: result.label, previous: result.model,
        current: createDesignPageDisplayModel(captured, presentation.catalog, size) });
    } catch { setFeedback("This published design could not be compared. Your current changes are kept; refresh its saved versions and check your access."); }
    finally { setOperation(null); }
  };
  const compareSavedDraft = async () => {
    if (busy || !sameIdentity || !props.callbacks.compareSavedDraft || !shape.success) return;
    const captured = structuredClone(current.current.page), localKey = pageKey(captured), expected = current.current.head,
      size = formFactor, epoch = ++comparisonEpoch.current;
    const stale = () => current.current.identity !== identity || epoch !== comparisonEpoch.current
      || pageKey(current.current.page) !== localKey || current.current.formFactor !== size
      || current.current.head.revision !== expected.revision || current.current.head.definitionRevision !== expected.definitionRevision;
    setOperation("compare"); setFeedback("");
    try {
      const saved = await props.callbacks.compareSavedDraft({ revision: expected.revision, definitionRevision: expected.definitionRevision, payload: captured, formFactor: size });
      if (stale()) return;
      if (!revision(saved.revision) || saved.revision < expected.revision || !revision(saved.definitionRevision) || saved.definitionRevision < expected.definitionRevision
        || saved.model.formFactor !== size || JSON.stringify(pagePayloadSchema.parse(saved.payload).entity) !== JSON.stringify(captured.entity)
        || saved.changes.length > 101 || saved.changes.some(item => typeof item !== "string")) throw new Error("Changed saved comparison");
      setDialog({ kind: "savedDraft", saved, local: createDesignPageDisplayModel(captured, saved.presentation.local.catalog, size), localKey,
        expectedRevision: expected.revision, expectedDefinitionRevision: expected.definitionRevision });
    } catch {
      if (!stale()) setFeedback("The current saved draft could not be compared. Your changes are kept. Check your access and try again.");
    } finally { setOperation(null); }
  };
  const adoptComparedHead = (keepLocal: boolean) => {
    if (!dialog || dialog.kind !== "savedDraft" || busy || !sameIdentity || pageKey(current.current.page) !== dialog.localKey
      || current.current.head.revision !== dialog.expectedRevision || current.current.head.definitionRevision !== dialog.expectedDefinitionRevision) return;
    const saved = dialog.saved, next = { revision: saved.revision, definitionRevision: saved.definitionRevision,
      payload: structuredClone(saved.payload), warnings: saved.warnings };
    comparisonEpoch.current++; inspectionEpoch.current++; reviewEpoch.current++; previewEpoch.current++;
    comparedHeadWithoutReview.current = reviewHeadKey(next); setReviewing(false);
    current.current.head = next; setHead(next); setPresentation(keepLocal ? saved.presentation.local : saved.presentation.saved); setActiveVersionId(saved.activeVersionId); setReview(null); setInspection(null); setActualPreview(null); setDialog(null);
    if (!keepLocal) { const nextPage = structuredClone(saved.payload); current.current.page = nextPage; setPage(nextPage); }
    setFeedback(keepLocal ? "Your changes are kept alongside the latest saved draft. Save when ready; the server will check for any further changes."
      : "The current saved draft is now open. Your live design has not changed.");
  };
  const recheck = () => { if (!busy && sameIdentity) { const epoch = ++reviewEpoch.current; setReviewing(true); setFeedback(""); void applyReview(head, epoch); } };
  const activeLabel = versions.find(version => version.id === activeVersionId)?.label ?? (activeVersionId ? "Published design" : "No published design yet");
  const newSection = { label: "New section", help: "", formFactors: page.formFactors, columns: { desktop: 2 as const, tablet: 2 as const, phone: 1 as const },
    components: [{ id: "new_note", type: "instructions" as const, label: "Next steps", text: "Add helpful guidance for your team.", formFactors: page.formFactors }] };
  const editorProps = { businessName: props.business.name, screenName: props.draft.name, workspaceHref: props.business.workspaceHref, liveVersionLabel: activeLabel,
    page, savedPage: head.payload, onChange: change, createNodeId: () => `node_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`,
    palette: presentation.palette, fields: presentation.fields, presets: props.presets, conditions: presentation.conditions, newSection, saveDraft: save, requestPublishReview: !sameIdentity || busy ? undefined : openPublish,
    review: { page: review?.payload ?? head.payload, status: reviewed ? "valid" as const : reviewing ? "pending" as const : "invalid" as const,
      messages: (review?.warnings ?? head.warnings).map(message => ({ severity: "warning" as const, message })) },
    renderCanvas: (canvas: PageEditorCanvasProps) => <Canvas canvas={canvas} catalog={presentation.catalog} actual={actualPreview?.key === pageKey(page) ? actualPreview.model : null} onFormFactor={setFormFactor} onAlternateSamples={setAlternateSamples} /> };
  return <div className="flex h-dvh flex-col bg-[var(--color-surface)]">
    <div inert={dialog !== null} className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b bg-white px-5 py-2 text-xs text-[var(--color-ink-muted)]">
        <span className="mr-auto">{alternateSamples ? "Alternate layout · labelled samples" : actualPreview?.model.formFactor === formFactor ? `Actual ${props.scope === "list" ? "list" : samples.find(sample => sample.id === actualPreview.recordId)?.label ?? "record"} preview · buttons are disabled` : "Design canvas · labelled samples"}</span>
        {props.callbacks.compareSavedDraft && <Button type="button" variant="ghost" disabled={busy || !sameIdentity || !shape.success} onClick={compareSavedDraft}>Compare saved draft</Button>}
        <Button type="button" variant="ghost" disabled={busy || reviewing || !sameIdentity} onClick={recheck}>Recheck saved draft</Button>
        {props.scope === "record" && <><Button type="button" variant="ghost" disabled={busy || !sameIdentity} onClick={loadSamples}>Choose preview record</Button><select aria-label="Preview record" className="max-w-52 rounded-xl border bg-white px-3 py-2" value={recordId} onChange={event => { setRecordId(event.target.value); setActualPreview(null); }} disabled={busy || !samples.length}><option value="">Choose a record</option>{samples.map(sample => <option key={sample.id} value={sample.id}>{sample.label}</option>)}</select></>}
        <Button type="button" disabled={busy || !sameIdentity || (props.scope === "record" && !recordId)} onClick={preview}>{operation === "preview" ? "Loading preview…" : "Load actual preview"}</Button>
        {actualPreview && <Button type="button" variant="ghost" onClick={() => { previewEpoch.current++; setActualPreview(null); }}>Use samples</Button>}
        <select aria-label="Previous published design" className="max-w-48 rounded-xl border bg-white px-3 py-2" value={selectedVersion} disabled={busy || !versions.length} onChange={event => setSelectedVersion(event.target.value)}><option value="">Previous designs</option>{versions.map(version => <option key={version.id} value={version.id}>{version.label}{version.id === activeVersionId ? " · Live" : ""}</option>)}</select>
        {props.callbacks.compare && <Button type="button" disabled={busy || !sameIdentity || !selectedVersion} onClick={compare}>{operation === "compare" ? "Loading comparison…" : "Compare designs"}</Button>}
        <Button type="button" disabled={busy || dirty || !sameIdentity || !selectedVersion || selectedVersion === activeVersionId} onClick={() => { const version = versions.find(version => version.id === selectedVersion); if (version) setDialog({ kind: "restore", version, definitionRevision: head.definitionRevision }); }}>Restore live design</Button>
      </div>
      {(!sameIdentity || feedback) && <p role="status" className="border-b bg-blue-50 px-5 py-3 text-sm text-blue-900">{!sameIdentity ? "This editor belongs to another draft. Reopen the selected business screen before saving." : feedback}</p>}
      {sameIdentity && dirty && props.callbacks.inspect && <section aria-label="Draft check" aria-live="polite" className="border-b bg-slate-50 px-5 py-3 text-xs text-slate-700">
        <strong>Draft check: </strong>{checkMessage}{inspection?.key === key && inspection.warnings.length > 0 && <ul className="mt-2 list-disc pl-5">{inspection.warnings.map((warning, i) => <li key={i}>{warning}</li>)}</ul>}
      </section>}
      <div className="min-h-0 flex-1 [&>main]:h-full"><StudioPageEditor {...editorProps} /></div>
    </div>
    {dialog && <EditorDialog titleId={titleId} wide={dialog.kind === "compare" || dialog.kind === "savedDraft"} title={dialog.kind === "savedDraft" ? "Compare the saved draft" : dialog.kind === "publish" ? "Make this design live?" : dialog.kind === "compare" ? "Compare your designs" : `Restore ${dialog.version.label}?`} busy={operation === "publish" || operation === "restore"} onClose={() => setDialog(null)}>
      {dialog.kind === "savedDraft" ? <>
        <p className="mb-5 text-sm leading-6 text-[var(--color-ink-muted)]">Compare the latest saved design with your unsaved work. These previews use labelled samples; buttons are disabled.</p>
        <div className="grid gap-6 lg:grid-cols-2"><section aria-label="Saved draft preview" className="min-w-0"><h3 className="mb-3 font-semibold">Current saved draft</h3><PageRenderer model={dialog.saved.model} interaction="design_only" /></section>
          <section aria-label="Unsaved draft preview" className="min-w-0"><h3 className="mb-3 font-semibold">Your unsaved design</h3><PageRenderer model={dialog.local} interaction="design_only" /></section></div>
        <h3 className="mt-5 font-semibold">What changed</h3><ul className="mt-2 list-disc space-y-2 pl-5 text-sm">{dialog.saved.changes.map((item, i) => <li key={i}>{item}</li>)}</ul>
        {dialog.saved.warnings.length > 0 && <ul className="mt-4 list-disc rounded-xl bg-amber-50 p-5 text-sm text-amber-900">{dialog.saved.warnings.map((item, i) => <li key={i}>{item}</li>)}</ul>}
        <p className="mt-5 text-sm text-[var(--color-ink-muted)]">Keeping your changes does not merge the designs. Your next Save replaces the saved draft with your design if nobody has saved again. Using the saved draft replaces your unsaved design. Neither choice publishes anything.</p>
        <div className="mt-6 flex flex-wrap justify-end gap-3"><Button type="button" onClick={() => setDialog(null)}>Back to editing</Button><Button type="button" onClick={() => adoptComparedHead(false)}>Use saved draft</Button><Button type="button" variant="primary" onClick={() => adoptComparedHead(true)}>Keep my changes</Button></div>
      </> : dialog.kind === "compare" ? <>
        <p className="mb-5 text-sm leading-6 text-[var(--color-ink-muted)]">Labelled samples show the layout changes. Your draft and live design are kept. Preview buttons are disabled.</p>
        <div className="grid gap-6 lg:grid-cols-2"><section aria-label="Previous design preview" className="min-w-0"><h3 className="mb-3 font-semibold">{dialog.label}</h3><PageRenderer model={dialog.previous} interaction="design_only"/></section>
          <section aria-label="Current draft preview" className="min-w-0"><h3 className="mb-3 font-semibold">Your current draft</h3><PageRenderer model={dialog.current} interaction="design_only"/></section></div>
        <div className="mt-6 flex justify-end"><Button type="button" onClick={() => setDialog(null)}>Back to editing</Button></div>
      </> : dialog.kind === "publish" ? <>
        <p className="text-sm leading-6 text-[var(--color-ink-muted)]">This publishes the reviewed saved design to {props.business.name}. Your team will see it on their business screens.</p>
        <h3 className="mt-5 font-semibold">Changes to review</h3><ul className="mt-2 list-disc space-y-2 pl-5 text-sm">{(dialog.review.changes?.length ? dialog.review.changes : [`${dialog.review.payload.sections.length} labelled sections with ${dialog.review.payload.sections.reduce((count, section) => count + section.components.length, 0)} items.`, `Available on ${dialog.review.payload.formFactors.join(", ")}.`]).map((change, index) => <li key={index}>{change}</li>)}</ul>
        {dialog.review.warnings.length > 0 && <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4"><h3 className="font-semibold text-amber-900">Before publishing</h3><ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-amber-900">{dialog.review.warnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul><label className="mt-4 flex items-start gap-2 text-sm"><input type="checkbox" checked={acknowledge} onChange={event => setAcknowledge(event.target.checked)} disabled={busy} />I have reviewed these notes.</label></div>}
        <div className="mt-6 flex justify-end gap-3"><Button type="button" disabled={busy} onClick={() => setDialog(null)}>Keep editing</Button><Button type="button" variant="primary" disabled={busy || dirty || !reviewed || (dialog.review.warnings.length > 0 && !acknowledge)} onClick={confirmPublish}>{operation === "publish" ? "Publishing…" : "Go live"}</Button></div>
      </> : <><p className="text-sm leading-6 text-[var(--color-ink-muted)]">This makes {dialog.version.label} the live design for {props.business.name}. Your current draft is kept so you can continue editing it.</p>{dialog.version.publishedAt && <p className="mt-3 text-sm">Published {dialog.version.publishedAt}</p>}<div className="mt-6 flex justify-end gap-3"><Button type="button" disabled={busy} onClick={() => setDialog(null)}>Keep current live design</Button><Button type="button" variant="primary" disabled={busy || dirty} onClick={confirmRestore}>{operation === "restore" ? "Restoring…" : "Restore this live design"}</Button></div></>}
    </EditorDialog>}
  </div>;
}
function Canvas({ canvas, catalog, actual, onFormFactor, onAlternateSamples }: { canvas: PageEditorCanvasProps; catalog: PagePresentationCatalog; actual: PageDisplayModel | null; onFormFactor: (form: PageDisplayModel["formFactor"]) => void; onAlternateSamples: (value: boolean) => void }) {
  useEffect(() => { onFormFactor(canvas.formFactor); }, [canvas.formFactor, onFormFactor]);
  useEffect(() => { onAlternateSamples(!!canvas.designVariantId); }, [canvas.designVariantId, onAlternateSamples]);
  if (!pagePayloadSchema.safeParse(canvas.page).success)
    return <p className="p-5 text-sm text-amber-800">Complete the design settings to preview this layout. Your changes are kept.</p>;
  const model = !canvas.designVariantId && actual?.formFactor === canvas.formFactor ? actual : createDesignPageDisplayModel(canvas.page, catalog, canvas.formFactor);
  return <PageRenderer model={model} interaction="design_only" selection={canvas.selection} onSelect={canvas.onSelect}
    renderAnalyticsView={component => <EmbeddedBusinessView output={component.output}/>}/>;
}
function EditorDialog({ titleId, title, busy, onClose, children, wide = false }: { titleId: string; title: string; busy: boolean; onClose: () => void; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { const previous = document.activeElement; ref.current?.querySelector<HTMLElement>(":is(button,input):not(:disabled)")?.focus(); return () => { if (previous instanceof HTMLElement) previous.focus(); }; }, []);
  return <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/40 p-4">
    <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} className={`max-h-[90dvh] w-full ${wide ? "max-w-7xl" : "max-w-xl"} overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl`} onKeyDown={event => {
      if (event.key === "Escape" && !busy) { event.preventDefault(); onClose(); }
      if (event.key !== "Tab") return;
      const focusable = [...(ref.current?.querySelectorAll<HTMLElement>(":is(button,input,select,a[href]):not(:disabled)") ?? [])];
      if (!focusable.length) { event.preventDefault(); ref.current?.focus(); return; }
      if (event.shiftKey && document.activeElement === focusable[0]) { event.preventDefault(); focusable.at(-1)?.focus(); }
      else if (!event.shiftKey && document.activeElement === focusable.at(-1)) { event.preventDefault(); focusable[0].focus(); }
    }}><h2 id={titleId} className="mb-4 text-xl font-semibold">{title}</h2>{children}</div>
  </div>;
}
