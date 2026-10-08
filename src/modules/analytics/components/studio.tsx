"use client";
// Builder uses dropdowns on the board. Do not restore the measure-card catalogue or chart-thumbnail menu.
import { useEffect, useState, useTransition, type CSSProperties, type SetStateAction } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, ChartNoAxesCombined, GripVertical, Monitor, Plus, Save, Trash2, LayoutTemplate, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AnalyticsResult } from "@/core/analytics/types";
import { widgetSpan, type StudioWidget } from "@/modules/analytics/definition";
import { boardTemplates, widgetsFromTemplate } from "@/modules/analytics/templates";
import { deleteAnalyticsDashboard, loadLiveMetrics, loadMetricSlice, saveAnalyticsDashboard } from "@/app/(app)/analytics/actions";
import { useLiveGoals } from "@/modules/kpis/components/use-live-goals";
import { GoalCompare } from "@/modules/kpis/components/goal-compare";
import type { GoalMarker } from "@/modules/kpis/services/workspace";
import { TileChart, palettes, visualOptions } from "./charts";
import styles from "./studio.module.css";

export type SavedBoard = { id: string; name: string; widgets: StudioWidget[]; refreshSeconds: number; updatedAt: string; updatedLabel: string };
const subjectColor: Record<string, StudioWidget["color"]> = { Sales: "blue", CRM: "violet", Customers: "teal", HR: "teal", Scheduling: "teal", Inventory: "amber", Logistics: "amber", Finance: "slate", "Customer Service": "rose", Marketing: "rose", Projects: "violet", Planning: "amber", Products: "blue", Pricing: "slate", "Goals & KPIs": "violet" };
const colours = Object.keys(palettes) as StudioWidget["color"][];

