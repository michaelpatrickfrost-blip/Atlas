import type { CSSProperties, MouseEvent } from "react";
import type { AnalyticsResult } from "@/core/analytics/types";
import type { StudioWidget } from "@/modules/analytics/definition";
import { formatMoney } from "@/core/shared/money";
import styles from "./studio.module.css";

export const palettes = {
  blue: ["#0071e3", "#3b93ef", "#8ec2f8", "#d7ebfd", "#f3f9ff", "#607089"],
  teal: ["#0d7a72", "#2f9d94", "#79c4bc", "#c9ebe7", "#f1faf8", "#5d7c78"],
  violet: ["#6d4ec2", "#9276db", "#c0aeec", "#e4dcf8", "#f7f4fd", "#746888"],
  amber: ["#c4841a", "#d7a44a", "#e8c98a", "#f6ead0", "#fbf6ea", "#8a7860"],
  rose: ["#c45378", "#d8839d", "#ebc0cf", "#f8e8ee", "#fdf6f8", "#8d6f7a"],
  slate: ["#3d5270", "#6a7d98", "#a3b0c2", "#d5dce6", "#f4f7fb", "#5c6b7c"],
};

export const visualOptions: { id: StudioWidget["visual"]; label: string }[] = [
  { id: "kpi", label: "Number" },
  { id: "bar", label: "Bars" },
  { id: "stacked", label: "Split" },
  { id: "column", label: "Columns" },
  { id: "line", label: "Line" },
  { id: "area", label: "Area" },
  { id: "donut", label: "Donut" },
  { id: "pie", label: "Pie" },
  { id: "gauge", label: "Gauge" },
  { id: "funnel", label: "Funnel" },
  { id: "table", label: "Table" },
];

const number = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 1 });

export function formatPoint(value: number, metric: AnalyticsResult, currency?: string) {
  if (metric.unit === "money") return formatMoney(value, currency ?? "GBP");
  if (metric.unit === "percent") return `${Math.round(value)}%`;
  if (metric.unit === "hours") return `${number.format(value)} h`;
  return number.format(value);
}

export function pointsFor(metric: AnalyticsResult, widget: StudioWidget) {
  const filtered = metric.points.filter((point) => !widget.category || point.label === widget.category);
  if (metric.shape === "trend") return filtered;
  return [...filtered].sort((a, b) => b.value - a.value).slice(0, widget.maxCategories ?? 8);
}

export function headline(metric: AnalyticsResult, points: AnalyticsResult["points"]) {
  if (!points.length) return "—";
  if (metric.unit === "percent") return formatPoint(points[0].value, metric);
  if (metric.unit === "money") {
    if (points.length === 1) return formatPoint(points[0].value, metric, points[0].label);
    return points.slice(0, 2).map((point) => formatPoint(point.value, metric, point.label)).join(" · ");
  }
  return formatPoint(points.reduce((sum, point) => sum + point.value, 0), metric);
}

export function TileChart({ metric, widget, onPick }: { metric: AnalyticsResult; widget: StudioWidget; onPick?: (label: string, event: MouseEvent) => void }) {
  const colors = palettes[widget.color ?? "blue"];
  const points = pointsFor(metric, widget);
  const total = points.reduce((sum, point) => sum + point.value, 0);
  const pick = (label: string, event: MouseEvent) => { event.stopPropagation(); onPick?.(label, event); };
  if (metric.error) return <p role="status" className="py-8 text-sm text-amber-700">{metric.error}</p>;
  if (!points.length) return <p className="py-10 text-sm text-slate-400">Nothing in this period yet.</p>;
  if (widget.visual === "kpi") return <Kpi metric={metric} points={points} color={colors[0]} />;
  if (widget.visual === "line" || widget.visual === "area") return <Trend points={points} color={colors[0]} fill={widget.visual === "area"} metric={metric} onPick={pick} />;
  if (widget.visual === "donut" || widget.visual === "pie") return <Distribution points={points} pie={widget.visual === "pie"} colors={colors} metric={metric} onPick={pick} />;
  if (widget.visual === "column") return <Columns points={points} color={colors[0]} soft={colors[2]} metric={metric} onPick={pick} />;
  if (widget.visual === "gauge") return <Gauge metric={metric} points={points} total={total} color={colors[0]} />;
  if (widget.visual === "funnel") return <Funnel points={points} color={colors[0]} metric={metric} onPick={pick} />;
  if (widget.visual === "stacked") return <Split points={points} colors={colors} metric={metric} total={total} onPick={pick} />;
  if (widget.visual === "table") return <DataTable points={points} metric={metric} onPick={pick} />;
  return <Bars points={points} color={colors[0]} soft={colors[2]} metric={metric} onPick={pick} />;
}

