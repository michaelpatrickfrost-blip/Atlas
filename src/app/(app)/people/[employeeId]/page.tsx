import Link from "next/link";
import { assertModuleEnabled } from "@/core/modules/access";
import { assuranceState } from "@/modules/people/domain/platform";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { StatusPill, type StatusTone } from "@/components/ui/status-pill";
import { requireSession } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { HR_CAPABILITIES, PAYROLL_CAPABILITIES } from "@/core/permissions/capabilities";
import { db } from "@/core/db/client";
import { calculateBradfordFactor } from "@/modules/people/domain/bradford-factor";
import { calculateLeaveBalance, currentLeaveYearRange } from "@/modules/people/domain/leave-balance";
import { PersonGoals } from "@/modules/kpis/components/person-goals";
import { PersonSchedule } from "@/modules/scheduling/components/person-schedule";
import { getPersonSchedule } from "@/app/(app)/scheduling/actions";
import { getEnabledModuleIds } from "@/core/modules/runtime";
import { updateEmployeeContact, updateEmployeeTask, changeEmployeeStatus, updateEmployeeProfile, completeEmployeeTask, addEmployeeTask, linkEmployeeToUser, addEmployeeDocument } from "../actions";

const STATUS_TONE: Record<string, StatusTone> = { ONBOARDING: "warning", ACTIVE: "success", ON_LEAVE: "neutral", OFFBOARDING: "warning", LEFT: "danger" };
const BAND_TONE: Record<string, StatusTone> = { none: "success", watch: "warning", concern: "warning", serious: "danger" };

function formatMoney(minorUnits: number | null, currency: string) {
  if (minorUnits == null) return "—";
  return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(minorUnits / 100);
}

