"use client";
import React, { startTransition, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/service-fields";
import type { FieldSearchRequest } from "@/core/studio/fields/search-contract";
import type { TicketSearchField, TicketFieldSearchResult } from "@/core/service-work/field-search-contract";
import { readFieldSearchFilter, supportsSearchRange, type SearchDraft } from "./field-search-value";

type Choice = { id: string; label: string };
type ReferenceRequest = Pick<TicketSearchField, "definitionId" | "definitionRevision" | "versionId" | "generationId"> & { search: string };
const initial = (field: TicketSearchField): SearchDraft => ({ operator: "equals", text: "", currency: field.storage.type === "money" ? field.storage.currencies[0] : "" });
const observation = (field: TicketSearchField) => ({ definitionId: field.definitionId, definitionRevision: field.definitionRevision, versionId: field.versionId, generationId: field.generationId });
const friendlyError = (error: unknown) => error instanceof Error && /^CONFLICT:/.test(error.message)
  ? "The search setup or access changed. Your entries are kept; refresh this page before trying again."
  : "Search is unavailable. Your entries are kept. Check your access or try again.";

/** Pure customer search UI. Original owning engine controls private visibility,
 * current/written policy, typed comparisons and scanned-window cursor. */
export function TicketAdditionalDetailSearch({ fields, search, searchReferences }: { fields: TicketSearchField[];
  search: (request: FieldSearchRequest) => Promise<TicketFieldSearchResult>;
  searchReferences: (request: ReferenceRequest) => Promise<Choice[]> }) {
  const [selected, setSelected] = useState(fields[0]?.definitionId ?? ""), [draft, setDraft] = useState<SearchDraft>(fields[0] ? initial(fields[0]) : { operator: "equals", text: "", currency: "" });
  const [result, setResult] = useState<TicketFieldSearchResult | null>(null), [pending, setPending] = useState(false), [error, setError] = useState("");
  const [referenceText, setReferenceText] = useState(""), [choices, setChoices] = useState<Choice[]>([]), [chosenLabel, setChosenLabel] = useState(""), [referencePending, setReferencePending] = useState(false);
  const sequence = useRef(0), referenceSequence = useRef(0), field = fields.find(item => item.definitionId === selected);
  useEffect(() => () => { sequence.current += 1; referenceSequence.current += 1; }, []);
  const invalidate = () => { sequence.current += 1; setResult(null); setPending(false); setError(""); };
  const change = (patch: Partial<SearchDraft>) => { invalidate(); setDraft(previous => ({ ...previous, ...patch })); };
  const run = (next = false) => {
    if (!field) return;
    let request: FieldSearchRequest;
    try { request = { ...observation(field), filter: readFieldSearchFilter(field, draft), limit: 25, ...(next && result?.next ? { cursor: result.next } : {}) }; }
    catch (error) { setError(error instanceof Error ? error.message : "Check the search value."); return; }
    const id = ++sequence.current; setPending(true); setError("");
    startTransition(async () => {
      try { const response = await search(request); if (sequence.current === id) setResult(response); }
      catch (error) { if (sequence.current === id) { setResult(null); setError(friendlyError(error)); } }
      finally { if (sequence.current === id) setPending(false); }
    });
  };
  const findReferences = () => {
    if (!field) return;
    const id = ++referenceSequence.current; setReferencePending(true); setError("");
    startTransition(async () => {
      try { const response = await searchReferences({ ...observation(field), search: referenceText }); if (referenceSequence.current === id) setChoices(response); }
      catch (error) { if (referenceSequence.current === id) { setChoices([]); setError(friendlyError(error)); } }
      finally { if (referenceSequence.current === id) setReferencePending(false); }
    });
  };
  if (!fields.length || !field) return null;
  let control: React.ReactNode;
  const storage = field.storage;
  if (storage.type === "boolean") control = <select aria-label="Search value" className={inputClass} value={draft.text} onChange={event => change({ text: event.target.value })}><option value="">Choose an answer</option><option value="yes">Yes</option><option value="no">No</option></select>;
  else if (storage.type === "enum") control = <select aria-label="Search value" className={inputClass} value={draft.text} onChange={event => change({ text: event.target.value })}><option value="">Choose an option</option>{storage.options.map(option => <option key={option.id} value={option.id}>{option.label}{option.retired ? " (retired)" : ""}</option>)}</select>;
  else if (storage.type === "reference") control = <div className="space-y-2 sm:col-span-2"><p className="text-sm text-slate-700">{chosenLabel || "Choose a record by name"}</p><div className="flex gap-2"><input aria-label="Find linked ticket" className={`${inputClass} min-w-0`} maxLength={100} value={referenceText} onChange={event => { referenceSequence.current += 1; setReferencePending(false); setChoices([]); setReferenceText(event.target.value); }}/><Button type="button" variant="secondary" disabled={referencePending} onClick={findReferences}>{referencePending ? "Finding…" : "Find records"}</Button></div>
    <ul className="space-y-1">{choices.map(choice => <li key={choice.id}><button type="button" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm hover:border-blue-400" onClick={() => { change({ text: choice.id }); setChosenLabel(choice.label); setChoices([]); }}>{choice.label}</button></li>)}</ul></div>;
  else control = <div className="space-y-1"><input aria-label="Search value" className={inputClass} type={storage.type === "datetime" ? "datetime-local" : storage.type === "date" ? "date" : "text"}
    value={draft.text} maxLength={storage.type === "string" ? storage.maxLength : storage.type === "url" ? 2000 : storage.type === "email" ? 320 : 100}
    inputMode={["integer", "duration", "decimal", "money"].includes(storage.type) ? "decimal" : undefined} step={storage.type === "datetime" ? "any" : undefined} onChange={event => change({ text: event.target.value })}/>
    {storage.type === "datetime" && <p className="text-xs text-slate-500">Date and time in UTC.</p>}{storage.type === "duration" && <p className="text-xs text-slate-500">Duration in seconds.</p>}</div>;
  return <details className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5"><summary className="cursor-pointer text-sm font-semibold text-slate-900">Find by additional details</summary>
    <p className="mt-2 text-xs text-slate-500">Search details configured for your business, across tickets you can read. The queue and status filters above do not apply to this search.</p>
    <form className="mt-4 space-y-3" onSubmit={event => { event.preventDefault(); run(); }}>
      <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-4"><label className="space-y-1 text-xs font-medium">Detail<select className={inputClass} value={selected} onChange={event => {
        const next = fields.find(item => item.definitionId === event.target.value); if (!next) return; invalidate(); referenceSequence.current += 1;
        setReferencePending(false); setChoices([]); setChosenLabel(""); setReferenceText(""); setSelected(next.definitionId); setDraft(initial(next));
      }}>{fields.map(item => <option key={item.definitionId} value={item.definitionId}>{item.label}</option>)}</select></label>
      <label className="space-y-1 text-xs font-medium">Comparison<select className={inputClass} value={draft.operator} onChange={event => change({ operator: event.target.value as SearchDraft["operator"] })}><option value="equals">Is exactly</option>{supportsSearchRange(field) && <><option value="gte">Is at least</option><option value="lte">Is at most</option></>}<option value="null">Cleared value</option></select></label>
      {draft.operator !== "null" && <>{control}{storage.type === "money" && <label className="space-y-1 text-xs font-medium">Currency<select className={inputClass} value={draft.currency} onChange={event => change({ currency: event.target.value })}>{storage.currencies.map(currency => <option key={currency}>{currency}</option>)}</select></label>}</>}
      <Button type="submit" variant="secondary" disabled={pending}>{pending ? "Searching…" : "Find tickets"}</Button></div>
      {field.help && <p className="text-xs text-slate-500">{field.help}</p>}{draft.operator === "null" && <p className="text-xs text-slate-500">Finds an explicitly cleared saved value. Details never entered are different.</p>}
    </form>
    {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
    {result && <div className="mt-4 space-y-3" aria-live="polite"><div className="overflow-x-auto rounded-lg border border-slate-200"><table className="w-full text-left text-sm"><caption className="sr-only">Tickets matching the additional detail</caption><thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-4 py-2">Ticket</th><th className="px-4 py-2">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{result.records.map(record => <tr key={record.id}><td className="px-4 py-3"><Link href={record.href} className="font-medium text-blue-700"><span className="block text-xs">{record.fields.number}</span>{record.fields.subject}</Link></td><td className="px-4 py-3 capitalize">{record.fields.status.replaceAll("_", " ").toLowerCase()}</td></tr>)}</tbody></table>
      {!result.records.length && <p className="p-4 text-sm text-slate-500">No matches in this part of the search.</p>}</div>
      {result.next ? <><p className="text-xs text-slate-500">There are more accessible tickets to check. Continue even when this part has no matches.</p><Button type="button" variant="secondary" disabled={pending} onClick={() => run(true)}>{pending ? "Searching…" : "Continue search"}</Button></> : <p className="text-xs text-slate-500">Search complete. Only tickets you can currently read are shown.</p>}
    </div>}
  </details>;
}
