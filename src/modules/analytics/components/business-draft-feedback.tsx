"use client";
import React, { useEffect, useRef, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { MiniVisual } from './charts';
import { widgetSpan } from '../definition';
import { analyticsBusinessViewContentSchema, type BusinessViewContent } from '../services/business-view-contract';
import type { BusinessMeasureReference, BusinessViewComparison, BusinessViewInspection } from '../services/business-view-inspection-contract';

export type BusinessDraftFeedbackControls = {
  definitionId: string; revision: number; definitionRevision: number;
  inspect(input: { revision: number; definitionRevision: number; content: BusinessViewContent }): Promise<BusinessViewInspection>;
  compareSavedDraft(input: { revision: number; definitionRevision: number; content: BusinessViewContent }): Promise<BusinessViewComparison>;
};
function feedback(error: unknown) {
  if (error instanceof Error && /CONFLICT|REVIEW_CHANGED/.test(error.message)) return 'Someone else saved this dashboard. Your changes are kept. Compare the saved draft before saving.';
  if (error instanceof Error && /FORBIDDEN|CAPABILITY|UNAUTHORI/.test(error.message)) return 'Your current access does not allow this design. Check your business permissions.';
  return 'Check the selected measures and dashboard settings before saving.';
}
/** Business draft only. Metadata checks/comparison never save, query chart data,
 * publish or merge. Deliberate adoption changes a local baseline only. */
export function BusinessDraftFeedback({ controls, content, references, onReferences, onValidation, onAdopt }: {
  controls: BusinessDraftFeedbackControls; content: unknown; references: BusinessMeasureReference[];
  onReferences(value: BusinessMeasureReference[]): void; onValidation(valid: boolean): void;
  onAdopt(value: BusinessViewComparison, mode: 'keep' | 'saved'): void;
}) {
  const key = JSON.stringify({ definitionId: controls.definitionId, revision: controls.revision, definitionRevision: controls.definitionRevision, content });
  const current = useRef(key);
  useEffect(() => { current.current = key; }, [key]);
  const [checked, setChecked] = useState<{ key: string; error: string; warnings: string[] } | null>(null);
  const [comparison, setComparison] = useState<{ key: string; value: BusinessViewComparison } | null>(null);
  const [comparisonError, setComparisonError] = useState(''), [pending, start] = useTransition();
  const dialog = useRef<HTMLDivElement>(null), openButton = useRef<HTMLButtonElement>(null);
  const { definitionId, revision, definitionRevision, inspect, compareSavedDraft } = controls;
  useEffect(() => {
    let cancelled = false;
    const parsed = analyticsBusinessViewContentSchema.safeParse(content);
    onValidation(false);
    if (!parsed.success) { onReferences([]); return; }
    const timer = setTimeout(() => start(async () => {
      try {
        const result = await inspect({ revision, definitionRevision, content: parsed.data });
        if (cancelled || current.current !== key) return;
        if (result.definitionId !== definitionId || result.revision !== revision || result.definitionRevision !== definitionRevision
          || JSON.stringify(result.content) !== JSON.stringify(parsed.data)) throw new Error('CONFLICT: the inspected draft changed.');
        setChecked({ key, error: '', warnings: result.warnings }); onReferences(result.measures); onValidation(true);
      } catch (error) {
        if (!cancelled && current.current === key) { setChecked({ key, error: feedback(error), warnings: [] }); onReferences([]); onValidation(false); }
      }
    }), 450);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [key, content, definitionId, revision, definitionRevision, inspect, onValidation, onReferences]);
  useEffect(() => {
    if (!comparison || comparison.key !== key) return;
    dialog.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); setComparison(null); openButton.current?.focus(); }
      if (event.key === 'Tab') {
        const buttons = [...(dialog.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? [])];
        const first = buttons[0], last = buttons.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [comparison, key]);
  function compare() {
    const parsed = analyticsBusinessViewContentSchema.safeParse(content);
    if (!parsed.success) { setComparisonError('Check your local dashboard settings before comparing.'); return; }
    setComparisonError('');
    start(async () => {
      try {
        const value = await compareSavedDraft({ revision, definitionRevision, content: parsed.data });
        if (current.current !== key) return;
        if (value.definitionId !== definitionId || value.revision < revision || value.definitionRevision < definitionRevision
          || JSON.stringify(value.local) !== JSON.stringify(parsed.data)) throw new Error('CONFLICT: the comparison changed.');
        setComparison({ key, value });
      } catch (error) { if (current.current === key) setComparisonError(feedback(error)); }
    });
  }
  const parsed = analyticsBusinessViewContentSchema.safeParse(content);
  const result = checked?.key === key ? checked : null, visible = comparison?.key === key ? comparison.value : null;
  return <section aria-label="Dashboard design checks" className="rounded-2xl border border-blue-100 bg-white p-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><p role="status" className="text-sm text-slate-600">
      {(!parsed.success && (parsed.error.issues[0]?.message ?? 'Check the dashboard settings.')) || result?.error || (result ? 'Design checked against your current business access.' : 'Checking your design…')}</p>
      <Button ref={openButton} disabled={pending} onClick={compare}>Compare saved draft</Button></div>
    {!!result?.warnings.length && <ul className="mt-2 text-sm text-amber-800">{result.warnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul>}
    {comparisonError && <p role="alert" className="mt-2 text-sm text-red-700">{comparisonError}</p>}
    {visible && <div className="fixed inset-0 z-50 overflow-auto bg-slate-900/30 p-4 sm:p-8"><div ref={dialog} role="dialog" aria-modal="true" aria-label="Compare dashboard designs" className="mx-auto max-w-5xl rounded-3xl bg-white p-5 sm:p-8">
      <h2 className="text-xl font-semibold">Compare dashboard designs</h2><p className="mt-2 text-sm text-slate-500">Review the chart layout and settings. These illustrations contain no business figures.</p>
      <div className="mt-5 grid gap-5 md:grid-cols-2">{[['Current saved draft', visible.saved], ['Your local changes', visible.local]].map(([label, value]) => {
        const board = value as BusinessViewContent;
        return <section key={String(label)} aria-label={String(label)} className="min-w-0 rounded-2xl border border-slate-200 p-4"><h3 className="font-semibold">{String(label)}</h3><p className="mt-2 text-sm">{board.name} · Period {board.period === 'all' ? 'All time' : `${board.period} days`} · {board.refreshSeconds ? `Refresh ${board.refreshSeconds}s` : 'Manual refresh'}</p>
          <div className="mt-3 grid grid-cols-12 gap-3">{board.widgets.map(widget => <div key={widget.id} className="min-w-0 rounded-xl border border-slate-100 p-3" style={{ gridColumn: `span ${widgetSpan(widget)}` }}>
            <p className="mb-2 truncate text-sm font-medium">{widget.title || visible.measures.find(measure => measure.id === widget.metricId)?.name || 'Approved measure'}</p><MiniVisual type={widget.visual}/>
            <p className="mt-2 text-xs text-slate-500">{widget.breakdown || 'Default breakdown'} · {widget.height || 'Regular height'}</p></div>)}</div></section>;
      })}</div>
      <ul className="mt-5 space-y-1 text-sm text-slate-600">{(visible.changes.length ? visible.changes : ['The saved and local designs match.']).map((change, index) => <li key={index}>{change}</li>)}</ul>
      <div className="mt-6 flex flex-wrap gap-3"><Button onClick={() => { setComparison(null); openButton.current?.focus(); }}>Back to my design</Button>
        <Button onClick={() => { onAdopt(visible, 'keep'); setComparison(null); openButton.current?.focus(); }}>Keep my changes against this saved draft</Button>
        <Button onClick={() => { onAdopt(visible, 'saved'); setComparison(null); openButton.current?.focus(); }}>Use saved draft</Button></div>
    </div></div>}
    {references.length === 0 && result && !result.error && <p className="mt-2 text-xs text-slate-500">Approved measure references are shown beside each selected chart.</p>}
  </section>;
}
