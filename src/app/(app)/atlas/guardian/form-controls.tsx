"use client";
import { useFormStatus } from "react-dom";
import { useState } from "react";
import { ISSUE_STATES } from "@/core/guardian/report";
import { updateGuardianIssue } from "./actions";

export function SweepButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending} className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white disabled:opacity-60">{pending ? "Queuing sweep…" : "Run system sweep"}</button>;
}
function SaveButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending} className="rounded-xl bg-slate-900 px-5 py-3 text-sm text-white disabled:opacity-60">{pending ? "Saving…" : "Save progress"}</button>;
}
export function IssueProgress({ issue }: { issue: { id: string; status: string; resolution: string | null; verifiedRevision: string | null } }) {
  const [status, setStatus] = useState(issue.status);
  return <form action={updateGuardianIssue} className="space-y-4 rounded-2xl border bg-white p-5"><h2 className="font-semibold">Repair progress</h2><input type="hidden" name="id" value={issue.id} /><label className="block text-sm">Status<select name="status" value={status} onChange={event => setStatus(event.target.value)} className="ml-4 rounded-lg border p-2">{ISSUE_STATES.map(state => <option key={state}>{state}</option>)}</select></label><label className="block text-sm">What was fixed, verified, or still blocks repair<textarea name="resolution" required={status === "FIXED"} defaultValue={issue.resolution ?? ""} maxLength={4000} rows={4} className="mt-2 block w-full rounded-xl border p-3" /></label><label className="block text-sm">Verified deployed revision<input name="verifiedRevision" required={status === "FIXED"} defaultValue={issue.verifiedRevision ?? ""} maxLength={80} className="mt-2 block w-full rounded-xl border p-3" /></label><p className="text-xs text-slate-500">FIXED requires the deployed revision and a successful reproduction check. A recurring failure reopens the report.</p><SaveButton /></form>;
}
