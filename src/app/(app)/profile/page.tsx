import Link from "next/link";
import { changeOwnPassword, signOutOtherSessions } from "@/core/auth/security-actions";
import { getMyHR } from "@/app/(app)/people/self-service";
import { requestLeave, cancelOwnLeave } from "@/app/(app)/people/absence/actions";
import { updateOwnEmployeeDetails } from "@/app/(app)/people/actions";
import { getMyConduct } from "@/app/(app)/people/conduct/actions";
import { submitExpenseClaim } from "@/app/(app)/people/expenses/actions";
import { saveProfile } from "./actions";
import { loadAssignedWork } from "./work";
import { COMPANY_ACCESS_AREAS, hasCompanyAreaAccess } from "@/core/permissions/company-access";
import { can } from "@/core/permissions/check";
import { canRequestOwnHoliday } from "@/core/permissions/hr-access";
import { requireSession } from "@/core/auth/session";
import { db } from "@/core/db/client";
import { enabledModulesForSession } from "@/core/modules/runtime";
import { ActionForm } from "@/components/ui/action-form";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import { PersonGoals } from "@/modules/kpis/components/person-goals";
import { PersonSchedule } from "@/modules/scheduling/components/person-schedule";
import { HolidayRequestFields } from "@/modules/people/components/holiday-request-fields";
import { CASE_STAGE_LABEL, PLAN_STATUS_LABEL } from "@/modules/people/domain/conduct";
import { workingLeaveDays } from "@/modules/people/domain/working-time";
import { getPersonSchedule } from "@/app/(app)/scheduling/actions";
import { myPayslips } from "@/modules/payroll/services/queries";
import { PAYROLL_CAPABILITIES } from "@/core/permissions/capabilities";

const card = "rounded-3xl border border-black/[0.04] bg-white p-6 shadow-[0_1px_1px_rgba(0,0,0,0.04),0_18px_40px_-24px_rgba(0,0,0,0.28)]";

function formatMoney(minorUnits: number, currency = "GBP") {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(minorUnits / 100);
}

