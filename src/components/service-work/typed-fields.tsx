"use client";

import { useEffect, useId, useRef, useState } from "react";
import { inputClass } from "@/components/ui/service-fields";
import { fieldFormValueSchema, parseFieldFormPacketJson, type FieldFormPacket } from "@/core/studio/fields/form-packet";
import type { FieldValue } from "@/core/studio/fields/schema";
import type { TicketFieldFormControl, TicketFieldFormManifest, TicketFieldReferenceChoice, TicketFieldReferenceSearch } from "@/core/service-work/field-form-contract";

type Address = Extract<FieldValue, { type: "address" }>["value"];
type Draft = { text: string; amount: string; currency: string; selections: string[]; address: Address };
type Result = { value: FieldValue | null; error: string };
const emptyAddress = (): Address => ({ line1: "", line2: "", city: "", region: "", postalCode: "", country: "" });
const countryNames = new Intl.DisplayNames(["en"], { type: "region" });
function draftFor(field: TicketFieldFormControl): Draft {
  const value = field.value;
  const draft: Draft = { text: "", amount: "", currency: field.storage.type === "money" ? field.storage.currencies[0] : "",
    selections: [], address: { ...emptyAddress(), country: field.storage.type === "address" ? field.storage.countries[0] : "" } };
  if (!value) return draft;
  switch (value.type) {
    case "money": return { ...draft, amount: value.value.amount, currency: value.value.currency };
    case "address": return { ...draft, address: { ...value.value } };
    case "multi_enum": return { ...draft, selections: [...value.value] };
    case "boolean": return { ...draft, text: value.value ? "yes" : "no" };
    case "datetime": return { ...draft, text: value.value.replace(/Z$/, "") };
    default: return { ...draft, text: String(value.value) };
  }
}
function readDraft(field: TicketFieldFormControl, draft: Draft | null): Result {
  if (draft === null) return { value: null, error: "" };
  const type = field.storage.type;
  let value: unknown;
  if (type === "address") value = Object.entries(draft.address).every(([key, part]) => key === "country" || !part) ? null : { type, value: draft.address };
  else if (type === "money") value = draft.amount === "" ? null : { type, value: { amount: draft.amount, currency: draft.currency } };
  else if (type === "multi_enum") value = draft.selections.length ? { type, value: draft.selections } : null;
  else if (draft.text === "") value = null;
  else if (type === "integer" || type === "duration") value = { type, value: /^-?\d+$/.test(draft.text) ? Number(draft.text) : NaN };
  else if (type === "boolean") value = { type, value: draft.text === "yes" ? true : draft.text === "no" ? false : undefined };
  else if (type === "datetime") value = { type, value: `${draft.text}Z` };
  else value = { type, value: draft.text };
  if (value === null) return { value: null, error: "" };
  const parsed = fieldFormValueSchema.safeParse(value);
  return parsed.success ? { value: parsed.data, error: "" } : { value: null, error: type === "address" ? "Complete the street, city and country." : type === "datetime" ? "Enter a valid date and time in UTC." : "Check the format of this value." };
}

/** Shared presentation only. The server owns discovery, permissions, requirements,
 * manifest/CAS checks and atomic persistence. Mount inside the existing ActionForm.
 * Keep this mounted on failure; remount with the refreshed manifest after success.
 */
export function TicketTypedFields({ manifest, searchReferences }: { manifest: TicketFieldFormManifest; searchReferences?: TicketFieldReferenceSearch }) {
  const [observed] = useState(manifest), [drafts, setDrafts] = useState<Record<string, Draft | null>>({});
  const root = useRef<HTMLDivElement>(null);
  const entries: FieldFormPacket["fields"] = [], errors = new Map<string, string>();
  for (const field of observed.fields) {
    if (!(field.definitionId in drafts)) continue;
    const result = readDraft(field, drafts[field.definitionId]);
    if (result.error) errors.set(field.definitionId, result.error);
    else if (observed.operation === "update" && drafts[field.definitionId] !== null && JSON.stringify(result.value) === JSON.stringify(field.value)) continue;
    else entries.push({ operationId: field.operationId, definitionId: field.definitionId, definitionRevision: field.definitionRevision,
      versionId: field.versionId, generationId: field.generationId, slotRevision: field.slotRevision, valueRevision: field.valueRevision, value: result.value });
  }
  const packet: FieldFormPacket = { schemaVersion: 1, operationId: observed.operationId, manifestChecksum: observed.manifestChecksum,
    extensionRevision: observed.extensionRevision, fields: entries };
  const json = JSON.stringify(packet);
  let packetError = "";
  try { parseFieldFormPacketJson(json, 100); } catch { packetError = "These additional details are too large or no longer valid. Review them before saving."; }
  const invalid = errors.size > 0 || !!packetError;
  useEffect(() => {
    const form = root.current?.closest("form");
    if (!form) return;
    const preventInvalid = (event: Event) => {
      if (!invalid) return;
      event.preventDefault(); event.stopImmediatePropagation();
      root.current?.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(":invalid")?.reportValidity();
    };
    form.addEventListener("submit", preventInvalid, true);
    return () => form.removeEventListener("submit", preventInvalid, true);
  }, [invalid]);
  if (!observed.fields.length) return null;
  return <div ref={root} className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5">
    <div><h3 className="text-sm font-semibold text-slate-900">Additional details</h3><p className="mt-1 text-xs text-slate-500">Set up for your business. {observed.operation === "update" ? "Only your changes will be saved." : "Complete the details that apply to this request."}</p></div>
    <input type="hidden" name="studioFields" value={invalid ? "" : json}/>
    {manifest.manifestChecksum !== observed.manifestChecksum && <p role="status" className="text-xs text-amber-800">The setup has changed. Your entries are kept here; refresh the form before saving.</p>}
    <div className="grid gap-4 sm:grid-cols-2">{observed.fields.map(field => <TypedField key={field.definitionId} field={field}
      draft={field.definitionId in drafts ? drafts[field.definitionId] : draftFor(field)} error={errors.get(field.definitionId) ?? ""}
      searchReferences={searchReferences} onChange={draft => setDrafts(previous => ({ ...previous, [field.definitionId]: draft }))}
      onUndo={field.definitionId in drafts ? () => setDrafts(previous => { const next = { ...previous }; delete next[field.definitionId]; return next; }) : undefined}/>)}</div>
    {packetError && <p role="alert" className="text-xs text-red-700">{packetError}</p>}
  </div>;
}

