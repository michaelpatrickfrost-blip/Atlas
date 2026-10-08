import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { SAFETY_CAPABILITIES as C } from "@/core/permissions/capabilities";
import { recordDetail } from "@/modules/safety/services/queries";
import { recordLabel, recordDue, WORKPLACE_FIELDS, WORKPLACE_PROMPTS, DEFAULT_PROMPTS, type WorkplaceKind } from "@/modules/safety/domain/workplace";
import { WorkplaceForm } from "@/modules/safety/components/workplace-form";
export default async function SafetyRecordPage({ params }: { params: Promise<{ recordId: string }> }) {
 const session=await requireSession();assertCapability(session,C.riskRead);
 const record=await recordDetail(session,(await params).recordId);if(!record)notFound();
 const payload=record.payload&&typeof record.payload==="object"&&!Array.isArray(record.payload)?record.payload as Record<string,unknown>:{};
 const prompts=WORKPLACE_PROMPTS[record.kind as WorkplaceKind]??DEFAULT_PROMPTS;
 const labels:Record<string,string>={location:"Location / work area",responsible:"Responsible person / team",detail:"Summary / existing detail",followUp:"Follow-up work",evidence:"Evidence / document references",completionNote:"Completion / review evidence",...Object.fromEntries(prompts.map((label,index)=>[`finding${index+1}`,label]))};
 return <div className="space-y-6"><Link href="/safety/workplace" className="text-sm text-[var(--color-atlas-blue)]">← Workplace register</Link><header><p className="text-sm text-[var(--color-ink-muted)]">{record.reference} · {recordLabel(record.kind)}{record.sensitive?" · Restricted":""}</p><h1 className="mt-2 break-words text-4xl font-semibold tracking-tight">{record.title}</h1><p className="mt-2 text-sm">{recordLabel(record.status)} · {recordDue(record.dueAt,record.status)}{record.dueAt?` · ${record.dueAt.toLocaleDateString("en-GB",{timeZone:"UTC"})}`:""}</p></header>
 <dl className="grid gap-5 md:grid-cols-2">{WORKPLACE_FIELDS.filter(key=>typeof payload[key]==="string"&&payload[key]).map(key=><div key={key} className="min-w-0 rounded-2xl border p-4"><dt className="text-xs text-[var(--color-ink-muted)]">{labels[key]}</dt><dd className="mt-2 whitespace-pre-wrap break-words text-sm">{String(payload[key])}</dd></div>)}</dl>
 {record.kind==="ASBESTOS"&&<p className="text-sm">{record.asbestosNote}</p>}
 {record.sensitive&&<p className="text-sm text-[var(--color-ink-muted)]">Keep operational assistance and work-relevant outcomes here, without clinical detail.</p>}
 {record.kind==="LONE_WORK"&&<p className="text-sm text-[var(--color-ink-muted)]">This record does not replace a monitored lone-worker service.</p>}
 {can(session,C.riskCreate)&&(!record.sensitive||can(session,C.healthSurveillanceRead))&&<details className="rounded-3xl border bg-white p-5"><summary className="cursor-pointer text-lg font-semibold">Edit record and follow-up</summary><div className="mt-5"><WorkplaceForm key={record.updatedAt.toISOString()} record={{id:record.id,kind:record.kind,title:record.title,status:record.status,dueAt:record.dueAt?.toISOString().slice(0,10)??"",version:record.updatedAt.toISOString(),payload}} sensitiveAllowed={can(session,C.healthSurveillanceRead)}/></div></details>}
 </div>;
}
