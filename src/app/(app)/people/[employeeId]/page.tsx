import Link from "next/link";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { StatusPill, type StatusTone } from "@/components/ui/status-pill";
import { requireSession } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { HR_CAPABILITIES } from "@/core/permissions/capabilities";
import { db } from "@/core/db/client";
import { calculateBradfordFactor } from "@/modules/people/domain/bradford-factor";
import { changeEmployeeStatus, updateEmployeeProfile, completeEmployeeTask, addEmployeeTask, linkEmployeeToUser } from "../actions";

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
  const manage = can(session, HR_CAPABILITIES.employeeManage);
  const canAbsence = can(session, HR_CAPABILITIES.absenceRead);
  const canPayroll = can(session, HR_CAPABILITIES.payrollRead);

  const employee = await db.employee.findFirstOrThrow({
    where: { id: employeeId, organisationId: session.organisationId },
    include: {
      manager: { select: { id: true, firstName: true, lastName: true } },
      reports: { select: { id: true, firstName: true, lastName: true } },
      onboardingTasks: { orderBy: { createdAt: "asc" } },
      appraisals: { orderBy: { scheduledAt: "desc" }, take: 10 },
      oneToOnes: { orderBy: { scheduledAt: "desc" }, take: 10 },
      absences: { orderBy: { startDate: "desc" }, take: 20 },
      shifts: { where: { startsAt: { gte: new Date() } }, orderBy: { startsAt: "asc" }, take: 10 },
      payslips: { orderBy: { createdAt: "desc" }, take: 6, include: { payrollRun: { select: { periodLabel: true } } } },
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

  const onboarding = employee.onboardingTasks.filter((t) => t.phase === "ONBOARDING");
  const offboarding = employee.onboardingTasks.filter((t) => t.phase === "OFFBOARDING");
  const bradford = calculateBradfordFactor(employee.absences.filter((a) => a.type === "SICKNESS"));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-[var(--color-border)] bg-white p-6">
        <div>
          <p className="text-xs text-[var(--color-ink-faint)]">{employee.employeeNumber}</p>
          <h2 className="text-xl font-semibold">{employee.firstName} {employee.lastName}</h2>
          <p className="text-sm text-[var(--color-ink-muted)]">{employee.jobTitle}{employee.department ? ` · ${employee.department}` : ""}</p>
          <p className="mt-1 text-xs text-[var(--color-ink-muted)]">{employee.email}{employee.phone ? ` · ${employee.phone}` : ""}</p>
          {employee.manager && <p className="mt-1 text-xs text-[var(--color-ink-muted)]">Reports to <Link href={`/people/${employee.manager.id}`} className="text-[var(--color-atlas-blue)]">{employee.manager.firstName} {employee.manager.lastName}</Link></p>}
          <p className="mt-1 text-xs text-[var(--color-ink-muted)]">{employee.userId ? "Linked to an Atlas login" : "No Atlas login linked"}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusPill label={employee.status.replaceAll("_", " ")} tone={STATUS_TONE[employee.status] ?? "neutral"} />
          {manage && (
            <ActionForm action={changeEmployeeStatus.bind(null, employee.id)} className="flex gap-2">
              <select name="status" defaultValue={employee.status} className="border border-[var(--color-border)] bg-white px-3 py-2 text-xs">
                {["ONBOARDING", "ACTIVE", "ON_LEAVE", "OFFBOARDING", "LEFT"].map((s) => <option key={s} value={s}>{s.replaceAll("_", " ")}</option>)}
              </select>
              <Button type="submit">Save status</Button>
            </ActionForm>
          )}
        </div>
      </div>

      {manage && (
        <section className="rounded-2xl border border-[var(--color-border)] bg-white p-6">
          <h3 className="text-sm font-semibold">Profile</h3>
          <ActionForm action={updateEmployeeProfile.bind(null, employee.id)} className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-sm">Job title<input name="jobTitle" defaultValue={employee.jobTitle} required maxLength={150} className="mt-2 w-full border border-[var(--color-border)] p-3" /></label>
            <label className="text-sm">Department<input name="department" defaultValue={employee.department ?? ""} maxLength={150} className="mt-2 w-full border border-[var(--color-border)] p-3" /></label>
            <label className="text-sm">Manager
              <select name="managerId" defaultValue={employee.managerId ?? ""} className="mt-2 w-full border border-[var(--color-border)] bg-white p-3">
                <option value="">No manager</option>
                {managers.map((m) => <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>)}
              </select>
            </label>
            {canPayroll && <label className="text-sm">Annual salary (£)<input type="number" step="0.01" min="0" name="annualSalary" defaultValue={employee.annualSalaryMinorUnits ? employee.annualSalaryMinorUnits / 100 : ""} className="mt-2 w-full border border-[var(--color-border)] p-3" /></label>}
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

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-white p-6">
          <h3 className="text-sm font-semibold">Onboarding checklist</h3>
          {onboarding.length === 0 ? <p className="text-sm text-[var(--color-ink-muted)]">No onboarding tasks.</p> : (
            <ul className="space-y-2">
              {onboarding.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className={t.completedAt ? "text-[var(--color-ink-faint)] line-through" : ""}>{t.title}</span>
                  {!t.completedAt && manage && <form action={completeEmployeeTask.bind(null, t.id)}><Button type="submit" className="text-xs">Done</Button></form>}
                </li>
              ))}
            </ul>
          )}
          {manage && employee.status !== "LEFT" && (
            <ActionForm action={addEmployeeTask.bind(null, employee.id, "ONBOARDING")} className="flex gap-2 pt-2">
              <input name="title" placeholder="Add a task" required maxLength={300} className="flex-1 border border-[var(--color-border)] p-2 text-sm" />
              <Button type="submit">Add</Button>
            </ActionForm>
          )}
        </section>

        <section className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-white p-6">
          <h3 className="text-sm font-semibold">Offboarding checklist</h3>
          {offboarding.length === 0 ? <p className="text-sm text-[var(--color-ink-muted)]">Not offboarding.</p> : (
            <ul className="space-y-2">
              {offboarding.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className={t.completedAt ? "text-[var(--color-ink-faint)] line-through" : ""}>{t.title}</span>
                  {!t.completedAt && manage && <form action={completeEmployeeTask.bind(null, t.id)}><Button type="submit" className="text-xs">Done</Button></form>}
                </li>
              ))}
            </ul>
          )}
          {manage && (employee.status === "OFFBOARDING") && (
            <ActionForm action={addEmployeeTask.bind(null, employee.id, "OFFBOARDING")} className="flex gap-2 pt-2">
              <input name="title" placeholder="Add a task" required maxLength={300} className="flex-1 border border-[var(--color-border)] p-2 text-sm" />
              <Button type="submit">Add</Button>
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
            {employee.absences.length > 0 && (
              <ul className="space-y-1 text-sm">
                {employee.absences.slice(0, 5).map((a) => <li key={a.id} className="flex justify-between"><span>{a.type.replaceAll("_", " ")}</span><span className="text-[var(--color-ink-muted)]">{a.startDate.toLocaleDateString("en-GB")} – {a.endDate.toLocaleDateString("en-GB")}</span></li>)}
              </ul>
            )}
          </section>
        )}

        <section className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-white p-6">
          <div className="flex items-center justify-between"><h3 className="text-sm font-semibold">Upcoming shifts</h3><Link href={`/people/rotas?employeeId=${employee.id}`} className="text-xs text-[var(--color-atlas-blue)]">Rota →</Link></div>
          {employee.shifts.length === 0 ? <p className="text-sm text-[var(--color-ink-muted)]">No shifts scheduled.</p> : (
            <ul className="space-y-1 text-sm">
              {employee.shifts.map((s) => <li key={s.id} className="flex justify-between"><span>{s.startsAt.toLocaleString("en-GB")}</span><span className="text-[var(--color-ink-muted)]">{s.role ?? s.location ?? ""}</span></li>)}
            </ul>
          )}
        </section>

        {canPayroll && (
          <section className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-white p-6">
            <div className="flex items-center justify-between"><h3 className="text-sm font-semibold">Recent payslips</h3><Link href="/people/payroll" className="text-xs text-[var(--color-atlas-blue)]">Payroll →</Link></div>
            {employee.payslips.length === 0 ? <p className="text-sm text-[var(--color-ink-muted)]">No payslips yet.</p> : (
              <ul className="space-y-1 text-sm">
                {employee.payslips.map((p) => <li key={p.id} className="flex justify-between"><span>{p.payrollRun.periodLabel}</span><span className="font-medium">{formatMoney(p.netMinorUnits, p.currency)}</span></li>)}
              </ul>
            )}
          </section>
        )}
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