function TypedField({ field, draft, error, onChange, onUndo, searchReferences }: { field: TicketFieldFormControl; draft: Draft | null; error: string;
  onChange: (draft: Draft | null) => void; onUndo?: () => void; searchReferences?: TicketFieldReferenceSearch }) {
  const id = useId(), helpId = `${id}-help`, errorId = `${id}-error`, storage = field.storage;
  const current = draft ?? draftFor({ ...field, value: null });
  const update = (patch: Partial<Draft>) => onChange({ ...current, ...patch });
  const primary = { id, "aria-describedby": `${helpId}${error ? ` ${errorId}` : ""}`, "aria-invalid": !!error,
    ref: (element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null) => { element?.setCustomValidity(error); } };
  let control: React.ReactNode;
  switch (storage.type) {
    case "boolean": control = <select {...primary} className={inputClass} value={current.text} required={field.required} onChange={event => update({ text: event.target.value })}><option value="">Choose an answer</option><option value="yes">Yes</option><option value="no">No</option></select>; break;
    case "enum": control = <select {...primary} className={inputClass} value={current.text} required={field.required} onChange={event => update({ text: event.target.value })}><option value="">Choose an option</option>{storage.options.filter(option => !option.retired || option.id === current.text).map(option => <option key={option.id} value={option.id} disabled={option.retired}>{option.label}{option.retired ? " (no longer available)" : ""}</option>)}</select>; break;
    case "multi_enum": control = <div id={id} className="space-y-2 rounded-lg border border-slate-300 bg-white p-3" role="group" aria-labelledby={`${id}-label`} aria-describedby={helpId}>{storage.options.filter(option => !option.retired || current.selections.includes(option.id)).map(option => <label key={option.id} className="flex items-start gap-2 text-sm font-normal text-slate-700"><input type="checkbox" className="mt-0.5 accent-blue-600" checked={current.selections.includes(option.id)} disabled={option.retired} onChange={event => update({ selections: event.target.checked ? [...current.selections, option.id] : current.selections.filter(value => value !== option.id) })}/>{option.label}{option.retired ? " (no longer available)" : ""}</label>)}</div>; break;
    case "money": control = <div className="flex gap-2"><input {...primary} aria-label={`${field.label} amount`} className={`${inputClass} min-w-0`} value={current.amount} inputMode="decimal" required={field.required} placeholder="0.00" onChange={event => update({ amount: event.target.value })}/><select aria-label={`${field.label} currency`} className={`${inputClass} max-w-28`} value={current.currency} onChange={event => update({ currency: event.target.value })}>{storage.currencies.map(currency => <option key={currency}>{currency}</option>)}</select></div>; break;
    case "address": control = <div className="grid gap-2 sm:grid-cols-2">{([ ["line1", "Street address", 200], ["line2", "Address line 2", 200], ["city", "City", 100], ["region", "Region", 100], ["postalCode", "Postal code", 40] ] as const).map(([key, title, maxLength]) => <label key={key} className={key.startsWith("line") ? "sm:col-span-2" : ""}><span className="mb-1 block text-xs text-slate-500">{title}</span><input {...(key === "line1" ? primary : {})} aria-label={`${field.label} ${title.toLowerCase()}`} className={inputClass} value={current.address[key]} maxLength={maxLength} required={field.required && (key === "line1" || key === "city")} onChange={event => update({ address: { ...current.address, [key]: event.target.value } })}/></label>)}<label><span className="mb-1 block text-xs text-slate-500">Country</span><select aria-label={`${field.label} country`} className={inputClass} value={current.address.country} onChange={event => update({ address: { ...current.address, country: event.target.value } })}>{storage.countries.map(country => <option key={country} value={country}>{countryNames.of(country) ?? country}</option>)}</select></label></div>; break;
    case "reference": control = <ReferencePicker id={id} label={field.label} definitionId={field.definitionId} selected={current.text} search={searchReferences} onSelect={value => update({ text: value })}/>; break;
    case "string": control = storage.multiline ? <textarea {...primary} className={inputClass} rows={3} value={current.text} minLength={storage.minLength} maxLength={storage.maxLength} required={field.required} onChange={event => update({ text: event.target.value })}/> : <input {...primary} className={inputClass} value={current.text} minLength={storage.minLength} maxLength={storage.maxLength} pattern={storage.pattern} required={field.required} onChange={event => update({ text: event.target.value })}/>; break;
    default: {
      const type = storage.type === "datetime" ? "datetime-local" : storage.type === "integer" || storage.type === "duration" ? "number" : storage.type === "decimal" ? "text" : storage.type === "phone" ? "tel" : storage.type;
      control = <><input {...primary} className={inputClass} type={type} value={current.text} required={field.required} inputMode={storage.type === "decimal" ? "decimal" : undefined}
        step={storage.type === "datetime" ? "any" : storage.type === "integer" || storage.type === "duration" ? 1 : undefined}
        min={storage.type === "integer" || storage.type === "duration" ? storage.min ?? (storage.type === "duration" ? 0 : undefined) : undefined}
        max={storage.type === "integer" || storage.type === "duration" ? storage.max : undefined}
        maxLength={storage.type === "decimal" ? 40 : storage.type === "email" ? 320 : storage.type === "url" ? 2000 : undefined}
        placeholder={storage.type === "phone" ? "+44…" : undefined} onChange={event => update({ text: event.target.value })}/>
        {storage.type === "datetime" && <p className="text-xs text-slate-500">Date and time in UTC.</p>}{storage.type === "duration" && <p className="text-xs text-slate-500">Duration in seconds.</p>}</>; break;
    }
  }
  return <div className={storage.type === "address" || storage.type === "string" && storage.multiline ? "space-y-2 sm:col-span-2" : "space-y-2"}>
    <div className="flex items-start justify-between gap-2"><label id={`${id}-label`} htmlFor={id} className="text-xs font-semibold text-slate-700">{field.label}{field.required && <span className="ml-1 text-blue-700">Required</span>}</label><div className="flex gap-2 text-xs">{onUndo && <button type="button" className="text-blue-700 hover:underline" onClick={onUndo} aria-label={`Undo changes to ${field.label}`}>Undo</button>}<button type="button" className="text-slate-500 hover:text-slate-800" aria-label={`Clear ${field.label}`} onClick={() => onChange(null)}>Clear</button></div></div>
    {control}<p id={helpId} className="text-xs text-slate-500">{field.help}{field.conditionalRequired && <span className="block">Required in some situations.</span>}</p>
    {error && <p id={errorId} role="alert" className="text-xs text-red-700">{error}</p>}
  </div>;
}

