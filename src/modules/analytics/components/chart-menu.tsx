"use client";
import type { AnalyticsResult } from "@/core/analytics/types";
import type { StudioWidget } from "@/modules/analytics/definition";
import { MiniVisual, palettes, visualOptions } from "./charts";
import styles from "./studio.module.css";

const widths = [{ id: 4, label: "Quarter" }, { id: 6, label: "Half" }, { id: 8, label: "Wide" }, { id: 12, label: "Full" }] as const;

export function ChartMenu({ metric, widget, metrics, focus, x, y, onChange, onRemove, onClose }: {
  metric: AnalyticsResult;
  widget: StudioWidget;
  metrics: AnalyticsResult[];
  focus?: string;
  x: number;
  y: number;
  onChange: (patch: Partial<StudioWidget>) => void;
  onRemove: () => void;
  onClose: () => void;
}) {
  const sameApp = metrics.filter((item) => item.subject === metric.subject && item.id !== metric.id);
  const breakdown = widget.breakdown || metric.breakdowns?.[0]?.id;
  return <div className={styles.menu} style={{ left: x, top: y }} role="dialog" aria-label={`${metric.name} options`} onClick={(event) => event.stopPropagation()} onPointerDown={(event) => event.stopPropagation()}>
    <div className="mb-3 flex items-start justify-between gap-3">
      <div><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">{metric.subject}</p><h3 className="text-base font-semibold">{widget.title || metric.name}</h3></div>
      <button type="button" onClick={onClose} className="rounded-full px-2 text-slate-400" aria-label="Close menu">✕</button>
    </div>
    <label className="mb-4 block"><span className={styles.menuLabel}>Name</span><input aria-label="Chart title" value={widget.title ?? ""} placeholder={metric.name} maxLength={100} onChange={(event) => onChange({ title: event.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" /></label>
    {metric.breakdowns && <section className="mb-4"><p className={styles.menuLabel}>Show</p><div className="flex flex-wrap gap-1.5">{metric.breakdowns.map((item) => <button type="button" key={item.id} aria-pressed={breakdown === item.id} className={styles.choice} onClick={() => { onChange({ breakdown: item.id, category: "", visual: item.shape === "trend" && ["donut", "pie", "funnel", "gauge", "stacked"].includes(widget.visual) ? "area" : item.shape !== "trend" && ["line", "area"].includes(widget.visual) ? "bar" : widget.visual }); onClose(); }}>{item.label}</button>)}</div></section>}
    <section className="mb-4"><p className={styles.menuLabel}>Chart</p><div className="grid grid-cols-4 gap-1.5">{visualOptions.map((visual) => <button type="button" key={visual.id} aria-pressed={widget.visual === visual.id} className={`${styles.visualPick} ${widget.visual === visual.id ? styles.visualOn : ""}`} onClick={() => onChange({ visual: visual.id })}><MiniVisual type={visual.id} /><span>{visual.label}</span></button>)}</div></section>
    {sameApp.length > 0 && <section className="mb-4"><p className={styles.menuLabel}>Also in {metric.subject}</p><div className="flex flex-wrap gap-1.5">{sameApp.slice(0, 8).map((item) => <button type="button" key={item.id} className={styles.choice} onClick={() => { onChange({ metricId: item.id, breakdown: "", category: "", title: "" }); onClose(); }}>{item.name}</button>)}</div></section>}
    <section className="mb-4"><p className={styles.menuLabel}>{focus ? `Clicked · ${focus}` : "In this chart"}</p><div className="flex flex-wrap gap-1.5">{metric.points.slice(0, 8).map((point) => <button type="button" key={point.label} className={styles.choice} aria-pressed={widget.category === point.label} onClick={() => { onChange({ category: widget.category === point.label ? "" : point.label }); onClose(); }}>{point.label}</button>)}{widget.category && <button type="button" className={styles.choice} onClick={() => onChange({ category: "" })}>Show all</button>}</div></section>
    <section className="mb-4"><p className={styles.menuLabel}>Size</p><div className="flex flex-wrap gap-1.5">{widths.map((item) => <button type="button" key={item.id} aria-pressed={(widget.span ?? (widget.wide ? 6 : 4)) === item.id} className={styles.choice} onClick={() => onChange({ span: item.id, wide: item.id >= 6 })}>{item.label}</button>)}</div></section>
    <section><p className={styles.menuLabel}>Colour</p><div className="flex flex-wrap gap-2">{Object.entries(palettes).map(([key, colors]) => <button type="button" key={key} aria-label={`${key} colour`} aria-pressed={(widget.color ?? "blue") === key} onClick={() => onChange({ color: key as StudioWidget["color"] })} className={`h-7 w-7 rounded-full border-2 ${(widget.color ?? "blue") === key ? "border-slate-900" : "border-white"}`} style={{ background: colors[0] }} />)}</div></section>
    <button type="button" className="mt-4 text-xs font-medium text-rose-600" onClick={() => { onRemove(); onClose(); }}>Remove this chart</button>
    {metric.definition && <p className="mt-3 text-[11px] leading-relaxed text-slate-400">{metric.definition}</p>}
  </div>;
}
