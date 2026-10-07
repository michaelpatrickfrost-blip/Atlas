import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { db } from "@/core/db/client";
import { CreateDialog } from "@/components/ui/create-dialog";
import { NewCompanyUserForm } from "../../account-forms";
import { ConsoleNav } from "../../console-nav";

export default async function CompanyUsers({ params, searchParams }: { params: Promise<{ organisationId: string }>; searchParams: Promise<{ q?: string; status?: string; role?: string; page?: string }> }) {
  const session = await requireSession();
  assertCapability(session, "atlas.users.manage");
  const { organisationId } = await params, filter = await searchParams;
  const query = (filter.q ?? "").trim().slice(0, 100), page = Math.max(1, Math.min(10000, Math.floor(Number(filter.page) || 1)));
  const org = await db.organisation.findFirst({ where: { id: organisationId, kind: "CUSTOMER" }, select: { id: true, name: true, archivedAt: true } });
  if (!org) notFound();
  const where = { organisationId, ...(query ? { user: { OR: [{ name: { contains: query, mode: "insensitive" as const } }, { email: { contains: query, mode: "insensitive" as const } }] } } : {}), ...(["active", "suspended"].includes(filter.status ?? "") ? { active: filter.status === "active" } : {}), ...(filter.role ? { roles: { some: { roleId: filter.role } } } : {}) };
  const [members, roles, total] = await Promise.all([
    db.membership.findMany({ where, include: { user: { select: { name: true, email: true, platformAdmin: { select: { active: true } } } }, roles: { include: { role: { select: { name: true } } } } }, orderBy: [{ user: { name: "asc" } }, { id: "asc" }], take: 30, skip: (page - 1) * 30 }),
    db.role.findMany({ where: { organisationId }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.membership.count({ where }),
  ]);
  const pageHref = (number: number) => `/atlas/${org.id}/users?${new URLSearchParams({ q: query, status: filter.status ?? "", role: filter.role ?? "", page: String(number) })}`;
  return <div className="space-y-6"><ConsoleNav organisationId={org.id} current="users" /><div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-2xl font-semibold tracking-tight">Users & access</h2><p className="mt-2 text-sm text-slate-500">{org.name} · Company roles and individual permissions never grant Atlas staff access.</p></div>{!org.archivedAt && <CreateDialog title="Add a company user" label="Add user"><NewCompanyUserForm organisationId={org.id} roles={roles} /></CreateDialog>}</div>
    {org.archivedAt && <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">This company is archived. Restore it before changing access or issuing setup codes.</p>}
    <form className="flex flex-wrap gap-3"><input name="q" aria-label="Search users" defaultValue={query} placeholder="Name or email…" className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white p-3 text-sm" /><select name="status" aria-label="User status" defaultValue={filter.status ?? ""} className="rounded-xl border border-slate-200 bg-white p-3 text-sm"><option value="">All users</option><option value="active">Active</option><option value="suspended">Suspended</option></select><select name="role" aria-label="Filter by role" defaultValue={filter.role ?? ""} className="max-w-full rounded-xl border border-slate-200 bg-white p-3 text-sm"><option value="">All roles</option>{roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}</select><button className="rounded-xl bg-slate-900 px-5 text-sm text-white">Search</button></form>
    <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">{members.map(member => <Link key={member.id} href={`/atlas/${org.id}/users/${member.id}`} className="flex flex-wrap items-center justify-between gap-4 p-5 hover:bg-slate-50"><div className="min-w-0"><p className="font-medium">{member.user.name}{member.user.platformAdmin && <span className="ml-2 rounded bg-blue-50 px-2 py-1 text-[10px] text-blue-700">Atlas staff</span>}</p><p className="mt-1 break-all text-xs text-slate-500">{member.user.email}</p></div><div className="text-xs text-slate-500"><p>{member.roles.map(role => role.role.name).join(", ") || (member.user.platformAdmin?.active ? "Full Atlas staff permissions" : "Profile access only")}</p><p className="mt-1">{member.active ? "Active" : "Suspended"} · {member.lastLoginAt ? `Last sign-in ${member.lastLoginAt.toLocaleDateString("en-GB")}` : "Not signed in yet"}</p></div><span className="text-xs text-blue-700">Manage →</span></Link>)}{!members.length && <p className="p-8 text-sm text-slate-500">No users match these filters.</p>}</div>
    <div className="flex justify-between text-xs text-slate-500"><p>{total} matching users · Page {page}</p><div className="flex gap-4">{page > 1 && <Link href={pageHref(page - 1)}>Previous</Link>}{page * 30 < total && <Link href={pageHref(page + 1)}>Next</Link>}</div></div>
  </div>;
}
