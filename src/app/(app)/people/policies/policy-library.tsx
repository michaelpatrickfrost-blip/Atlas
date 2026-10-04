"use client";
import { useState } from "react";
import { openPolicy } from "./actions";

export function PolicyFileButton({ id, name }: { id: string; name: string }) {
  const [preview, setPreview] = useState<{ name: string; base64: string } | null>(null);
  const [error, setError] = useState("");
  return <>
    <button type="button" className="text-sm font-medium text-blue-600" onClick={async () => { try { setError(""); const file = await openPolicy(id); setPreview({ name: file.name, base64: file.base64 }); } catch (caught) { setError(caught instanceof Error ? caught.message : "The PDF could not be opened."); } }}>Open PDF</button>
    {error && <p role="alert" className="text-xs text-rose-700">{error}</p>}
    {preview && <div role="dialog" aria-modal="true" aria-label={preview.name} className="fixed inset-0 z-50 flex flex-col bg-slate-950/80 p-4 sm:p-10"><div className="flex items-center justify-between rounded-t-xl bg-white px-4 py-3"><strong className="truncate text-sm">{preview.name}</strong><button type="button" className="text-sm font-medium text-blue-600" onClick={() => setPreview(null)}>Close</button></div><object className="min-h-0 flex-1 rounded-b-xl bg-white" type="application/pdf" data={`data:application/pdf;base64,${preview.base64}`} aria-label={name}><p className="p-6 text-sm">This window cannot display the PDF. Ask HR for another copy.</p></object></div>}
  </>;
}
