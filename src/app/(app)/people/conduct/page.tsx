import Link from "next/link";
import { StatusPill } from "@/components/ui/status-pill";
import { getConductDesk } from "./actions";
import { RecordIntro } from "@/modules/people/components/record-form";
import { PLAN_STATUS_LABEL, CASE_STAGE_LABEL, CASE_STATUS_LABEL } from "@/modules/people/domain/conduct";

export default async function ConductPage({ searchParams }: { searchParams: Promise<{ employeeId?: string }> }) {
  const { employeeId } = await searchParams;
  const desk = await getConductDesk(employeeId);
  return <div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <RecordIntro kicker="Performance and conduct" title="Plans and disciplinary cases" detail={desk.canView ? "Open a performance plan with clear objectives, or record a disciplinary process from an informal conversation through to an outcome and appeal." : "These are the plans and cases that involve you."} />
      {desk.canEdit && <div className="flex gap-3"><Link href="/people/conduct/plans/new" className="rounded-full bg-[var(--color-atlas-blue)] px-4 py-2.5 text-sm font-semibold text-white">New performance plan</Link><Link href="/people/conduct/cases/new" className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold">New disciplinary case</Link></div>}
    </div>
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-slate-200 bg-white p-6"><h3 className="font-semibold">Performance plans</h3><div className="mt-4 divide-y">{desk.plans.map((plan) => <Link key={plan.id} href={`/people/conduct/plans/${plan.id}`} className="flex items-center justify-between gap-3 py-3"><span><span className="block text-sm font-medium">{plan.title}</span><span className="text-xs text-slate-500">{plan.employee.firstName} {plan.employee.lastName} · Review {plan.reviewOn.toLocaleDateString("en-GB", { timeZone: "UTC" })}</span></span><StatusPill label={PLAN_STATUS_LABEL[plan.status as keyof typeof PLAN_STATUS_LABEL] ?? plan.status} tone={plan.status === "ACHIEVED" ? "success" : plan.status === "NOT_MET" ? "danger" : "warning"} /></Link>)}{!desk.plans.length && <p className="py-6 text-sm text-slate-500">No performance plans in your view.</p>}</div></section>
      <section className="rounded-2xl border border-slate-200 bg-white p-6"><h3 className="font-semibold">Disciplinary cases</h3><div className="mt-4 divide-y">{desk.cases.map((item) => <Link key={item.id} href={`/people/conduct/cases/${item.id}`} className="flex items-center justify-between gap-3 py-3"><span><span className="block text-sm font-medium">{item.reference}</span><span className="text-xs text-slate-500">{item.employee.firstName} {item.employee.lastName} · {CASE_STAGE_LABEL[item.stage as keyof typeof CASE_STAGE_LABEL] ?? item.stage}</span></span><StatusPill label={CASE_STATUS_LABEL[item.status as keyof typeof CASE_STATUS_LABEL] ?? item.status} tone={item.status === "CLOSED" ? "neutral" : "warning"} /></Link>)}{!desk.cases.length && <p className="py-6 text-sm text-slate-500">No disciplinary cases in your view.</p>}</div></section>
    </div>
  </div>;
}
