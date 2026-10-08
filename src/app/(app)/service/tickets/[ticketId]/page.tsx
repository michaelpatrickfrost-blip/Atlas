import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireSession } from '@/core/auth/session';
import { ticketRecord } from '@/modules/service/services/queries';
import { updateDepartmentTicket } from '@/modules/service/services/commands';
import { TICKET_STATUSES, label } from '@/modules/service/domain/workflow';
import { ActionForm } from '@/modules/service/components/action-form';
import { RecordVersion, Select, TextArea } from '@/modules/service/components/fields';

export default async function HistoricalTicket({params}:{params:Promise<{ticketId:string}>}) {
  const session=await requireSession();
  const ticket=await ticketRecord(session,(await params).ticketId);
  if(!ticket) notFound();
  const final=ticket.status==='COMPLETE'||ticket.status==='CANCELLED';
  return <div className="min-w-0 space-y-5 break-words">
    <Link href="/service/tickets" className="text-sm text-blue-700">← Historical department work</Link>
    <div><p className="text-sm text-slate-600">{ticket.number} · {ticket.queue.name}</p><h1 className="mt-1 text-2xl font-semibold">{ticket.subject}</h1>
      <p className="mt-2 text-sm">{label(ticket.status)} · Due {ticket.dueAt.toLocaleDateString('en-GB',{timeZone:'Europe/London'})} · {ticket.ownerUserId===session.userId?'Assigned to you':ticket.ownerUserId?'Assigned':'Unassigned'}</p>
      <p className="mt-2 text-sm">Case {ticket.canOpenCase?<Link href={`/service/cases/${ticket.caseId}`} className="text-blue-700 underline">{ticket.case.number}</Link>:ticket.case.number}</p>
    </div>
    <section className="rounded-xl border border-slate-200 bg-white p-4"><h2 className="font-semibold">Work requested</h2><p className="mt-2 whitespace-pre-wrap text-sm">{ticket.description}</p></section>
    {final?<section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4"><p className="font-medium">{ticket.status==='COMPLETE'?'This ticket is complete.':'This ticket is cancelled.'}</p>{ticket.outcome&&<div><h2 className="font-semibold">Outcome / reason</h2><p className="whitespace-pre-wrap text-sm">{ticket.outcome}</p></div>}{ticket.customerSafeSummary&&<div><h2 className="font-semibold">Customer-safe summary</h2><p className="whitespace-pre-wrap text-sm">{ticket.customerSafeSummary}</p></div>}</section>
    :session.capabilities.has('service.ticket.update')?<section className="rounded-xl border border-slate-200 bg-white p-4"><h2 className="mb-3 font-semibold">Update this ticket</h2><ActionForm action={updateDepartmentTicket} label="Save progress">
      <RecordVersion ticket id={ticket.id} version={ticket.version}/>
      <Select title="Status" name="status" options={TICKET_STATUSES} defaultValue={ticket.status}/>
      {ticket.ownerUserId!==session.userId&&<label className="flex items-center gap-2 text-sm"><input type="checkbox" name="takeOwnership" value="yes" defaultChecked={!ticket.ownerUserId}/>Assign this ticket to me</label>}
      <TextArea title="Outcome / reason" name="outcome" defaultValue={ticket.outcome??''}/>
      <TextArea title="Customer-safe summary" name="customerSafeSummary" defaultValue={ticket.customerSafeSummary??''}/>
      <p className="text-xs text-slate-600">Give a reason when waiting for information, completing, rejecting or cancelling work. Completion sends your findings to the original case owner, who keeps responsibility for the customer response.</p>
    </ActionForm></section>:<section className="space-y-2 rounded-xl border border-slate-200 bg-white p-4"><p className="text-sm text-slate-600">You have read-only access to this ticket.</p><p className="whitespace-pre-wrap text-sm">{ticket.outcome}</p><p className="whitespace-pre-wrap text-sm">{ticket.customerSafeSummary}</p></section>}
  </div>;
}
