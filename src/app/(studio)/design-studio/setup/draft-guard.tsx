"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { FormFeedback } from "@/core/shared/form-feedback";
import { readSetupDraftEdit, type SetupDraftComparison } from "@/core/studio/authoring/setup-edit-input";

function friendlyFeedback(error: unknown) {
  if (!(error instanceof Error)) return "This draft could not be checked. Your changes are kept.";
  if (/CONFLICT|REVIEW_CHANGED/.test(error.message)) return "Someone else saved this setup. Your changes are kept; compare the saved draft before saving.";
  if (/FORBIDDEN|CAPABILITY|UNAUTHORI/.test(error.message)) return "Your current access does not allow this setup. Your changes are kept; check your business permissions.";
  if (/DEPENDENCY_BROKEN/.test(error.message)) return "A selected setup choice is unavailable or incompatible. Your changes are kept; review the selected screen and details.";
  if (/MIGRATION_REQUIRED/.test(error.message)) return "Published detail settings need the reviewed field-change editor. Your changes are kept.";
  if (error.name === "ZodError") return "Check the detail type, limits and starting value. Your changes are kept.";
  return error.message;
}

/** Client feedback never grants publication. Original save/CAS and separate saved
 * review remain server-owned; comparison changes input/baseline only by choice. */
