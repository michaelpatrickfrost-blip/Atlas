import { requireSession } from '@/core/auth/session';
import { assertCapability } from '@/core/permissions/check';
import { db } from '@/core/db/client';
import { requireService } from '@/modules/service/services/queries';
import { createCase } from '@/modules/service/services/commands';
import { ActionForm } from '@/modules/service/components/action-form';
import { Field, Select, TextArea, inputClass } from '@/modules/service/components/fields';
import { CASE_TYPES, PRIORITIES, SEVERITIES, CHANNELS } from '@/modules/service/domain/workflow';
export default async function NewCase({searchParams}:{searchParams:Promise<{partyId?:string;q?:string}>}) {
 const session=await requireSession();assertCapability(session,'service.case.create');assertCapability(session,'customers.read');await requireService(session);const {partyId,q}=await searchParams;
 const parties=await db.party.findMany({where:{organisationId:session.organisationId,...(q?{name:{contains:q,mode:'insensitive'}}:{}),...(partyId?{id:partyId}:{})},select:{id:true,name:true,customerCode:true},orderBy:{name:'asc'},take:100});
 const contacts=partyId?await db.contact.findMany({where:{partyId,party:{organisationId:session.organisationId}},select:{id:true,firstName:true,surname:true}}):[];
 return <div className="max-w-3xl space-y-5"><h2 className="text-2xl font-semibold">New customer case</h2><p className="text-sm text-slate-500">Start with a customer and subject. Classification can follow during triage.</p><form className="flex gap-2"><Field title="Find customer" name="q" defaultValue={q}/><button className="atlas-primary-button self-end">Search</button></form>
 <ActionForm action={createCase} label="Create case"><label className="block text-xs">Customer<select name="partyId" required defaultValue={partyId} className={inputClass}><option value="">Choose customer</option>{parties.map(p=><option key={p.id} value={p.id}>{p.customerCode} · {p.name}</option>)}</select></label><Field title="Subject" name="subject" required maxLength={250}/>{contacts.length>0&&<label className="block text-xs">Contact<select className={inputClass} name="contactId"><option value="">Unknown caller / no contact</option>{contacts.map(c=><option key={c.id} value={c.id}>{c.firstName} {c.surname}</option>)}</select></label>}<TextArea title="What happened?" name="description"/>
 <details className="rounded-lg border border-slate-200 p-4"><summary className="cursor-pointer text-sm font-medium">Classification and intake</summary><div className="mt-3 grid gap-3 sm:grid-cols-2"><Select title="Type" name="type" options={CASE_TYPES} defaultValue="QUERY"/><Select title="Channel" name="channel" options={CHANNELS} defaultValue="MANUAL"/><Select title="Priority — response urgency" name="priority" options={PRIORITIES} defaultValue="NORMAL"/><Select title="Severity — business impact" name="severity" options={SEVERITIES} defaultValue="SEV3"/>{session.capabilities.has('service.case.restricted')&&<Select title="Security" name="security" options={['STANDARD','RESTRICTED']}/>}</div></details></ActionForm><p className="text-xs text-slate-500">Customer results are limited to 100. Search to narrow the list.</p></div>;
}