function dayLabel(date: Date) {
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

export default async function ProfilePage() {
  const session = await requireSession();
  const enabled = await enabledModulesForSession(session);
  const [employee, assignments, membership, company] = await Promise.all([
    enabled.has("people") ? getMyHR() : null,
    loadAssignedWork(),
    db.membership.findFirstOrThrow({ where: { id: session.membershipId, organisationId: session.organisationId, userId: session.userId }, include: { roles: { include: { role: true } } } }),
    db.organisation.findUniqueOrThrow({ where: { id: session.organisationId }, select: { restrictedAccessAreas: true } }),
  ]);
  const conduct = employee ? await getMyConduct() : { plans: [], cases: [] };
  const published: Array<{ id: string; startsAt: Date; endsAt: Date; breakMinutes: number; status: string; role: string | null; location: string | null; workType: { name: string; category: string } | null; team: { name: string } | null }> = (employee?.shifts ?? []).map((shift) => ({ id: shift.id, startsAt: shift.startsAt, endsAt: shift.endsAt, breakMinutes: shift.breakMinutes, status: "CONFIRMED", role: shift.role, location: shift.location, workType: null, team: null }));
  let schedule = published;
  if (employee && enabled.has("scheduling")) {
    try { schedule = await getPersonSchedule(); }
    catch {
      // The published employee shifts above are the same rota when the planner relation is unavailable.
      schedule = published;
    }
  }
  const year = new Date().getUTCFullYear();
  const holidays = employee ? employee.absences.filter((absence) => absence.type === "HOLIDAY") : [];
  const thisYear = holidays.filter((absence) => absence.startDate.getUTCFullYear() === year);
  const days = (status: string) => thisYear.filter((absence) => absence.status === status).reduce((sum, absence) => sum + (absence.bookedDays ?? workingLeaveDays(absence.startDate, absence.endDate, employee!.workingDays)), 0);
  const approved = employee ? days("APPROVED") : 0;
  const pending = employee ? days("PENDING") : 0;
  const remaining = employee ? employee.annualLeaveDaysEntitlement - approved - pending : 0;
  const canBook = employee ? canRequestOwnHoliday(session) : false;
  const first = session.userName.split(" ")[0];
  const canSeePayslips = employee && enabled.has("payroll") && can(session, PAYROLL_CAPABILITIES.payslipSelf);
  const payslips = canSeePayslips ? await myPayslips(session) : null;
  const jumps = [
    employee ? ["#time-off", "Time off"] : null,
    employee && enabled.has("scheduling") ? ["#rota", "Rota"] : null,
    canSeePayslips ? ["#payslips", "Payslips"] : null,
    ["#assigned", "Assigned"],
    employee ? ["#goals", "Goals"] : null,
    employee ? ["#contact", "Contact details"] : null,
    ["#account", "Account"],
  ].filter((item): item is [string, string] => Boolean(item));

  return <div className="mx-auto flex max-w-6xl flex-col gap-8">
    <header className="flex flex-wrap items-end justify-between gap-6 pt-2">
      <div className="flex items-center gap-4">
        <Avatar name={session.userName} size="lg" />
        <div>
          <p className="text-sm text-[#6e6e73]">{session.organisationName}</p>
          <h1 className="mt-1 text-4xl font-semibold tracking-tight text-[#1d1d1f]">My work</h1>
          <p className="mt-2 max-w-xl text-sm text-[#6e6e73]">{employee ? `${employee.jobTitle}${employee.department ? ` · ${employee.department}` : ""}${employee.manager ? ` · Reports to ${employee.manager.firstName} ${employee.manager.lastName}` : ""}` : `${first}, this is everything sitting with you.`}</p>
        </div>
      </div>
      <nav className="flex flex-wrap gap-2" aria-label="My work sections">
        {jumps.map(([href, label]) => <a key={href} href={href} className="rounded-full bg-black/[0.05] px-3 py-1.5 text-xs font-medium text-[#1d1d1f]">{label}</a>)}
      </nav>
    </header>

    {employee && <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {[{ label: `${year} days left`, value: String(remaining), note: `${approved} approved · ${pending} waiting` }, { label: "Open work", value: String(assignments.length), note: "Tasks, meetings and plans" }, { label: "Next shift", value: schedule[0] ? schedule[0].startsAt.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) : "None", note: schedule[0] ? (schedule[0].workType?.name ?? schedule[0].role ?? "Published shift") : "Nothing published yet" }, { label: "Performance", value: String(conduct.plans.length), note: conduct.plans.length ? "Plans on your record" : "No plan open" }].map((item) => <div key={item.label} className={card}><p className="text-xs text-[#6e6e73]">{item.label}</p><p className="mt-2 text-3xl font-semibold tracking-tight text-[#1d1d1f]">{item.value}</p><p className="mt-1 text-xs text-[#6e6e73]">{item.note}</p></div>)}
    </section>}

    {!employee && <section className={card}><h2 className="text-lg font-semibold">Your employee record is not linked yet</h2><p className="mt-2 text-sm text-[#6e6e73]">Ask HR to link your employee record to this login. Holidays, your rota and contact details appear here once that link exists. Work already assigned to your login is listed below.</p></section>}

    {employee && <section id="time-off" className={card}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h2 className="text-lg font-semibold tracking-tight">Time off</h2><p className="mt-1 text-sm text-[#6e6e73]">Request holiday here. It is saved on your HR record and waits for your manager. {employee.annualLeaveDaysEntitlement} days this year, {remaining} left after approved and pending requests.</p></div>
        <Link href="/people/holidays" className="text-sm font-medium text-[#0071e3]">Open holidays</Link>
      </div>
      {canBook ? <ActionForm action={requestLeave} className="mt-5 grid gap-4 border-t border-black/[0.06] pt-5 sm:grid-cols-2">
        <HolidayRequestFields workingDays={employee.workingDays} remaining={remaining} managerName={employee.manager ? `${employee.manager.firstName} ${employee.manager.lastName}` : null} />
        <label className="text-sm sm:col-span-2">Note for your manager<textarea name="reason" maxLength={1000} rows={3} className="mt-2 w-full rounded-2xl border border-slate-200 p-3" /></label>
        <Button type="submit" variant="primary" className="justify-self-start">Request time off</Button>
      </ActionForm> : <p className="mt-4 text-sm text-[#6e6e73]">Holiday requests are not enabled for your access. A company administrator can allow your own holidays without opening the rest of HR.</p>}
      <div className="mt-6 divide-y divide-black/[0.06]">
        {holidays.map((absence) => <div key={absence.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
          <div className="text-sm"><p>{dayLabel(absence.startDate)} – {dayLabel(absence.endDate)} · {absence.bookedDays ?? workingLeaveDays(absence.startDate, absence.endDate, employee.workingDays)} working days</p>{absence.rejectionReason && <p className="mt-1 text-xs text-[#6e6e73]">Decision: {absence.rejectionReason}</p>}</div>
          <div className="flex items-center gap-3">
            <StatusPill label={absence.status} tone={absence.status === "APPROVED" ? "success" : absence.status === "PENDING" ? "warning" : "neutral"} />
            {["PENDING", "APPROVED"].includes(absence.status) && absence.startDate.toISOString().slice(0, 10) >= new Date().toISOString().slice(0, 10) && <ActionForm action={cancelOwnLeave.bind(null, absence.id)}><Button type="submit">Cancel</Button></ActionForm>}
          </div>
        </div>)}
        {!holidays.length && <p className="py-4 text-sm text-[#6e6e73]">No holiday requests yet.</p>}
      </div>
    </section>}

    {employee && enabled.has("scheduling") && <div id="rota"><PersonSchedule shifts={schedule} heading="Your rota" /></div>}

    {canSeePayslips && payslips && <section id="payslips" className={card}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h2 className="text-lg font-semibold tracking-tight">Payslips</h2><p className="mt-1 text-sm text-[#6e6e73]">Your net pay for recent payroll runs, and any P45/P60 issued to you. These figures are calculated in Atlas and are not a submission to HMRC.</p></div>
        <Link href="/payroll" className="text-sm font-medium text-[#0071e3]">Open payroll</Link>
      </div>
      <div className="mt-4 divide-y divide-black/[0.06]">
        {payslips.payslips.map((p) => <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
          <span>{p.payrollRun.periodLabel}</span>
          <span className="font-semibold">{new Intl.NumberFormat("en-GB", { style: "currency", currency: p.currency }).format(p.netMinorUnits / 100)}</span>
        </div>)}
        {!payslips.payslips.length && <p className="py-4 text-sm text-[#6e6e73]">No payslips yet.</p>}
      </div>
      {payslips.documents.length > 0 && <div className="mt-4 flex flex-wrap gap-2 border-t border-black/[0.06] pt-4">
        {payslips.documents.map((d) => <span key={d.id} className="rounded-full bg-black/[0.05] px-3 py-1.5 text-xs font-medium">{d.type} · {d.taxYear}</span>)}
      </div>}
    </section>}

    <section id="assigned" className={card}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h2 className="text-lg font-semibold tracking-tight">Assigned to you</h2><p className="mt-1 text-sm text-[#6e6e73]">Tasks, meetings, customer work, reviews and checklist items that name you.</p></div>
        {enabled.has("projects") && can(session, "projects.read") && <Link href="/projects/work/my-work" className="text-sm font-medium text-[#0071e3]">Open project work</Link>}
      </div>
      <div className="mt-4 divide-y divide-black/[0.06]">
        {assignments.map((item) => <Link key={`${item.kind}:${item.id}`} href={item.href} className="flex flex-wrap items-baseline justify-between gap-3 py-3">
          <span><span className="text-[11px] font-medium uppercase tracking-wide text-[#6e6e73]">{item.kind}</span><span className="mt-0.5 block text-sm font-medium text-[#1d1d1f]">{item.title}</span></span>
          {item.detail && <span className="text-xs text-[#6e6e73]">{item.detail}</span>}
        </Link>)}
        {!assignments.length && <p className="py-4 text-sm text-[#6e6e73]">Nothing is assigned to you right now.</p>}
      </div>
    </section>

    {employee && <div id="goals" className="space-y-4">
      <PersonGoals employeeId={employee.id} self personLabel={`${employee.firstName} ${employee.lastName}`} />
      {!!conduct.plans.length && <section className={card}><h2 className="text-lg font-semibold">Performance plans</h2><p className="mt-1 text-sm text-[#6e6e73]">Improvement and development plans kept on your HR record, including a PIP.</p><div className="mt-4 divide-y divide-black/[0.06]">{conduct.plans.map((plan) => <Link key={plan.id} href={`/people/conduct/plans/${plan.id}`} className="flex items-center justify-between gap-3 py-3 text-sm"><span className="font-medium">{plan.title}</span><span className="text-[#6e6e73]">{PLAN_STATUS_LABEL[plan.status as keyof typeof PLAN_STATUS_LABEL] ?? plan.status}</span></Link>)}</div></section>}
      {!!conduct.cases.length && <section className={card}><h2 className="text-lg font-semibold">Matters about you</h2><div className="mt-4 divide-y divide-black/[0.06]">{conduct.cases.map((item) => <Link key={item.id} href={`/people/conduct/cases/${item.id}`} className="flex items-center justify-between gap-3 py-3 text-sm"><span className="font-medium">{item.reference}</span><span className="text-[#6e6e73]">{CASE_STAGE_LABEL[item.stage as keyof typeof CASE_STAGE_LABEL] ?? item.stage}</span></Link>)}</div></section>}
    </div>}

    {employee && <section id="contact" className={card}>
      <h2 className="text-lg font-semibold tracking-tight">Contact details</h2>
      <p className="mt-1 text-sm text-[#6e6e73]">Phone, address and emergency contact save onto your HR record. Job title, pay and your manager stay with HR.</p>
      <ActionForm action={updateOwnEmployeeDetails} className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="text-sm">Phone<input name="phone" defaultValue={employee.phone ?? ""} maxLength={50} autoComplete="tel" className="mt-2 w-full rounded-2xl border border-slate-200 p-3" /></label>
        <label className="text-sm">Emergency contact phone<input name="emergencyContactPhone" defaultValue={employee.emergencyContactPhone ?? ""} maxLength={50} autoComplete="tel" className="mt-2 w-full rounded-2xl border border-slate-200 p-3" /></label>
        <label className="text-sm sm:col-span-2">Home address<textarea name="address" defaultValue={employee.address ?? ""} maxLength={500} rows={3} autoComplete="street-address" className="mt-2 w-full rounded-2xl border border-slate-200 p-3" placeholder="Street, town, postcode" /></label>
        <label className="text-sm sm:col-span-2">Emergency contact name<input name="emergencyContactName" defaultValue={employee.emergencyContactName ?? ""} maxLength={150} autoComplete="name" className="mt-2 w-full rounded-2xl border border-slate-200 p-3" /></label>
        <Button type="submit" variant="primary" className="justify-self-start">Save to HR</Button>
      </ActionForm>
    </section>}

    {employee && <section className={card}>
      <h2 className="text-lg font-semibold">Expenses</h2>
      {employee.expenseClaims.length > 0 && <ul className="mt-4 divide-y divide-black/[0.06]">{employee.expenseClaims.map((claim) => <li key={claim.id} className="flex items-center justify-between gap-3 py-3 text-sm"><span>{claim.category} — {formatMoney(claim.amountMinorUnits, claim.currency)}</span><StatusPill label={claim.status} tone={claim.status === "APPROVED" ? "success" : claim.status === "REJECTED" ? "danger" : "warning"} /></li>)}</ul>}
      <ActionForm action={submitExpenseClaim} className="mt-4 grid gap-4 border-t border-black/[0.06] pt-4 sm:grid-cols-2">
        <label className="text-sm">Category<input name="category" required maxLength={100} placeholder="Travel" className="mt-2 w-full rounded-2xl border border-slate-200 p-3" /></label>
        <label className="text-sm">Amount (£)<input type="number" step="0.01" min="0.01" name="amount" required className="mt-2 w-full rounded-2xl border border-slate-200 p-3" /></label>
        <label className="text-sm">Date incurred<input type="date" name="incurredOn" required className="mt-2 w-full rounded-2xl border border-slate-200 p-3" /></label>
        <label className="text-sm sm:col-span-2">Description<textarea name="description" className="mt-2 w-full rounded-2xl border border-slate-200 p-3" /></label>
        <Button type="submit" variant="primary" className="justify-self-start">Submit claim</Button>
      </ActionForm>
    </section>}

    <section id="account" className="space-y-6">
      <div><h2 className="text-lg font-semibold tracking-tight">Account</h2><p className="mt-1 text-sm text-[#6e6e73]">Your name, password and what this login can open. Contact details above are the ones HR keeps.</p></div>
      <ActionForm action={saveProfile} className={`${card} space-y-4`}>
        <label className="block text-sm font-medium">Full name<input required name="name" maxLength={100} defaultValue={session.userName} className="mt-2 block w-full rounded-2xl border border-slate-200 p-3" /></label>
        <div><p className="text-sm font-medium">Email</p><p className="mt-2 text-sm text-[#6e6e73]">{session.userEmail}</p></div>
        <Button type="submit" variant="primary">Save name</Button>
      </ActionForm>
      <section className={card}>
        <h3 className="text-sm font-semibold">Your access</h3>
        <p className="mt-2 text-xs text-[#6e6e73]">Roles: {membership.roles?.map((role) => role.role.name).join(", ") || "No assigned roles"}. Company restrictions override role permissions.</p>
        <div className="mt-4 divide-y divide-black/[0.06]">{COMPANY_ACCESS_AREAS.map((area) => <div key={area.id} className="flex items-center justify-between gap-3 py-3 text-xs"><span>{area.label}</span><span className="text-[#6e6e73]">{company.restrictedAccessAreas.includes(area.id) ? "Off for this company" : hasCompanyAreaAccess(session.capabilities, area) ? "Allowed" : "Not granted"}</span></div>)}</div>
        {(can(session, "core.roles.manage") || can(session, "core.users.manage")) && <Link href="/settings" className="mt-4 inline-block text-xs text-[#0071e3]">Manage company and user access</Link>}
      </section>
      <section className={card}>
        <h3 className="text-sm font-semibold">Password and sessions</h3>
        <p className="mt-2 text-xs text-[#6e6e73]">Changing your password signs out other devices. This device stays signed in.</p>
        <ActionForm action={changeOwnPassword} className="mt-4 grid gap-4 sm:grid-cols-3">{[["currentPassword", "Current password"], ["password", "New password"], ["confirmPassword", "Confirm new password"]].map(([name, label]) => <label key={name} className="text-xs">{label}<input type="password" name={name} required minLength={name === "currentPassword" ? undefined : 12} maxLength={128} autoComplete={name === "currentPassword" ? "current-password" : "new-password"} className="mt-2 w-full rounded-2xl border border-slate-200 p-3" /></label>)}<Button type="submit" variant="primary">Change password</Button></ActionForm>
        <ActionForm action={signOutOtherSessions} className="mt-4"><Button type="submit">Sign out other devices in this company</Button></ActionForm>
      </section>
    </section>
  </div>;
}
