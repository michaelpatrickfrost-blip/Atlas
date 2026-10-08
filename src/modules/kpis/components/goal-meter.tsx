import { formatGoalValue, verdictLabel, type GoalVerdict } from "@/modules/kpis/domain/progress";

const tone: Record<GoalVerdict, string> = {
  met: "bg-emerald-50 text-emerald-800",
  ahead: "bg-emerald-50 text-emerald-800",
  on_track: "bg-blue-50 text-blue-800",
  behind: "bg-amber-50 text-amber-900",
  at_risk: "bg-rose-50 text-rose-800",
  over: "bg-rose-50 text-rose-800",
  not_started: "bg-slate-100 text-slate-600",
  no_reading: "bg-slate-100 text-slate-600",
};

export function GoalMeter({ name, actual, target, elapsed, verdict, unit, currency, summary, status, showPace = true }: {
  name?: string;
  actual: number | null;
  target: number;
  elapsed: number;
  verdict: GoalVerdict;
  unit: string;
  currency?: string;
  summary: string;
  status?: string;
  showPace?:boolean;
}) {
  const width = actual === null || target <= 0 ? 0 : Math.max(0, Math.min(100, actual / target * 100));
  const pace = Math.max(0, Math.min(100, elapsed * 100));
  const label = status === "CLOSED" ? "Closed" : verdict === "behind" && (unit === "percent" || !showPace) ? "Below target" : verdictLabel[verdict];
  return <div>
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        {name && <p className="text-sm font-semibold">{name}</p>}
        <p className="mt-1 text-2xl font-semibold tracking-tight">{actual === null ? "—" : formatGoalValue(actual, unit, currency)} <span className="text-sm font-normal text-[var(--color-ink-muted)]">of {formatGoalValue(target, unit, currency)}</span></p>
      </div>
      <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${status === "CLOSED" ? "bg-slate-100 text-slate-600" : tone[verdict]}`}>{label}</span>
    </div>
    <div className="relative mt-3 h-2 rounded-full bg-[var(--color-surface-sunken)]">
      <div className="h-full rounded-full bg-[var(--color-atlas-blue)]" style={{ width: `${width}%` }} />
      {showPace&&unit!=="percent"&&<span className="absolute top-[-3px] h-3.5 w-0.5 bg-slate-900/70" style={{ left: `${pace}%` }} title="Where a straight line would be today" />}
    </div>
    <p className="mt-2 text-xs leading-relaxed text-[var(--color-ink-muted)]">{summary}</p>
  </div>;
}
