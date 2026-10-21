import Link from "next/link";
import { ArrowUpRight, Bell, ListTodo, Target } from "lucide-react";
import { requireSession } from "@/core/auth/session";
import { enabledModulesForSession, getNavigableModules } from "@/core/modules/runtime";
import { RefreshButton } from "@/components/ui/refresh-button";
import { getAttentionOverview } from "@/core/attention/aggregate";
import { AppDirectory } from "@/components/shell/app-directory";
import { GoalMeter } from "@/modules/kpis/components/goal-meter";
import { loadGoalWorkspace } from "@/modules/kpis/services/workspace";
import { listCustomerScreens } from "@/core/studio/pages/customer-catalog";
import { loadMyTaskCount } from "@/app/(app)/profile/task-actions";
import { can } from "@/core/permissions/check";

const SEVERITY = { critical: "atlas-sev-critical", warning: "atlas-sev-warning", info: "atlas-sev-info" } as const;

/** Home: a living front page — today's numbers, then the index of apps,
 *  with attention and goals alongside. Every figure comes from the real records. */
export default async function HomePage() {
  const session = await requireSession();
  const [attention, enabled, modules, screens] = await Promise.all([
    getAttentionOverview(session),
    enabledModulesForSession(session),
    getNavigableModules(session),
    listCustomerScreens(session),
  ]);
  const [goalBoard, openTasks] = await Promise.all([
    enabled.has("kpis") ? loadGoalWorkspace(session).catch(() => null) : null,
    can(session, "core.profile.self") ? loadMyTaskCount().catch(() => null) : null,
  ]);
  const highlights = goalBoard?.goals.filter((goal) => goal.status === "ACTIVE").slice(0, 4) ?? [];
  const urgent = attention.items.filter((item) => item.severity === "critical").length;
  const now = new Date();
  const weekday = new Intl.DateTimeFormat("en-GB", { weekday: "long", timeZone: "Europe/London" }).format(now);
  const date = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", timeZone: "Europe/London" }).format(now);
  const firstName = session.userName.trim().split(/\s+/)[0] || session.userName;
  const stats: Array<{ label: string; value: number; href: string; icon: typeof Bell; tone?: string; event?: string }> = [
    { label: "Needs attention", value: attention.items.length, href: "#attention", icon: Bell, tone: urgent ? "critical" : undefined },
    ...(openTasks !== null ? [{ label: "Open tasks", value: openTasks, href: "/profile#assigned", icon: ListTodo, event: "atlas:open-tasks" }] : []),
    ...(goalBoard ? [{ label: "Active goals", value: goalBoard.goals.filter((goal) => goal.status === "ACTIVE").length, href: "/kpis", icon: Target }] : []),
  ];
  const hasSide = attention.items.length > 0 || attention.unavailableSources > 0 || highlights.length > 0;

  return (
    <div className="atlas-home mx-auto flex max-w-[1480px] flex-col">
      <header className="atlas-today atlas-reveal">
        <div className="atlas-today-copy">
          <p className="atlas-today-date"><span>{weekday}</span> {date}</p>
          <h1 id="launcher-title">Good day, {firstName}<span aria-hidden="true">.</span></h1>
          <p className="atlas-today-intro">{modules.length} apps connected for {session.organisationName}{urgent ? ` · ${urgent} ${urgent === 1 ? "item needs" : "items need"} you now` : attention.items.length ? " · a few things to review" : " · nothing waiting on you"}.</p>
        </div>
        <ul className="atlas-today-stats" aria-label="Today at a glance">
          {stats.map(({ label, value, href, icon: Icon, tone }, index) => (
            <li key={label} style={{ "--i": index } as React.CSSProperties} className="atlas-reveal">
              <Link href={href} className="atlas-stat-tile" data-tone={tone}>
                <span className="atlas-stat-tile-icon"><Icon size={16} aria-hidden="true" /></span>
                <span className="atlas-stat-tile-value">{value}</span>
                <span className="atlas-stat-tile-label">{label}</span>
                <ArrowUpRight size={14} aria-hidden="true" className="atlas-stat-tile-arrow" />
              </Link>
            </li>
          ))}
        </ul>
      </header>

      <div className={`atlas-home-grid ${hasSide ? "atlas-home-grid-side" : ""}`}>
        <section id="your-apps" aria-labelledby="your-apps-title" className="atlas-launcher atlas-reveal" style={{ "--i": 1 } as React.CSSProperties}>
          <h2 id="your-apps-title" className="atlas-section-title">Your apps<span>{modules.length}</span></h2>
          <AppDirectory session={session} variant="launcher" />
          {screens.length > 0 && <section aria-label="Your business screens" className="atlas-home-section mt-8">
            <h2 className="atlas-section-title">Your business screens<span>{screens.length}</span></h2>
            <p className="mt-2 text-xs text-[var(--color-ink-faint)]">Layouts published for {session.organisationName}.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{screens.map(screen => <Link key={screen.id} href={`/screens/${screen.id}`} className="atlas-screen-link">{screen.name}</Link>)}</div>
          </section>}
        </section>

        {hasSide && <aside className="atlas-home-side">
          {(attention.items.length > 0 || attention.unavailableSources > 0) && <section id="attention" aria-label="Needs attention" className="atlas-home-section atlas-reveal" style={{ "--i": 2 } as React.CSSProperties}>
            <h2 className="atlas-section-title">Needs attention<span>{attention.items.length}</span></h2>
            <div className="atlas-attention-list">
              {attention.items.map((item, index) => (
                <Link key={`${item.source}:${item.id}:${item.href}`} href={item.href} style={{ "--i": index } as React.CSSProperties} className={`atlas-attention-item atlas-reveal ${SEVERITY[item.severity]}`}>
                  <span aria-hidden className="atlas-attention-dot" />
                  <span className="min-w-0 flex-1"><span className="atlas-attention-source">{item.source}</span><span className="atlas-attention-label">{item.label}</span></span>
                  {item.severity !== "info" && <span className="atlas-attention-tag">{item.severity === "critical" ? "Urgent" : "Review"}</span>}
                </Link>
              ))}
              {attention.unavailableSources > 0 && <div role="status" className="atlas-attention-warning"><p>Some updates could not be loaded. This list may be incomplete.</p><RefreshButton /></div>}
            </div>
          </section>}
          {highlights.length > 0 && (
            <section className="atlas-home-section atlas-reveal" style={{ "--i": 3 } as React.CSSProperties}>
              <h2 className="atlas-section-title">Goals<span><Link href="/kpis" className="atlas-section-link">All goals</Link></span></h2>
              <div className="atlas-goal-list">
                {highlights.map((goal, index) => (
                  <Link key={goal.id} href={goal.planId ? `/kpis/plans/${goal.planId}` : `/kpis/${goal.id}`} style={{ "--i": index } as React.CSSProperties} className="atlas-goal-item atlas-reveal">
                    <p className="atlas-goal-owner">{goal.visibility === "COMPANY" ? goal.department || goal.teamName : goal.personName || "Personal"}{goal.metricName ? ` · ${goal.metricName}` : ""}</p>
                    <div className="mt-1"><GoalMeter name={goal.name} actual={goal.actual} target={goal.target} elapsed={goal.elapsed} verdict={goal.verdict} unit={goal.unit} currency={goal.currency} summary={goal.summary} status={goal.status} /></div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </aside>}
      </div>
    </div>
  );
}
