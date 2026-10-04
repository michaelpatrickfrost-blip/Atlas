"use client";
import { useActionState, useState, startTransition } from "react";
import { importCsv } from "./actions";
import { Button } from "@/components/ui/button";

export function ImportForm({ entities, lists }: { entities: { id: string; label: string }[]; lists: { id: string; name: string }[] }) {
  const [entity, setEntity] = useState(entities[0]?.id ?? "");
  const [state, action, pending] = useActionState(importCsv, { error: "", message: "", preview: [] });
  const [dirty, setDirty] = useState(true);
  return (
    <form onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); const button = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null; data.set("mode", button?.value ?? "preview"); setDirty(false); startTransition(() => action(data)); }} onChange={() => setDirty(true)} className="space-y-5 rounded-2xl border border-[var(--color-border)] bg-white p-6">
      <label className="block text-sm">Import type<select name="entity" value={entity} onChange={(event) => setEntity(event.target.value)} className="mt-2 w-full border border-[var(--color-border)] bg-white p-3">{entities.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
      <a href={`/api/import-template?entity=${entity}`} className="inline-block text-sm text-[var(--color-atlas-blue)]">Download CSV template →</a>
      {entity === "prices" && <label className="block text-sm">Destination pricelist<select required name="priceListId" className="mt-2 w-full border border-[var(--color-border)] bg-white p-3"><option value="">Choose pricelist</option>{lists.map((list) => <option key={list.id} value={list.id}>{list.name}</option>)}</select></label>}
      <label className="block text-sm">CSV file<input required type="file" name="file" accept=".csv,text/csv" className="mt-2 block w-full rounded-xl border border-[var(--color-border)] p-3" /></label>
      <div className="flex gap-3"><Button disabled={pending} name="mode" value="preview" type="submit">Validate & preview</Button><Button disabled={pending || dirty || !state.preview.length} name="mode" value="apply" type="submit" variant="primary">Import records</Button></div>
      {pending && <p role="status" className="text-sm">Processing…</p>}
      {state.error && <p role="alert" className="text-sm text-[var(--color-status-danger)]">{state.error}</p>}
      {state.message && <p role="status" className="text-sm text-[var(--color-ink-muted)]">{state.message}</p>}
      {state.preview.length > 0 && <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]"><table className="w-full text-xs"><thead><tr>{Object.keys(state.preview[0]).map((key) => <th key={key} className="bg-[var(--color-surface-sunken)] p-3 text-left">{key}</th>)}</tr></thead><tbody>{state.preview.map((row, index) => <tr key={index}>{Object.values(row).map((value, column) => <td key={column} className="border-t border-[var(--color-border)] p-3">{value}</td>)}</tr>)}</tbody></table></div>}
    </form>
  );
}
