import Link from "next/link";
import { ActionForm } from "@/components/ui/action-form";
import { requireSession } from "@/core/auth/session";
import { Avatar } from "@/components/ui/avatar";
import { saveProfile } from "./actions";
import { Button } from "@/components/ui/button";
import { db } from "@/core/db/client";
import { getEnabledModuleIds } from "@/core/modules/runtime";
import { calculateBradfordFactor } from "@/modules/people/domain/bradford-factor";

export default async function ProfilePage() {
 const session = await requireSession();
 const enabledModules = await getEnabledModuleIds(session.organisationId);
 const employee = enabledModules.has("people")
  ? await db.employee.findFirst({
     where: { organisationId: session.organisationId, userId: session.userId },
     include: { manager: { select: { id: true, firstName: true, lastName: true } }, absences: { where: { type: "SICKNESS" }, select: { startDate: true, endDate: true } } },
    })
  : null;
 const bradford = employee ? calculateBradfordFactor(employee.absences) : null;

 return <div className="mx-auto max-w-2xl space-y-7"><div><h1 className="text-3xl font-semibold tracking-tight">Your profile</h1><p className="mt-2 text-sm text-[var(--color-ink-muted)]">Your account in {session.organisationName}.</p></div><ActionForm action={saveProfile} className="space-y-6 rounded-2xl border border-[var(--color-border)] bg-white p-7"><Avatar name={session.userName}/><label className="block text-sm font-medium">Full name<input required name="name" maxLength={100} defaultValue={session.userName} className="mt-2 block w-full border border-[var(--color-border)] p-3"/></label><div><p className="text-sm font-medium">Email</p><p className="mt-2 text-sm text-[var(--color-ink-muted)]">{session.userEmail}</p></div><Button type="submit" variant="primary">Save profile</Button></ActionForm>
 {employee && <div className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-white p-7">
  <h2 className="text-sm font-semibold">Your HR record</h2>
  <p className="text-sm text-[var(--color-ink-muted)]">{employee.jobTitle}{employee.department ? ` · ${employee.department}` : ""}</p>
  {employee.manager && <p className="text-sm text-[var(--color-ink-muted)]">Reports to {employee.manager.firstName} {employee.manager.lastName}</p>}
  <p className="text-sm text-[var(--color-ink-muted)]">{employee.annualLeaveDaysEntitlement} days annual leave entitlement.</p>
  {bradford && bradford.episodes > 0 && <p className="text-sm text-[var(--color-ink-muted)]">{bradford.episodes} sickness episode{bradford.episodes===1?"":"s"} in the last 12 months.</p>}
  <Link href={`/people/${employee.id}`} className="inline-block text-sm text-[var(--color-atlas-blue)]">View full HR record →</Link>
 </div>}
 </div>;
}
