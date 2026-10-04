import Link from "next/link";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import { getCase, saveCase, respondToCase, addCaseEvent, conductChoices } from "../../actions";
import { CaseForm } from "@/modules/people/components/case-form";
import { Field, FormSection, RecordIntro, fieldClass } from "@/modules/people/components/record-form";
import { CASE_STAGE_LABEL, CASE_STATUS_LABEL, EVENT_KINDS, EVENT_KIND_LABEL } from "@/modules/people/domain/conduct";

function day(value: Date | null) { return value ? value.toISOString().slice(0, 10) : ""; }

export default async function CasePage({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  const [{ record, canEdit, own, confidential }, choices] = await Promise.all([getCase(caseId), conductChoices()]);
  return <div className="space-y-6">
    <Link href="/people/conduct" className="text-sm text-blue-600">← Conduct</Link>
    <div className="flex flex-wrap items-end justify-between gap-3"><RecordIntro kicker={record.reference} title={`${record.employee.firstName} ${record.employee.lastName}`} detail={CASE_STAGE_LABEL[record.stage as keyof typeof CASE_STAGE_LABEL] ?? record.stage} /><StatusPill label={CASE_STATUS_LABEL[record.status as keyof typeof CASE_STATUS_LABEL] ?? record.status} tone={record.status === "CLOSED" ? "neutral" : "warning"} /></div>
    {canEdit ? <CaseForm action={saveCase.bind(null, record.id)} employees={choices.employees} plans={choices.plans.map((plan) => ({ id: plan.id, title: plan.title, employeeName: `${plan.employee.firstName} ${plan.employee.lastName}` }))} confidential={confidential} record={{ employeeId: record.employeeId, employeeName: `${record.employee.firstName} ${record.employee.lastName}`, planId: record.planId ?? "", stage: record.stage, status: record.status, allegation: record.allegation, facts: record.facts ?? "", outcome: record.outcome ?? "", sanction: record.sanction ?? "", hearingOn: day(record.hearingOn), appealBy: day(record.appealBy), confidentialNotes: record.confidentialNotes ?? "" }} /> : <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6 text-sm leading-6"><p>{record.allegation}</p>{record.hearingOn && <p className="text-slate-500">Hearing {record.hearingOn.toLocaleDateString("en-GB", { timeZone: "UTC" })}</p>}{record.outcome && <p><span className="font-medium">Outcome: </span>{record.outcome}</p>}{record.sanction && <p><span className="font-medium">Sanction: </span>{record.sanction}</p>}{record.appealBy && <p className="text-slate-500">Appeal by {record.appealBy.toLocaleDateString("en-GB", { timeZone: "UTC" })}</p>}{record.plan && <p><Link href={`/people/conduct/plans/${record.plan.id}`} className="text-blue-600">Linked plan: {record.plan.title}</Link></p>}</section>}
    <FormSection title="Employee response" intro={own ? "Add your response in your own words. It is stored with the case." : "The employee can write this, or you can record the response they gave."}>
      {record.employeeResponse && <p className="text-sm leading-6 text-slate-600 sm:col-span-2">{record.employeeResponse}</p>}
      {(own || canEdit) && <ActionForm action={respondToCase.bind(null, record.id)} className="grid gap-4 sm:col-span-2"><Field label="Response"><textarea name="employeeResponse" maxLength={8000} rows={4} defaultValue={record.employeeResponse ?? ""} className={fieldClass} /></Field><Button type="submit" variant="primary" className="justify-self-start">Save response</Button></ActionForm>}
    </FormSection>
    <section className="rounded-2xl border border-slate-200 bg-white p-6"><h3 className="text-lg font-semibold">Case updates</h3><ol className="mt-4 space-y-3">{record.events.map((event) => <li key={event.id} className="rounded-xl bg-slate-50 p-4 text-sm"><p className="text-xs text-slate-400">{event.occurredOn.toLocaleDateString("en-GB", { timeZone: "UTC" })} · {EVENT_KIND_LABEL[event.kind as keyof typeof EVENT_KIND_LABEL] ?? event.kind}{event.shared ? "" : " · not shared with the employee"}</p><p className="mt-1 font-medium">{event.summary}</p>{event.detail && <p className="mt-1 text-slate-500">{event.detail}</p>}</li>)}{!record.events.length && <p className="text-sm text-slate-500">No updates yet.</p>}</ol>
      {canEdit && <ActionForm action={addCaseEvent.bind(null, record.id)} className="mt-6 grid gap-4 sm:grid-cols-2"><Field label="Update type"><select name="kind" className={fieldClass}>{EVENT_KINDS.map((kind) => <option key={kind} value={kind}>{EVENT_KIND_LABEL[kind]}</option>)}</select></Field><Field label="Date"><input name="occurredOn" type="date" required className={fieldClass} /></Field><Field label="Summary" className="sm:col-span-2"><input name="summary" required maxLength={300} className={fieldClass} /></Field><Field label="Detail" className="sm:col-span-2"><textarea name="detail" maxLength={4000} rows={3} className={fieldClass} /></Field><label className="flex items-center gap-2 text-sm sm:col-span-2"><input name="shared" type="checkbox" className="accent-blue-600" />Share a private note with the employee. Meetings, warnings, appeals and outcomes are shared automatically.</label><Button type="submit" variant="primary" className="justify-self-start">Add update</Button></ActionForm>}
    </section>
  </div>;
}
