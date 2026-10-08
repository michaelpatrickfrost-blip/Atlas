"use client";
import { useState, useTransition } from "react";
import { saveWorkplaceRecord } from "../services/commands";
import { RECORD_KINDS, SENSITIVE_RECORD_KINDS } from "../domain/work";
import { DEFAULT_PROMPTS, WORKPLACE_PROMPTS, recordLabel, type WorkplaceKind } from "../domain/workplace";
const inputClass="w-full min-w-0 rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm";
export type RecordDraft={id:string;kind:string;title:string;status:string;dueAt:string;version:string;payload:Record<string,unknown>};
export function WorkplaceForm({record,sensitiveAllowed=false}:{record?:RecordDraft;sensitiveAllowed?:boolean}) {
 const [kind,setKind]=useState(record?.kind??"DSE_ASSESSMENT"),[error,setError]=useState("");const [pending,startTransition]=useTransition();
 const prompts=WORKPLACE_PROMPTS[kind as WorkplaceKind]??DEFAULT_PROMPTS;
 const value=(key:string)=>typeof record?.payload[key]==="string"?String(record.payload[key]):"";
 const field=(label:string,name:string,rows=3)=><label className="block min-w-0 space-y-1 text-sm" key={name}><span>{label}</span><textarea aria-label={label} name={name} rows={rows} maxLength={6000} defaultValue={value(name)} className={inputClass}/></label>;
 return <form method="post" className="space-y-5" onSubmit={event=>{event.preventDefault();if(pending)return;const data=new FormData(event.currentTarget);setError("");startTransition(async()=>{try{const result=await saveWorkplaceRecord(data);if(result?.error)setError(result.error);}catch(e){if(typeof e==="object"&&e&&"digest" in e&&String(e.digest).startsWith("NEXT_REDIRECT"))throw e;setError("Could not save this record. Your work is still here; try again or check your access.");}});}}>
  <fieldset disabled={pending} className="contents">
   {record&&<><input type="hidden" name="recordId" value={record.id}/><input type="hidden" name="version" value={record.version}/></>}
   <div className="grid gap-4 md:grid-cols-2">
    <label className="space-y-1 text-sm"><span>Record type</span><select aria-label="Record type" name={record?undefined:"kind"} disabled={Boolean(record)} value={kind} onChange={event=>setKind(event.target.value)} className={inputClass}>{RECORD_KINDS.filter(item=>sensitiveAllowed||!SENSITIVE_RECORD_KINDS.has(item)).map(item=><option key={item} value={item}>{recordLabel(item)}</option>)}</select>{record&&<input type="hidden" name="kind" value={kind}/>}</label>
    <label className="space-y-1 text-sm"><span>Title</span><input name="title" required maxLength={200} defaultValue={record?.title} className={inputClass}/></label>
    <label className="space-y-1 text-sm"><span>Location / work area</span><input name="location" maxLength={300} defaultValue={value("location")} className={inputClass}/></label>
    <label className="space-y-1 text-sm"><span>Responsible person / team</span><input name="responsible" maxLength={300} defaultValue={value("responsible")} className={inputClass}/></label>
    <label className="space-y-1 text-sm"><span>Review / follow-up date</span><input name="dueAt" type="date" defaultValue={record?.dueAt} className={inputClass}/></label>
    <label className="space-y-1 text-sm"><span>Status</span><select aria-label="Status" name="status" defaultValue={record?.status??"OPEN"} className={inputClass}><option value="OPEN">Open</option><option value="IN_PROGRESS">In progress</option><option value="COMPLETE">Complete</option></select></label>
   </div>
   {SENSITIVE_RECORD_KINDS.has(kind)&&<p className="rounded-xl bg-amber-50 p-3 text-sm">Restricted record. Keep only operational assistance, requirements or work-relevant outcomes here. Do not enter clinical information.</p>}
   {field("Summary / existing detail","detail")}
   <details open className="rounded-2xl border border-[var(--color-border)] p-4"><summary className="cursor-pointer font-medium">Guided findings and arrangements</summary><p className="mt-2 text-xs text-[var(--color-ink-muted)]">Use the prompts that apply to your workplace. These do not approve an assessment.</p><div className="mt-4 grid gap-4 md:grid-cols-2">{prompts.map((label,index)=>field(label,`finding${index+1}`))}</div></details>
   {field("Follow-up work and who will do it","followUp")}
   {field("Evidence / document references","evidence",2)}
   {field("Completion / review evidence (required to mark complete)","completionNote",2)}
   <button type="submit" className="rounded-xl bg-[var(--color-atlas-blue)] px-5 py-3 text-sm font-medium text-white">{pending?"Saving…":record?"Save record":"Create workplace record"}</button>
  </fieldset>
  {error&&<p role="alert" className="text-sm text-rose-700">{error}</p>}
 </form>;
}
