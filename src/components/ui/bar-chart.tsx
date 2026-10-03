export type BarChartPoint = { label: string; value: number };

/** A restrained CSS bar chart — no charting library, no decoration beyond the
 *  bars themselves. Used where a single series trend communicates more than a
 *  number alone (see docs/DESIGN_SYSTEM.md). */
export function BarChart({ points }: { points: BarChartPoint[] }) {
  const max = Math.max(...points.map((p) => p.value), 1);
  return (
    <div className="flex h-36 items-stretch gap-2">
      {points.map((point) => (
        <div title={`${point.label}: ${point.value.toLocaleString("en-GB")}`} key={point.label} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
          <div
            className="w-full rounded-t-lg transition-all"
            style={{
              height: `${(point.value / max) * 100}%`,
              background: point.value === max && point.value > 0 ? "var(--color-atlas-blue)" : "var(--color-atlas-blue-soft)",
            }}
          />
          <span className="text-[11px] text-[var(--color-ink-faint)]">{point.label}</span>
        </div>
      ))}
    </div>
  );
}
