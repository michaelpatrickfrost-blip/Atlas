import Link from "next/link";
import { getMyHR } from "@/app/(app)/people/self-service";
import { requestLeave, cancelOwnLeave } from "@/app/(app)/people/absence/actions";
import { updateOwnEmployeeDetails } from "@/app/(app)/people/actions";
import { getMyConduct } from "@/app/(app)/people/conduct/actions";
import { listPolicies } from "@/app/(app)/people/policies/actions";
import { requireSession } from "@/core/auth/session";
import { canRequestOwnHoliday, canReadPolicies } from "@/core/permissions/hr-access";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import { PersonGoals } from "@/modules/kpis/components/person-goals";
import { PLAN_STATUS_LABEL, CASE_STAGE_LABEL } from "@/modules/people/domain/conduct";
import { workingLeaveDays } from "@/modules/people/domain/working-time";
import { HolidayRequestFields } from "@/modules/people/components/holiday-request-fields";
import { getEnabledModuleIds } from "@/core/modules/runtime";
import { getPersonSchedule } from "@/app/(app)/scheduling/actions";
import { PersonSchedule } from "@/modules/scheduling/components/person-schedule";
export async function MyHRWorkspace({holidayOnly=false}:{holidayOnly?:boolean}) {
  const session = await requireSession();
  const employee = await getMyHR();
  if (!employee) return <div className="rounded-2xl border bg-white p-7"><h2 className="font-semibold">Your employee account is not linked yet</h2><p className="mt-2 text-sm text-slate-500">Ask HR to link your employee record to your existing Atlas login. You do not need a separate account.</p></div>;
  const year = new Date().getUTCFullYear();
  const holidays = employee.absences.filter(a => a.type === "HOLIDAY" && a.startDate.getUTCFullYear() === year);
  const count = (status: string) => holidays.filter(a => a.status === status).reduce((sum,a)=>sum+(a.bookedDays ?? workingLeaveDays(a.startDate,a.endDate,employee.workingDays)),0);
  const approved=count("APPROVED"),pending=count("PENDING");
  const canBook = canRequestOwnHoliday(session);
  const policies = !holidayOnly && canReadPolicies(session) ? await listPolicies() : [];
  const mine = holidayOnly ? { plans: [], cases: [] } : await getMyConduct();
  const schedulingOn = !holidayOnly && (await getEnabledModuleIds(session.organisationId)).has("scheduling");
  const schedule = schedulingOn ? await getPersonSchedule() : [];
  return <div className="space-y-6"><div><h2 className="text-2xl font-semibold">{holidayOnly?"Time off":"My HR"}</h2><p className="mt-2 text-sm text-slate-500">{employee.firstName} {employee.lastName} · {employee.jobTitle}{employee.manager ? ` · Manager: ${employee.manager.firstName} ${employee.manager.lastName}` : ""}</p>{!holidayOnly && <div className="mt-3 flex flex-wrap gap-4 text-sm text-blue-600"><Link href="/profile">My work →</Link>{canBook && <Link href="/people/holidays">Book holiday →</Link>}{canReadPolicies(session) && <Link href="/people/policies">Company policies →</Link>}<Link href="/people/timesheets">Enter my hours →</Link><Link href="/scheduling">My shifts &amp; tasks →</Link></div>}</div>
    {schedulingOn && <PersonSchedule shifts={schedule} />}
    {!holidayOnly && <PersonGoals employeeId={employee.id} self personLabel={`${employee.firstName} ${employee.lastName}`} />}
    <div className="grid gap-3 sm:grid-cols-3">{[{label:`${year} entitlement`,value:employee.annualLeaveDaysEntitlement},{label:"Approved days",value:approved},{label:"Available after pending requests",value:employee.annualLeaveDaysEntitlement-approved-pending}].map(m=><div key={m.label} className="rounded-2xl border bg-white p-5"><p className="text-xs text-slate-500">{m.label}</p><p className="mt-2 text-3xl font-semibold">{m.value}</p></div>)}</div>
    <section className="rounded-2xl border bg-white p-6"><h3 className="font-semibold">Request holiday</h3>{canBook ? <><p className="mt-2 text-xs text-slate-500">The days follow your working pattern. The request waits in HR until your manager approves it. Split dates that cross into another calendar year.</p><ActionForm action={requestLeave} className="mt-4 grid gap-4 sm:grid-cols-2"><HolidayRequestFields workingDays={employee.workingDays} remaining={employee.annualLeaveDaysEntitlement - approved - pending} managerName={employee.manager ? `${employee.manager.firstName} ${employee.manager.lastName}` : null} /><label className="text-sm sm:col-span-2">Note for your manager (optional)<textarea name="reason" maxLength={1000} rows={3} className="mt-2 w-full rounded-xl border border-slate-200 p-3" /></label><Button type="submit" variant="primary" className="justify-self-start">Send request to HR</Button></ActionForm></> : <p className="mt-2 text-sm text-slate-500">Holiday requests are not enabled for your access. A company administrator can allow own holidays without opening the rest of HR.</p>}</section>
    <section className="rounded-2xl border bg-white p-6"><h3 className="font-semibold">My leave requests</h3><div className="mt-4 divide-y">{employee.absences.filter(a=>a.type==="HOLIDAY").map(a=><div key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div className="text-sm"><p>{a.startDate.toLocaleDateString("en-GB",{timeZone:"UTC"})} – {a.endDate.toLocaleDateString("en-GB",{timeZone:"UTC"})} · {a.bookedDays ?? workingLeaveDays(a.startDate,a.endDate,employee.workingDays)} working days</p>{a.rejectionReason && <p className="mt-1 text-xs text-slate-500">Decision: {a.rejectionReason}</p>}</div><StatusPill label={a.status} tone={a.status==="APPROVED"?"success":a.status==="PENDING"?"warning":"neutral"} />{["PENDING","APPROVED"].includes(a.status) && a.startDate.toISOString().slice(0,10)>=new Date().toISOString().slice(0,10) && <ActionForm action={cancelOwnLeave.bind(null,a.id)}><Button type="submit">Cancel request</Button></ActionForm>}</div>)}{!holidays.length && <p className="text-sm text-slate-500">No holiday requests this year.</p>}</div></section>
    {!holidayOnly && !!mine.plans.length && <section className="rounded-2xl border bg-white p-6"><h3 className="font-semibold">Your performance plans</h3><div className="mt-4 divide-y">{mine.plans.map(plan => <Link key={plan.id} href={`/people/conduct/plans/${plan.id}`} className="flex items-center justify-between py-3 text-sm"><span>{plan.title}</span><span className="text-slate-500">{PLAN_STATUS_LABEL[plan.status as keyof typeof PLAN_STATUS_LABEL] ?? plan.status}</span></Link>)}</div></section>}
    {!holidayOnly && !!mine.cases.length && <section className="rounded-2xl border bg-white p-6"><h3 className="font-semibold">Disciplinary cases about you</h3><div className="mt-4 divide-y">{mine.cases.map(item => <Link key={item.id} href={`/people/conduct/cases/${item.id}`} className="flex items-center justify-between py-3 text-sm"><span>{item.reference}</span><span className="text-slate-500">{CASE_STAGE_LABEL[item.stage as keyof typeof CASE_STAGE_LABEL] ?? item.stage}</span></Link>)}</div></section>}
    {!holidayOnly && !!policies.length && <section className="rounded-2xl border bg-white p-6"><h3 className="font-semibold">Company policies</h3><div className="mt-4 divide-y">{policies.filter(policy => policy.status === "PUBLISHED").slice(0, 6).map(policy => <Link key={policy.id} href="/people/policies" className="block py-3 text-sm">{policy.title}<span className="ml-2 text-xs text-slate-500">{policy.category}</span></Link>)}</div></section>}
    {!holidayOnly && <section className="rounded-2xl border bg-white p-6"><h3 className="font-semibold">Keep my contact details up to date</h3><ActionForm action={updateOwnEmployeeDetails} className="mt-4 grid gap-4 sm:grid-cols-2">{([{key:"phone",label:"Phone"},{key:"address",label:"Address"},{key:"emergencyContactName",label:"Emergency contact name"},{key:"emergencyContactPhone",label:"Emergency contact phone"}] as const).map(f=><label key={f.key} className="text-sm">{f.label}<input name={f.key} defaultValue={employee[f.key] ?? ""} maxLength={f.key==="address"?500:150} className="mt-2 w-full rounded-lg border p-3" /></label>)}<Button type="submit" variant="primary" className="justify-self-start">Save details</Button></ActionForm></section>}
  </div>;
}
