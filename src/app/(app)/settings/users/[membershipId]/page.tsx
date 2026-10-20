import Link from "next/link";
import { notFound } from "next/navigation";
import {
  UserRound,
  ShieldCheck,
  Link2,
  LockKeyhole,
  ArrowLeft,
  SlidersHorizontal,
} from "lucide-react";
import { requireSession } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { db } from "@/core/db/client";
import { memberAccessRevision } from "@/core/permissions/access-revision";
import { managedAccountRevision } from "@/core/auth/managed-account";
import { effectiveRoleCapabilities } from "@/core/permissions/access-levels";
import { applyCompanyAccessRestrictions } from "@/core/permissions/company-access";
import { AccessEditor } from "@/components/admin/access-editor";
import { RecoveryForm } from "@/components/admin/recovery-form";
import { ActionForm } from "@/components/ui/action-form";
import {
  setUserStatus,
  revokeUserSessions,
  saveUserAccess,
  linkEmployeeProfile,
  saveManagedUserDetails,
  setManagedUserPassword,
} from "../../user-actions";
import { accessGroups } from "../../access-groups";

const panel =
  "rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-7";
const input =
  "mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100";
const button =
  "min-h-11 rounded-xl bg-blue-600 px-5 py-3 text-xs font-semibold text-white";
