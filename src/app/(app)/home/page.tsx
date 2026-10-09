import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { enabledModulesForSession } from "@/core/modules/runtime";
import { RefreshButton } from "@/components/ui/refresh-button";
import { getAttentionOverview } from "@/core/attention/aggregate";
import { AppDirectory } from "@/components/shell/app-directory";
import { GoalMeter } from "@/modules/kpis/components/goal-meter";
import { loadGoalWorkspace } from "@/modules/kpis/services/workspace";

const PANEL = "rounded-2xl border border-black/[0.06] bg-white";
const DOT = { critical: "bg-[#d12b45]", warning: "bg-[#c9820a]", info: "bg-[#c7c7cc]" } as const;

export default async function HomePage() {
  const session = await requireSession();
  const [attention, enabled] = await Promise.all([getAttentionOverview(session), enabledModulesForSession(session)]);
  const goalBoard = enabled.has("kpis") ? await loadGoalWorkspace(session).catch(() => null) : null;
  const highlights = goalBoard?.goals.filter((goal) => goal.status === "ACTIVE").slice(0, 4) ?? [];
  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-5">
      <section id="your-apps" aria-labelledby="launcher-title" className="relative isolate scroll-mt-5 overflow-hidden rounded-[26px] border border-white bg-white/55 p-3 shadow-[0_10px_50px_-30px_rgba(64,98,151,0.25)] sm:p-5 lg:p-7">
        <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-16 -z-10 hidden h-[210px] w-[390px] overflow-hidden opacity-90 mix-blend-multiply lg:block"><img src="/brand/atlas-mark.png" alt="" width={515} height={400} className="w-full" /></div>
        <header className="flex min-h-[116px] items-center justify-between gap-5 px-2 pb-6 sm:px-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#526587]">Welcome to Atlas</p>
            <h1 id="launcher-title" className="mt-1.5 text-3xl font-semibold tracking-[-0.05em] text-[#090f22] sm:text-[40px] sm:leading-tight">Your apps</h1>
            <p className="mt-1.5 text-sm text-[#71809a] sm:text-base">Choose an app to get started.</p>
          </div>
          <div aria-hidden="true" className="mr-[230px] hidden shrink-0 lg:block"><p className="text-base tracking-[0.15em] text-[#526587]">Plan. Make. Deliver.</p><div className="mt-3 h-[3px] w-8 rounded-full bg-blue-600" /></div>
        </header>
        <AppDirectory session={session} variant="launcher" />
      </section>
      <div className={`grid gap-5 ${highlights.length > 0 ? "lg:grid-cols-2" : ""}`}>
        <section aria-label="Needs attention" className={`${PANEL} px-5 py-4 sm:px-6`}>
          <h2 className="text-[13px] font-semibold text-[#1d1d1f]">Needs attention{attention.items.length > 0 && <span className="ml-2 font-normal text-[#86868b]">{attention.items.length}</span>}</h2>
          <div className="mt-2">
            {attention.items.map((item) => (
              <Link key={`${item.source}:${item.id}:${item.href}`} href={item.href} className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2 text-[13px] text-[#1d1d1f] hover:bg-black/[0.04]">
                <span aria-hidden className={`size-1.5 shrink-0 rounded-full ${DOT[item.severity]}`} />
                <span className="min-w-0 flex-1"><span className="block text-[11px] text-[#86868b]">{item.source}</span><span className="mt-0.5 block">{item.label}</span></span>
                {item.severity !== "info" && <span className="shrink-0 text-[11px] text-[#86868b]">{item.severity === "critical" ? "Urgent" : "Review"}</span>}
              </Link>
            ))}
            {!attention.items.length && !attention.unavailableSources && <p className="py-2 text-[13px] text-[#86868b]">No attention items reported by your connected apps.</p>}
            {attention.unavailableSources > 0 && <div role="status" className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-amber-50 p-3"><p className="text-xs text-amber-900">Some updates could not be loaded. This list may be incomplete.</p><RefreshButton /></div>}
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
