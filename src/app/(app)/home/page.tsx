import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { getEnabledModuleIds } from "@/core/modules/runtime";
import { getAttentionItems } from "@/core/attention/aggregate";
import { AppDirectory } from "@/components/shell/app-directory";
import { CompanyMark } from "@/components/shell/company-mark";
import { GoalMeter } from "@/modules/kpis/components/goal-meter";
import { loadGoalWorkspace } from "@/modules/kpis/services/workspace";

const PANEL = "rounded-2xl border border-black/[0.06] bg-white";
const DOT = { critical: "bg-[#d12b45]", warning: "bg-[#c9820a]", info: "bg-[#c7c7cc]" } as const;

export default async function HomePage() {
  const session = await requireSession();
  const [attention, enabled] = await Promise.all([getAttentionItems(session), getEnabledModuleIds(session.organisationId)]);
  const goalBoard = enabled.has("kpis") ? await loadGoalWorkspace(session).catch(() => null) : null;
  const highlights = goalBoard?.goals.filter((goal) => goal.status === "ACTIVE").slice(0, 4) ?? [];
  const today = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/London" }).format(new Date());
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5">
      <header className="flex items-center gap-3.5 pb-1 pt-1">
        <CompanyMark organisationId={session.organisationId} name={session.organisationName} size="md" />
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold tracking-tight text-[#1d1d1f]">{session.organisationName}</h1>
          <p className="text-[13px] text-[#6e6e73]">{today}</p>
        </div>
      </header>
      <section className={`${PANEL} p-5 sm:p-6`}>
        <AppDirectory session={session} />
      </section>
      <div className={`grid gap-5 ${highlights.length > 0 ? "lg:grid-cols-2" : ""}`}>
        <section className={`${PANEL} px-5 py-4 sm:px-6`}>
          <h2 className="text-[13px] font-semibold text-[#1d1d1f]">To do{attention.length > 0 && <span className="ml-2 font-normal text-[#86868b]">{attention.length}</span>}</h2>
          <div className="mt-2">
            {attention.map((item) => (
              <Link key={item.id} href={item.href} className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2 text-[13px] text-[#1d1d1f] hover:bg-black/[0.04]">
                <span aria-hidden className={`size-1.5 shrink-0 rounded-full ${DOT[item.severity]}`} />
                <span className="min-w-0 flex-1">{item.label}</span>
                {item.severity !== "info" && <span className="shrink-0 text-[11px] text-[#86868b]">{item.severity === "critical" ? "Urgent" : "Review"}</span>}
              </Link>
            ))}
            {!attention.length && <p className="py-2 text-[13px] text-[#86868b]">Nothing waiting.</p>}
          </div>
        </section>
        {highlights.length > 0 && (
          <section className={`${PANEL} px-5 py-4 sm:px-6`}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[13px] font-semibold text-[#1d1d1f]">Goals</h2>
              <Link href="/kpis" className="text-[12px] text-[#0071e3]">All goals</Link>
            </div>
            <div className="mt-3 flex flex-col gap-4">
              {highlights.map((goal) => (
                <Link key={goal.id} href={goal.planId ? `/kpis/plans/${goal.planId}` : `/kpis/${goal.id}`} className="block">
                  <p className="text-[11px] text-[#86868b]">{goal.visibility === "COMPANY" ? goal.department || goal.teamName : goal.personName || "Personal"}{goal.metricName ? ` · ${goal.metricName}` : ""}</p>
                  <div className="mt-1"><GoalMeter name={goal.name} actual={goal.actual} target={goal.target} elapsed={goal.elapsed} verdict={goal.verdict} unit={goal.unit} currency={goal.currency} summary={goal.summary} status={goal.status} /></div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