export default async function UserAdministration({
  params,
  searchParams,
}: {
  params: Promise<{ membershipId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await requireSession();
  assertCapability(session, "core.users.manage");
  const { membershipId } = await params,
    query = await searchParams;
  const tab = ["details", "security"].includes(query.tab ?? "")
    ? query.tab
    : "access";
  const member = await db.membership.findFirst({
    where: { id: membershipId, organisationId: session.organisationId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          authVersion: true,
          platformAdmin: { select: { userId: true } },
          _count: { select: { memberships: true } },
        },
      },
      roles: { include: { role: true } },
    },
  });
  if (!member) notFound();
  const self = member.id === session.membershipId;
  const protectedAccount =
    !!member.user.platformAdmin || member.user._count.memberships !== 1;
  const manageHR = can(session, "people.employee.manage"),
    viewHR = can(session, "people.employee.read");
  const [roles, company, employees] = await Promise.all([
    db.role.findMany({
      where: { organisationId: session.organisationId },
      orderBy: { name: "asc" },
    }),
    db.organisation.findUniqueOrThrow({
      where: { id: session.organisationId },
      select: { restrictedAccessAreas: true },
    }),
    manageHR || viewHR
      ? db.employee.findMany({
          where: {
            organisationId: session.organisationId,
            ...(!manageHR ? { userId: member.userId } : {}),
          },
          select: {
            id: true,
            userId: true,
            firstName: true,
            lastName: true,
            jobTitle: true,
            department: true,
            employeeNumber: true,
          },
          orderBy: { lastName: "asc" },
        })
      : [],
  ]);
  const linked = employees.find((e) => e.userId === member.userId);
  const caps = effectiveRoleCapabilities(
    member.roles.map((r) => r.role),
    member.grantedCapabilities,
    member.deniedCapabilities,
  );
  const effective = applyCompanyAccessRestrictions(
    caps,
    company.restrictedAccessAreas,
  );
  const allCaps = new Set(accessGroups().flatMap((g) => g.capabilities));
  const permitted = applyCompanyAccessRestrictions(
    allCaps,
    company.restrictedAccessAreas,
  );
  const blocked = [...allCaps].filter((cap) => !permitted.has(cap));
  const revision = managedAccountRevision(member);
  const identity = (
    <>
      <input type="hidden" name="membershipId" value={member.id} />
      <input type="hidden" name="accountRevision" value={revision} />
    </>
  );
  return (
    <div className="space-y-5">
      <Link
        href="/settings?tab=users"
        className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-slate-500"
      >
        <ArrowLeft size={15} />
        All users
      </Link>
      <section className="relative overflow-hidden rounded-3xl border border-blue-100 bg-[var(--color-surface)] p-6 sm:p-8">
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-4 sm:flex sm:flex-wrap sm:items-center sm:gap-5">
          <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
            <UserRound size={28} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold tracking-[.17em] text-blue-600">
              Company account
            </p>
            <h2 className="mt-2 break-words text-2xl font-semibold tracking-tight sm:text-3xl">
              {member.user.name}
              {self && <span className="ml-2 text-sm text-slate-400">You</span>}
            </h2>
            <p className="mt-1 break-all text-sm text-slate-500">
              {member.user.email}
            </p>
          </div>
          <span
            className={`col-span-2 justify-self-start rounded-full px-4 py-2 text-xs font-semibold ${member.active ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
          >
            {member.active ? "Active account" : "Suspended"}
          </span>
        </div>
        <div className="mt-6 flex flex-wrap gap-x-7 gap-y-2 border-t border-blue-100/70 pt-5 text-xs text-slate-500">
          <span>{member.roles.length} assigned profiles</span>
          <span>{effective.size} permissions after company restrictions</span>
          <span>
            {member.lastLoginAt
              ? "Last sign-in " + member.lastLoginAt.toLocaleDateString("en-GB")
              : "Not signed in yet"}
          </span>
        </div>
      </section>
      <nav
        aria-label="User administration"
        className="flex gap-2 rounded-2xl border border-slate-100 bg-white p-2"
      >
        {[
          { id: "access", label: "Access permissions", icon: ShieldCheck },
          { id: "details", label: "Account details", icon: UserRound },
          { id: "security", label: "Password & security", icon: LockKeyhole },
        ].map((item) => (
          <Link
            key={item.id}
            href={`/settings/users/${member.id}?tab=${item.id}`}
            aria-current={tab === item.id ? "page" : undefined}
            className={`flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl px-2 py-3 text-center text-xs font-semibold sm:flex-none sm:px-5 ${tab === item.id ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:bg-slate-50"}`}
          >
            <item.icon size={16} className="hidden shrink-0 sm:block" />
            {item.label}
          </Link>
        ))}
      </nav>
      {tab === "access" ? (
        <section className={panel}>
          <div className="mb-6 flex items-center gap-3">
            <SlidersHorizontal size={20} className="text-blue-500" />
            <div>
              <h3 className="font-semibold">Profiles & individual access</h3>
              <p className="mt-1 text-xs text-slate-500">
                Choose their profiles, then refine what this person can see and
                do.
              </p>
            </div>
          </div>
          {can(session, "core.roles.manage") ? (
            <AccessEditor
              key={memberAccessRevision(member, roles)}
              membershipId={member.id}
              accessRevision={memberAccessRevision(member, roles)}
              capabilities={[...caps]}
              groups={accessGroups()}
              roles={roles}
              roleIds={member.roles.map((r) => r.roleId)}
              granted={member.grantedCapabilities}
              denied={member.deniedCapabilities}
              blockedCapabilities={blocked}
              action={saveUserAccess}
              disabled={self}
            />
          ) : (
            <p className="text-sm text-slate-500">
              Access-profile administration permission is needed to edit access.
              Assigned profiles:{" "}
              {member.roles.map((r) => r.role.name).join(", ") || "None"}.
            </p>
          )}
        </section>
      ) : tab === "details" ? (
        <div className="grid items-start gap-5 lg:grid-cols-2">
          <section className={panel}>
            <h3 className="font-semibold">Account details</h3>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Their name appears across Atlas. Email is their sign-in address;
              changing it signs them out and cancels old recovery codes.
            </p>
            {self ? (
              <Link
                href="/profile/settings"
                className="mt-5 inline-block text-sm text-blue-600"
              >
                Edit your personal details →
              </Link>
            ) : protectedAccount ? (
              <p className="mt-5 rounded-xl bg-amber-50 p-4 text-xs leading-5 text-amber-800">
                This is a shared or Atlas staff account. Its owner manages their
                account details and password.
              </p>
            ) : (
              <ActionForm
                key={revision}
                action={saveManagedUserDetails}
                className="mt-6 space-y-4"
              >
                {identity}
                <label className="block text-xs font-semibold">
                  Full name
                  <input
                    className={input}
                    name="name"
                    defaultValue={member.user.name}
                    required
                    maxLength={100}
                  />
                </label>
                <label className="block text-xs font-semibold">
                  Sign-in email
                  <input
                    className={input}
                    name="email"
                    type="email"
                    defaultValue={member.user.email}
                    required
                    maxLength={254}
                  />
                </label>
                <label className="block text-xs font-semibold">
                  Confirm your password
                  <input
                    className={input}
                    name="currentPassword"
                    type="password"
                    required
                    autoComplete="current-password"
                  />
                </label>
                <button className={button}>Save account details</button>
              </ActionForm>
            )}
          </section>
          <section className={panel}>
            <div className="flex items-center gap-2">
              <Link2 size={18} className="text-blue-500" />
              <h3 className="font-semibold">Employee profile</h3>
            </div>
            {linked ? (
              <div className="mt-4">
                <p className="text-sm font-semibold">
                  {linked.firstName} {linked.lastName}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {linked.jobTitle} · {linked.department ?? "No department"}
                </p>
                {viewHR && (
                  <Link
                    href={`/people/${linked.id}`}
                    className="mt-3 inline-block text-xs text-blue-600"
                  >
                    Open employee record →
                  </Link>
                )}
              </div>
            ) : (
              <p className="mt-3 text-xs text-slate-500">
                {manageHR || viewHR
                  ? "No linked employee record."
                  : "Employee details require HR permission."}
              </p>
            )}
            {manageHR && (
              <ActionForm
                action={linkEmployeeProfile}
                className="mt-5 space-y-3"
              >
                <input type="hidden" name="membershipId" value={member.id} />
                <label className="block text-xs font-semibold">
                  Link existing employee
                  <select
                    name="employeeId"
                    defaultValue={linked?.id ?? ""}
                    className={input}
                  >
                    <option value="">No employee link</option>
                    {employees
                      .filter((e) => !e.userId || e.userId === member.userId)
                      .map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.employeeNumber} · {e.firstName} {e.lastName}
                        </option>
                      ))}
                  </select>
                </label>
                <button className={button}>Save employee link</button>
              </ActionForm>
            )}
          </section>
        </div>
      ) : self ? (
        <section className={panel}>
          <h3 className="font-semibold">Your account security</h3>
          <Link
            href="/profile/settings"
            className="mt-4 inline-block text-sm text-blue-600"
          >
            Manage your password & sessions →
          </Link>
        </section>
      ) : (
        <div className="grid items-start gap-5 lg:grid-cols-2">
          <section className={panel}>
            <div className="flex items-center gap-2">
              <LockKeyhole size={19} className="text-blue-500" />
              <h3 className="font-semibold">Set a password</h3>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Assign a new password and share it privately with this person.
              Previous sessions and recovery codes stop working. They can change
              it in Personal settings.
            </p>
            {protectedAccount ? (
              <p className="mt-5 rounded-xl bg-amber-50 p-4 text-xs text-amber-800">
                The owner manages credentials for shared and Atlas staff
                accounts.
              </p>
            ) : !member.active ? (
              <p className="mt-5 text-xs text-slate-500">
                Restore access before assigning a password or issuing recovery.
              </p>
            ) : (
              <ActionForm
                action={setManagedUserPassword}
                className="mt-6 space-y-4"
              >
                {identity}
                <label className="block text-xs font-semibold">
                  New user password
                  <input
                    className={input}
                    name="password"
                    type="password"
                    required
                    minLength={12}
                    maxLength={128}
                    autoComplete="new-password"
                  />
                </label>
                <label className="block text-xs font-semibold">
                  Confirm user password
                  <input
                    className={input}
                    name="confirmPassword"
                    type="password"
                    required
                    minLength={12}
                    maxLength={128}
                    autoComplete="new-password"
                  />
                </label>
                <p className="text-xs text-slate-500">
                  At least 12 characters, up to 72 UTF-8 bytes. Passwords are
                  never shown again or recorded in the audit log.
                </p>
                <label className="block text-xs font-semibold">
                  Confirm your password
                  <input
                    className={input}
                    name="currentPassword"
                    type="password"
                    required
                    autoComplete="current-password"
                  />
                </label>
                <button className={button}>Set user password</button>
              </ActionForm>
            )}
          </section>
          <div className="space-y-5">
            {member.active && !protectedAccount && (
              <section className={panel}>
                <h3 className="font-semibold">
                  Let the user reset their password
                </h3>
                <div className="mt-4">
                  <RecoveryForm membershipId={member.id} />
                </div>
              </section>
            )}
            <section className={panel}>
              <h3 className="font-semibold">Sign-in & sessions</h3>
              <div className="mt-5 space-y-5">
                <ActionForm action={setUserStatus} className="space-y-3">
                  <input type="hidden" name="membershipId" value={member.id} />
                  <input
                    type="hidden"
                    name="status"
                    value={member.active ? "SUSPENDED" : "ACTIVE"}
                  />
                  <p className="text-xs leading-5 text-slate-500">
                    {member.active
                      ? "Suspend this person's company access on every device. Their records stay in Atlas."
                      : "Restore company sign-in with their assigned permissions."}
                  </p>
                  <button className="min-h-11 rounded-xl bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">
                    {member.active ? "Suspend access" : "Restore access"}
                  </button>
                </ActionForm>
                <ActionForm action={revokeUserSessions} className="space-y-3">
                  <input type="hidden" name="membershipId" value={member.id} />
                  <p className="text-xs text-slate-500">
                    Require a fresh sign-in on their company devices.
                  </p>
                  <button className="min-h-11 rounded-xl border border-slate-200 px-4 py-3 text-xs font-semibold text-slate-600">
                    Revoke company sessions
                  </button>
                </ActionForm>
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
