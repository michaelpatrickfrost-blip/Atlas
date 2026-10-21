"use client";

import Link from "next/link";
import { useState } from "react";
import type { customerScreenRecords } from "@/core/studio/pages/customer-catalog";
import { loadBusinessScreenRecords } from "../actions";

type Choices = Awaited<ReturnType<typeof customerScreenRecords>>;
export function BusinessScreenRecordChooser({ initial }: { initial: Choices }) {
  const [choices, setChoices] = useState(initial), [first, setFirst] = useState(true), [busy, setBusy] = useState(false), [feedback, setFeedback] = useState("");
  const load = async (cursor: Choices["nextCursor"]) => {
    if (busy) return;
    setBusy(true); setFeedback("");
    try { const loaded = await loadBusinessScreenRecords({ definitionId: choices.definitionId, cursor,
      expectedVersionId: choices.versionId, expectedDefinitionRevision: choices.definitionRevision });
      setChoices(loaded); setFirst(cursor === null); }
    catch { setFeedback("More records could not be loaded. Your current choices are kept; refresh and check your access."); }
    finally { setBusy(false); }
  };
  return <div className="space-y-4" aria-busy={busy}>
    {feedback && <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{feedback}</p>}
    <div className="grid gap-3">{choices.records.map(record => <Link key={record.id}
      href={`/screens/${choices.definitionId}?record=${encodeURIComponent(record.id)}`}
      className="rounded-2xl border bg-white p-5 font-medium text-blue-700">{record.label}</Link>)}</div>
    {!choices.records.length && <p className="rounded-2xl border bg-white p-6 text-sm text-slate-500">There are no accessible records on this page.</p>}
    <div className="flex flex-wrap gap-3">
      {!first && <button type="button" disabled={busy} onClick={() => load(null)} className="rounded-xl border bg-white px-4 py-2 text-sm text-blue-700 disabled:opacity-50">Back to first records</button>}
      {choices.nextCursor && <button type="button" disabled={busy} onClick={() => load(choices.nextCursor)} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">Next records</button>}
    </div>
  </div>;
}
