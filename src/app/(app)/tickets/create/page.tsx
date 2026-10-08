import { requireSession } from "@/core/auth/session";
import { serviceWorkRestriction } from "@/components/service-work/access-state";
import { deskQueues } from "@/core/service-work/queries";
import { queueConfig } from "@/core/service-work/config";
import { RequestForm } from "@/components/service-work/request-form";
export default async function CreateTicket({searchParams}:{searchParams:Promise<{queueId?:string;serviceId?:string}>}) {
 const initial=await searchParams;
 const session = await requireSession();
 const restriction = await serviceWorkRestriction(session, "TICKET", ["tickets.ticket.create"]);
 if (restriction) return restriction;
 const queues = await deskQueues(session);
 return <div className="mx-auto max-w-3xl space-y-6"><div><p className="text-xs font-semibold uppercase tracking-widest text-teal-700">Internal service desk</p><h2 className="mt-2 text-3xl font-semibold">How can we help?</h2><p className="mt-2 text-sm text-slate-500">Choose a team and describe what you need.</p></div>{queues.length ? <RequestForm initialQueueId={initial.queueId} initialServiceId={initial.serviceId} queues={queues.map(queue => ({ id: queue.id, name: queue.name, services: queueConfig(queue.configuration).services }))}/> : <p className="rounded-xl border border-slate-200 p-6 text-sm">Create a team queue under Queues to start accepting requests.</p>}</div>;
}