function Kpi({ metric, points, color }: { metric: AnalyticsResult; points: AnalyticsResult["points"]; color: string }) {
  const trend = metric.shape === "trend" && points.length >= 2 ? points.at(-1)!.value - points.at(-2)!.value : null;
  const max = Math.max(1, ...points.map((point) => point.value));
  return <div className="mt-5">
    <p className={styles.kpi}>{headline(metric, points)}</p>
    <div className="mt-4 flex items-end justify-between gap-4">
      <p className="text-[11px] text-slate-400">{trend === null ? `${points.length} ${points.length === 1 ? "group" : "groups"}` : `${trend > 0 ? "+" : ""}${formatPoint(trend, metric)} vs prior`}</p>
      <div aria-hidden="true" className={styles.spark}>{points.slice(-12).map((point, index) => <span key={`${point.label}-${index}`} style={{ height: `${Math.max(8, point.value / max * 100)}%`, background: color }} />)}</div>
    </div>
  </div>;
}

function Trend({ points, color, fill, metric, onPick }: { points: AnalyticsResult["points"]; color: string; fill: boolean; metric: AnalyticsResult; onPick?: (label: string, event: MouseEvent) => void }) {
  const width = 640;
  const height = 220;
  const pad = 28;
  const max = Math.max(1, ...points.map((point) => point.value));
  const step = points.length > 1 ? (width - pad * 2) / (points.length - 1) : 0;
  const coords = points.map((point, index) => ({ ...point, x: pad + index * step, y: height - pad - (point.value / max) * (height - pad * 2) }));
  const line = coords.map((point, index) => `${index ? "L" : "M"}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");
  const area = coords.length ? `${line} L${coords.at(-1)!.x.toFixed(1)},${height - pad} L${coords[0].x.toFixed(1)},${height - pad} Z` : "";
  const labels = [coords[0], coords[Math.floor((coords.length - 1) / 2)], coords.at(-1)].filter((point, index, list) => point && list.findIndex((item) => item?.label === point.label) === index);
  return <svg viewBox={`0 0 ${width} ${height}`} className="mt-4 w-full" role="img" aria-label={`${metric.name} over time`}>
    {[0.25, 0.5, 0.75].map((mark) => <line key={mark} x1={pad} x2={width - pad} y1={height - pad - mark * (height - pad * 2)} y2={height - pad - mark * (height - pad * 2)} stroke="#e6ebf2" strokeWidth="1" />)}
    {fill && <path d={area} fill={color} opacity="0.16" />}
    <path d={line} fill="none" stroke={color} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
    {coords.map((point) => <circle key={point.label} cx={point.x} cy={point.y} r="8" fill="white" stroke={color} strokeWidth="2" className="cursor-pointer" onClick={(event) => onPick?.(point.label, event)}><title>{`${point.label}: ${formatPoint(point.value, metric, metric.unit === "money" ? point.label : undefined)}`}</title></circle>)}
    {labels.map((point) => point && <text key={point.label} x={point.x} y={height - 8} textAnchor="middle" fontSize="11" fill="#8b97a8">{point.label}</text>)}
  </svg>;
}

function Columns({ points, color, soft, metric, onPick }: { points: AnalyticsResult["points"]; color: string; soft: string; metric: AnalyticsResult; onPick?: (label: string, event: MouseEvent) => void }) {
  const max = Math.max(1, ...points.map((point) => point.value));
  return <div className="mt-5 overflow-x-auto"><div className="flex h-52 min-w-[220px] items-end gap-3 border-b border-slate-200 px-1">{points.map((point) => <button type="button" key={point.label} title={`${point.label}: ${formatPoint(point.value, metric, metric.unit === "money" ? point.label : undefined)}`} onClick={(event) => onPick?.(point.label, event)} className="flex h-full min-w-8 flex-1 flex-col items-center justify-end gap-2"><span className="text-[10px] font-medium text-slate-500">{formatPoint(point.value, metric, metric.unit === "money" ? point.label : undefined)}</span><span className="w-full max-w-14 rounded-t-lg" style={{ height: `${Math.max(4, point.value / max * 78)}%`, background: `linear-gradient(180deg, ${soft}, ${color})` }} /></button>)}</div><div className="mt-2 flex gap-3 px-1">{points.map((point) => <button type="button" key={point.label} onClick={(event) => onPick?.(point.label, event)} className="min-w-8 flex-1 truncate text-center text-[10px] text-slate-400" title={point.label}>{point.label}</button>)}</div></div>;
}

function Bars({ points, color, soft, metric, onPick }: { points: AnalyticsResult["points"]; color: string; soft: string; metric: AnalyticsResult; onPick?: (label: string, event: MouseEvent) => void }) {
  const max = Math.max(1, ...points.map((point) => point.value));
  return <div className="mt-5 space-y-4">{points.map((point, index) => <button type="button" key={point.label} onClick={(event) => onPick?.(point.label, event)} className="block w-full text-left"><div className="mb-1.5 flex justify-between gap-3 text-[12px]"><span className="truncate text-slate-500"><span className="mr-2 font-mono text-[10px] text-slate-300">{String(index + 1).padStart(2, "0")}</span>{point.label}</span><span className="font-medium">{formatPoint(point.value, metric, metric.unit === "money" ? point.label : undefined)}</span></div><div className="h-2.5 rounded-full bg-slate-100"><div className="h-full rounded-full" style={{ width: `${Math.max(2, point.value / max * 100)}%`, background: `linear-gradient(90deg, ${color}, ${soft})` }} /></div></button>)}</div>;
}

function Split({ points, colors, metric, total, onPick }: { points: AnalyticsResult["points"]; colors: string[]; metric: AnalyticsResult; total: number; onPick?: (label: string, event: MouseEvent) => void }) {
  return <div className="mt-6"><div className="flex h-8 overflow-hidden rounded-full bg-slate-100">{points.filter((point) => point.value > 0).map((point, index) => <button type="button" key={point.label} title={`${point.label}: ${formatPoint(point.value, metric, metric.unit === "money" ? point.label : undefined)}`} onClick={(event) => onPick?.(point.label, event)} style={{ width: `${total ? point.value / total * 100 : 0}%`, background: colors[index % colors.length] }} />)}</div><div className="mt-4 space-y-2">{points.map((point, index) => <button type="button" key={point.label} onClick={(event) => onPick?.(point.label, event)} className="flex w-full items-center gap-2 text-left text-[12px]"><span className="h-2.5 w-2.5 rounded-full" style={{ background: colors[index % colors.length] }} /><span className="min-w-0 flex-1 truncate text-slate-500">{point.label}</span><span className="font-medium">{total ? Math.round(point.value / total * 100) : 0}%</span></button>)}</div></div>;
}

function Funnel({ points, color, metric, onPick }: { points: AnalyticsResult["points"]; color: string; metric: AnalyticsResult; onPick?: (label: string, event: MouseEvent) => void }) {
  const max = Math.max(1, ...points.map((point) => point.value));
  return <div className="mt-5 space-y-2">{points.map((point, index) => <button type="button" key={point.label} onClick={(event) => onPick?.(point.label, event)} className="grid w-full grid-cols-[1fr_auto] items-center gap-3 text-left"><span className="h-9 rounded-lg" style={{ width: `${Math.max(18, point.value / max * 100)}%`, background: color, opacity: 1 - index * 0.08 } as CSSProperties} /><span className="text-[11px] text-slate-500">{point.label} · {formatPoint(point.value, metric, metric.unit === "money" ? point.label : undefined)}</span></button>)}</div>;
}

function Gauge({ metric, points, total, color }: { metric: AnalyticsResult; points: AnalyticsResult["points"]; total: number; color: string }) {
  const percent = metric.unit === "percent" ? Math.max(0, Math.min(100, points[0]?.value ?? 0)) : total ? Math.round(points[0].value / total * 100) : 0;
  const length = Math.PI * 78;
  return <div className="relative mx-auto mt-2 w-full max-w-[280px]"><svg viewBox="0 0 200 118" role="img" aria-label={`${percent}%`}><path d="M 22 100 A 78 78 0 0 1 178 100" fill="none" stroke="#e8eef5" strokeWidth="14" strokeLinecap="round" /><path d="M 22 100 A 78 78 0 0 1 178 100" fill="none" stroke={color} strokeWidth="14" strokeLinecap="round" strokeDasharray={`${length * percent / 100} ${length}`} /></svg><div className="absolute inset-x-0 bottom-2 text-center"><p className="text-3xl font-semibold tracking-tight">{percent}%</p><p className="text-[11px] text-slate-400">{metric.unit === "percent" ? points[0]?.label : points[0] ? `${points[0].label} share` : ""}</p></div></div>;
}

function Distribution({ points, pie, colors, metric, onPick }: { points: AnalyticsResult["points"]; pie: boolean; colors: string[]; metric: AnalyticsResult; onPick?: (label: string, event: MouseEvent) => void }) {
  const sorted = points.filter((point) => point.value > 0);
  const groups = sorted.length > 6 ? [...sorted.slice(0, 5), { label: "Other", value: sorted.slice(5).reduce((sum, point) => sum + point.value, 0) }] : sorted;
  const total = groups.reduce((sum, point) => sum + point.value, 0) || 1;
  const slices = groups.map((point, index) => {
    const before = groups.slice(0, index).reduce((sum, group) => sum + group.value, 0);
    const start = -Math.PI / 2 + before / total * Math.PI * 2;
    return { ...point, color: colors[index % colors.length], start, end: start + point.value / total * Math.PI * 2 };
  });
  return <div className="mt-4 grid items-center gap-4 sm:grid-cols-[160px_1fr]"><svg viewBox="0 0 200 200" className="mx-auto w-full max-w-[180px]" role="img" aria-label={metric.name}><circle cx="100" cy="100" r="78" fill="#f4f7fb" />{slices.map((slice) => { const large = slice.end - slice.start > Math.PI ? 1 : 0; const x1 = 100 + 78 * Math.cos(slice.start); const y1 = 100 + 78 * Math.sin(slice.start); const x2 = 100 + 78 * Math.cos(slice.end); const y2 = 100 + 78 * Math.sin(slice.end); return slice.end - slice.start >= Math.PI * 2 - 0.001 ? <circle key={slice.label} cx="100" cy="100" r="78" fill={slice.color} className="cursor-pointer" onClick={(event) => onPick?.(slice.label, event)}><title>{`${slice.label}: ${formatPoint(slice.value, metric, metric.unit === "money" ? slice.label : undefined)}`}</title></circle> : <path key={slice.label} d={`M 100 100 L ${x1} ${y1} A 78 78 0 ${large} 1 ${x2} ${y2} Z`} fill={slice.color} stroke="white" strokeWidth="2" className="cursor-pointer" onClick={(event) => onPick?.(slice.label, event)}><title>{`${slice.label}: ${formatPoint(slice.value, metric, metric.unit === "money" ? slice.label : undefined)}`}</title></path>; })}{!pie && <circle cx="100" cy="100" r="48" fill="white" pointerEvents="none" />}</svg><div className="space-y-2">{groups.map((point, index) => <button type="button" key={point.label} onClick={(event) => onPick?.(point.label, event)} className="flex w-full items-center gap-2 text-left text-[12px]"><span className="h-2 w-2 rounded-full" style={{ background: colors[index % colors.length] }} /><span className="min-w-0 flex-1 truncate text-slate-500">{point.label}</span><span className="font-medium">{Math.round(point.value / total * 100)}%</span></button>)}</div></div>;
}

function DataTable({ points, metric, onPick }: { points: AnalyticsResult["points"]; metric: AnalyticsResult; onPick?: (label: string, event: MouseEvent) => void }) {
  return <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="border-b border-slate-200 text-slate-400"><th className="pb-2 font-medium">Group</th><th className="pb-2 text-right font-medium">Value</th></tr></thead><tbody>{points.map((point) => <tr key={point.label} className="cursor-pointer border-b border-slate-100 last:border-0" onClick={(event) => onPick?.(point.label, event)}><td className="py-2.5">{point.label}</td><td className="py-2.5 text-right font-medium">{formatPoint(point.value, metric, metric.unit === "money" ? point.label : undefined)}</td></tr>)}</tbody></table></div>;
}

export function MiniVisual({ type }: { type: StudioWidget["visual"] }) {
  return <svg viewBox="0 0 100 42" aria-hidden="true" className="h-8 w-full text-[var(--color-atlas-blue,#0071e3)]">{type === "kpi" ? <text x="8" y="28" fontSize="18" fontWeight="650" fill="currentColor">128</text> : type === "line" || type === "area" ? <path d="M 8 30 L 28 22 L 48 26 L 68 12 L 92 16" fill={type === "area" ? "currentColor" : "none"} opacity={type === "area" ? 0.15 : 1} stroke="currentColor" strokeWidth="2" /> : type === "column" ? [18, 28, 16, 32, 22].map((height, index) => <rect key={index} x={8 + index * 18} y={38 - height} width="10" height={height} rx="2" fill="currentColor" opacity={0.45 + index * 0.1} />) : type === "gauge" ? <path d="M 18 32 A 32 32 0 0 1 82 32" fill="none" stroke="currentColor" strokeWidth="6" /> : type === "table" ? [10, 20, 30].map((y) => <path key={y} d={`M 8 ${y} H 92`} stroke="currentColor" opacity="0.45" />) : [72, 48, 30].map((width, index) => <rect key={index} x="8" y={6 + index * 12} width={width} height="7" rx="3" fill="currentColor" opacity={1 - index * 0.22} />)}</svg>;
}