export default async function EmployeeRecordPage({ params }: { params: Promise<{ employeeId: string }> }) {
  const { employeeId } = await params;
  const session = await requireSession();
  assertCapability(session, HR_CAPABILITIES.employeeRead);
  await assertModuleEnabled(session, "people");
  const manage = can(session, HR_CAPABILITIES.employeeManage);
  const canAbsence = can(session, HR_CAPABILITIES.absenceRead);
  const managePayroll = can(session, PAYROLL_CAPABILITIES.employeeManage);
  const manageOnboarding = can(session, HR_CAPABILITIES.onboardingManage);
  const manageOffboarding = can(session, HR_CAPABILITIES.offboardingManage);
  const canPayroll = can(session, PAYROLL_CAPABILITIES.runRead) || can(session, PAYROLL_CAPABILITIES.payslipSelf);

  const employee = await db.employee.findFirstOrThrow({
    where: { id: employeeId, organisationId: session.organisationId },
    include: {
      manager: { select: { id: true, firstName: true, lastName: true } },
      reports: { select: { id: true, firstName: true, lastName: true } },
      onboardingTasks: { orderBy: { createdAt: "asc" } },
      appraisals: { where: can(session, HR_CAPABILITIES.appraisalRead) ? {} : { id: "__denied__" }, orderBy: { scheduledAt: "desc" }, take: 10 },
      oneToOnes: { where: can(session, HR_CAPABILITIES.oneToOneRead) ? {} : { id: "__denied__" }, orderBy: { scheduledAt: "desc" }, take: 10 },
      absences: { where: canAbsence ? {} : { id: "__denied__" }, orderBy: { startDate: "desc" } },
      shifts: { where: { startsAt: { gte: new Date() }, status: { not: "CANCELLED" }, ...(can(session, HR_CAPABILITIES.rotaRead) ? {} : { id: "__denied__" }) }, orderBy: { startsAt: "asc" }, take: 10 },
      payslips: { where: canPayroll ? {} : { id: "__denied__" }, orderBy: { createdAt: "desc" }, take: 6, include: { payrollRun: { select: { periodLabel: true } } } },
      history: { orderBy: { occurredAt: "desc" }, take: 20 },
      documents: { orderBy: { createdAt: "desc" } },
      expenseClaims: { where: can(session, HR_CAPABILITIES.expenseRead) ? {} : { id: "__denied__" }, orderBy: { createdAt: "desc" }, take: 10 },
    },
  });

  const managers = manage
    ? await db.employee.findMany({ where: { organisationId: session.organisationId, status: { not: "LEFT" }, id: { not: employeeId } }, select: { id: true, firstName: true, lastName: true } })
    : [];

  let linkableMembers: Array<{ userId: string; user: { name: string; email: string } }> = [];
  if (manage) {
    const [members, linked] = await Promise.all([
      db.membership.findMany({ where: { organisationId: session.organisationId }, include: { user: { select: { name: true, email: true } } } }),
      db.employee.findMany({ where: { organisationId: session.organisationId, userId: { not: null } }, select: { userId: true } }),
    ]);
    const linkedIds = new Set(linked.map((e) => e.userId));
    linkableMembers = members.filter((m) => !linkedIds.has(m.userId) || m.userId === employee.userId);
  }

  const taskOwners = manageOnboarding || manageOffboarding ? await db.membership.findMany({ where: { organisationId: session.organisationId }, select: { userId: true, user: { select: { name: true } } } }) : [];

  const onboarding = employee.onboardingTasks.filter((t) => t.phase === "ONBOARDING");
  const offboarding = employee.onboardingTasks.filter((t) => t.phase === "OFFBOARDING");
  const bradford = calculateBradfordFactor(employee.absences.filter((a) => a.type === "SICKNESS" && a.status === "APPROVED"));
  const leaveYear = currentLeaveYearRange();
  const schedulingOn = (await getEnabledModuleIds(session.organisationId)).has("scheduling");
  const schedule = schedulingOn ? await getPersonSchedule(employee.id) : [];
  const leaveBalance = calculateLeaveBalance({
    entitlementDays: employee.annualLeaveDaysEntitlement,
    workingDays: employee.workingDays,
    approvedHolidays: employee.absences.filter((a) => a.type === "HOLIDAY" && a.status === "APPROVED" && a.startDate >= leaveYear.start && a.startDate <= leaveYear.end),
  });

  return (
    <div className="min-w-0 space-y-6 break-words">
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-[var(--color-border)] bg-white p-6">
        <div>
          <p className="text-xs text-[var(--color-ink-faint)]">{employee.employeeNumber}</p>
          <h2 className="text-xl font-semibold">{employee.firstName} {employee.lastName}</h2>
          <p className="text-sm text-[var(--color-ink-muted)]">{employee.jobTitle}{employee.department ? ` · ${employee.department}` : ""}</p>
          <p className="mt-1 text-xs text-[var(--color-ink-muted)]">{employee.email}{employee.phone ? ` · ${employee.phone}` : ""}</p>
          {employee.manager && <p className="mt-1 text-xs text-[var(--color-ink-muted)]">Reports to <Link href={`/people/${employee.manager.id}`} className="text-[var(--color-atlas-blue)]">{employee.manager.firstName} {employee.manager.lastName}</Link></p>}
          {(can(session, HR_CAPABILITIES.conductRead) || can(session, HR_CAPABILITIES.conductManage)) && <Link href={`/people/conduct?employeeId=${employee.id}`} className="mt-2 inline-block text-xs text-[var(--color-atlas-blue)]">Performance plans and disciplinary cases →</Link>}
          <p className="mt-1 text-xs text-[var(--color-ink-muted)]">{employee.userId ? "Linked to an Atlas login" : "No Atlas login linked"}</p>
          {employee.skills.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {employee.skills.map((skill) => <span key={skill} className="rounded-full bg-[var(--color-surface-sunken)] px-2.5 py-0.5 text-xs text-[var(--color-ink-muted)]">{skill}</span>)}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusPill label={employee.status.replaceAll("_", " ")} tone={STATUS_TONE[employee.status] ?? "neutral"} />
          {manage && (
            <ActionForm action={changeEmployeeStatus.bind(null, employee.id)} className="flex flex-wrap gap-2">
              <select name="status" defaultValue={employee.status} className="border border-[var(--color-border)] bg-white px-3 py-2 text-xs">
                {["ONBOARDING", "ACTIVE", "ON_LEAVE", "OFFBOARDING", "LEFT"].map((s) => <option key={s} value={s}>{s.replaceAll("_", " ")}</option>)}
              </select>
              <label className="text-xs">Leaving date<input type="date" name="endDate" defaultValue={employee.endDate?.toISOString().slice(0,10) ?? ""} className="ml-2 border border-[var(--color-border)] p-2" /></label>
              <label className="text-xs">Leaving reason<input name="leaveReason" maxLength={1000} defaultValue={employee.leaveReason ?? ""} className="ml-2 border border-[var(--color-border)] p-2" /></label>
              <Button type="submit">Save status</Button>
            </ActionForm>
          )}
        </div>
      </div>

      <PersonGoals employeeId={employee.id} personLabel={`${employee.firstName} ${employee.lastName}`} />

      {manage && (
        <section className="rounded-2xl border border-[var(--color-border)] bg-white p-6">
          <Link href={`/people/my-team/${employee.id}`} className="mb-4 inline-block text-sm text-[var(--color-atlas-blue)]">Private HR notes &amp; working pattern →</Link><h3 className="text-sm font-semibold">Contact details &amp; leave entitlement</h3><ActionForm action={updateEmployeeContact.bind(null, employee.id)} className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-sm">First name<input type="text" name="firstName" defaultValue={employee.firstName ?? ""} maxLength={100} required className="mt-2 w-full rounded-lg border border-[var(--color-border)] p-3" /></label><label className="text-sm">Last name<input type="text" name="lastName" defaultValue={employee.lastName ?? ""} maxLength={100} required className="mt-2 w-full rounded-lg border border-[var(--color-border)] p-3" /></label><label className="text-sm">Preferred name<input type="text" name="preferredName" defaultValue={employee.preferredName ?? ""} maxLength={100} className="mt-2 w-full rounded-lg border border-[var(--color-border)] p-3" /></label><label className="text-sm">Email<input type="email" name="email" defaultValue={employee.email ?? ""} maxLength={200} required className="mt-2 w-full rounded-lg border border-[var(--color-border)] p-3" /></label><label className="text-sm">Phone<input type="tel" name="phone" defaultValue={employee.phone ?? ""} maxLength={50} className="mt-2 w-full rounded-lg border border-[var(--color-border)] p-3" /></label><label className="text-sm">Home address<input type="text" name="address" defaultValue={employee.address ?? ""} maxLength={500} className="mt-2 w-full rounded-lg border border-[var(--color-border)] p-3" /></label><label className="text-sm">Emergency contact name<input type="text" name="emergencyContactName" defaultValue={employee.emergencyContactName ?? ""} maxLength={150} className="mt-2 w-full rounded-lg border border-[var(--color-border)] p-3" /></label><label className="text-sm">Emergency contact phone<input type="tel" name="emergencyContactPhone" defaultValue={employee.emergencyContactPhone ?? ""} maxLength={50} className="mt-2 w-full rounded-lg border border-[var(--color-border)] p-3" /></label><label className="text-sm">Annual leave entitlement (days)<input type="number" name="annualLeaveDaysEntitlement" defaultValue={employee.annualLeaveDaysEntitlement} min="0" max="366" required className="mt-2 w-full rounded-lg border border-[var(--color-border)] p-3" /></label><Button type="submit" variant="primary" className="justify-self-start sm:col-span-2">Save contact details</Button></ActionForm><h3 className="mt-6 border-t border-[var(--color-border)] pt-5 text-sm font-semibold">Employment &amp; review schedule</h3>
          <ActionForm action={updateEmployeeProfile.bind(null, employee.id)} className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-sm">Job title<input name="jobTitle" defaultValue={employee.jobTitle} required maxLength={150} className="mt-2 w-full border border-[var(--color-border)] p-3" /></label>
            <label className="text-sm">Department<input name="department" defaultValue={employee.department ?? ""} maxLength={150} className="mt-2 w-full border border-[var(--color-border)] p-3" /></label>
            <label className="text-sm">Manager
              <select name="managerId" defaultValue={employee.managerId ?? ""} className="mt-2 w-full border border-[var(--color-border)] bg-white p-3">
                <option value="">No manager</option>
                {managers.map((m) => <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>)}
              </select>
            </label>
            {managePayroll && <label className="text-sm">Annual salary (£)<input type="number" step="0.01" min="0" name="annualSalary" defaultValue={employee.annualSalaryMinorUnits ? employee.annualSalaryMinorUnits / 100 : ""} className="mt-2 w-full border border-[var(--color-border)] p-3" /></label>}
            <label className="text-sm sm:col-span-2">Skills<input name="skills" defaultValue={employee.skills.join(", ")} placeholder="Comma-separated, e.g. Forklift licence, First aid" className="mt-2 w-full border border-[var(--color-border)] p-3" /></label>
            <label className="text-sm">Appraisal cadence override (months)<input type="number" min="1" name="appraisalCadenceMonths" defaultValue={employee.appraisalCadenceMonths ?? ""} placeholder="Org default" className="mt-2 w-full border border-[var(--color-border)] p-3" /></label>
            <label className="text-sm">One-to-one cadence override (weeks)<input type="number" min="1" name="oneToOneCadenceWeeks" defaultValue={employee.oneToOneCadenceWeeks ?? ""} placeholder="Org default" className="mt-2 w-full border border-[var(--color-border)] p-3" /></label>
            <label className="text-sm">Contracted weekly hours<input type="number" min="1" step="0.5" name="contractedWeeklyHours" defaultValue={employee.contractedWeeklyHours ?? ""} placeholder={`Org default (${employee.employmentType.replaceAll("_", " ")})`} className="mt-2 w-full border border-[var(--color-border)] p-3" /></label>
            <Button type="submit" variant="primary" className="justify-self-start sm:col-span-2">Save profile</Button>
          </ActionForm>
          <ActionForm action={linkEmployeeToUser.bind(null, employee.id)} className="mt-4 flex items-end gap-3 border-t border-[var(--color-border)] pt-4">
            <label className="flex-1 text-sm">Linked Atlas login
              <select name="userId" defaultValue={employee.userId ?? ""} className="mt-2 w-full border border-[var(--color-border)] bg-white p-3">
                <option value="">No login link</option>
                {linkableMembers.map((m) => <option key={m.userId} value={m.userId}>{m.user.name} ({m.user.email})</option>)}
              </select>
            </label>
            <Button type="submit">Save link</Button>
          </ActionForm>
        </section>
      )}

      <section className="flex flex-wrap gap-3 rounded-2xl border border-[var(--color-border)] bg-white p-4 text-sm"><Link className="text-[var(--color-atlas-blue)]" href={`/people/training?employeeId=${employee.id}`}>Training &amp; qualifications →</Link><Link className="text-[var(--color-atlas-blue)]" href={`/people/documents?employeeId=${employee.id}`}>Document register &amp; renewals →</Link></section>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-white p-6">
          <h3 className="text-sm font-semibold">Onboarding checklist</h3>
          {onboarding.length === 0 ? <p className="text-sm text-[var(--color-ink-muted)]">No onboarding tasks.</p> : (
            <ul className="space-y-2">
              {onboarding.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 text-sm">
                  <div className="flex-1"><span className={t.completedAt ? "text-[var(--color-ink-faint)] line-through" : ""}>{t.title}</span><p className="mt-1 text-xs text-[var(--color-ink-muted)]">{t.dueDate ? `Due ${t.dueDate.toLocaleDateString("en-GB")}` : "No deadline"}</p>
                  {manageOnboarding && !t.completedAt && <details className="mt-2"><summary className="cursor-pointer text-xs text-[var(--color-atlas-blue)]">Assign &amp; edit task</summary><ActionForm action={updateEmployeeTask.bind(null, t.id)} className="mt-2 grid gap-2"><label className="text-xs">Deadline<input type="date" name="dueDate" defaultValue={t.dueDate?.toISOString().slice(0,10) ?? ""} className="mt-1 w-full border border-[var(--color-border)] p-2" /></label><label className="text-xs">Owner<select name="assignedToUserId" defaultValue={t.assignedToUserId ?? ""} className="mt-1 w-full border border-[var(--color-border)] bg-white p-2"><option value="">Unassigned</option>{taskOwners.map(m => <option key={m.userId} value={m.userId}>{m.user.name}</option>)}</select></label><label className="text-xs">Notes<textarea name="notes" maxLength={2000} defaultValue={t.notes ?? ""} className="mt-1 w-full border border-[var(--color-border)] p-2" /></label><Button type="submit">Save task</Button></ActionForm></details>}</div>
                  {!t.completedAt && manageOnboarding && <form action={completeEmployeeTask.bind(null, t.id)}><Button type="submit" className="text-xs">Done</Button></form>}
                </li>
              ))}
            </ul>
          )}
          {manageOnboarding && employee.status !== "LEFT" && (
            <ActionForm action={addEmployeeTask.bind(null, employee.id, "ONBOARDING")} className="grid gap-2 pt-2">
              <input name="title" placeholder="Add a task" required maxLength={300} className="flex-1 border border-[var(--color-border)] p-2 text-sm" />
              <label className="text-xs">Deadline<input type="date" name="dueDate" className="ml-2 border border-[var(--color-border)] p-2" /></label><label className="text-xs">Category<input name="category" maxLength={100} className="ml-2 border border-[var(--color-border)] p-2" /></label><Button type="submit">Add</Button>
            </ActionForm>
          )}
        </section>

        <section className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-white p-6">
          <h3 className="text-sm font-semibold">Offboarding checklist</h3>
          {offboarding.length === 0 ? <p className="text-sm text-[var(--color-ink-muted)]">Not offboarding.</p> : (
            <ul className="space-y-2">
              {offboarding.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 text-sm">
                  <div className="flex-1"><span className={t.completedAt ? "text-[var(--color-ink-faint)] line-through" : ""}>{t.title}</span><p className="mt-1 text-xs text-[var(--color-ink-muted)]">{t.dueDate ? `Due ${t.dueDate.toLocaleDateString("en-GB")}` : "No deadline"}</p>
                  {manageOffboarding && !t.completedAt && <details className="mt-2"><summary className="cursor-pointer text-xs text-[var(--color-atlas-blue)]">Assign &amp; edit task</summary><ActionForm action={updateEmployeeTask.bind(null, t.id)} className="mt-2 grid gap-2"><label className="text-xs">Deadline<input type="date" name="dueDate" defaultValue={t.dueDate?.toISOString().slice(0,10) ?? ""} className="mt-1 w-full border border-[var(--color-border)] p-2" /></label><label className="text-xs">Owner<select name="assignedToUserId" defaultValue={t.assignedToUserId ?? ""} className="mt-1 w-full border border-[var(--color-border)] bg-white p-2"><option value="">Unassigned</option>{taskOwners.map(m => <option key={m.userId} value={m.userId}>{m.user.name}</option>)}</select></label><label className="text-xs">Notes<textarea name="notes" maxLength={2000} defaultValue={t.notes ?? ""} className="mt-1 w-full border border-[var(--color-border)] p-2" /></label><Button type="submit">Save task</Button></ActionForm></details>}</div>
                  {!t.completedAt && manageOffboarding && <form action={completeEmployeeTask.bind(null, t.id)}><Button type="submit" className="text-xs">Done</Button></form>}
                </li>
              ))}
            </ul>
          )}
          {manageOffboarding && (employee.status === "OFFBOARDING") && (
            <ActionForm action={addEmployeeTask.bind(null, employee.id, "OFFBOARDING")} className="grid gap-2 pt-2">
              <input name="title" placeholder="Add a task" required maxLength={300} className="flex-1 border border-[var(--color-border)] p-2 text-sm" />
              <label className="text-xs">Deadline<input type="date" name="dueDate" className="ml-2 border border-[var(--color-border)] p-2" /></label><label className="text-xs">Category<input name="category" maxLength={100} className="ml-2 border border-[var(--color-border)] p-2" /></label><Button type="submit">Add</Button>
            </ActionForm>
          )}
        </section>

        <section className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-white p-6">
          <div className="flex items-center justify-between"><h3 className="text-sm font-semibold">Appraisals</h3><Link href={`/people/appraisals?employeeId=${employee.id}`} className="text-xs text-[var(--color-atlas-blue)]">Schedule →</Link></div>
          {employee.appraisals.length === 0 ? <p className="text-sm text-[var(--color-ink-muted)]">No appraisals recorded.</p> : (
            <ul className="space-y-2 text-sm">
              {employee.appraisals.map((a) => <li key={a.id} className="flex items-center justify-between"><span>{a.cycle}</span><StatusPill label={a.status} tone={a.status === "COMPLETED" ? "success" : "neutral"} /></li>)}
            </ul>
          )}
        </section>

        <section className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-white p-6">
          <div className="flex items-center justify-between"><h3 className="text-sm font-semibold">One-to-ones</h3><Link href={`/people/one-to-ones?employeeId=${employee.id}`} className="text-xs text-[var(--color-atlas-blue)]">Schedule →</Link></div>
          {employee.oneToOnes.length === 0 ? <p className="text-sm text-[var(--color-ink-muted)]">No one-to-ones recorded.</p> : (
            <ul className="space-y-2 text-sm">
              {employee.oneToOnes.map((o) => <li key={o.id} className="flex items-center justify-between"><span>{o.scheduledAt.toLocaleDateString("en-GB")}</span><StatusPill label={o.status} tone={o.status === "COMPLETED" ? "success" : "neutral"} /></li>)}
            </ul>
          )}
        </section>

        {canAbsence && (
          <section className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-white p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Absence &amp; Bradford Factor</h3>
              <Link href={`/people/absence?employeeId=${employee.id}`} className="text-xs text-[var(--color-atlas-blue)]">Log absence →</Link>
            </div>
            <div className="flex items-center gap-3">
              <StatusPill label={`Score ${bradford.score}`} tone={BAND_TONE[bradford.band]} />
              <p className="text-xs text-[var(--color-ink-muted)]">{bradford.episodes} episode{bradford.episodes === 1 ? "" : "s"}, {bradford.days} day{bradford.days === 1 ? "" : "s"} sickness in the last 12 months.</p>
            </div>
            <p className="text-sm"><span className={leaveBalance.remaining < 0 ? "font-semibold text-[var(--color-status-danger)]" : "font-semibold"}>{leaveBalance.remaining}</span> <span className="text-[var(--color-ink-muted)]">of {leaveBalance.entitlement} leave days left in {leaveYear.start.getFullYear()}</span></p>
            {employee.absences.length > 0 && (
              <ul className="space-y-1 text-sm">
                {employee.absences.slice(0, 5).map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-2">
                    <span>{a.type.replaceAll("_", " ")}</span>
                    <span className="flex items-center gap-2 text-[var(--color-ink-muted)]">
                      {a.startDate.toLocaleDateString("en-GB")} – {a.endDate.toLocaleDateString("en-GB")}
                      {a.status !== "APPROVED" && <StatusPill label={a.status} tone={a.status === "PENDING" ? "warning" : "danger"} />}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {schedulingOn ? <PersonSchedule shifts={schedule} heading={`${employee.firstName}'s schedule`} /> : <section className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-white p-6">
          <div className="flex items-center justify-between"><h3 className="text-sm font-semibold">Upcoming shifts</h3><Link href={`/people/rotas?employeeId=${employee.id}`} className="text-xs text-[var(--color-atlas-blue)]">Rota →</Link></div>
          {employee.shifts.length === 0 ? <p className="text-sm text-[var(--color-ink-muted)]">No shifts scheduled.</p> : (
            <ul className="space-y-1 text-sm">
              {employee.shifts.map((s) => <li key={s.id} className="flex justify-between"><span>{s.startsAt.toLocaleString("en-GB")}</span><span className="text-[var(--color-ink-muted)]">{s.role ?? s.location ?? ""}</span></li>)}
            </ul>
          )}
        </section>}

        {canPayroll && (
          <section className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-white p-6">
            <div className="flex items-center justify-between"><h3 className="text-sm font-semibold">Recent payslips</h3><Link href="/payroll" className="text-xs text-[var(--color-atlas-blue)]">Payroll →</Link></div>
            {employee.payslips.length === 0 ? <p className="text-sm text-[var(--color-ink-muted)]">No payslips yet.</p> : (
              <ul className="space-y-1 text-sm">
                {employee.payslips.map((p) => <li key={p.id} className="flex justify-between"><span>{p.payrollRun.periodLabel}</span><span className="font-medium">{formatMoney(p.netMinorUnits, p.currency)}</span></li>)}
              </ul>
            )}
          </section>
        )}

        {canPayroll && (
          <section className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-white p-6">
            <div className="flex items-center justify-between"><h3 className="text-sm font-semibold">Expense claims</h3><Link href="/people/expenses" className="text-xs text-[var(--color-atlas-blue)]">Expenses →</Link></div>
            {employee.expenseClaims.length === 0 ? <p className="text-sm text-[var(--color-ink-muted)]">No expense claims yet.</p> : (
              <ul className="space-y-1 text-sm">
                {employee.expenseClaims.map((c) => (
                  <li key={c.id} className="flex items-center justify-between">
                    <span>{c.category} — {formatMoney(c.amountMinorUnits, c.currency)}</span>
                    <StatusPill label={c.status} tone={c.status === "APPROVED" ? "success" : c.status === "REJECTED" ? "danger" : "warning"} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>

      {employee.status === "LEFT" && (
        <section className="space-y-2 rounded-2xl border border-[var(--color-border)] bg-white p-6">
          <h3 className="text-sm font-semibold">Leaver summary</h3>
          <p className="text-xs text-[var(--color-ink-muted)]">Not a statutory P45 — export these figures to your payroll/tax provider to issue official leaver paperwork.</p>
          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div><dt className="text-xs text-[var(--color-ink-faint)]">Start date</dt><dd>{employee.startDate.toLocaleDateString("en-GB")}</dd></div>
            <div><dt className="text-xs text-[var(--color-ink-faint)]">Leaving date</dt><dd>{employee.endDate ? employee.endDate.toLocaleDateString("en-GB") : "—"}</dd></div>
            <div><dt className="text-xs text-[var(--color-ink-faint)]">Last payslip</dt><dd>{canPayroll ? (employee.payslips[0] ? formatMoney(employee.payslips[0].netMinorUnits, employee.payslips[0].currency) : "—") : "Hidden"}</dd></div>
            <div><dt className="text-xs text-[var(--color-ink-faint)]">Annual leave entitlement</dt><dd>{employee.annualLeaveDaysEntitlement} days</dd></div>
          </dl>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-white p-6">
          <h3 className="text-sm font-semibold">History</h3>
          {employee.history.length === 0 ? <p className="text-sm text-[var(--color-ink-muted)]">No history yet.</p> : (
            <ol className="space-y-3 border-l border-[var(--color-border)] pl-4">
              {employee.history.map((h) => (
                <li key={h.id} className="relative text-sm">
                  <span className="absolute -left-[1.1rem] top-1 size-2 rounded-full bg-[var(--color-atlas-blue)]" />
                  <p>{h.description}</p>
                  <p className="text-xs text-[var(--color-ink-faint)]">{h.occurredAt.toLocaleString("en-GB")}</p>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-white p-6">
          <h3 className="text-sm font-semibold">Documents</h3>
          {employee.documents.length === 0 ? <p className="text-sm text-[var(--color-ink-muted)]">No documents linked.</p> : (
            <ul className="space-y-2 text-sm">
              {employee.documents.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3">
                  {d.url ? <a href={d.url} target="_blank" rel="noreferrer" className="text-[var(--color-atlas-blue)]">{d.title}</a> : <span>{d.title}</span>}
                  {<span className="ml-2 text-xs text-[var(--color-ink-muted)]">{assuranceState(d)}</span>}{d.category && <span className="text-xs text-[var(--color-ink-faint)]">{d.category}</span>}
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-[var(--color-ink-faint)]">Document references use your approved storage. Manage issue dates, renewals and archive status in the document register.</p>
          {manage && (
            <ActionForm action={addEmployeeDocument.bind(null, employee.id)} className="grid gap-2 border-t border-[var(--color-border)] pt-3 sm:grid-cols-2">
              <input name="title" placeholder="Document title" required maxLength={200} className="border border-[var(--color-border)] p-2 text-sm sm:col-span-2" />
              <input name="url" placeholder="Link (optional)" className="border border-[var(--color-border)] p-2 text-sm" />
              <input name="category" placeholder="Category (optional)" className="border border-[var(--color-border)] p-2 text-sm" />
              <Button type="submit" className="justify-self-start sm:col-span-2">Add document</Button>
            </ActionForm>
          )}
        </section>
      </div>

      {employee.reports.length > 0 && (
        <section className="rounded-2xl border border-[var(--color-border)] bg-white p-6">
          <h3 className="text-sm font-semibold">Direct reports</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {employee.reports.map((r) => <Link key={r.id} href={`/people/${r.id}`} className="rounded-full border border-[var(--color-border)] px-3 py-1 text-xs text-[var(--color-atlas-blue)]">{r.firstName} {r.lastName}</Link>)}
          </div>
        </section>
      )}
    </div>
  );
}
