"use client";
import { useState } from "react";
import { Download } from "lucide-react";
import { CreateDialog } from "./create-dialog";

/** Download a table as CSV or Excel, with the columns the person wants. `href` is an export route that
 * answers `format=headers`, `format=xlsx` and `columns=`. */
export function ExportMenu({ href, label = "Export" }: { href: string; label?: string }) {
  const [columns, setColumns] = useState<string[] | null>(null), [chosen, setChosen] = useState<string[]>([]), [error, setError] = useState("");
  const join = (extra: Record<string, string>) => `${href}${href.includes("?") ? "&" : "?"}${new URLSearchParams(extra)}`;
  async function load() {
    if (columns) return;
    try {
      const response = await fetch(join({ format: "headers" }), { cache: "no-store" });
      if (!response.ok) throw new Error();
      const names = ((await response.json()) as { columns: string[] }).columns;
      setColumns(names); setChosen(names);
    } catch { setError("The column list could not be loaded. You can still download every column."); setColumns([]); }
  }
  const link = (format: string) => join({ format, ...(columns?.length && chosen.length && chosen.length < columns.length ? { columns: columns.filter((name) => chosen.includes(name)).join("|") } : {}) });
  const button = "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium";
  return <CreateDialog label={label} title="Export" onOpen={load} trigger={(open) => <button type="button" onClick={open} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"><Download size={15} />{label}</button>}>
    <div className="space-y-5">
      <div>
        <div className="flex items-center justify-between"><p className="text-xs font-medium">Columns</p>{!!columns?.length && <p className="flex gap-3 text-xs"><button type="button" className="text-blue-600" onClick={() => setChosen(columns)}>All</button><button type="button" className="text-blue-600" onClick={() => setChosen([])}>None</button></p>}</div>
        {!columns ? <p className="mt-3 text-sm text-slate-500">Loading columns…</p> : <div className="mt-3 grid gap-2 sm:grid-cols-2">{columns.map((name) => <label key={name} className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" className="size-4 rounded border-slate-300" checked={chosen.includes(name)} onChange={(event) => setChosen((current) => event.target.checked ? [...current, name] : current.filter((value) => value !== name))} />{name}</label>)}</div>}
        {error && <p className="mt-3 text-xs text-amber-700">{error}</p>}
      </div>
      <p className="text-xs text-slate-500">The export uses the filters on this screen.</p>
      <div className="flex flex-wrap gap-2">
        <a href={columns && !chosen.length && columns.length ? undefined : link("xlsx")} className={`${button} bg-blue-600 text-white hover:bg-blue-700 ${columns?.length && !chosen.length ? "pointer-events-none opacity-50" : ""}`}>Download Excel</a>
        <a href={columns && !chosen.length && columns.length ? undefined : link("csv")} className={`${button} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 ${columns?.length && !chosen.length ? "pointer-events-none opacity-50" : ""}`}>Download CSV</a>
      </div>
    </div>
  </CreateDialog>;
}
