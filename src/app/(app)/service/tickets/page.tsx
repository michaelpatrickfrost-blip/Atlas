import Link from 'next/link';
import { requireSession } from '@/core/auth/session';
import { ticketList } from '@/modules/service/services/queries';
import { TICKET_STATUSES, label } from '@/modules/service/domain/workflow';
import { DataTable } from '@/components/ui/table';
import { inputClass } from '@/components/ui/service-fields';

export default async function HistoricalDepartmentWork({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}) {
  const session=await requireSession();
  const params=await searchParams;
  const filter={q:params.q?.trim(),status:TICKET_STATUSES.find(status=>status===params.status),mine:params.mine==='1',caseId:params.caseId};
  const tickets=await ticketList(session,filter);
  return <div className="space-y-5">
    <div><h1 className="text-2xl font-semibold">Historical department work</h1><p className="mt-2 text-sm text-slate-600">Find and finish departmental tickets from earlier customer service cases. Completed work stays here for reference.</p></div>
    <form className="flex flex-wrap items-end gap-3">
      {filter.caseId&&<input type="hidden" name="caseId" value={filter.caseId}/>}
      <label className="min-w-48 flex-1 text-sm">Search<input className={inputClass} name="q" defaultValue={filter.q} placeholder="Ticket number or subject"/></label>
      <label className="text-sm">Status<select className={inputClass} name="status" defaultValue={filter.status??''}><option value="">All statuses</option>{TICKET_STATUSES.map(status=><option key={status} value={status}>{label(status)}</option>)}</select></label>
      <label className="flex items-center gap-2 py-2 text-sm"><input type="checkbox" name="mine" value="1" defaultChecked={filter.mine}/>Assigned to me</label>
      <button className="rounded-lg bg-blue-700 px-4 py-2 text-sm text-white">Apply filters</button>
      <Link href="/service/tickets" className="py-2 text-sm text-blue-700">Clear filters</Link>
    </form>
    <DataTable rows={tickets} getHref={ticket=>`/service/tickets/${ticket.id}`} emptyLabel="No historical department work matches these filters." columns={[
      {header:'Ticket',render:ticket=><><strong>{ticket.number}</strong><div>{ticket.subject}</div></>},
      {header:'Department',render:ticket=>ticket.queue.name},
      {header:'Case',render:ticket=>ticket.case.number},
      {header:'Status',render:ticket=>label(ticket.status)},
      {header:'Due',render:ticket=>ticket.dueAt.toLocaleDateString('en-GB',{timeZone:'Europe/London'})},
    ]}/>
    <p className="text-xs text-slate-500">Showing up to 100 accessible tickets, earliest due first. Search or filter to narrow the list.</p>
  </div>;
}
