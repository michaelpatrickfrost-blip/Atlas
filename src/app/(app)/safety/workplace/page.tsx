import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { SAFETY_CAPABILITIES as C } from "@/core/permissions/capabilities";
import { db } from "@/core/db/client";
import { RECORD_KINDS } from "@/modules/safety/domain/work";
import { recordDue, recordLabel } from "@/modules/safety/domain/workplace";
import { WorkplaceForm } from "@/modules/safety/components/workplace-form";
import { inputClass } from "../ui";
export default async function WorkplacePage({searchParams}:{searchParams:Promise<{q?:string;kind?:string;due?:string}>}) {
 const session=await requireSession();assertCapability(session,C.riskRead);
 const search=await searchParams;const q=String(search.q??"").slice(0,200);const kind=RECORD_KINDS.find(item=>item===search.kind);const now=new Date();const today=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()));
 const records=await db.safetyRecord.findMany({where:{organisationId:session.organisationId,...(!can(session,C.healthSurveillanceRead)&&!can(session,C.sensitiveIncidentRead)?{sensitive:false}:{}),...(kind?{kind}:{}),...(q?{OR:[{title:{contains:q,mode:"insensitive"}},{reference:{contains:q,mode:"insensitive"}}]}:{}),...(search.due==="overdue"?{status:{not:"COMPLETE"},dueAt:{lt:today}}:search.due==="soon"?{status:{not:"COMPLETE"},dueAt:{gte:today,lte:new Date(today.getTime()+30*86400000)}}:search.due==="complete"?{status:"COMPLETE"}:{})},orderBy:[{dueAt:{sort:"asc",nulls:"last"}},{createdAt:"desc"}],take:201});
 return <div className="space-y-8">
 <header><h1 className="text-4xl font-semibold tracking-tight">Workplace safety</h1><p className="mt-2 max-w-2xl text-sm text-[var(--color-ink-muted)]">Assessments, checks and arrangements in one register. Record what you found, who will act and when to review it.</p></header>
 <form method="get" className="grid gap-3 rounded-2xl border p-4 md:grid-cols-4"><label className="text-sm">Search title or reference<input name="q" defaultValue={q} className={inputClass}/></label><label className="text-sm">Record type<select name="kind" defaultValue={kind??""} className={inputClass}><option value="">All types</option>{RECORD_KINDS.map(item=><option key={item} value={item}>{recordLabel(item)}</option>)}</select></label><label className="text-sm">Review<select name="due" defaultValue={search.due??""} className={inputClass}><option value="">All records</option><option value="overdue">Overdue</option><option value="soon">Due within 30 days</option><option value="complete">Complete</option></select></label><button className="self-end rounded-xl border px-4 py-2 text-sm" type="submit">Filter records</button></form>
 <section aria-label="Workplace register" className="divide-y rounded-2xl border">
 {!records.length&&<p className="p-5 text-sm text-[var(--color-ink-muted)]">No records match. Create one below or change your filters.</p>}
 {records.slice(0,200).map(record=><Link key={record.id} href={`/safety/records/${record.id}`} className="flex flex-wrap justify-between gap-2 p-5 hover:bg-slate-50"><span className="min-w-0 break-words"><span className="block font-medium">{record.reference} · {record.title}</span><span className="text-xs text-[var(--color-ink-muted)]">{recordLabel(record.kind)}{record.sensitive?" · Restricted":""} · {recordLabel(record.status)}</span></span><span className={`text-sm ${recordDue(record.dueAt,record.status)==="Overdue"?"text-rose-700":"text-[var(--color-ink-muted)]"}`}>{recordDue(record.dueAt,record.status)}{record.dueAt?` · ${record.dueAt.toLocaleDateString("en-GB",{timeZone:"UTC"})}`:""}</span></Link>)}
 </section>
 {records.length>200&&<p className="text-sm">Showing 200 records. Narrow the search or filters to find older work.</p>}
 {can(session,C.riskCreate)&&<section id="new" className="rounded-3xl border bg-white p-5 md:p-6"><h2 className="mb-4 text-xl font-semibold">New workplace record</h2><WorkplaceForm sensitiveAllowed={can(session,C.healthSurveillanceRead)}/></section>}
 </div>;
}
