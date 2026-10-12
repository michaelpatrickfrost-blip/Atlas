"use client";
import { templateDetailLabel, templateTextPieces } from "@/core/templates/editor-model";

/** Named protected details and editable wording serialize to the original text
 * format. No HTML/contenteditable/parser or new template schema is introduced. */
export function TemplateTextEditor({ label, value, onChange, onSelection, compact = false }: {
  label: string; value: string; onChange: (value: string) => void; onSelection: (start: number, end: number) => void; compact?: boolean;
}) {
  const pieces = templateTextPieces(value);
  return <div className="mt-1 flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 focus-within:border-blue-400" role="group" aria-label={`${label} editor`}>
    {pieces.map((piece, index) => {
      const offset = pieces.slice(0, index).reduce((sum, part) => sum + part.value.length, 0);
      if (piece.kind === "detail") return <span key={index} aria-label={`Business detail: ${templateDetailLabel(piece.key)}`} className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
        {templateDetailLabel(piece.key)}<button type="button" aria-label={`Remove ${templateDetailLabel(piece.key)} detail`} onClick={() => { onChange(pieces.filter((_, i) => i !== index).map(part => part.value).join("")); onSelection(offset, offset); }} className="rounded px-1 hover:bg-blue-100">×</button></span>;
      const select = (input: HTMLTextAreaElement) => onSelection(offset + input.selectionStart, offset + input.selectionEnd);
      return <textarea key={index} aria-label={index === 0 ? label : `${label} wording ${index / 2 + 1}`} value={piece.value} maxLength={12000}
        rows={compact ? 1 : Math.max(1, Math.min(7, piece.value.split("\n").length + (piece.value.length > 100 ? 1 : 0)))}
        onFocus={event => select(event.currentTarget)} onSelect={event => select(event.currentTarget)}
        onChange={event => { onChange(pieces.map((part, i) => i === index ? event.target.value : part.value).join("")); select(event.currentTarget); }}
        placeholder={value ? "Add wording…" : "Write your wording…"}
        className={`min-w-16 flex-1 resize-y border-0 bg-transparent py-1 text-sm outline-none ${compact ? "min-h-7" : "min-h-12"}`}/>;
    })}
  </div>;
}
