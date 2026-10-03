import { CreateDialog } from "@/components/ui/create-dialog";
import { ActionForm } from "@/components/ui/action-form";
import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { assertCapability,can } from "@/core/permissions/check";
import { db } from "@/core/db/client";
import { Button } from "@/components/ui/button";
import { createProject,changeProjectStatus } from "./actions";
export default async function ProjectsPage() {
 const session=await requireSession();
 assertCapability(session,"projects.read");
 const manage=can(session,"projects.manage");
 const [projects,customers]=await Promise.all([db.project.findMany({where:{organisationId:session.organisationId},include:{party:true,quotes:{select:{id:true,reference:true}}},orderBy:{updatedAt:"desc"}}),manage ? db.party.findMany({where:{organisationId:session.organisationId},select:{id:true,name:true},orderBy:{name:"asc"}}):[]]);
 return <div className="space-y-6">{manage && <CreateDialog title="New customer project" label="New project"><ActionForm action={createProject} className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm">Project name<input name="name" required maxLength={200} className="mt-2 w-full border border-[var(--color-border)] p-3"/></label><label className="text-sm">Customer<select required name="partyId" className="mt-2 w-full border border-[var(--color-border)] bg-white p-3"><option value="">Choose customer</option>{customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label className="text-sm sm:col-span-2">Notes<textarea name="notes" className="mt-2 w-full rounded-lg border border-[var(--color-border)] p-3"/></label><Button type="submit" variant="primary" className="justify-self-start">Create project</Button></ActionForm></CreateDialog>}
 {projects.length ? <div className="grid gap-4 lg:grid-cols-2">{projects.map(p=><article key={p.id} className="space-y-4 rounded-2xl border border-[var(--color-border)] bg-white p-6"><p className="text-xs text-[var(--color-ink-faint)]">{p.reference}</p><h2 className="text-lg font-semibold">{p.name}</h2><Link href={`/customers/${p.partyId}`} className="text-sm text-[var(--color-atlas-blue)]">{p.party.name}</Link>{p.notes && <p className="whitespace-pre-wrap text-sm text-[var(--color-ink-muted)]">{p.notes}</p>}<div className="flex flex-wrap gap-3">{p.quotes.map(q=><Link key={q.id} href={`/sales/quotes/${q.id}`} className="text-xs text-[var(--color-atlas-blue)]">Quote {q.reference} →</Link>)}</div>{manage ? <ActionForm action={changeProjectStatus.bind(null,p.id)} className="flex gap-3"><select name="status" defaultValue={p.status} className="border border-[var(--color-border)] bg-white px-3 py-2 text-xs">{["PLANNED","ACTIVE","ON_HOLD","COMPLETED","CANCELLED"].map(s=><option key={s}>{s}</option>)}</select><Button type="submit">Save status</Button></ActionForm>:<p className="text-xs">{p.status}</p>}</article>)}</div> : <p className="py-12 text-center text-sm text-[var(--color-ink-muted)]">Create a project to connect customer work and quotations.</p>}</div>;
}
