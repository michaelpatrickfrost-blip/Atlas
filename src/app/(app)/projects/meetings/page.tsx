import {projectScope,taskScope} from '@/core/permissions/work-access';
import { CreateDialog } from "@/components/ui/create-dialog";
import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { assertCapability,can } from "@/core/permissions/check";
import { db } from "@/core/db/client";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { createMeeting } from "../actions";
const input='mt-2 block w-full border border-[var(--color-border)] bg-white p-3 text-sm';
export default async function MeetingsPage() {
 const session=await requireSession();
 assertCapability(session,'projects.read');
 const [meetings,projects,members]=await Promise.all([db.meeting.findMany({where:{organisationId:session.organisationId,OR:[{projectId:null},{project:projectScope(session)}]},include:{project:true,tasks:{where:taskScope(session)}},orderBy:{startsAt:'desc'}}),db.project.findMany({where:projectScope(session)}),db.membership.findMany({where:{organisationId:session.organisationId},include:{user:{select:{name:true}}}})]);
 const names=new Map(members.map(m=>[m.userId,m.user.name]));
 return <div className="space-y-6"><h2 className="text-3xl font-semibold tracking-tight">Meetings that move work forward.</h2>{can(session,'projects.manage')&&<CreateDialog title="Schedule a meeting" label="Schedule meeting"><ActionForm action={createMeeting} className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-xs">Meeting title<input required name="title" className={input}/></label><label className="text-xs">Date and time (London)<input required type="datetime-local" name="startsAt" className={input}/></label><label className="text-xs">Project<select name="projectId" className={input}><option value="">Team meeting</option>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><fieldset><legend className="text-xs">Attendees</legend><div className="mt-3 flex flex-wrap gap-3">{members.map(m=><label key={m.id} className="flex gap-2 text-xs"><input type="checkbox" name="attendee" value={m.userId}/>{m.user.name}</label>)}</div></fieldset><label className="text-xs sm:col-span-2">Agenda / notes<textarea name="notes" className={`${input} min-h-24 rounded-xl`}/></label><Button type="submit" variant="primary" className="justify-self-start">Save meeting</Button></ActionForm></CreateDialog>}<div className="grid gap-4 sm:grid-cols-2">{meetings.map(m=><article key={m.id} className="rounded-2xl border border-[var(--color-border)] bg-white p-6"><p className="text-xs text-[var(--color-atlas-blue)]">{m.startsAt.toLocaleString('en-GB',{timeZone:'Europe/London'})}</p><h3 className="mt-3 text-lg font-semibold">{m.title}</h3><p className="mt-2 text-xs text-[var(--color-ink-muted)]">{m.project?.name??'Team meeting'} · {m.attendeeUserIds.map(id=>names.get(id)??'Former member').join(', ')}</p><p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-ink-muted)]">{m.notes}</p><Link href="/projects/tasks" className="mt-5 block text-sm text-[var(--color-atlas-blue)]">{m.tasks.length} assigned actions · Manage tasks →</Link></article>)}</div></div>;
}
