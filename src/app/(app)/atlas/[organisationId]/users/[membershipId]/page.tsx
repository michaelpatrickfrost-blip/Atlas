import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { db } from "@/core/db/client";
import { effectiveRoleCapabilities } from "@/core/permissions/access-levels";
import { applyCompanyAccessRestrictions, COMPANY_ACCESS_AREAS, hasCompanyAreaAccess } from "@/core/permissions/company-access";
import { AccessEditor } from "@/components/admin/access-editor";
import { PortalActionForm as ActionForm } from "@/app/(app)/atlas/portal-action-form";
import { accessGroups } from "@/app/(app)/settings/access-groups";
import { ConsoleNav } from "../../../console-nav";
import { CredentialForm } from "../../../credential-form";
import { saveAtlasUserAccess, saveAtlasUserProfile, revokeAtlasUserSessions, issueAtlasUserRecovery } from "../../../admin-actions";
import { setCompanyUserStatus } from "../../../setup-actions";
const input = "mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm";
const panel = "rounded-2xl border border-slate-200 bg-white p-5 sm:p-6";
export default async function CompanyUser({ params }: { params: Promise<{ organisationId: string; membershipId: string }> }) {
  const session = await requireSession();
  assertCapability(session, "atlas.users.manage");
  const { organisationId, membershipId } = await params;
  const member = await db.membership.findFirst({ where: { id: membershipId, organisationId, organisation: { kind: "CUSTOMER" } }, include: { organisation: true, user: { select: { id: true, name: true, email: true, platformAdmin: true, _count: { select: { memberships: true } } } }, roles: { include: { role: true } } } });
  if (!member) notFound();
  const roles = await db.role.findMany({ where: { organisationId }, orderBy: { name: "asc" } });
  const caps = effectiveRoleCapabilities(member.roles.map(role => role.role), member.grantedCapabilities, member.deniedCapabilities);
  const effective = applyCompanyAccessRestrictions(caps, member.organisation.restrictedAccessAreas);
  const blocked = member.id === session.membershipId || !!member.organisation.archivedAt || !!member.user.platformAdmin;
  const hidden = <><input type="hidden" name="organisationId" value={organisationId} /><input type="hidden" name="membershipId" value={member.id} /></>;
  return <div className="space-y-6"><ConsoleNav organisationId={organisationId} current="users" /><Link href={`/atlas/${organisationId}/users`} className="inline-block text-xs text-blue-700">← Company users</Link><div><h2 className="text-2xl font-semibold">{member.user.name}</h2><p className="mt-2 text-sm text-slate-500">{member.user.email} · {member.organisation.name} · {member.active ? "Active" : "Suspended"}</p></div>
    {member.user.platformAdmin ? <section className={panel}><h3 className="font-semibold">Atlas staff identity</h3><p className="my-3 text-sm text-slate-500">Active Atlas staff currently have full permissions in their selected company. Company roles cannot reduce or grant platform staff access.</p><Link href="/atlas/team" className="text-sm text-blue-700">Manage in Atlas team →</Link></section> : <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6"><section className={panel}><h3 className="mb-5 font-semibold">Sign-in profile</h3>{!blocked && member.user._count.memberships === 1 ? <ActionForm action={saveAtlasUserProfile} label="Save profile">{hidden}<label className="block text-xs">Full name<input name="name" required maxLength={100} defaultValue={member.user.name} className={input} /></label><label className="block text-xs">Email<input name="email" required type="email" maxLength={254} defaultValue={member.user.email} className={input} /></label><p className="text-xs text-slate-500">Saving revokes existing sessions and pending recovery codes.</p></ActionForm> : <p className="text-sm text-slate-500">{member.user._count.memberships > 1 ? "Shared accounts manage their own global name and email." : "Use My work for your own profile. Archived company profiles are read only."}</p>}</section>
      <section className={panel}><h3 className="mb-5 font-semibold">Roles & individual access</h3><AccessEditor key={JSON.stringify([member.roles.map(role => role.roleId), member.grantedCapabilities, member.deniedCapabilities])} organisationId={organisationId} membershipId={member.id} capabilities={[...caps].filter(cap => !cap.startsWith("atlas."))} groups={accessGroups()} roles={roles} roleIds={member.roles.map(role => role.roleId)} granted={member.grantedCapabilities} denied={member.deniedCapabilities} action={saveAtlasUserAccess} disabled={blocked} /></section></div>
      <aside className="space-y-6"><section className={panel}><h3 className="font-semibold">Effective access</h3><p className="mt-2 text-xs text-slate-500">Company restrictions override roles and individual grants.</p><div className="mt-4 divide-y divide-slate-100">{COMPANY_ACCESS_AREAS.map(area => <div key={area.id} className="flex justify-between gap-3 py-3 text-xs"><span>{area.label}</span><span className="text-slate-500">{member.organisation.restrictedAccessAreas.includes(area.id) ? "Off for company" : hasCompanyAreaAccess(effective, area) ? "Access" : "No access"}</span></div>)}</div></section>
      {!blocked && <section className={panel}><h3 className="mb-4 font-semibold">Security & sign-in</h3><div className="space-y-6"><ActionForm action={setCompanyUserStatus} label={member.active ? "Suspend user" : "Restore user"}>{hidden}<input type="hidden" name="status" value={member.active ? "SUSPENDED" : "ACTIVE"} /><p className="text-xs text-slate-500">Suspension blocks access to this company and preserves all records.</p></ActionForm><ActionForm action={revokeAtlasUserSessions} label="Sign out devices">{hidden}<p className="text-xs text-slate-500">Revoke sessions for this user in this company.</p></ActionForm>{member.active && member.organisation.status === "ACTIVE" && member.user._count.memberships === 1 && <details><summary className="cursor-pointer text-sm font-medium text-blue-700">Reset password / reissue setup</summary><div className="mt-4"><CredentialForm action={issueAtlasUserRecovery} label="Issue recovery code">{hidden}<label className="block text-xs">Your administrator password<input type="password" name="currentPassword" required autoComplete="current-password" className={input} /></label><p className="text-xs text-slate-500">Single use, valid for 30 minutes. Give it directly to this person.</p></CredentialForm></div></details>}</div></section>}</aside>
    </div>}
  </div>;
}
