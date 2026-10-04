import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { HR_CAPABILITIES as HR } from "@/core/permissions/capabilities";
import { db } from "@/core/db/client";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { completeEmployeeTask } from "../actions";

export default async function HRWorkspace() {
  const session = await requireSession();
  assertCapability(session, HR.employeeRead);
  const organisationId = session.organisationId;
  const today = new Date();
  const horizon = new Date(today.getTime() + 14 * 86400000);
  const phases: ("ONBOARDING" | "OFFBOARDING")[] = [];
  if (can(session, HR.onboardingManage)) phases.push("ONBOARDING");
  if (can(session, HR.offboardingManage)) phases.push("OFFBOARDING");
  const [headcount, joiners, leavers, tasks, appraisals, meetings, leave, expenses] = await Promise.all([
    db.employee.count({ where: { organisationId, status: { not: "LEFT" } } }),
    db.employee.count({ where: { organisationId, status: "ONBOARDING" } }),
    db.employee.count({ where: { organisationId, status: "OFFBOARDING" } }),
    phases.length ? db.employeeTask.findMany({ where: { organisationId, phase: { in: phases }, completedAt: null, employee: { status: { not: "LEFT" } } }, include: { employee: { select: { firstName: true, lastName: true } } }, orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }], take: 50 }) : [],
    can(session, HR.appraisalRead) ? db.appraisal.findMany({ where: { organisationId, status: "SCHEDULED", scheduledAt: { lte: horizon } }, include: { employee: { select: { firstName: true, lastName: true } } }, orderBy: { scheduledAt: "asc" }, take: 20 }) : [],
    can(session, HR.oneToOneRead) ? db.oneToOne.findMany({ where: { organisationId, status: "SCHEDULED", scheduledAt: { lte: horizon } }, include: { employee: { select: { firstName: true, lastName: true } } }, orderBy: { scheduledAt: "asc" }, take: 20 }) : [],
    can(session, HR.absenceManage) ? db.absenceRecord.count({ where: { organisationId, status: "PENDING" } }) : null,
    can(session, HR.expenseApprove) ? db.expenseClaim.count({ where: { organisationId, status: "PENDING" } }) : null,
  ]);
  const metrics = [{ label: "People employed", value: headcount, href: "/people" }, { label: "Joining", value: joiners, href: "/people/onboarding" }, { label: "Leaving", value: leavers, href: "/people/offboarding" }, ...(leave !== null ? [{ label: "Leave decisions", value: leave, href: "/people/absence" }] : []), ...(expenses !== null ? [{ label: "Expense decisions", value: expenses, href: "/people/expenses" }] : [])];
  const reviews = [...appraisals.map(a => ({ id: a.id, label: `${a.employee.firstName} ${a.employee.lastName}`, type: "Appraisal", date: a.scheduledAt, href: `/people/appraisals?employeeId=${a.employeeId}` })), ...meetings.map(a => ({ id: a.id, label: `${a.employee.firstName} ${a.employee.lastName}`, type: "One-to-one", date: a.scheduledAt, href: `/people/one-to-ones?employeeId=${a.employeeId}` }))].sort((a,b) => a.date.getTime() - b.date.getTime());
  return <div className="space-y-6">
    <div><p className="text-xs font-medium uppercase tracking-wide text-[var(--color-atlas-blue)]">People operations</p><h2 className="mt-1 text-2xl font-semibold">HR workspace</h2><p className="mt-2 text-sm text-[var(--color-ink-muted)]">Decisions, deadlines and employee transitions in one place.</p></div>
    <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">{metrics.map(m => <Link key={m.label} href={m.href} className="rounded-2xl border border-[var(--color-border)] bg-white p-5"><p className="text-xs text-[var(--color-ink-muted)]">{m.label}</p><p className="mt-2 text-3xl font-semibold">{m.value}</p></Link>)}</div>
    <div className="grid gap-6 xl:grid-cols-2">
      <section className="rounded-2xl border border-[var(--color-border)] bg-white p-6"><h3 className="font-semibold">Checklist work queue</h3><p className="mt-1 text-xs text-[var(--color-ink-muted)]">First 50 outstanding tasks, ordered by deadline. Open the employee to assign or add work.</p><div className="mt-4 divide-y divide-[var(--color-border)]">{tasks.length === 0 && <p className="py-5 text-sm text-[var(--color-ink-muted)]">No outstanding tasks within your access.</p>}{tasks.map(t => <div key={t.id} className="flex items-start justify-between gap-4 py-3"><div><Link href={`/people/${t.employeeId}`} className="text-sm font-medium text-[var(--color-atlas-blue)]">{t.employee.firstName} {t.employee.lastName}</Link><p className="mt-1 text-sm">{t.title}</p><p className={`mt-1 text-xs ${t.dueDate && t.dueDate < today ? "text-red-700" : "text-[var(--color-ink-muted)]"}`}>{t.phase === "ONBOARDING" ? "Onboarding" : "Offboarding"} · {t.dueDate ? `Due ${t.dueDate.toLocaleDateString("en-GB")}` : "Needs a deadline"}{t.assignedToUserId === session.userId ? " · Assigned to you" : ""}</p></div><ActionForm action={completeEmployeeTask.bind(null, t.id)}><Button type="submit">Complete</Button></ActionForm></div>)}</div></section>
      <section className="rounded-2xl border border-[var(--color-border)] bg-white p-6"><h3 className="font-semibold">Reviews in the next fortnight</h3><p className="mt-1 text-xs text-[var(--color-ink-muted)]">Includes overdue meetings. Open the review workspace to complete and schedule the next cycle.</p><div className="mt-4 divide-y divide-[var(--color-border)]">{reviews.length === 0 && <p className="py-5 text-sm text-[var(--color-ink-muted)]">No reviews due within your access.</p>}{reviews.map(r => <Link key={r.id} href={r.href} className="flex justify-between gap-3 py-3 text-sm"><span><span className="font-medium">{r.label}</span><span className="mt-1 block text-xs text-[var(--color-ink-muted)]">{r.type}</span></span><span className={r.date < today ? "text-red-700" : "text-[var(--color-ink-muted)]"}>{r.date.toLocaleDateString("en-GB")}</span></Link>)}</div></section>
    </div>
    <section className="rounded-2xl border border-[var(--color-border)] bg-white p-6"><h3 className="font-semibold">Workflow triggers</h3><div className="mt-4 grid gap-5 text-sm md:grid-cols-3"><div><p className="font-medium">Employee added</p><p className="mt-1 text-[var(--color-ink-muted)]">Creates onboarding tasks with start-date deadlines and an owner, plus the first appraisal and one-to-one.</p></div><div><p className="font-medium">Offboarding started</p><p className="mt-1 text-[var(--color-ink-muted)]">Creates the leaver checklist once. Outstanding tasks block leaving; a leaving date and reason are required.</p></div><div><p className="font-medium">Review completed</p><p className="mt-1 text-[var(--color-ink-muted)]">Existing review actions schedule the next cycle from employee or organisation cadence. Due work appears here when this page loads.</p></div></div></section>
  </div>;
}
