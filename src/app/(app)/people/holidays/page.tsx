import Link from "next/link";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { requireSession } from "@/core/auth/session";
import { can } from "@/core/permissions/check";
import { HR_CAPABILITIES } from "@/core/permissions/capabilities";
import { canRequestOwnHoliday } from "@/core/permissions/hr-access";
import { assertModuleEnabled } from "@/core/modules/access";
import { db } from "@/core/db/client";
import { canManageTeams, teamScope } from "@/modules/people/services/team-access";
import { workingLeaveDays } from "@/modules/people/domain/working-time";
import { calculateLeaveBalance } from "@/modules/people/domain/leave-balance";
import { MyHRWorkspace } from "@/modules/people/components/my-hr-workspace";
import { approveLeaveRequest, rejectLeaveRequest, setLeaveAllowance } from "../absence/actions";

export default async function HolidaysPage() {
  const session = await requireSession();
  await assertModuleEnabled(session, "people");
  const own = canRequestOwnHoliday(session);
  const company = can(session, HR_CAPABILITIES.absenceManage) || can(session, HR_CAPABILITIES.employeeManage);
  const managesPeople = company || canManageTeams(session);
  const year = new Date().getUTCFullYear();
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const yearEnd = new Date(Date.UTC(year, 11, 31));
  const employeeWhere = company ? { organisationId: session.organisationId } : await teamScope(session);
  const pending = managesPeople ? await db.absenceRecord.findMany({
    where: { organisationId: session.organisationId, type: "HOLIDAY", status: "PENDING", employee: employeeWhere },
    include: { employee: { select: { id: true, firstName: true, lastName: true, workingDays: true, annualLeaveDaysEntitlement: true } } },
    orderBy: { startDate: "asc" },
    take: 100,
  }) : [];
  const people = company ? await db.employee.findMany({
    where: { organisationId: session.organisationId, status: { not: "LEFT" } },
    select: {
      id: true, firstName: true, lastName: true, department: true, annualLeaveDaysEntitlement: true, workingDays: true,
      absences: { where: { type: "HOLIDAY", status: { in: ["APPROVED", "PENDING"] }, startDate: { gte: yearStart, lte: yearEnd } }, select: { bookedDays: true, startDate: true, endDate: true, status: true } },
    },
    orderBy: [{ department: "asc" }, { lastName: "asc" }],
    take: 300,
  }) : [];

  return <div className="space-y-8">
    <div>
      <h2 className="text-2xl font-semibold tracking-tight">Holidays</h2>
      <p className="mt-2 max-w-2xl text-sm text-slate-500">A person requests holiday on their profile. It arrives here for their manager. The days are counted from their working pattern, and HR can change that count or the allowance they are given for the year.</p>
    </div>
    {managesPeople && <section className="space-y-3">
      <h3 className="text-sm font-semibold">Waiting for approval ({pending.length})</h3>
      {!pending.length && <p className="rounded-2xl border bg-white p-5 text-sm text-slate-500">No profile requests are waiting.</p>}
      <div className="grid gap-3 lg:grid-cols-2">{pending.map((request) => {
        const counted = request.bookedDays ?? workingLeaveDays(request.startDate, request.endDate, request.employee.workingDays);
        return <article key={request.id} className="space-y-3 rounded-2xl border bg-white p-5">
          <div><Link href={`/people/${request.employee.id}`} className="font-medium text-blue-700">{request.employee.firstName} {request.employee.lastName}</Link><p className="mt-1 text-sm text-slate-500">{request.startDate.toLocaleDateString("en-GB", { timeZone: "UTC" })} – {request.endDate.toLocaleDateString("en-GB", { timeZone: "UTC" })} · allowance {request.employee.annualLeaveDaysEntitlement} days</p>{request.reason && <p className="mt-1 text-xs text-slate-500">{request.reason}</p>}</div>
          <form action={approveLeaveRequest.bind(null, request.id)} className="flex flex-wrap items-end gap-2">
            <label className="text-xs text-slate-500">Days to approve<input name="bookedDays" type="number" step="0.5" min="0" max="366" required defaultValue={counted} className="mt-1 block w-28 rounded-lg border p-2 text-sm" /></label>
            <Button type="submit" variant="primary">Approve</Button>
          </form>
          <p className="text-[11px] text-slate-400">Their working pattern counts {counted} day{counted === 1 ? "" : "s"}. Change the number if this request should take more or less.</p>
          <ActionForm action={rejectLeaveRequest.bind(null, request.id)} className="flex flex-wrap gap-2"><input name="rejectionReason" required maxLength={500} placeholder="Reason for declining" className="min-w-40 flex-1 rounded-lg border p-2 text-sm" /><Button type="submit">Decline</Button></ActionForm>
        </article>;
      })}</div>
    </section>}
    {company && <section className="space-y-3">
      <h3 className="text-sm font-semibold">What people get — {year}</h3>
      <p className="text-xs text-slate-500">The allowance is a whole number of days for the year. Taken and waiting figures use each request’s saved days.</p>
      <div className="overflow-hidden rounded-2xl border bg-white"><table className="w-full text-left text-sm"><thead><tr className="border-b text-xs text-slate-500"><th className="p-3">Person</th><th className="p-3">Taken</th><th className="p-3">Waiting</th><th className="p-3">Left</th><th className="p-3">Allowance</th></tr></thead><tbody>{people.map((person) => {
        const approved = person.absences.filter((absence) => absence.status === "APPROVED");
        const waiting = person.absences.filter((absence) => absence.status === "PENDING").reduce((sum, absence) => sum + (absence.bookedDays ?? workingLeaveDays(absence.startDate, absence.endDate, person.workingDays)), 0);
        const balance = calculateLeaveBalance({ entitlementDays: person.annualLeaveDaysEntitlement, workingDays: person.workingDays, approvedHolidays: approved });
        return <tr key={person.id} className="border-t"><td className="p-3"><Link href={`/people/${person.id}`} className="font-medium text-blue-700">{person.firstName} {person.lastName}</Link><span className="mt-1 block text-xs text-slate-400">{person.department ?? "No department"}</span></td><td className="p-3">{balance.taken}</td><td className="p-3">{waiting}</td><td className="p-3">{balance.remaining}</td><td className="p-3"><form action={setLeaveAllowance.bind(null, person.id)} className="flex items-center gap-2"><input name="days" type="number" min="0" max="366" step="1" required defaultValue={person.annualLeaveDaysEntitlement} className="w-20 rounded-lg border p-2" /><Button type="submit">Save</Button></form></td></tr>;
      })}</tbody></table></div>
    </section>}
    {own && <MyHRWorkspace holidayOnly />}
  </div>;
}
