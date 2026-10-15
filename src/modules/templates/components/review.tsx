"use client";
import { useEffect, useId, useRef, type ReactNode, type RefObject } from "react";
import { merge, mergeKeys } from "@/core/templates/domain";
import { templateDetailLabel } from "@/core/templates/editor-model";
import type { TemplateBlock } from "@/core/templates/types";

/** The same original block preview is used for editing and comparing. Examples
 * are fixed, carry no record facts and never resolve a provider. */
export const templateExampleValues: Record<string, string> = {
  "company.name": "Your company", "customer.name": "Example customer", "customer.code": "CUS-001",
  "customer.address": "1 Example Street, London", "contact.name": "Alex Taylor", "contact.email": "alex@example.com",
  "record.name": "Example deal", "record.reference": "REF-001", "record.value": "£12,000.00", "record.currency": "GBP",
  "record.date": "7 October 2026", "date.today": "7 October 2026",
};
export function TemplateDocumentPreview({ title, blocks, fields = templateExampleValues, company = "Your company", label = "Document preview", compact = false }: {
  title: string; blocks: TemplateBlock[]; fields?: Record<string, string>; company?: string; label?: string; compact?: boolean;
}) {
  const preview = (text: string) => {
    try {
      const resolved = { ...fields };
      for (const key of mergeKeys(text)) if (resolved[key] === undefined) resolved[key] = `[${templateDetailLabel(key)}]`;
      return merge(text, resolved, false);
    } catch { return "Choose valid business details before saving."; }
  };
  return <article aria-label={label} className={`${compact ? "min-h-96" : "min-h-[640px]"} overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8`}>
    <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">{company}</p>
    <h1 className="my-6 break-words text-2xl font-semibold">{preview(title)}</h1>
    {blocks.map(block => <div key={block.id} className="mb-5 break-words">
      {block.type === "heading" ? <h2 className="text-lg font-semibold">{preview(block.text)}</h2>
        : block.type === "divider" ? <hr /> : block.type === "pageBreak" ? <p className="border-t border-dashed pt-2 text-xs text-slate-400">Page break</p>
          : block.type === "signature" ? <div className="space-y-5 text-sm"><p>{preview(block.text)}</p><p>Name: ____________________</p><p>Signature: _________________ &nbsp; Date: _________</p></div>
            : block.type === "table" ? <div className="overflow-x-auto"><table className="w-full text-sm"><tbody>{preview(block.text).split("\n").map((row, i) => <tr key={i}>{row.split("|").map((cell, j) => <td key={j} className={`border border-slate-200 p-2 ${i === 0 ? "bg-slate-50 font-medium" : ""}`}>{cell}</td>)}</tr>)}</tbody></table></div>
              : block.type === "bullets" ? <ul className="list-disc space-y-1 pl-5 text-sm leading-7 text-slate-600">{preview(block.text).split("\n").filter(Boolean).map((item, i) => <li key={i}>{item}</li>)}</ul>
                : <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600">{preview(block.text)}</p>}
    </div>)}
  </article>;
}

export function TemplateReviewDialog({ title, onClose, children, wide = false, returnFocusRef }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean; returnFocusRef?: RefObject<HTMLButtonElement | null> }) {
  const ref = useRef<HTMLDialogElement>(null), titleId = useId();
  useEffect(() => {
    const previous = returnFocusRef?.current ?? document.activeElement, node = ref.current;
    node?.showModal();
    node?.querySelector<HTMLButtonElement>("button")?.focus();
    return () => { node?.close(); if (previous instanceof HTMLElement && previous.isConnected) previous.focus(); };
  }, [returnFocusRef]);
  return <dialog ref={ref} aria-labelledby={titleId} className={`m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] ${wide ? "max-w-6xl" : "max-w-xl"} overflow-auto rounded-3xl border border-slate-200 bg-white p-5 text-slate-900 shadow-2xl backdrop:bg-slate-950/40 sm:p-7`}
    onCancel={event => { event.preventDefault(); onClose(); }} onKeyDown={event => {
      if (event.key === "Escape") { event.preventDefault(); onClose(); }
      if (event.key !== "Tab") return;
      const items = [...(ref.current?.querySelectorAll<HTMLElement>("button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled)") ?? [])];
      if (!items.length) { event.preventDefault(); ref.current?.focus(); }
      else if (event.shiftKey && document.activeElement === items[0]) { event.preventDefault(); items.at(-1)?.focus(); }
      else if (!event.shiftKey && document.activeElement === items.at(-1)) { event.preventDefault(); items[0].focus(); }
    }}>
    <div className="mb-5 flex items-start justify-between gap-4"><h2 id={titleId} className="text-xl font-semibold">{title}</h2><button type="button" onClick={onClose} className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-sm">Back to editing</button></div>
    {children}
  </dialog>;
}
