"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { DraftDifference } from "@/core/studio/definitions/diff";
export type DraftSaveResult = { ok: boolean; message: string; differences?: DraftDifference[] };
export function DraftEditor({ action, children }: { action: (form: FormData) => Promise<DraftSaveResult>; children: React.ReactNode }) {
  const [pending,startTransition]=useTransition(),[result,setResult]=useState<DraftSaveResult|null>(null);
  return <form className="mt-4 space-y-4" onSubmit={event=>{
    event.preventDefault();if(pending)return;
    const form=event.currentTarget,data=new FormData(form);
    startTransition(async()=>{try{setResult(await action(data));}catch(error){setResult({ok:false,message:error instanceof Error?error.message:"Unable to save."});}});
  }}><fieldset disabled={pending} className="contents">{children}<Button variant="primary">{pending?"Saving…":"Save draft"}</Button></fieldset>
    {result && <p role={result.ok?"status":"alert"} className="text-sm">{result.message}</p>}
    {!!result?.differences?.length && <div className="overflow-auto"><table className="w-full text-left text-sm"><caption className="mb-2 text-left font-medium">Compare the current saved draft with your unsaved changes</caption><thead><tr><th className="p-2">Field</th><th className="p-2">Current saved value</th><th className="p-2">Your unsaved value</th></tr></thead><tbody>{result.differences.map(d=><tr key={d.path} className="border-t"><td className="p-2">{d.path}</td><td className="max-w-xs break-words p-2">{d.saved||"Empty"}</td><td className="max-w-xs break-words p-2">{d.submitted||"Empty"}</td></tr>)}</tbody></table></div>}
  </form>;
}
