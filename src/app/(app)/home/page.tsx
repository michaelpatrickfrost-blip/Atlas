import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { getEnabledModuleIds } from "@/core/modules/runtime";
import { RefreshButton } from "@/components/ui/refresh-button";
import { getAttentionOverview } from "@/core/attention/aggregate";
import { AppDirectory } from "@/components/shell/app-directory";
import { CompanyMark } from "@/components/shell/company-mark";
import { GoalMeter } from "@/modules/kpis/components/goal-meter";
import { loadGoalWorkspace } from "@/modules/kpis/services/workspace";

const PANEL = "rounded-2xl border border-black/[0.06] bg-white";
const DOT = { critical: "bg-[#d12b45]", warning: "bg-[#c9820a]", info: "bg-[#c7c7cc]" } as const;

export default async function HomePage() {
  const session = await requireSession();
  const [attention, enabled] = await Promise.all([getAttentionOverview(session), getEnabledModuleIds(session.organisationId)]);
  const goalBoard = enabled.has("kpis") ? await loadGoalWorkspace(session).catch(() => null) : null;
  const highlights = goalBoard?.goals.filter((goal) => goal.status === "ACTIVE").slice(0, 4) ?? [];
  const today = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/London" }).format(new Date());
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5">
      <header className="flex flex-wrap items-center gap-3.5 pb-1 pt-1">
        <CompanyMark organisationId={session.organisationId} name={session.organisationName} size="md" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-semibold tracking-tight text-[#1d1d1f]">{session.organisationName}</h1>
          <p className="text-[13px] text-[#6e6e73]">{today}</p>
        </div>
        <Link href="/profile#assigned" className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700">My work →</Link>
      </header>
      <section aria-labelledby="launcher-title" className={`${PANEL} p-5 sm:p-7`}>
        <div className="mb-7">
          <h2 id="launcher-title" className="text-lg font-semibold tracking-tight text-[#1d1d1f]">Your apps</h2>
          <p className="mt-1 text-[13px] text-[#6e6e73]">Choose an app to get started.</p>
        </div>
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
