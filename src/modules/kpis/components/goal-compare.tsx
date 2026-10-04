import Link from "next/link";
import type { AnalyticsResult } from "@/core/analytics/types";
import { judgeGoal, readActual } from "@/modules/kpis/domain/progress";
import type { GoalMarker } from "@/modules/kpis/services/workspace";
import { GoalMeter } from "./goal-meter";
import styles from "@/modules/analytics/components/studio.module.css";

function periodLabel(period: string) {
  if (period === "all") return "all time";
  if (period === "30") return "the last 30 days";
  if (period === "365") return "the last 12 months";
  return "the last 90 days";
}

export function GoalCompare({ goals, metric, period }: { goals: GoalMarker[]; metric: AnalyticsResult; period: string }) {
  const matched = goals.filter((goal) => goal.metricId === metric.id).slice(0, 3);
  if (!matched.length) return null;
  return <div className={styles.goal}>{matched.map((goal) => {
    const reading = readActual(metric.points, metric.unit ?? goal.unit, goal.sliceLabel);
    const judged = judgeGoal({
      actual: reading.blocked ? null : reading.actual,
      blocked: reading.blocked,
      target: goal.target,
      direction: goal.direction,
      startsAt: new Date(goal.startsAt),
      endsAt: new Date(goal.endsAt),
      snapshot: metric.snapshot,
      unit: goal.unit === "money" || metric.unit === "money" ? "money" : goal.unit,
      currency: reading.currency || (goal.unit === "money" ? goal.sliceLabel : undefined),
    });
    const focus = goal.sliceLabel ? ` This target is only the “${goal.sliceLabel}” part of the measure.` : "";
    return <article key={goal.id} className="mt-3 first:mt-0">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Goal · {goal.department || goal.teamName}</p>
      <GoalMeter name={goal.name} actual={reading.blocked ? null : reading.actual} target={goal.target} elapsed={judged.elapsed} verdict={judged.verdict} unit={metric.unit ?? goal.unit} currency={reading.currency || goal.sliceLabel} summary={`${judged.summary}${focus} The chart is ${metric.snapshot ? "the current position" : periodLabel(period)}. The pace uses ${new Date(goal.startsAt).toLocaleDateString("en-GB", { timeZone: "UTC", day: "numeric", month: "short" })} – ${new Date(goal.endsAt).toLocaleDateString("en-GB", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" })}. ${goal.ownerName} owns it.`} />
      <Link href={`/kpis/${goal.id}`} className="mt-2 inline-block text-xs font-semibold text-[var(--color-atlas-blue)]">Open the full goal</Link>
    </article>;
  })}{goals.filter((goal) => goal.metricId === metric.id).length > 3 && <p className="mt-2 text-xs text-slate-400">More goals for this measure are on the scorecard.</p>}</div>;
}
