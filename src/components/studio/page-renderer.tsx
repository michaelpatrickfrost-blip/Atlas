"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import type { PageDisplayComponent, PageDisplayModel } from "@/core/studio/pages/render-model";

type Selection = { kind: "section" | "component"; id: string };
export type PageRendererProps = {
  model: PageDisplayModel;
  interaction: "design_only" | "live";
  selection?: Selection | null;
  onSelect?: (selection: Selection) => void;
  onAction?: (componentId: string) => void;
  onNext?: (componentId: string, cursor: NonNullable<Extract<PageDisplayComponent, { type: "queryList" }>["nextCursor"]>) => void;
  onRecordSelect?: (componentId: string, recordId: string) => void;
  renderSurface?: (component: Extract<PageDisplayComponent, { type: "surface" }>) => ReactNode;
};
const grids = ["", "grid-cols-1", "grid-cols-2", "grid-cols-3"];
/** One renderer for customer pages and labelled Studio sample/live previews.
 * Design interaction cannot invoke a command, paginate protected data or navigate
 * business records. Live callbacks go back through the owning server endpoints. */
export function PageRenderer({ model, interaction, selection, onSelect, onAction, onNext, onRecordSelect, renderSurface }: PageRendererProps) {
  const design = interaction === "design_only";
  const selected = (kind: Selection["kind"], id: string) => design && selection?.kind === kind && selection.id === id;
  return <div className="space-y-6" data-page-form-factor={model.formFactor}>
    {model.sections.map(section => <section key={section.id} className={`rounded-3xl border bg-white p-5 shadow-sm ${selected("section", section.id) ? "border-blue-500 ring-2 ring-blue-100" : "border-[var(--color-border)]"}`}>
      <div className="mb-5">
        {design && onSelect ? <button type="button" className="text-left text-lg font-semibold text-[var(--color-ink)]" onClick={() => onSelect({ kind: "section", id: section.id })}>{section.label}</button>
          : <h2 className="text-lg font-semibold text-[var(--color-ink)]">{section.label}</h2>}
        {section.help && <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{section.help}</p>}
      </div>
      <div className={`grid gap-4 ${model.formFactor === "phone" ? "grid-cols-1" : grids[section.columns]}`}>
        {section.components.map(component => <div key={component.id} className={`min-w-0 rounded-2xl border p-4 ${selected("component", component.id) ? "border-blue-500 bg-blue-50/30 ring-2 ring-blue-100" : "border-[var(--color-border)] bg-[var(--color-surface)]"}`}>
          {design && onSelect && <button type="button" aria-label={`Select ${component.label || "component"}`} className="mb-2 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-blue-700" onClick={() => onSelect({ kind: "component", id: component.id })}>Select {component.label || "component"}</button>}
          {component.label && <h3 className="mb-3 text-sm font-semibold text-[var(--color-ink)]">{component.label}</h3>}
          {component.help && <p className="mb-3 text-sm text-[var(--color-ink-muted)]">{component.help}</p>}
          {component.type === "fields" || component.type === "facts" || component.type === "metric" ? <dl className="space-y-3">{component.cells.map((cell, index) => <div key={index}>
            <dt className="text-xs font-medium text-[var(--color-ink-muted)]">{cell.label}</dt><dd className={`${component.type === "metric" ? "text-2xl font-semibold" : "text-sm"} mt-1 break-words text-[var(--color-ink)]`}>{cell.text}</dd></div>)}</dl>
            : component.type === "queryList" ? <div>
              {component.rows.length ? <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{component.columns.map((column, index) => <th key={index} className="whitespace-nowrap border-b px-2 py-2 text-xs font-medium text-[var(--color-ink-muted)]">{column}</th>)}</tr></thead>
                <tbody>{component.rows.map(row => <tr key={row.id} className="border-b last:border-0">{row.cells.map((cell, index) => <td key={index} className="px-2 py-3 align-top">{index === 0 && !design && onRecordSelect ? <button type="button" className="text-left font-medium text-blue-700 hover:underline" onClick={() => onRecordSelect(component.id, row.id)}>{cell.text}</button> : cell.text}</td>)}</tr>)}</tbody></table></div>
                : <p className="py-4 text-sm text-[var(--color-ink-muted)]">No records to show.</p>}
              {component.nextCursor && <Button type="button" variant="ghost" className="mt-3" disabled={design || !onNext} onClick={() => { if (!design && component.nextCursor) onNext?.(component.id, component.nextCursor); }}>Next page</Button>}
            </div> : component.type === "instructions" || component.type === "callout" ? <p className={`whitespace-pre-wrap text-sm leading-6 ${component.type === "callout" && component.tone === "warning" ? "text-amber-800" : component.type === "callout" && component.tone === "success" ? "text-emerald-800" : "text-[var(--color-ink-muted)]"}`}>{component.text}</p>
              : component.type === "action" ? <Button type="button" variant="primary" disabled={design || !onAction} onClick={() => { if (!design) onAction?.(component.id); }}>{component.label || "Continue"}</Button>
                : component.type === "surface" && !design && renderSurface ? renderSurface(component) : <p className="text-sm text-[var(--color-ink-muted)]">This area is supplied by the owning app.</p>}
        </div>)}
      </div>
    </section>)}
  </div>;
}
