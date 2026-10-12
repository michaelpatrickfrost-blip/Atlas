import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/core/auth/session";
import { serviceWorkRestriction } from "./access-state";
import { db } from "@/core/db/client";
import { isModuleEnabled } from "@/core/modules/runtime";
import { workScope } from "@/core/service-work/access";
import { serviceCaseScope } from "@/core/permissions/service-access";
import { TicketHistoryPanel, TicketEvidencePanel, TicketStatusPanel, TicketApprovalPanel } from "./ticket-record-panels";
import { deskQueues } from "@/core/service-work/queries";
import { commentWork, mergeWork, watchWork, requestWorkApproval, decideWorkApproval } from "@/core/service-work/actions";
import { attachServiceFile } from "@/core/service-work/file-actions";
import { queueConfig, FINAL_WORK } from "@/core/service-work/config";
import { slaState } from "@/core/service-work/sla";
import { RequestForm } from "./request-form";
import { ActionForm } from "@/components/ui/action-form";
import { Field, Select, TextArea } from "@/components/ui/service-fields";
import { ticketFieldFormManifest } from "@/core/service-work/field-forms";
import { TicketProgressForm } from "./ticket-progress-form";
import { ticketRecordTypeSelection } from "@/core/service-work/record-types";
import { recordDefaultCustomerPageTarget } from "@/core/studio/pages/record-default";
import { Card } from "@/components/ui/card";
const label = (value: string) => value.replaceAll("_", " ").toLowerCase();
export async function WorkDetail({ id, kind = "TICKET" }: { id: string; kind?: string }) {
  const session = await requireSession();
  const restriction = await serviceWorkRestriction(session, kind);
  if (restriction) return restriction;
  const work = await db.serviceWorkItem.findFirst({ where: { AND: [workScope(session), { id, kind }] }, include: { queue: { include: { members: { where: { organisationId: session.organisationId } } } }, files: { select: { id: true, name: true, size: true, mime: true, createdAt: true }, where: { organisationId: session.organisationId, OR: [{ visibility: "REQUESTER" }, { visibility: "INTERNAL", work: { queue: { members: { some: { organisationId: session.organisationId, userId: session.userId } } } } }] } } } });
  if (!work) notFound();
  const agent = work.queue.members.some(member => member.userId === session.userId);
  const manage = (!work.queue.restricted || agent) && (kind === "TICKET" ? session.capabilities.has("tickets.ticket.manage") : session.capabilities.has("service.ticket.update") && (agent || session.capabilities.has("tickets.ticket.manage")));
  const parent=work.parentId?await db.serviceWorkItem.findFirst({where:{AND:[workScope(session),{id:work.parentId}]},select:{kind:true,id:true}}):null;
  const entries = await db.serviceWorkEntry.findMany({ where: { organisationId: session.organisationId, workId: id, ...(!agent ? { visibility: "REQUESTER" } : {}) }, orderBy: { createdAt: "asc" }, take: 500 });
  const [members, queues, children, mergedFrom, approval, parentCase, continuing] = await Promise.all([
    db.membership.findMany({ where: { organisationId: session.organisationId, active: true }, select: { userId: true, user: { select: { name: true } } }, take: 500 }), deskQueues(session),
    db.serviceWorkItem.findMany({ where: { AND: [workScope(session), { parentId: id }] }, select: { id: true, kind: true, number: true, subject: true, status: true } }),
    db.serviceWorkItem.findMany({ where: { AND: [workScope(session), { mergedIntoId: id }] }, select: { id: true, kind: true, number: true } }),
    manage && kind === "TICKET" && work.approvalId ? db.approvalInstance.findFirst({ where: { id: work.approvalId, organisationId: session.organisationId, subjectType: "SERVICE_TICKET", subjectId: id }, include: { steps: { where: { organisationId: session.organisationId } } } }) : null,
    work.parentCaseId && session.capabilities.has("service.case.read") && await isModuleEnabled(session, "service") ? db.serviceCase.findFirst({ where: { AND: [serviceCaseScope(session), { id: work.parentCaseId }] }, select: { id: true } }) : null,
    work.mergedIntoId ? db.serviceWorkItem.findFirst({ where: { AND: [workScope(session), { id: work.mergedIntoId }] }, select: { id: true, kind: true } }) : null,
  ]);
  const names = new Map(members.map(member => [member.userId, member.user.name]));
  const context = work.context as Record<string, unknown>, definition = work.definition as { fields?: { key: string; label: string }[] };
  const origin = context.origin as {caseNumber?: string; affectedQuantity?: number; lotCode?: string} | undefined;
  const version = <><input name="workId" type="hidden" value={id}/><input name="version" type="hidden" value={work.version}/></>;
  const link = (id: string, kind: string) => `/${kind === "QUERY" ? "service/queries" : "tickets"}/${id}`;
  const queryCreate = session.capabilities.has("service.ticket.create"), ticketCreate = session.capabilities.has("tickets.ticket.create") && await isModuleEnabled(session, "tickets");
  const [editFields, createFields, recordTypeSelection, businessLayout] = await Promise.all([
    manage && kind === "TICKET" && !work.mergedIntoId ? ticketFieldFormManifest(session, { operation: "update", recordId: id }) : null,
    ticketCreate && !work.mergedIntoId && !FINAL_WORK.includes(work.status) ? ticketFieldFormManifest(session, { operation: "create" }) : null,
    manage && kind === "TICKET" && !work.mergedIntoId && !FINAL_WORK.includes(work.status) ? ticketRecordTypeSelection(session, id, work.version) : null,
    kind === "TICKET" && !work.mergedIntoId ? recordDefaultCustomerPageTarget(session,
      { mode: "record_default", entityId: "tickets.ticket", recordId: id, formFactor: "desktop" }) : null,
  ]);
  return <div className="space-y-6"><Link className="text-xs text-teal-700" href={kind === "QUERY" ? "/service/queries" : "/tickets"}>← {kind === "QUERY" ? "Queries" : "Tickets"}</Link><div className="flex flex-wrap justify-between gap-4"><div><p className="text-xs font-semibold tracking-widest text-teal-700">{work.number} · {work.queue.name}</p><h2 className="mt-2 text-3xl font-semibold tracking-tight">{work.subject}</h2><p className="mt-2 text-sm text-slate-500">{names.get(work.requesterUserId) ?? "Colleague"} · {label(work.type)} · {label(work.priority)} priority</p></div><span className="h-fit rounded-full bg-slate-100 px-4 py-2 text-xs font-medium capitalize">{label(work.status)}</span></div>
    {businessLayout && <Link className="flex items-center justify-between gap-4 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm text-blue-900 hover:bg-blue-100/60"
      href={`/screens/${businessLayout.definitionId}?mode=record_default&record=${encodeURIComponent(id)}`}><span><strong>Open business layout</strong><span className="mt-1 block text-xs">{businessLayout.name}</span></span><span aria-hidden="true">→</span></Link>}
    {work.mergedIntoId && <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm">This reference was merged. {continuing ? <Link className="font-semibold underline" href={link(continuing.id, continuing.kind)}>Open the continuing record</Link> : <span>The continuing record is not available with your current access</span>}. Original history and evidence remain below.</div>}
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.8fr)_minmax(300px,1fr)]"><div className="space-y-5">
      <Card className="p-6"><h3 className="font-semibold">Request</h3><p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{work.description}</p>{definition.fields?.length ? <dl className="mt-5 grid gap-3 sm:grid-cols-2">{definition.fields.map(field => <div key={field.key}><dt className="text-xs text-slate-400">{field.label}</dt><dd className="mt-1 text-sm">{String((context.answers as Record<string, unknown>)?.[field.key] ?? "—")}</dd></div>)}</dl> : null}{["asset", "service", "problem", "workaround", "rootCause", "risk", "implementationPlan", "rollbackPlan", "testingPlan", "schedule"].filter(key => context[key]).map(key => <div className="mt-4" key={key}><p className="text-xs font-medium capitalize text-slate-400">{key.replaceAll(/([A-Z])/g, " $1")}</p><p className="mt-1 whitespace-pre-wrap text-sm">{String(context[key])}</p></div>)}</Card>
      <Card className="p-6"><h3 className="font-semibold">Conversation & history</h3><TicketHistoryPanel rows={entries.map(entry => ({ id: entry.id, values: { kind: entry.kind, created_at: entry.createdAt.toISOString(), actor: names.get(entry.actorUserId) ?? "Colleague", visibility: entry.visibility === "INTERNAL" ? "INTERNAL" : "REQUESTER", body: entry.body } }))}/>
      {!work.mergedIntoId && <ActionForm action={commentWork} className="mt-4" label="Add reply">{version}<TextArea name="body" title="Reply or investigation note" required/><Select name="visibility" title="Visibility" options={agent ? ["REQUESTER", "INTERNAL"] : ["REQUESTER"]}/></ActionForm>}</Card>
      <Card className="p-6"><h3 className="font-semibold">Linked work</h3>{origin?.caseNumber && (!work.parentCaseId || parentCase) && <p className="mt-3 text-sm text-slate-600">{origin.caseNumber}{origin.affectedQuantity != null ? ` · ${origin.affectedQuantity} affected units` : ""}{origin.lotCode ? ` · Lot ${origin.lotCode}` : ""}</p>}<div className="mt-3 space-y-2 text-sm">{parentCase && <Link className="block text-teal-700" href={`/service/cases/${work.parentCaseId}`}>Originating customer case →</Link>}{parent && <Link className="block text-teal-700" href={link(parent.id,parent.kind)}>Originating ticket / query →</Link>}{children.map(child => <Link key={child.id} href={link(child.id, child.kind)} className="flex justify-between rounded-lg border border-slate-200 p-3"><span>{child.number} · {child.subject}</span><span className="ml-3 text-xs capitalize text-slate-500">{label(child.status)}</span></Link>)}{mergedFrom.map(source => <Link key={source.id} className="block text-teal-700" href={link(source.id, source.kind)}>Merged history: {source.number} →</Link>)}</div>{!work.mergedIntoId && !FINAL_WORK.includes(work.status) && (queryCreate || ticketCreate) && <details className="mt-5"><summary className="cursor-pointer text-sm font-medium">Create linked work</summary><div className="mt-4 space-y-5">{queryCreate && <details><summary className="cursor-pointer text-sm">Request action from another team</summary><div className="mt-3"><RequestForm kind="QUERY" parentId={id} queues={queues.map(queue => ({ id: queue.id, name: queue.name, services: queueConfig(queue.configuration).services }))}/></div></details>}{ticketCreate && <details><summary className="cursor-pointer text-sm">Create child ticket</summary><div className="mt-3"><RequestForm fieldManifest={createFields} parentId={id} queues={queues.map(queue => ({ id: queue.id, name: queue.name, services: queueConfig(queue.configuration).services }))}/></div></details>}</div></details>}</Card>
    </div><aside className="space-y-5"><Card className="p-5"><h3 className="font-semibold">Service commitment</h3><TicketStatusPanel rows={[{ id: work.id, values: { status: work.status, owner: work.ownerUserId ? names.get(work.ownerUserId) ?? "Colleague" : "Unassigned", reopen_count: work.reopenCount,
      first_response_state: slaState(work.firstResponseDueAt, null, work.firstResponseAt), first_response_due: work.firstResponseDueAt?.toISOString() ?? null,
      resolution_state: slaState(work.resolutionDueAt, work.pausedAt, work.resolvedAt), resolution_due: work.resolutionDueAt?.toISOString() ?? null } }]}/>
      {session.capabilities.has("tickets.ticket.watch") && <ActionForm action={watchWork} className="mt-4" label={work.watcherIds.includes(session.userId) ? "Stop following" : "Follow updates"}>{version}</ActionForm>}</Card>
      {manage && !work.mergedIntoId && <Card className="p-5"><h3 className="mb-4 font-semibold">Progress & assignment</h3><TicketProgressForm work={work} owners={members.filter(member => work.queue.members.some(value => value.userId === member.userId)).map(member => ({ id: member.userId, name: member.user.name }))} fieldManifest={editFields} recordTypeSelection={recordTypeSelection}/></Card>}
      <Card className="p-5"><h3 className="font-semibold">Evidence</h3><TicketEvidencePanel rows={work.files.map(file => ({ id: file.id, values: { name: file.name, size: file.size, mime: file.mime, created_at: file.createdAt.toISOString() } }))}/>
      {!work.mergedIntoId && <ActionForm action={attachServiceFile} className="mt-4" label="Attach evidence"><input name="workId" type="hidden" value={id}/><Field title="PDF or photograph · up to 8 MB" name="file" type="file" accept="application/pdf,image/png,image/jpeg" required/></ActionForm>}</Card>
      {manage && kind === "TICKET" && <Card className="p-5"><h3 className="font-semibold">Approval</h3><TicketApprovalPanel rows={approval ? [{ id: approval.id, values: { approval_status: approval.status, stage: null, approver: null, status: approval.status, reason: null, due_at: null } },
        ...approval.steps.map(step => ({ id: step.id, values: { approval_status: approval.status, stage: step.stage, approver: names.get(step.approverUserId) ?? "Approver", status: step.status, reason: step.reason, due_at: step.dueAt.toISOString() } }))] : []}/>
      {!FINAL_WORK.includes(work.status) && <ActionForm action={requestWorkApproval} label="Request approval" className="mt-4">{version}</ActionForm>}{approval?.status === "PENDING" && <ActionForm action={decideWorkApproval} className="mt-4" label="Record decision">{version}<Select title="Decision" name="decision" options={["APPROVED", "REJECTED", "INFORMATION"]}/><TextArea title="Reason" name="reason" required/></ActionForm>}</Card>}
      {manage && session.capabilities.has("tickets.ticket.manage") && !work.mergedIntoId && <details className="rounded-xl border border-slate-200 p-5"><summary className="cursor-pointer text-sm">Merge duplicate</summary><ActionForm action={mergeWork} className="mt-4" label="Merge and retain history">{version}<Field name="targetNumber" title="Continuing reference" placeholder="TKT-000123" required/><TextArea name="reason" title="Reason" required/></ActionForm></details>}
    </aside></div></div>;
}
