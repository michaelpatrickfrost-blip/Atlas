"use client";
import { useMemo, useState } from "react";
import { ActionForm } from "@/components/ui/action-form";
import { BLOCK_TYPES, MERGE_FIELDS, newBlock, type EmailBlock } from "@/core/email/blocks";
import { renderEmail, type Brand } from "@/core/email/render-pure";
import { saveEmailTemplate } from "../actions";

const input = "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm";
const SAMPLE = {
  customer: { name: "Northbridge Construction" }, contact: { firstName: "Sam", name: "Sam Patel", email: "sam@example.com" }, company: { name: "" }, sender: { name: "Your name" },
  order: { reference: "SO-10482", total: "£4,820.00", status: "Confirmed", deliveryDate: "14 Oct" }, quote: { reference: "QT-2201", total: "£12,400.00", link: "https://example.com/quote" },
  invoice: { reference: "INV-5521", total: "£4,820.00", dueDate: "3 Nov" }, shipment: { reference: "SH-3301", tracking: "TRK123456", carrier: "DPD" },
  case: { number: "CS-1042", subject: "Delivery query" }, contract: { title: "Supply agreement", link: "https://example.com/sign" }, csat: { url: "https://example.com/csat" },
  campaign: { name: "Q4 Contractor Growth" }, event: { name: "Product launch", date: "12 Nov", venue: "Leeds" },
};

type Initial = { id: string; name: string; category: string; subject: string; preheader: string; blocks: EmailBlock[] } | null;

export function TemplateMaker({ initial, brand }: { initial: Initial; brand: Brand }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState(initial?.category ?? "GENERAL");
  const [subject, setSubject] = useState(initial?.subject ?? "");
  const [preheader, setPreheader] = useState(initial?.preheader ?? "");
  const [blocks, setBlocks] = useState<EmailBlock[]>(initial?.blocks ?? []);
  const [open, setOpen] = useState<string | null>(null);
  const html = useMemo(() => renderEmail(blocks, brand, { ...SAMPLE, company: { name: brand.name } }, { preheader }).html, [blocks, brand, preheader]);
  const update = (id: string, patch: Partial<EmailBlock>) => setBlocks((bs) => bs.map((b) => (b.id === id ? ({ ...b, ...patch } as EmailBlock) : b)));
  const move = (i: number, d: number) => setBlocks((bs) => { const n = [...bs]; const j = i + d; if (j < 0 || j >= n.length) return bs; [n[i], n[j]] = [n[j], n[i]]; return n; });
  if (!initial && !blocks.length && !name) return <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">Choose a template or start from a ready-made one.</div>;
  return (
    <div className="grid gap-6 2xl:grid-cols-2">
      <ActionForm action={saveEmailTemplate} className="space-y-4">
        <input type="hidden" name="id" value={initial?.id ?? ""} />
        <input type="hidden" name="blocks" value={JSON.stringify(blocks)} />
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm font-medium">Template name<input name="name" required value={name} onChange={(e) => setName(e.target.value)} className={input} /></label>
          <label className="text-sm font-medium">Used for<select name="category" value={category} onChange={(e) => setCategory(e.target.value)} className={input}>{["GENERAL", "SALES", "MARKETING", "SURVEY", "CONTRACT", "INVITE", "FINANCE", "SERVICE"].map((c) => <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>)}</select></label>
          <label className="text-sm font-medium md:col-span-2">Subject<input name="subject" required value={subject} onChange={(e) => setSubject(e.target.value)} className={input} /></label>
          <label className="text-sm font-medium md:col-span-2">Preview line<input name="preheader" value={preheader} onChange={(e) => setPreheader(e.target.value)} className={input} /></label>
        </div>
        <div className="space-y-2">
          {blocks.map((b, i) => (
            <div key={b.id} className="rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between px-3 py-2">
                <button type="button" onClick={() => setOpen(open === b.id ? null : b.id)} className="flex-1 text-left text-sm font-medium">{BLOCK_TYPES.find((t) => t.type === b.type)?.label}<span className="ml-2 text-xs font-normal text-slate-400">{"text" in b ? b.text.slice(0, 40) : "label" in b ? b.label : ""}</span></button>
                <div className="flex gap-1 text-xs"><button type="button" onClick={() => move(i, -1)} aria-label="Move up">↑</button><button type="button" onClick={() => move(i, 1)} aria-label="Move down">↓</button><button type="button" className="text-red-700" onClick={() => setBlocks((bs) => bs.filter((x) => x.id !== b.id))}>Remove</button></div>
              </div>
              {open === b.id && (
                <div className="space-y-2 border-t border-slate-100 p-3">
                  {(b.type === "heading" || b.type === "text") && <textarea className={input} rows={b.type === "text" ? 5 : 2} value={b.text} onChange={(e) => update(b.id, { text: e.target.value })} />}
                  {b.type === "button" && <><input className={input} value={b.label} onChange={(e) => update(b.id, { label: e.target.value })} placeholder="Button text" /><input className={input} value={b.url} onChange={(e) => update(b.id, { url: e.target.value })} placeholder="https://… or {{quote.link}}" /></>}
                  {b.type === "image" && <><input className={input} value={b.url} onChange={(e) => update(b.id, { url: e.target.value })} placeholder="Image link (https://)" /><input className={input} value={b.alt ?? ""} onChange={(e) => update(b.id, { alt: e.target.value })} placeholder="Describe the image" /></>}
                  {b.type === "columns" && <div className="grid grid-cols-2 gap-2"><textarea className={input} rows={4} value={b.left} onChange={(e) => update(b.id, { left: e.target.value })} /><textarea className={input} rows={4} value={b.right} onChange={(e) => update(b.id, { right: e.target.value })} /></div>}
                  {b.type === "csat" && <input className={input} value={b.question} onChange={(e) => update(b.id, { question: e.target.value })} />}
                  {b.type === "details" && (
                    <div className="space-y-2">
                      {b.rows.map((r, ri) => <div key={ri} className="grid grid-cols-2 gap-2"><input className={input} value={r[0]} onChange={(e) => update(b.id, { rows: b.rows.map((x, xi) => (xi === ri ? [e.target.value, x[1]] : x)) as Array<[string, string]> })} /><input className={input} value={r[1]} onChange={(e) => update(b.id, { rows: b.rows.map((x, xi) => (xi === ri ? [x[0], e.target.value] : x)) as Array<[string, string]> })} /></div>)}
                      <button type="button" className="text-xs text-blue-700" onClick={() => update(b.id, { rows: [...b.rows, ["Label", "{{order.reference}}"]] })}>Add row</button>
                    </div>
                  )}
                  {(b.type === "text" || b.type === "heading" || b.type === "button" || b.type === "details") && <p className="text-[11px] text-slate-500">Merge fields: {MERGE_FIELDS.slice(0, 8).map((m) => `{{${m}}}`).join("  ")} …</p>}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">{BLOCK_TYPES.map((t) => <button key={t.type} type="button" title={t.hint} onClick={() => { const nb = newBlock(t.type); setBlocks((bs) => [...bs, nb]); setOpen(nb.id); }} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs hover:bg-slate-50">+ {t.label}</button>)}</div>
        <button className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs text-white">Save template</button>
      </ActionForm>
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Live preview with your brand</p>
        <iframe title="Email preview" sandbox="" srcDoc={html} className="h-[720px] w-full rounded-2xl border border-slate-200 bg-white" />
      </div>
    </div>
  );
}
