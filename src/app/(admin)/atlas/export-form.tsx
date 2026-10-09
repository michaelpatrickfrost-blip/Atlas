"use client";
import { useState } from "react";
export function CompanyExportForm({ organisationId, name }: { organisationId: string; name: string }) {
  const [pending, setPending] = useState(false), [error, setError] = useState(""), [done, setDone] = useState(false);
  const input = "mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm";
  return <form className="space-y-4" onSubmit={async event => {
    event.preventDefault(); setPending(true); setError(""); setDone(false);
    const form = event.currentTarget;
    try {
      const response = await fetch(`/api/atlas/companies/${encodeURIComponent(organisationId)}/export`, { method: "POST", body: new FormData(form) });
      if (!response.ok) { const result = await response.json(); throw new Error(result.error ?? "Export failed."); }
      const blob = await response.blob(), url = URL.createObjectURL(blob), link = document.createElement("a");
      link.href = url; link.download = response.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/)?.[1] ?? "atlas-company.ndjson.gz";
      document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 60_000);
      form.reset(); setDone(true);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Export failed."); } finally { setPending(false); }
  }}><label className="block text-xs">Confirm company name<input name="confirmName" required autoComplete="off" placeholder={name} className={input} /></label><label className="block text-xs">Your administrator password<input name="currentPassword" type="password" required autoComplete="current-password" className={input} /></label><button disabled={pending} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white disabled:opacity-50">{pending ? "Preparing complete export…" : "Download company data"}</button>{error && <p role="alert" className="text-sm text-rose-700">{error}</p>}{done && <p role="status" className="text-sm text-emerald-700">Export prepared and download started. Confirm the file saved before handing it to the customer.</p>}</form>;
}