function ReferencePicker({ id, label, definitionId, selected, search, onSelect }: { id: string; label: string; definitionId: string; selected: string;
  search?: TicketFieldReferenceSearch; onSelect: (id: string) => void }) {
  const [query, setQuery] = useState(""), [choices, setChoices] = useState<TicketFieldReferenceChoice[]>([]), [pending, setPending] = useState(false), [error, setError] = useState("");
  const sequence = useRef(0), currentLabel = choices.find(choice => choice.id === selected)?.label;
  useEffect(() => () => { sequence.current += 1; }, []);
  const find = async () => {
    if (!search) return;
    const request = ++sequence.current; setPending(true); setError("");
    try { const result = await search(definitionId, query); if (request === sequence.current) setChoices(result); }
    catch { if (request === sequence.current) { setChoices([]); setError("Search is unavailable. Try again."); } }
    finally { if (request === sequence.current) setPending(false); }
  };
  return <div className="space-y-2"><p className="text-sm text-slate-700">{selected ? currentLabel ?? "Current selection" : "No selection"}</p>
    {search ? <><div className="flex gap-2"><input id={id} aria-label={`Search ${label}`} className={`${inputClass} min-w-0`} value={query} maxLength={100} placeholder="Search by name…" onChange={event => { sequence.current += 1; setQuery(event.target.value); setChoices([]); setPending(false); setError(""); }}/><button type="button" className="shrink-0 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium" disabled={pending} onClick={find}>{pending ? "Searching…" : "Search"}</button></div>
      <ul className="space-y-1">{choices.map(choice => <li key={choice.id}><button type="button" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm hover:border-blue-400 hover:bg-blue-50" onClick={() => onSelect(choice.id)} aria-label={`Choose ${choice.label}`}>{choice.label}</button></li>)}</ul></> : <p className="text-xs text-slate-500">Selection is unavailable in this form.</p>}
    {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
  </div>;
}
