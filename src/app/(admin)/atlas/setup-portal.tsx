"use client";
import { useActionState, useState, startTransition } from "react";
import { importCompanySetup } from "./setup-actions";
import { Button } from "@/components/ui/button";

type Template = { id: string; group: string; title: string; summary: string; columns: string[]; notes: string[] };

export function SetupPortal({ organisationId, templates }: { organisationId: string; templates: Template[] }) {
  const [entity, setEntity] = useState(templates[0]?.id ?? "");
  const [state, action, pending] = useActionState(importCompanySetup, { error: "", message: "", preview: [] });
  const [dirty, setDirty] = useState(true);
  const selected = templates.find((template) => template.id === entity) ?? templates[0];
  const groups = [...new Set(templates.map((template) => template.group))];
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-6">
        {groups.map((group) => (
          <section key={group}>
            <h2 className="text-xs font-semibold uppercase tracking-[.16em] text-slate-400">{group}</h2>
            <div className="mt-3 grid gap-3">
              {templates.filter((template) => template.group === group).map((template) => (
                <button key={template.id} type="button" onClick={() => setEntity(template.id)} className={`rounded-2xl border p-4 text-left ${template.id === selected?.id ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white"}`}>
                  <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-blue-600">Step {templates.indexOf(template) + 1}</p>
                  <p className="mt-1 text-sm font-semibold">{template.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">{template.summary}</p>
                  <p className="mt-2 text-[10px] text-slate-400">{template.columns.slice(0, 6).join(" · ")}{template.columns.length > 6 ? " · …" : ""}</p>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
      <form onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); const button = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null; data.set("mode", button?.value ?? "preview"); data.set("entity", entity); setDirty(false); startTransition(() => action(data)); }} onChange={() => setDirty(true)} className="h-fit space-y-4 rounded-2xl border border-slate-200 bg-white p-5 lg:sticky lg:top-4">
        <input type="hidden" name="organisationId" value={organisationId} />
        <input type="hidden" name="entity" value={entity} />
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.14em] text-blue-600">Upload</p>
          <h2 className="mt-1 text-lg font-semibold">{selected?.title}</h2>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">{selected?.summary}</p>
        </div>
        <a href={`/api/import-template?entity=${entity}`} className="inline-block text-sm font-medium text-blue-600">Download CSV template →</a>
        <ul className="space-y-2 text-xs leading-relaxed text-slate-500">{selected?.notes.map((note) => <li key={note}>{note}</li>)}</ul>
        <label className="block text-xs">CSV file<input required type="file" name="file" accept=".csv,text/csv" className="mt-2 block w-full rounded-xl border border-slate-200 p-3 text-sm" /></label>
        <div className="flex flex-wrap gap-2">
          <Button disabled={pending} name="mode" value="preview" type="submit">Validate & preview</Button>
          <Button disabled={pending || dirty || !state.preview.length} name="mode" value="apply" type="submit" variant="primary">Import into company</Button>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-400">Up to 500 rows and 2 MB. A file with an error changes nothing. Orders, invoices and supplier bank details stay in their apps.</p>
        {pending && <p role="status" className="text-sm">Checking the file…</p>}
        {state.error && <p role="alert" className="text-sm text-rose-600">{state.error}</p>}
        {state.message && <p role="status" className="text-sm text-slate-600">{state.message}</p>}
        {state.preview.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-[11px]">
              <thead><tr>{Object.keys(state.preview[0]).map((key) => <th key={key} className="bg-slate-50 p-2 font-medium">{key}</th>)}</tr></thead>
              <tbody>{state.preview.map((row, index) => <tr key={index}>{Object.values(row).map((value, column) => <td key={column} className="border-t border-slate-100 p-2">{value}</td>)}</tr>)}</tbody>
            </table>
          </div>
        )}
      </form>
    </div>
  );
}