export function Studio({ metrics: initialMetrics, dashboards, selectedId, period, canManage, company, sample = false, createNew = false, templateId, startEditing = false, openMenuMetric, goals = [] }: { metrics: AnalyticsResult[]; dashboards: SavedBoard[]; selectedId?: string; period: string; canManage: boolean; company: string; sample?: boolean; createNew?: boolean; templateId?: string; startEditing?: boolean; openMenuMetric?: string; goals?: GoalMarker[] }) {
  const router = useRouter();
  const selected = dashboards.find((board) => board.id === selectedId);
  const template = boardTemplates.find((item) => item.id === templateId);
  const building = createNew || Boolean(selected);
  const initialWidgets = selected?.widgets ?? (template ? widgetsFromTemplate(template, new Set(initialMetrics.map((metric) => metric.id))) : []);
  const [name, setName] = useState(selected?.name ?? template?.name ?? "Untitled board");
  const [widgets, setWidgetsState] = useState<StudioWidget[]>(initialWidgets);
  const [refreshSeconds, setRefreshSeconds] = useState(selected?.refreshSeconds ?? 30);
  const [opened, setOpened] = useState(building);
  const [editing, setEditing] = useState(startEditing && !createNew);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const [undoStack, setUndoStack] = useState<StudioWidget[][]>([]);
  const [slices, setSlices] = useState<Record<string, { points: AnalyticsResult["points"]; shape?: "breakdown" | "trend"; error?: string }>>({});
  const [addSubject, setAddSubject] = useState("Sales");
  const [addMetricId, setAddMetricId] = useState(openMenuMetric ?? "");
  const [addBreakdown, setAddBreakdown] = useState("");
  const [addVisual, setAddVisual] = useState<StudioWidget["visual"]>("column");
  const { metrics, updatedAt, refreshError, refreshing } = useLiveMetrics(initialMetrics, period, refreshSeconds, sample);
  const liveGoals=useLiveGoals(goals,refreshSeconds,sample);
  const subjects = [...new Set(metrics.map((metric) => metric.subject))];
  const activeSubject = subjects.includes(addSubject) ? addSubject : subjects[0] ?? "";
  const addPool = metrics.filter((metric) => metric.subject === activeSubject);
  const addMetric = addPool.find((metric) => metric.id === addMetricId) ?? addPool[0];
  const base = sample ? "/analytics-preview" : "/analytics";
  const sliceRequest = widgets.map((widget) => `${widget.metricId}:${widget.breakdown ?? ""}`).join("|");

  useEffect(() => {
    if (sample) return;
    const jobs = widgets.flatMap((widget) => {
      const metric = metrics.find((item) => item.id === widget.metricId);
      if (!widget.breakdown || !metric?.breakdowns || widget.breakdown === metric.breakdowns[0]?.id) return [];
      return [{ metricId: widget.metricId, breakdown: widget.breakdown }];
    });
    if (!jobs.length) return;
    let stop = false;
    const reportingPeriod = period === "30" || period === "365" || period === "all" ? period : "90";
    Promise.all(jobs.map(async (job) => {
      try {
        const slice = await loadMetricSlice({ ...job, period: reportingPeriod });
        return [`${job.metricId}:${job.breakdown}`, slice] as const;
      } catch (error) {
        return [`${job.metricId}:${job.breakdown}`, { points: [], error: error instanceof Error ? error.message : "Could not load this view." }] as const;
      }
    })).then((entries) => { if (!stop) setSlices(Object.fromEntries(entries)); });
    return () => { stop = true; };
  }, [sliceRequest, period, updatedAt, sample, widgets, metrics]);

  function setWidgets(next: SetStateAction<StudioWidget[]>) {
    setUndoStack((stack) => [...stack.slice(-29), widgets]);
    setWidgetsState(typeof next === "function" ? next(widgets) : next);
    setMessage("");
  }
  function undo() {
    const previous = undoStack.at(-1);
    if (!previous) return;
    setUndoStack((stack) => stack.slice(0, -1));
    setWidgetsState(previous);
  }
  function go(query: string) { router.push(query ? `${base}?${query}` : base); }
  function openMonitor(id?: string) {
    if (sample || !id) { setMessage("Save the board first, then open it on a monitor. Each board can have its own window."); return; }
    const popup = window.open(`/board?dashboard=${encodeURIComponent(id)}&period=${period}`, `atlas-board-${id}`, "popup,width=1680,height=980");
    if (!popup) setMessage("Allow pop-up windows so this board can sit on another monitor.");
  }
  function applyTemplate(id: string) {
    if (sample) {
      const next = boardTemplates.find((item) => item.id === id);
      if (!next) return;
      setName(next.name);
      setWidgets(widgetsFromTemplate(next, new Set(metrics.map((metric) => metric.id))));
      setOpened(true);
      return;
    }
    go(`new=1&template=${encodeURIComponent(id)}&period=${period}`);
  }
  function changePeriod(value: string) {
    const params = new URLSearchParams({ period: value });
    if (selectedId) params.set("dashboard", selectedId);
    if (createNew) params.set("new", "1");
    if (templateId) params.set("template", templateId);
    if (editing) params.set("edit", "1");
    go(params.toString());
  }
  function shownMetric(metric: AnalyticsResult, widget: StudioWidget): AnalyticsResult {
    const id = widget.breakdown;
    if (!id || id === metric.breakdowns?.[0]?.id) return metric;
    const preview = metric.previewSlices?.[id];
    const live = slices[`${metric.id}:${id}`];
    const shape = live?.shape ?? preview?.shape ?? metric.breakdowns?.find((item) => item.id === id)?.shape ?? metric.shape;
    const points = live?.points ?? preview?.points;
    if (!points) return { ...metric, points: [], shape, error: live?.error ?? (sample ? undefined : "Loading this view…") };
    return { ...metric, points, shape, error: live?.error };
  }
  function patchWidget(widgetId: string, patch: Partial<StudioWidget>) {
    setWidgets((current) => current.map((item) => item.id === widgetId ? { ...item, ...patch } : item));
  }
  function chooseVisual(metric: AnalyticsResult, breakdownId: string, visual: StudioWidget["visual"]): StudioWidget["visual"] {
    const shape = metric.breakdowns?.find((item) => item.id === breakdownId)?.shape ?? metric.shape;
    if (shape === "trend" && ["donut", "pie", "funnel", "gauge", "stacked"].includes(visual)) return "area";
    if (shape !== "trend" && (visual === "line" || visual === "area")) return "column";
    return visual;
  }
  function addChart() {
    if (!addMetric || widgets.length >= 24) return;
    const breakdown = addBreakdown || addMetric.breakdowns?.[0]?.id || "";
    setWidgets((current) => [...current, { id: crypto.randomUUID(), metricId: addMetric.id, visual: chooseVisual(addMetric, breakdown, addVisual), wide: addVisual !== "kpi", span: addVisual === "kpi" ? 4 : 6, breakdown, color: subjectColor[addMetric.subject] ?? "blue" }]);
  }

  if (!opened) return <Gallery company={company} dashboards={dashboards} metrics={metrics} canManage={canManage} sample={sample} period={period} onCreate={() => sample ? (setOpened(true), setName("Untitled board"), setWidgets([])) : go(`new=1&period=${period}`)} onTemplate={applyTemplate} onMonitor={openMonitor} onDelete={(id) => { const board = dashboards.find((item) => item.id === id); if (!board || !window.confirm(`Delete ${board.name}?`)) return; startTransition(async () => { await deleteAnalyticsDashboard(id); router.refresh(); }); }} />;

  return <div className={`${styles.studio} space-y-4 pb-8`}>
    <header className={styles.command}>
      <div className="min-w-0 flex-1">
        <button onClick={() => sample ? (setOpened(false), setEditing(false), setWidgetsState([])) : go(period === "90" ? "" : `period=${period}`)} className="text-xs font-medium text-[var(--color-atlas-blue)]">All dashboards</button>
        {canManage ? <input aria-label="Dashboard name" value={name} maxLength={70} onChange={(event) => setName(event.target.value)} className="mt-1 w-full bg-transparent text-3xl font-semibold tracking-tight outline-none" /> : <h1 className="mt-1 truncate text-3xl font-semibold tracking-tight">{name}</h1>}
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500"><span className={styles.live}><Radio size={12} />{sample ? "Sample figures" : refreshing ? "Refreshing" : "Live company data"}</span><span>{company}</span>{updatedAt && <span>Updated {updatedAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>}{refreshError && <span className="text-amber-700">{refreshError}</span>}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className={styles.pills} role="group" aria-label="Refresh">{([[0, "Off"], [15, "15s"], [30, "30s"], [60, "1m"], [120, "2m"]] as const).map(([value, label]) => <button type="button" key={value} aria-pressed={refreshSeconds === value} className={styles.pill} onClick={() => setRefreshSeconds(value)}>{label}</button>)}</div>
        <div className={styles.pills} role="group" aria-label="Reporting period">{([["30", "30 days"], ["90", "90 days"], ["365", "Year"], ["all", "All"]] as const).map(([value, label]) => <button type="button" key={value} aria-pressed={period === value} className={styles.pill} onClick={() => changePeriod(value)}>{label}</button>)}</div>
        {canManage && <Button onClick={undo} disabled={!undoStack.length}>Undo</Button>}
        {canManage && <Button onClick={() => setEditing((value) => !value)}>{editing ? "Done arranging" : "Arrange"}</Button>}
        <Button onClick={() => openMonitor(selected?.id)}><Monitor size={15} />On a monitor</Button>
        {!sample && canManage && <Button variant="primary" disabled={pending || !widgets.length} onClick={() => startTransition(async () => { setMessage(""); try { const id = await saveAnalyticsDashboard({ name, widgets, refreshSeconds }); setMessage("Saved to your account."); go(`dashboard=${id}&period=${period}`); } catch (error) { setMessage(error instanceof Error ? error.message : "Could not save this dashboard."); } })}><Save size={15} />{pending ? "Saving" : "Save dashboard"}</Button>}
        {selected && !sample && canManage && <button type="button" className="text-xs text-rose-600" onClick={() => startTransition(async () => { if (!window.confirm(`Delete ${selected.name}?`)) return; await deleteAnalyticsDashboard(selected.id); go(""); })}>Delete</button>}
      </div>
    </header>
    {message && <p role="status" className={styles.notice}>{message}</p>}
    {canManage && <div className={styles.addBar}>
      <label>App<select aria-label="App" className={styles.select} value={activeSubject} onChange={(event) => { setAddSubject(event.target.value); setAddMetricId(""); setAddBreakdown(""); }}>{subjects.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label>What to show<select aria-label="What to show" className={styles.select} value={addMetric?.id ?? ""} onChange={(event) => { setAddMetricId(event.target.value); setAddBreakdown(""); }}>{addPool.map((metric) => <option key={metric.id} value={metric.id}>{metric.name}</option>)}</select></label>
      {addMetric?.breakdowns && <label>Show by<select aria-label="Show by" className={styles.select} value={addBreakdown || addMetric.breakdowns[0]?.id || ""} onChange={(event) => setAddBreakdown(event.target.value)}>{addMetric.breakdowns.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>}
      <label>Chart<select aria-label="Chart to add" className={styles.select} value={addVisual} onChange={(event) => setAddVisual(event.target.value as StudioWidget["visual"])}>{visualOptions.map((visual) => <option key={visual.id} value={visual.id}>{visual.label}</option>)}</select></label>
      <Button variant="primary" disabled={!addMetric || widgets.length >= 24} onClick={addChart}><Plus size={15} />Add</Button>
      <label>Layout<select aria-label="Starting layout" className={styles.select} value="" onChange={(event) => { if (event.target.value) applyTemplate(event.target.value); }}><option value="">Start from…</option>{boardTemplates.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
    </div>}
    <div className={styles.grid}>{widgets.map((widget) => {
      const source = metrics.find((item) => item.id === widget.metricId);
      const metric = source ? shownMetric(source, widget) : undefined;
      const showBy = source?.breakdowns?.find((item) => item.id === (widget.breakdown || source.breakdowns?.[0]?.id))?.label;
      return <section key={widget.id} style={{ "--span": widgetSpan(widget), "--accent": palettes[widget.color ?? "blue"][0] } as CSSProperties} className={`${styles.tile} ${widget.visual === "kpi" && widget.tone === "ink" ? styles.ink : ""}`} onDragOver={(event) => { if (editing) event.preventDefault(); }} onDrop={(event) => { event.preventDefault(); const id = event.dataTransfer.getData("text/plain"); setWidgets((current) => { const from = current.findIndex((item) => item.id === id); const to = current.findIndex((item) => item.id === widget.id); if (from < 0 || from === to) return current; const next = [...current]; const [item] = next.splice(from, 1); next.splice(to, 0, item); return next; }); }}>
        {canManage && source && <div className={styles.tileBar}>
          {editing && <span className={styles.grip} draggable onDragStart={(event) => event.dataTransfer.setData("text/plain", widget.id)} aria-label="Drag to rearrange"><GripVertical size={14} /></span>}
          <select aria-label="What this chart shows" className={styles.miniSelect} value={widget.metricId} onChange={(event) => { const next = metrics.find((item) => item.id === event.target.value); patchWidget(widget.id, { metricId: event.target.value, breakdown: next?.breakdowns?.[0]?.id ?? "", category: "", title: "", color: subjectColor[next?.subject ?? ""] ?? "blue" }); }}>{subjects.map((group) => <optgroup key={group} label={group}>{metrics.filter((item) => item.subject === group).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</optgroup>)}</select>
          {source.breakdowns && <select aria-label="Show by" className={styles.miniSelect} value={widget.breakdown || source.breakdowns[0]?.id || ""} onChange={(event) => patchWidget(widget.id, { breakdown: event.target.value, category: "", visual: chooseVisual(source, event.target.value, widget.visual) })}>{source.breakdowns.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select>}
          <select aria-label="Chart type" className={styles.miniSelect} value={widget.visual} onChange={(event) => patchWidget(widget.id, { visual: event.target.value as StudioWidget["visual"] })}>{visualOptions.map((visual) => <option key={visual.id} value={visual.id}>{visual.label}</option>)}</select>
          {editing && metric && metric.shape !== "trend" && metric.points.length > 1 && <select aria-label="Focus" className={styles.miniSelect} value={widget.category ?? ""} onChange={(event) => patchWidget(widget.id, { category: event.target.value })}><option value="">All</option>{metric.points.map((point) => <option key={point.label} value={point.label}>{point.label}</option>)}</select>}
          {editing && <select aria-label="Width" className={styles.miniSelect} value={String(widgetSpan(widget))} onChange={(event) => { const span = Number(event.target.value) as 4 | 6 | 8 | 12; patchWidget(widget.id, { span, wide: span >= 6 }); }}><option value="4">Quarter</option><option value="6">Half</option><option value="8">Wide</option><option value="12">Full</option></select>}
          {editing && <select aria-label="Colour" className={styles.miniSelect} value={widget.color ?? "blue"} onChange={(event) => patchWidget(widget.id, { color: event.target.value as StudioWidget["color"] })}>{colours.map((colour) => colour && <option key={colour} value={colour}>{colour[0].toUpperCase() + colour.slice(1)}</option>)}</select>}
          {editing && <input aria-label="Chart title" className={styles.miniSelect} value={widget.title ?? ""} placeholder="Title" maxLength={100} onChange={(event) => patchWidget(widget.id, { title: event.target.value })} />}
          <button type="button" aria-label="Remove chart" onClick={() => setWidgets((current) => current.filter((item) => item.id !== widget.id))} className="rounded-lg p-1.5 text-slate-400"><Trash2 size={14} /></button>
        </div>}
        <TileHead metric={source} widget={widget} sample={sample} viewLabel={showBy ?? ""} />
        {metric ? <TileChart metric={metric} widget={widget} onPick={(picked) => canManage ? patchWidget(widget.id, { category: widget.category === picked ? "" : picked }) : undefined} /> : <p className="py-8 text-sm text-slate-500">This measure is no longer available to your account.</p>}
        {source && !sample && <GoalCompare goals={liveGoals} metric={source} period={period} />}
      </section>;
    })}{!widgets.length && <div className={`${styles.tile} ${styles.empty}`}><ChartNoAxesCombined className="mb-3 text-[var(--color-atlas-blue)]" /><h2 className="text-lg font-semibold">Add the first chart</h2><p className="mt-2 max-w-md text-sm text-slate-500">Choose an app, what to show, and a chart. Orders can be split by status, product, category, customer or time.</p></div>}</div>
  </div>;
}

function TileHead({ metric, widget, sample, viewLabel }: { metric?: AnalyticsResult; widget: StudioWidget; sample: boolean; viewLabel: string }) {
  if (!metric) return null;
  return <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">{metric.subject} · {metric.snapshot ? "Now" : "Period"}</p><h3 className="mt-1 text-sm font-semibold" title={metric.definition}>{widget.title || metric.name}</h3>{viewLabel && <p className="mt-1 text-[11px] font-medium text-[var(--color-atlas-blue)]">{viewLabel}</p>}</div>{sample ? <span className="text-[10px] text-slate-400">Sample</span> : <Link href={metric.href} className="text-[var(--color-atlas-blue)]" aria-label={`Open ${metric.subject}`}><ArrowUpRight size={16} /></Link>}</div>;
}

function Gallery({ company, dashboards, metrics, canManage, sample, period, onCreate, onTemplate, onMonitor, onDelete }: { company: string; dashboards: SavedBoard[]; metrics: AnalyticsResult[]; canManage: boolean; sample: boolean; period: string; onCreate: () => void; onTemplate: (id: string) => void; onMonitor: (id: string) => void; onDelete: (id: string) => void }) {
  const router = useRouter();
  const base = sample ? "/analytics-preview" : "/analytics";
  const subjectsFor = (board: SavedBoard) => [...new Set(board.widgets.map((widget) => metrics.find((metric) => metric.id === widget.metricId)?.subject).filter(Boolean))].slice(0, 4);
  return <div className="space-y-8 pb-10">
    <section className={styles.hero}>
      <div className="max-w-2xl"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-100/80">Dashboards · {company}</p><h1 className="mt-3 text-4xl font-semibold tracking-tight">Every part of the business, on one board</h1><p className="mt-4 max-w-xl text-sm leading-relaxed text-blue-100/80">Pull live figures from any app you can open. Change the chart, mix sales with service, stock and people, and put each board on its own monitor.</p></div>
      {canManage && <Button className="bg-white text-slate-900 hover:bg-white" onClick={onCreate}><Plus size={16} />New dashboard</Button>}
    </section>
    <section><div className="mb-3 flex items-center gap-2"><LayoutTemplate size={16} className="text-[var(--color-atlas-blue)]" /><h2 className="text-sm font-semibold">Start from the business</h2></div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{boardTemplates.map((template) => <button key={template.id} onClick={() => onTemplate(template.id)} className={styles.template}><span className="text-sm font-semibold">{template.name}</span><span className="mt-2 block text-xs leading-relaxed text-slate-500">{template.description}</span><span className="mt-4 block text-xs font-medium text-[var(--color-atlas-blue)]">Use this layout</span></button>)}</div></section>
    <section><div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold">Your dashboards</h2><span className="text-xs text-slate-400">{dashboards.length ? `${dashboards.length} saved` : "None yet"}</span></div>{dashboards.length ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{dashboards.map((board) => <article key={board.id} className={styles.boardCard}><button onClick={() => router.push(`${base}?dashboard=${board.id}&period=${period}`)} className="block w-full text-left"><h3 className="text-lg font-semibold">{board.name}</h3><p className="mt-2 text-xs text-slate-500">{board.widgets.length} charts · {subjectsFor(board).join(" · ") || "Mixed"}</p><p className="mt-1 text-[11px] text-slate-400">Updated {board.updatedLabel} · refreshes every {board.refreshSeconds ? `${board.refreshSeconds}s` : "manual load"}</p></button><div className="mt-4 flex flex-wrap gap-2"><Button onClick={() => router.push(`${base}?dashboard=${board.id}&period=${period}`)}>Open</Button><Button onClick={() => onMonitor(board.id)}><Monitor size={14} />Monitor</Button>{canManage && <Button onClick={() => router.push(`${base}?dashboard=${board.id}&period=${period}&edit=1`)}>Arrange</Button>}{canManage && !sample && <Button onClick={() => onDelete(board.id)} aria-label={`Delete ${board.name}`}><Trash2 size={14} /></Button>}</div></article>)}</div> : <div className={styles.boardCard}><h3 className="text-lg font-semibold">No dashboards yet</h3><p className="mt-2 max-w-lg text-sm text-slate-500">Create one and add orders, pipeline, cases, headcount, stock, finance documents or anything else your profile can see.</p>{canManage && <Button variant="primary" className="mt-5" onClick={onCreate}><Plus size={16} />New dashboard</Button>}</div>}</section>
    {sample && <p className={styles.notice}>This preview uses sample figures. Saving and monitor windows use the live Dashboards app.</p>}
  </div>;
}

function useLiveMetrics(initial: AnalyticsResult[], period: string, seconds: number, sample: boolean) {
  const [metrics, setMetrics] = useState(initial);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [refreshError, setRefreshError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  useEffect(() => {
    if (sample || seconds <= 0) return;
    let stop = false;
    const tick = async () => {
      if (document.hidden) return;
      setRefreshing(true);
      try {
        const next = await loadLiveMetrics(period);
        if (!stop) { setMetrics(next); setUpdatedAt(new Date()); setRefreshError(""); }
      } catch { if (!stop) setRefreshError("Refresh paused. The last figures are still showing."); }
      finally { if (!stop) setRefreshing(false); }
    };
    const timer = window.setInterval(tick, seconds * 1000);
    return () => { stop = true; window.clearInterval(timer); };
  }, [period, seconds, sample]);
  return { metrics, updatedAt, refreshError, refreshing };
}
