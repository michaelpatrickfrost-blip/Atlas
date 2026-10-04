import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { db } from "@/core/db/client";
import { getImplementedModules } from "@/core/modules/registry";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { CreateDialog } from "@/components/ui/create-dialog";
import { updateCompanyAccount, saveCompanyEntitlements } from "../actions";
import { setCompanyUserStatus } from "../setup-actions";
import { ConsoleNav } from "../console-nav";
import { NewCompanyUserForm } from "../account-forms";

const input = "mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm";

export default async function CompanyAccount({ params, searchParams }: { params: Promise<{ organisationId: string }>; searchParams: Promise<{ q?: string }> }) {
  const session = await requireSession();
  assertCapability(session, "atlas.companies.manage");
  const { organisationId } = await params;
  const { q = "" } = await searchParams;
  const query = q.trim().slice(0, 100);
  const org = await db.organisation.findUnique({
    where: { id: organisationId },
    include: {
      moduleStates: true,
      memberships: {
        where: query ? { user: { OR: [{ name: { contains: query, mode: "insensitive" } }, { email: { contains: query, mode: "insensitive" } }] } } : {},
        include: { user: { select: { id: true, name: true, email: true } }, roles: { include: { role: { select: { name: true } } } } },
        orderBy: { user: { name: "asc" } },
        take: 200,
      },
      _count: { select: { parties: true, products: true, priceLists: true, employees: true } },
    },
  });
  if (!org) notFound();
  const roles = await db.role.findMany({ where: { organisationId }, orderBy: { name: "asc" }, select: { id: true, name: true } });
  const audit = await db.auditEntry.findMany({ where: { organisationId, action: { startsWith: "atlas." } }, orderBy: { createdAt: "desc" }, take: 20 });
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <ConsoleNav organisationId={org.id} current="account" />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-blue-600">Company account</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{org.name}</h1>
          <p className="mt-2 text-sm text-slate-500">{org._count.parties} customers · {org._count.products} products · {org._count.priceLists} price lists · {org._count.employees} people</p>
        </div>
        <Link href={`/atlas/${org.id}/setup`} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white">Open data setup</Link>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-5 font-semibold">Account & subscription</h2>
          <ActionForm action={updateCompanyAccount} className="space-y-4">
            <input type="hidden" name="organisationId" value={org.id} />
            <label className="block text-xs">Company name<input required name="name" defaultValue={org.name} className={input} /></label>
            <label className="block text-xs">Account access<select name="status" defaultValue={org.status} className={input}><option value="ACTIVE">Active</option><option value="SUSPENDED">Suspended — block company sign-in</option></select></label>
            <label className="block text-xs">Subscription status<select name="subscriptionStatus" defaultValue={org.subscriptionStatus} className={input}>{["TRIAL", "ACTIVE", "PAST_DUE", "CANCELLED"].map((status) => <option key={status}>{status}</option>)}</select></label>
            <label className="block text-xs">Plan name<input required name="planName" defaultValue={org.planName} className={input} /></label>
            <label className="block text-xs">Trial ends<input name="trialEndsAt" type="date" defaultValue={org.trialEndsAt?.toISOString().slice(0, 10)} className={input} /></label>
            <p className="text-xs text-slate-400">Subscription fields record the account you manage. Charging and automatic expiry are separate.</p>
            <Button type="submit" variant="primary">Save account</Button>
          </ActionForm>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-2 font-semibold">App entitlements</h2>
          <p className="mb-5 text-xs text-slate-500">Choose what this company can turn on. Removing an entitlement disables access and keeps its records.</p>
          <ActionForm action={saveCompanyEntitlements} className="space-y-3">
            <input type="hidden" name="organisationId" value={org.id} />
            {getImplementedModules().map((module) => (
              <label key={module.id} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 text-sm">
                <input type="checkbox" name="moduleId" value={module.id} defaultChecked={org.moduleStates.some((state) => state.moduleId === module.id && state.entitled)} />
                <span className="flex-1">{module.name}</span>
                <span className="text-[10px] text-slate-400">{org.moduleStates.some((state) => state.moduleId === module.id && state.enabled) ? "Enabled" : "Disabled"}</span>
              </label>
            ))}
            <Button type="submit" variant="primary">Save entitlements</Button>
          </ActionForm>
        </section>
      </div>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
          <div>
            <h2 className="font-semibold">Company users</h2>
            <p className="mt-1 text-xs text-slate-500">Add people with a one-time setup code. This console does not sign in as them.</p>
          </div>
          <CreateDialog title="Add a company user" label="Add user"><NewCompanyUserForm organisationId={org.id} roles={roles} /></CreateDialog>
        </div>
        <form className="flex gap-3 border-b border-slate-100 p-4">
          <input aria-label="Search users" name="q" defaultValue={query} placeholder="Search by name or email…" className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          <Button type="submit">Search</Button>
        </form>
        <div className="divide-y divide-slate-100">
          {org.memberships.map((member) => (
            <div key={member.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 text-sm">
              <div>
                <p className="font-medium">{member.user.name}{member.id === session.membershipId && <span className="ml-2 text-xs font-normal text-slate-400">You</span>}</p>
                <p className="mt-1 text-xs text-slate-400">{member.user.email}</p>
              </div>
              <p className="text-xs text-slate-500">{member.roles.map((role) => role.role.name).join(", ") || "No role"} · {member.lastLoginAt ? `Last sign-in ${member.lastLoginAt.toLocaleDateString("en-GB")}` : "Not signed in yet"}</p>
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-3 py-1 text-[10px] font-semibold ${member.active ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-700"}`}>{member.active ? "Active" : "Suspended"}</span>
                {member.id !== session.membershipId && (
                  <ActionForm action={setCompanyUserStatus} className="flex items-center gap-2">
                    <input type="hidden" name="organisationId" value={org.id} />
                    <input type="hidden" name="membershipId" value={member.id} />
                    <input type="hidden" name="status" value={member.active ? "SUSPENDED" : "ACTIVE"} />
                    <button className="text-xs text-blue-600">{member.active ? "Suspend" : "Restore"}</button>
                  </ActionForm>
                )}
              </div>
            </div>
          ))}
          {!org.memberships.length && <p className="p-6 text-sm text-slate-400">No users match this search.</p>}
        </div>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 font-semibold">Account history</h2>
        {audit.length ? audit.map((entry) => <p key={entry.id} className="border-t border-slate-100 py-3 text-xs text-slate-500">{entry.createdAt.toLocaleString("en-GB")} · {entry.action}</p>) : <p className="text-sm text-slate-400">No owner changes yet.</p>}
      </section>
    </div>
  );
}