export function SetupDraftGuard({ editor, controls, definitionRevision = 0, inspect, compare }: {
  editor: ReactNode; controls: ReactNode; definitionRevision?: number;
  inspect?: (form: FormData) => Promise<{ revision: number; definitionRevision: number; warnings: string[] } | FormFeedback>;
  compare?: (form: FormData) => Promise<SetupDraftComparison | FormFeedback>;
}) {
  const [dirty, setDirty] = useState(false), [sequence, setSequence] = useState(0);
  const [feedback, setFeedback] = useState(""), [checking, setChecking] = useState(false);
  const [comparison, setComparison] = useState<{ result: SetupDraftComparison; key: string } | null>(null);
  const [comparing, setComparing] = useState(false);
  const compareButton = useRef<HTMLButtonElement>(null);
  const editorRef = useRef<HTMLDivElement>(null), epoch = useRef(0), definitionHead = useRef(definitionRevision);
  const form = () => editorRef.current?.querySelector("form");
  const snapshot = () => { const element = form(); if (!element) throw new Error("Reopen this saved setup to check its details.");
    const data = new FormData(element); data.set("definitionRevision", String(definitionHead.current)); return data; };
  const key = (data: FormData) => JSON.stringify([...data.entries()]);
  useEffect(() => {
    if (!dirty || !inspect) return;
    const requestEpoch = ++epoch.current;
    let cancelled = false;
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const captured = snapshot(), capturedKey = key(captured); readSetupDraftEdit(captured);
          const result = await inspect(captured);
          if (cancelled || requestEpoch !== epoch.current || capturedKey !== key(snapshot())) return;
          if ("error" in result) throw new Error(result.error);
          if (result.revision !== Number(captured.get("revision")) || result.definitionRevision !== Number(captured.get("definitionRevision")))
            throw new Error("The saved setup changed. Your changes are kept; compare the saved draft.");
          setFeedback(result.warnings.length ? result.warnings.join(" ") : "Draft checks passed. Save your changes before reviewing and going live.");
        } catch (error) {
          if (!cancelled && requestEpoch === epoch.current) setFeedback(friendlyFeedback(error));
        } finally { if (!cancelled && requestEpoch === epoch.current) setChecking(false); }
      })();
    }, 450);
    return () => { cancelled = true; clearTimeout(timer); };
    // DOM values are captured by the change sequence, not a second form store.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty, sequence, inspect]);
  const openComparison = async () => {
    if (!compare || comparing) return;
    const requestEpoch = ++epoch.current;
    setComparing(true); setChecking(false); setFeedback("");
    try {
      const captured = snapshot(), capturedKey = key(captured), result = await compare(captured);
      if (requestEpoch !== epoch.current || capturedKey !== key(snapshot())) return;
      if ("error" in result) throw new Error(result.error);
      if (!Number.isSafeInteger(result.revision) || result.revision < Number(captured.get("revision"))
        || !Number.isSafeInteger(result.definitionRevision) || result.definitionRevision < definitionHead.current)
        throw new Error("The saved draft changed unexpectedly. Your changes are kept.");
      setComparison({ result, key: capturedKey });
    } catch (error) { if (requestEpoch === epoch.current) setFeedback(friendlyFeedback(error)); }
    finally { if (requestEpoch === epoch.current) setComparing(false); }
  };
  const closeComparison = () => { setComparison(null); compareButton.current?.focus(); };
  const keep = () => {
    if (!comparison || comparison.key !== key(snapshot())) { setComparison(null); return; }
    const revision = form()?.querySelector<HTMLInputElement>('input[name="revision"]');
    if (!revision) return;
    revision.value = String(comparison.result.revision); definitionHead.current = comparison.result.definitionRevision;
    epoch.current++; closeComparison(); setDirty(true); setChecking(false);
    setFeedback("Your changes are kept alongside the latest saved draft. Save when ready; Atlas will check for any further changes.");
  };
  return <div className="grid items-start gap-6 lg:grid-cols-[1.5fr_1fr]">
    <div ref={editorRef} inert={comparison !== null} onChangeCapture={() => { epoch.current++; setDirty(true); setSequence(value => value + 1); setFeedback(""); setChecking(!!inspect); setComparison(null); setComparing(false); }}>{editor}</div>
    <div className="space-y-4" inert={comparison !== null}>
      {dirty && <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Save your changes before reviewing, going live or restoring a version.</p>}
      {inspect && dirty && <section aria-label="Setup draft check" aria-live="polite" className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900"><h2 className="font-semibold">Draft check</h2><p className="mt-2">{checking ? "Checking your latest details…" : feedback || "Your changes are kept."}</p></section>}
      {compare && <button ref={compareButton} type="button" disabled={comparing} onClick={() => void openComparison()} className="rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700">{comparing ? "Comparing…" : "Compare saved draft"}</button>}
      {!inspect && feedback && <p role="status" className="text-sm text-slate-600">{feedback}</p>}
      <fieldset disabled={dirty} className="contents"><legend className="sr-only">Saved setup review and published versions</legend>{controls}</fieldset>
    </div>
    {comparison && <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/40 p-4 md:p-8" onKeyDown={event => {
        if (event.key === "Escape") closeComparison();
        if (event.key === "Tab") {
          const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)"), first = buttons[0], last = buttons[buttons.length - 1];
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        }
      }}>
      <section role="dialog" aria-modal="true" aria-label="Compare business setup" className="mx-auto max-w-5xl rounded-3xl bg-white p-6 shadow-xl">
        <h2 className="text-2xl font-semibold">Compare your business setup</h2><p className="mt-2 text-sm text-slate-600">Review the saved details and your changes. Comparing does not save or make anything live.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">{[["Saved draft", comparison.result.savedSummary], ["Your changes", comparison.result.localSummary]] .map(([title, rows]) =>
          <section key={title as string} aria-label={title as string} className="rounded-2xl border border-slate-200 p-5"><h3 className="font-semibold">{title as string}</h3><dl className="mt-4 space-y-3">{(rows as { label: string; value: string }[]).map(row => <div key={row.label}><dt className="text-xs font-medium text-slate-500">{row.label}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-sm">{row.value}</dd></div>)}</dl></section>)}</div>
        <ul className="mt-5 list-disc space-y-1 pl-5 text-sm text-slate-600">{comparison.result.changes.map(change => <li key={change}>{change}</li>)}</ul>
        <div className="mt-6 flex flex-wrap gap-3"><button type="button" autoFocus onClick={closeComparison} className="rounded-xl border px-4 py-2 text-sm">Back to editing</button>
          <button type="button" onClick={keep} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Keep my changes</button>
          <button type="button" onClick={() => window.location.reload()} className="rounded-xl border px-4 py-2 text-sm">Use saved draft</button></div>
      </section>
    </div>}
  </div>;
}
