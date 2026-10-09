"use client";
import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type CSSProperties,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  ChartNoAxesCombined,
  Copy,
  GripVertical,
  LayoutTemplate,
  Monitor,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings2,
  Trash2,
  Undo2,
  Redo2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AnalyticsResult } from "@/core/analytics/types";
import type { ReportSpec } from "@/core/reports/types";
import {
  dataViewSchema,
  widgetSpan,
  type BoardFilters,
  type StudioWidget,
} from "@/modules/analytics/definition";
import {
  boardTemplates,
  widgetsFromTemplate,
} from "@/modules/analytics/templates";
import {
  deleteAnalyticsDashboard,
  loadDashboardData,
  loadLiveMetrics,
  loadMetricSlice,
  saveAnalyticsDashboard,
} from "@/app/(app)/analytics/actions";
import { useLiveGoals } from "@/modules/kpis/components/use-live-goals";
import { GoalCompare } from "@/modules/kpis/components/goal-compare";
import type { GoalMarker } from "@/modules/kpis/services/workspace";
import { TileChart, MiniVisual, palettes, visualOptions } from "./charts";
import styles from "./studio.module.css";
export type SavedBoard = {
  id: string;
  name: string;
  widgets: StudioWidget[];
  refreshSeconds: number;
  filters?: BoardFilters;
  updatedAt: string;
  updatedLabel: string;
};
type BoardState = {
  name: string;
  widgets: StudioWidget[];
  refreshSeconds: number;
  filters: BoardFilters;
};
const emptyFilters: BoardFilters = { from: "", to: "", search: "" };
const colours = Object.keys(palettes) as NonNullable<StudioWidget["color"]>[];
export function Studio({
  metrics: initialMetrics,
  datasets = [],
  dashboards,
  selectedId,
  period: initialPeriod,
  canManage,
  company,
  sample = false,
  createNew = false,
  templateId,
  startEditing = false,
  openMenuMetric,
  goals = [],
}: {
  metrics: AnalyticsResult[];
  datasets?: ReportSpec[];
  dashboards: SavedBoard[];
  selectedId?: string;
  period: string;
  canManage: boolean;
  company: string;
  sample?: boolean;
  createNew?: boolean;
  templateId?: string;
  startEditing?: boolean;
  openMenuMetric?: string;
  goals?: GoalMarker[];
}) {
  const router = useRouter(),
    selected = dashboards.find((b) => b.id === selectedId),
    template = boardTemplates.find((t) => t.id === templateId);
  const initial: BoardState = {
    name: selected?.name ?? template?.name ?? "Untitled dashboard",
    widgets:
      selected?.widgets ??
      (template
        ? widgetsFromTemplate(
            template,
            new Set(initialMetrics.map((m) => m.id)),
          )
        : []),
    refreshSeconds: selected?.refreshSeconds ?? 30,
    filters: selected?.filters ?? emptyFilters,
  };
  const [board, setBoard] = useState(initial),
    [opened, setOpened] = useState(createNew || !!selected),
    [editing, setEditing] = useState(
      createNew || startEditing || !!openMenuMetric,
    ),
    [focused, setFocused] = useState<string | null>(
      initial.widgets.find((w) => w.metricId === openMenuMetric)?.id ?? null,
    ),
    [library, setLibrary] = useState(
      (createNew && !template) || !!openMenuMetric,
    ),
    [libraryKind, setLibraryKind] = useState<"measures" | "records">(
      "measures",
    ),
    [search, setSearch] = useState(""),
    [subject, setSubject] = useState("All apps"),
    [message, setMessage] = useState(""),
    [dirty, setDirty] = useState(false),
    [period, setPeriod] = useState(initialPeriod),
    [history, setHistory] = useState<BoardState[]>([]),
    [future, setFuture] = useState<BoardState[]>([]),
    [pending, startTransition] = useTransition(),
    [tick, setTick] = useState(0);
  const [data, setData] = useState<Record<string, AnalyticsResult>>({}),
    [slices, setSlices] = useState<
      Record<string, Pick<AnalyticsResult, "points" | "shape" | "error">>
    >({}),
    [dataLoading, setDataLoading] = useState(false);
  const [loadedKey, setLoadedKey] = useState("");
  const { metrics, updated, refreshError, refreshing } = useLiveMetrics(
    initialMetrics,
    period,
    board.refreshSeconds,
    sample,
    tick,
  );
  const liveGoals = useLiveGoals(goals, board.refreshSeconds, sample || board.refreshSeconds<=0),
    active = board.widgets.find((w) => w.id === focused),
    activeMetric = active?.data
      ? data[active.id]
      : metrics.find((m) => m.id === active?.metricId),
    base = sample ? "/analytics-preview" : "/analytics";
  const queryKey = JSON.stringify({
    widgets: board.widgets.map((w) => ({
      id: w.id,
      metricId: w.metricId,
      visual: w.visual,
      wide: w.wide,
      data: w.data,
      breakdown: w.breakdown,
    })),
    filters: board.filters,
  });
  useEffect(() => {
    if (!dirty) return;
    const guard = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [dirty]);
  useEffect(() => {
    if (sample || !opened) return;
    let stopped = false;
    const jobs = board.widgets.flatMap((w) => {
      const m = metrics.find((m) => m.id === w.metricId);
      return !w.data && w.breakdown && w.breakdown !== m?.breakdowns?.[0]?.id
        ? [{ metricId: w.metricId, breakdown: w.breakdown }]
        : [];
    });
    const run = async () => {
      try {
        const result = await loadDashboardData({
          widgets: board.widgets.filter((w) => w.data),
          filters: board.filters,
        });
        if (!stopped) setData(result);
      } catch {
        if (!stopped)
          setMessage("Some data views could not load. Refresh to try again.");
      }
      const entries = [];
      for (const job of jobs) {
        try {
          entries.push([
            `${job.metricId}:${job.breakdown}`,
            await loadMetricSlice({ ...job, period }),
          ] as const);
        } catch {
          entries.push([
            `${job.metricId}:${job.breakdown}`,
            { points: [], error: "This view could not load." },
          ] as const);
        }
      }
      if (!stopped) {
        setLoadedKey(queryKey);
        setSlices(Object.fromEntries(entries));
        setDataLoading(false);
      }
    };
    const timer = window.setTimeout(() => {
      setDataLoading(true);
      setData({});
      setSlices({});
      void run();
    }, 200);
    return () => {
      stopped = true;
      window.clearTimeout(timer);
    };
    // queryKey is the serialised data query; styling edits do not refetch source records.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey, period, updated, sample, opened, tick]);
  function change(next: BoardState) {
    setHistory((h) => [...h.slice(-29), board]);
    setFuture([]);
    setBoard(next);
    setDirty(true);
    setMessage("");
  }
  function patch(id: string, p: Partial<StudioWidget>) {
    change({
      ...board,
      widgets: board.widgets.map((w) => (w.id === id ? { ...w, ...p } : w)),
    });
  }
  function patchData(p: Partial<NonNullable<StudioWidget["data"]>>) {
    if (active?.data) patch(active.id, { data: { ...active.data, ...p } });
  }
  function undo() {
    const prev = history.at(-1);
    if (!prev) return;
    setFuture((f) => [board, ...f]);
    setHistory((h) => h.slice(0, -1));
    setBoard(prev);
    setDirty(true);
  }
  function redo() {
    const next = future[0];
    if (!next) return;
    setHistory((h) => [...h, board]);
    setFuture((f) => f.slice(1));
    setBoard(next);
    setDirty(true);
  }
  function go(query = "") {
    if (
      dirty &&
      !window.confirm("Leave this dashboard and discard unsaved changes?")
    )
      return;
    router.push(query ? `${base}?${query}` : base);
  }
  function add(metric?: AnalyticsResult, dataset?: ReportSpec) {
    if (board.widgets.length >= 24) return;
    const w: StudioWidget = {
      id: crypto.randomUUID(),
      metricId: metric?.id ?? `data.${dataset!.id}`,
      visual: metric?.shape === "trend" ? "area" : "column",
      wide: true,
      span: 6,
      color: "blue",
      breakdown: metric?.breakdowns?.[0]?.id,
      data: dataset
        ? dataViewSchema.parse({
            dataset: dataset.id,
            group: dataset.columns.find((c) => c.values)?.key ?? "",
          })
        : undefined,
    };
    change({ ...board, widgets: [...board.widgets, w] });
    setFocused(w.id);
    setEditing(true);
    setLibrary(false);
  }
  function move(id: string, offset: number) {
    const from = board.widgets.findIndex((w) => w.id === id),
      to = from + offset;
    if (from < 0 || to < 0 || to >= board.widgets.length) return;
    const next = [...board.widgets];
    next.splice(to, 0, next.splice(from, 1)[0]);
    change({ ...board, widgets: next });
  }
  function duplicate(id: string) {
    const source = board.widgets.find((w) => w.id === id);
    if (!source || board.widgets.length >= 24) return;
    const w = {
      ...source,
      id: crypto.randomUUID(),
      title: `${source.title || metrics.find((m) => m.id === source.metricId)?.name || "Chart"} copy`,
    };
    change({ ...board, widgets: [...board.widgets, w] });
    setFocused(w.id);
  }
  function resolve(w: StudioWidget): AnalyticsResult | undefined {
    if (w.data)
      return (
        (loadedKey === queryKey ? data[w.id] : undefined) ?? {
          id: w.id,
          name:
            datasets.find((d) => d.id === w.data!.dataset)?.name ?? "Data view",
          subject:
            datasets.find((d) => d.id === w.data!.dataset)?.source ?? "Atlas",
          definition: "",
          grain: "Authorised matching records",
          href: "/reports",
          snapshot: false,
          points: [],
          error:
            dataLoading || loadedKey !== queryKey
              ? "Loading matching data…"
              : "Apply data settings to load this view.",
        }
      );
    const m = metrics.find((m) => m.id === w.metricId);
    if (!m || !w.breakdown || w.breakdown === m.breakdowns?.[0]?.id) return m;
    return {
      ...m,
      ...(sample
        ? m.previewSlices?.[w.breakdown]
        : slices[`${m.id}:${w.breakdown}`]),
      points:
        (sample
          ? m.previewSlices?.[w.breakdown]?.points
          : slices[`${m.id}:${w.breakdown}`]?.points) ?? [],
      shape: m.breakdowns?.find((b) => b.id === w.breakdown)?.shape ?? m.shape,
    };
  }
  function monitor() {
    if (dirty || !selected) {
      setMessage("Save your dashboard before opening its monitor view.");
      return;
    }
    if (
      !window.open(
        `/board?dashboard=${selected.id}&period=${period}`,
        `atlas-board-${selected.id}`,
        "popup,width=1680,height=980",
      )
    )
      setMessage("Allow pop-up windows to open this dashboard on a monitor.");
  }
  function save(asCopy = false) {
    startTransition(async () => {
      try {
        const id = await saveAnalyticsDashboard({
          ...board,
          period,
          name: asCopy ? `${board.name.slice(0, 60)} copy` : board.name,
          id: asCopy ? undefined : selected?.id,
          expectedUpdatedAt: asCopy ? undefined : selected?.updatedAt,
        });
        setDirty(false);
        router.push(`/analytics?dashboard=${id}&period=${period}`);
        router.refresh();
      } catch (e) {
        setMessage(
          e instanceof Error && e.message.includes("Unique constraint")
            ? "A dashboard with that name already exists. Choose another name."
            : e instanceof Error
              ? e.message
              : "Could not save. Your changes are still here.",
        );
      }
    });
  }
  const subjects = [
    "All apps",
    ...new Set([
      ...metrics.map((m) => m.subject),
      ...datasets.map((d) => d.source),
    ]),
  ];
  const match = (name: string, source: string, description: string) =>
    (subject === "All apps" || source === subject) &&
    `${name} ${description}`.toLowerCase().includes(search.toLowerCase());
  if (!opened)
    return (
      <div className={`${styles.studio} space-y-6 pb-8`}>
        <section className={styles.hero}>
          <div className="relative z-10 max-w-2xl">
            <p className={styles.eyebrow}>YOUR WORKSPACE · {company}</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-.04em] sm:text-5xl">
              Your business.
              <br />
              Your perspective.
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-6 text-slate-500">
              Build dashboards around what matters to you. Bring live data
              together, explore the details and make every view your own.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {canManage && (
                <Button
                  variant="primary"
                  onClick={() =>
                    sample
                      ? (setOpened(true), setEditing(true), setLibrary(true))
                      : go(`new=1&period=${period}`)
                  }
                >
                  <Plus size={16} />
                  New dashboard
                </Button>
              )}
              <Link href="/reports" className={styles.textLink}>
                Explore reports <ArrowUpRight size={15} />
              </Link>
            </div>
          </div>
          <img
            src="/brand/atlas-mark.png"
            alt=""
            aria-hidden="true"
            className={styles.heroMark}
          />
        </section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Your dashboards
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Private to your account · {dashboards.length} saved views
            </p>
          </div>
          <span className={styles.tag}>
            <ChartNoAxesCombined size={14} />
            {metrics.length} live measures · {datasets.length} record datasets
          </span>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {dashboards.map((b) => (
            <article key={b.id} className={styles.boardCard}>
              <button
                className="w-full text-left"
                onClick={() => go(`dashboard=${b.id}`)}
              >
                <div className={styles.boardPreview}>
                  {b.widgets.slice(0, 4).map((w) => (
                    <div key={w.id}>
                      <MiniVisual type={w.visual} />
                    </div>
                  ))}
                </div>
                <h3 className="mt-4 text-base font-semibold">{b.name}</h3>
                <p className="mt-1 text-xs text-slate-500">
                  {b.widgets.length} widgets · Updated {b.updatedLabel}
                </p>
              </button>
              <div className="mt-4 flex items-center gap-2">
                <Button onClick={() => go(`dashboard=${b.id}`)}>
                  Open dashboard <ArrowUpRight size={14} />
                </Button>
                {canManage && (
                  <button
                    aria-label={`Delete ${b.name}`}
                    className="ml-auto rounded-lg p-2 text-slate-400 hover:text-rose-600"
                    onClick={() => {
                      if (window.confirm(`Delete ${b.name}?`))
                        startTransition(async () => {
                          try {
                            await deleteAnalyticsDashboard(b.id);
                            router.refresh();
                          } catch {
                            setMessage("Could not delete this dashboard.");
                          }
                        });
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </article>
          ))}
          {!dashboards.length && (
            <div
              className={`${styles.boardCard} md:col-span-2 xl:col-span-3 py-10 text-center`}
            >
              <ChartNoAxesCombined
                className="mx-auto text-blue-600"
                size={34}
              />
              <h3 className="mt-3 font-semibold">
                A clearer picture starts here
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Start with a blank canvas or choose a layout below.
              </p>
            </div>
          )}
        </div>
        {canManage && (
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
              <LayoutTemplate size={18} className="text-blue-600" />
              Start with a little inspiration
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {boardTemplates.map((t) => (
                <button
                  key={t.id}
                  className={styles.template}
                  onClick={() =>
                    sample
                      ? (setBoard({
                          ...initial,
                          name: t.name,
                          widgets: widgetsFromTemplate(
                            t,
                            new Set(metrics.map((m) => m.id)),
                          ),
                        }),
                        setOpened(true),
                        setEditing(true))
                      : go(`new=1&template=${t.id}&period=${period}`)
                  }
                >
                  <div className="mb-4 flex gap-2 text-blue-600">
                    {t.picks.slice(0, 3).map((w, i) => (
                      <MiniVisual key={i} type={w.visual} />
                    ))}
                  </div>
                  <span className="font-semibold">{t.name}</span>
                  <span className="mt-2 block text-xs leading-5 text-slate-500">
                    {t.description}
                  </span>
                  <span className="mt-3 block text-xs font-semibold text-blue-600">
                    Use this layout →
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}
        {message && (
          <p role="status" className={styles.notice}>
            {message}
          </p>
        )}
        {sample && (
          <p className={styles.notice}>
            Design preview · sample figures. Sign in to save your own dashboard.
          </p>
        )}
      </div>
    );
  const inspectorDataset = datasets.find((d) => d.id === active?.data?.dataset);
  return (
    <fieldset
      disabled={pending}
      aria-busy={pending}
      className={`${styles.studio} min-w-0 space-y-4 pb-8`}
    >
      <header className={styles.command}>
        <div className="min-w-0 flex-1">
          <button
            onClick={() => (sample ? setOpened(false) : go())}
            className="text-xs font-semibold text-blue-600"
          >
            ← Your dashboards
          </button>
          <h1 className="mt-2 truncate text-2xl font-semibold tracking-tight sm:text-3xl">
            {board.name}
          </h1>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className={styles.live}>
              <span className="size-1.5 rounded-full bg-emerald-500" />
              {sample
                ? "Sample figures"
                : refreshing || dataLoading
                  ? "Refreshing data"
                  : "Live company data"}
            </span>
            <span>· {company}</span>
            {dirty && <span className="text-amber-700">· Unsaved changes</span>}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => setTick((t) => t + 1)}
            aria-label="Refresh dashboard"
            disabled={refreshing || dataLoading}
          >
            <RefreshCw size={15} />
          </Button>
          <Button onClick={monitor}>
            <Monitor size={15} />
            <span className="hidden sm:inline">Monitor</span>
          </Button>
          {canManage && (
            <Button
              onClick={() => {
                setEditing(!editing);
                setFocused(null);
                setLibrary(false);
              }}
            >
              <Settings2 size={15} />
              {editing ? "View dashboard" : "Edit dashboard"}
            </Button>
          )}
          {canManage && !sample && (
            <Button
              variant="primary"
              disabled={pending || !board.widgets.length}
              onClick={() => save()}
            >
              <Save size={15} />
              {pending ? "Saving…" : "Save"}
            </Button>
          )}
        </div>
      </header>
      <div className={styles.filters}>
        <label>
          Measure period
          <select
            aria-label="Measure period"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            {[
              ["30", "Last 30 days"],
              ["90", "Last 90 days"],
              ["365", "Last year"],
              ["all", "All time"],
            ].map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label>
          Records from
          <input
            aria-label="Records from"
            type="date"
            value={board.filters.from}
            onChange={(e) =>
              change({
                ...board,
                filters: { ...board.filters, from: e.target.value },
              })
            }
          />
        </label>
        <label>
          Records to
          <input
            aria-label="Records to"
            type="date"
            value={board.filters.to}
            onChange={(e) =>
              change({
                ...board,
                filters: { ...board.filters, to: e.target.value },
              })
            }
          />
        </label>
        <label className="flex-1">
          Record search
          <input
            aria-label="Record search"
            placeholder="Customer, reference, product…"
            value={board.filters.search}
            maxLength={200}
            onChange={(e) =>
              change({
                ...board,
                filters: { ...board.filters, search: e.target.value },
              })
            }
          />
        </label>
        <Button onClick={() => change({ ...board, filters: emptyFilters })}>
          Reset
        </Button>
        <p className="w-full text-[11px] text-slate-400">
          Date ranges and search apply to supporting record datasets. Curated
          measures use the measure period; current snapshots stay current.
          Widget filters can override the board.
        </p>
      </div>
      {(message || refreshError) && (
        <p role="status" className={styles.notice}>
          {message || refreshError}
        </p>
      )}
      {editing && canManage && (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="primary"
            disabled={board.widgets.length >= 24}
            onClick={() => {
              setLibrary(!library);
              setFocused(null);
            }}
          >
            <Plus size={15} />
            Add widget
          </Button>
          <Button
            aria-label="Undo dashboard change"
            onClick={undo}
            disabled={!history.length}
          >
            <Undo2 size={15} />
          </Button>
          <Button
            aria-label="Redo dashboard change"
            onClick={redo}
            disabled={!future.length}
          >
            <Redo2 size={15} />
          </Button>
          <label className="ml-1 flex min-w-0 flex-1 items-center gap-2 text-xs text-slate-500">
            Name
            <input
              aria-label="Dashboard name"
              maxLength={70}
              value={board.name}
              onChange={(e) => change({ ...board, name: e.target.value })}
              className={styles.select}
            />
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-500">
            Refresh
            <select
              aria-label="Dashboard refresh"
              className={styles.select}
              value={board.refreshSeconds}
              onChange={(e) =>
                change({ ...board, refreshSeconds: Number(e.target.value) })
              }
            >
              {[
                [0, "Manual"],
                [15, "15 seconds"],
                [30, "30 seconds"],
                [60, "1 minute"],
                [120, "2 minutes"],
              ].map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          {selected && !sample && (
            <Button disabled={pending} onClick={() => save(true)}>
              <Copy size={14} />
              Save a copy
            </Button>
          )}
          <span className="text-xs text-slate-400">
            {board.widgets.length}/24 widgets
          </span>
        </div>
      )}
      {editing && library && (
        <section className={styles.library} aria-label="Widget library">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">What would you like to show?</h2>
            <button
              onClick={() => setLibrary(false)}
              aria-label="Close widget library"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className={styles.pills}>
              <button
                className={styles.pill}
                aria-pressed={libraryKind === "measures"}
                onClick={() => setLibraryKind("measures")}
              >
                Business measures
              </button>
              <button
                className={styles.pill}
                aria-pressed={libraryKind === "records"}
                onClick={() => setLibraryKind("records")}
              >
                Build from records
              </button>
            </div>
            <label className="relative flex-1">
              <Search
                size={15}
                className="absolute left-3 top-3 text-slate-400"
              />
              <input
                aria-label="Search widget data"
                className={`${styles.select} w-full pl-9`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search data and measures…"
              />
            </label>
            <select
              aria-label="Filter widget apps"
              className={styles.select}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            >
              {subjects.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className={styles.libraryGrid}>
            {libraryKind === "measures"
              ? metrics
                  .filter((m) => match(m.name, m.subject, m.definition))
                  .map((m) => (
                    <button
                      key={m.id}
                      className={styles.metric}
                      onClick={() => add(m)}
                    >
                      <span>
                        <span className={styles.eyebrow}>{m.subject}</span>
                        <span className="mt-1 block text-sm font-semibold">
                          {m.name}
                        </span>
                        <span className="mt-1 line-clamp-2 block text-xs leading-5 text-slate-500">
                          {m.definition}
                        </span>
                      </span>
                      <Plus size={17} className="shrink-0 text-blue-600" />
                    </button>
                  ))
              : datasets
                  .filter((d) => match(d.name, d.source, d.description))
                  .map((d) => (
                    <button
                      key={d.id}
                      className={styles.metric}
                      onClick={() => add(undefined, d)}
                    >
                      <span>
                        <span className={styles.eyebrow}>{d.source}</span>
                        <span className="mt-1 block text-sm font-semibold">
                          {d.name}
                        </span>
                        <span className="mt-1 block text-xs text-slate-500">
                          {d.columns.length} fields · Group, calculate and
                          filter
                        </span>
                      </span>
                      <Plus size={17} className="shrink-0 text-blue-600" />
                    </button>
                  ))}
          </div>
          {libraryKind === "records" && !datasets.length && (
            <p className="text-sm text-slate-500">
              Record datasets appear when your profile has access to their
              source apps.
            </p>
          )}
        </section>
      )}
      <div
        className={`${styles.workspace} ${editing && active ? styles.withInspector : ""}`}
      >
        <div className={styles.grid} aria-label="Dashboard canvas">
          {board.widgets.map((w, index) => {
            const m = resolve(w);
            return (
              <section
                key={w.id}
                data-widget-id={w.id}
                className={`${styles.tile} ${editing && focused === w.id ? styles.selected : ""} ${w.tone === "ink" ? styles.ink : w.tone === "blue" ? styles.soft : ""} ${w.borderless ? styles.borderless : ""}`}
                style={
                  {
                    "--span": widgetSpan(w),
                    "--accent": palettes[w.color ?? "blue"][0],
                    "--tile-height":
                      w.height === "tall"
                        ? "420px"
                        : w.height === "compact"
                          ? "180px"
                          : "280px",
                  } as CSSProperties
                }
                onDragOver={(e) => {
                  if (editing) e.preventDefault();
                }}
                onDrop={(e) => {
                  if (!editing) return;
                  e.preventDefault();
                  const id = e.dataTransfer.getData("text/plain"),
                    from = board.widgets.findIndex((w) => w.id === id);
                  if (from >= 0) move(id, index - from);
                }}
              >
                <div className="mb-3 flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className={styles.eyebrow}>
                      {m?.subject ?? "Unavailable"}
                      {w.data ? " · Data view" : ""}
                    </p>
                    <h2 className="mt-1 text-sm font-semibold">
                      {w.title || m?.name || "Unavailable measure"}
                    </h2>
                    {w.category && (
                      <button
                        className="mt-1 text-xs text-blue-600"
                        onClick={() => patch(w.id, { category: "" })}
                      >
                        Focus: {w.category} ×
                      </button>
                    )}
                  </div>
                  {editing && canManage && (
                    <>
                      <span
                        draggable
                        onDragStart={(e) =>
                          e.dataTransfer.setData("text/plain", w.id)
                        }
                        title="Drag to reorder"
                        className={styles.grip}
                      >
                        <GripVertical size={17} />
                      </span>
                      <button
                        aria-label={`Configure widget ${index + 1}`}
                        onClick={() => {
                          setFocused(focused === w.id ? null : w.id);
                          setLibrary(false);
                        }}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600"
                      >
                        <Settings2 size={17} />
                      </button>
                    </>
                  )}
                </div>
                <div className={styles.chartBody}>
                  {m ? (
                    <TileChart
                      metric={m}
                      widget={w}
                      onPick={(label) =>
                        patch(w.id, {
                          category: w.category === label ? "" : label,
                        })
                      }
                    />
                  ) : (
                    <p className="py-8 text-sm text-slate-500">
                      This measure is no longer available to your account.
                    </p>
                  )}
                </div>
                {m && !w.data && !sample && (
                  <GoalCompare goals={liveGoals} metric={m} period={period} />
                )}
                <div className="mt-4 flex items-end gap-2 border-t border-slate-100 pt-3">
                  <p className="min-w-0 flex-1 text-[10px] leading-4 text-slate-400">
                    {m?.grain}
                    {m?.snapshot ? " · Current snapshot" : ""}
                    {w.data && m?.definition ? ` · ${m.definition}` : ""}
                  </p>
                  {m && (
                    <Link
                      prefetch={false}
                      href={
                        w.data
                          ? `/reports?dataset=${encodeURIComponent(w.data.dataset)}`
                          : m.href
                      }
                      aria-label={`Open source for widget ${index + 1}`}
                      className="shrink-0 text-blue-600"
                    >
                      <ArrowUpRight size={15} />
                    </Link>
                  )}
                </div>
              </section>
            );
          })}
          {!board.widgets.length && (
            <div className={`${styles.tile} ${styles.empty}`}>
              <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <ChartNoAxesCombined size={30} />
              </div>
              <h2 className="mt-4 text-xl font-semibold">
                Make room for what matters
              </h2>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                Add a business measure or build a chart from records. Choose the
                data, shape the view and arrange it your way.
              </p>
              {canManage && (
                <Button
                  className="mt-5"
                  variant="primary"
                  onClick={() => setLibrary(true)}
                >
                  <Plus size={15} />
                  Choose your first widget
                </Button>
              )}
            </div>
          )}
        </div>
        {editing && active && canManage && (
          <aside className={styles.panel} aria-label="Widget inspector">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Widget settings</h2>
              <button
                onClick={() => setFocused(null)}
                aria-label="Close widget settings"
              >
                <X size={18} />
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Make this view work for you.
            </p>
            <Field label="Chart title">
              <input
                aria-label="Chart title"
                maxLength={100}
                value={active.title ?? ""}
                placeholder={activeMetric?.name}
                onChange={(e) => patch(active.id, { title: e.target.value })}
              />
            </Field>
            {active.data && inspectorDataset ? (
              <>
                <Field label="Dataset">
                  <select
                    aria-label="Widget dataset"
                    value={active.data.dataset}
                    onChange={(e) =>
                      patch(active.id, {
                        data: dataViewSchema.parse({ dataset: e.target.value }),
                        category: "",
                      })
                    }
                  >
                    {datasets.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.source} · {d.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Group by">
                  <select
                    aria-label="Group by"
                    value={active.data.group}
                    onChange={(e) => patchData({ group: e.target.value })}
                  >
                    <option value="">All records</option>
                    {inspectorDataset.columns.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </Field>
                {inspectorDataset.columns.find(
                  (c) => c.key === active.data?.group,
                )?.type === "date" && (
                  <Field label="Date grouping">
                    <select
                      aria-label="Date grouping"
                      value={active.data.bucket}
                      onChange={(e) =>
                        patchData({
                          bucket: e.target.value as "day" | "month" | "year",
                        })
                      }
                    >
                      <option value="day">Day</option>
                      <option value="month">Month</option>
                      <option value="year">Year</option>
                    </select>
                  </Field>
                )}
                <Field label="Calculation">
                  <select
                    aria-label="Calculation"
                    value={active.data.aggregation}
                    onChange={(e) =>
                      patchData({
                        aggregation: e.target.value as NonNullable<
                          StudioWidget["data"]
                        >["aggregation"],
                        measure: "",
                      })
                    }
                  >
                    {[
                      ["count", "Count records"],
                      ["sum", "Total"],
                      ["average", "Average"],
                      ["min", "Lowest value"],
                      ["max", "Highest value"],
                      ["distinct", "Count distinct values"],
                    ].map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </Field>
                {active.data.aggregation !== "count" && (
                  <Field label="Value field">
                    <select
                      aria-label="Value field"
                      value={active.data.measure}
                      onChange={(e) => patchData({ measure: e.target.value })}
                    >
                      <option value="">Choose a field</option>
                      {inspectorDataset.columns
                        .filter(
                          (c) =>
                            active.data?.aggregation === "distinct" ||
                            ["number", "money"].includes(c.type || ""),
                        )
                        .map((c) => (
                          <option key={c.key} value={c.key}>
                            {c.label}
                          </option>
                        ))}
                    </select>
                  </Field>
                )}
                {inspectorDataset.columns.find(
                  (c) => c.key === active.data?.measure,
                )?.type === "money" &&
                  active.data.aggregation !== "count" && (
                    <Field label="Currency">
                      <input
                        aria-label="Widget currency"
                        maxLength={10}
                        placeholder="GBP"
                        value={active.data.currency}
                        onChange={(e) =>
                          patchData({ currency: e.target.value.toUpperCase() })
                        }
                      />
                    </Field>
                  )}
                <details className={styles.details}>
                  <summary>
                    Record filters{" "}
                    <span className="text-slate-400">
                      ({active.data.filters.length})
                    </span>
                  </summary>
                  <Field label="Search">
                    <input
                      aria-label="Widget record search"
                      maxLength={200}
                      value={active.data.search}
                      onChange={(e) => patchData({ search: e.target.value })}
                      placeholder="Use board search"
                    />
                  </Field>
                  {inspectorDataset.dateField && (
                    <>
                      <Field label="From">
                        <input
                          type="date"
                          aria-label="Widget from"
                          value={active.data.from}
                          onChange={(e) => patchData({ from: e.target.value })}
                        />
                      </Field>
                      <Field label="To">
                        <input
                          type="date"
                          aria-label="Widget to"
                          value={active.data.to}
                          onChange={(e) => patchData({ to: e.target.value })}
                        />
                      </Field>
                    </>
                  )}
                  {active.data.filters.map((f, i) => {
                    const col = inspectorDataset.columns.find(
                      (c) => c.key === f.field,
                    );
                    const update = (p: Partial<typeof f>) =>
                      patchData({
                        filters: active.data!.filters.map((v, n) =>
                          n === i ? { ...v, ...p } : v,
                        ),
                      });
                    return (
                      <div
                        key={i}
                        className="mt-3 space-y-2 rounded-xl bg-slate-50 p-2"
                      >
                        <select
                          aria-label={`Filter ${i + 1} field`}
                          value={f.field}
                          onChange={(e) =>
                            update({
                              field: e.target.value,
                              operator: "equals",
                              value: "",
                            })
                          }
                        >
                          {inspectorDataset.columns
                            .filter((c) => c.path)
                            .map((c) => (
                              <option key={c.key} value={c.key}>
                                {c.label}
                              </option>
                            ))}
                        </select>
                        <select
                          aria-label={`Filter ${i + 1} operator`}
                          value={f.operator}
                          onChange={(e) =>
                            update({
                              operator: e.target.value as typeof f.operator,
                            })
                          }
                        >
                          <option value="equals">Equals</option>
                          {(!col?.type || col.type === "text") &&
                            col?.searchable && (
                              <option value="contains">Contains</option>
                            )}
                          {["date", "number", "money"].includes(
                            col?.type || "",
                          ) && (
                            <>
                              <option value="gte">At least / from</option>
                              <option value="lte">At most / to</option>
                            </>
                          )}
                        </select>
                        {col?.values ? (
                          <select
                            aria-label={`Filter ${i + 1} value`}
                            value={f.value}
                            onChange={(e) => update({ value: e.target.value })}
                          >
                            <option value="">Choose value</option>
                            {col.values.map((v) => (
                              <option key={v}>{v}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            aria-label={`Filter ${i + 1} value`}
                            value={f.value}
                            type={col?.type === "date" ? "date" : "text"}
                            maxLength={200}
                            onChange={(e) => update({ value: e.target.value })}
                          />
                        )}
                        <button
                          className="text-xs text-rose-600"
                          onClick={() =>
                            patchData({
                              filters: active.data!.filters.filter(
                                (_, n) => n !== i,
                              ),
                            })
                          }
                        >
                          Remove filter
                        </button>
                      </div>
                    );
                  })}
                  <Button
                    className="mt-3"
                    disabled={
                      active.data.filters.length >= 12 ||
                      !inspectorDataset.columns.some((c) => c.path)
                    }
                    onClick={() =>
                      patchData({
                        filters: [
                          ...active.data!.filters,
                          {
                            field: inspectorDataset.columns.find((c) => c.path)!
                              .key,
                            operator: "equals",
                            value: "",
                          },
                        ],
                      })
                    }
                  >
                    <Plus size={14} />
                    Add field filter
                  </Button>
                </details>
              </>
            ) : (
              <>
                <Field label="Business measure">
                  <select
                    aria-label="Business measure"
                    value={active.metricId}
                    onChange={(e) => {
                      const m = metrics.find((m) => m.id === e.target.value);
                      patch(active.id, {
                        metricId: e.target.value,
                        breakdown: m?.breakdowns?.[0]?.id,
                        category: "",
                      });
                    }}
                  >
                    {metrics.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.subject} · {m.name}
                      </option>
                    ))}
                  </select>
                </Field>
                {activeMetric?.breakdowns && (
                  <Field label="Show by">
                    <select
                      aria-label="Show by"
                      value={active.breakdown || activeMetric.breakdowns[0]?.id}
                      onChange={(e) =>
                        patch(active.id, {
                          breakdown: e.target.value,
                          category: "",
                        })
                      }
                    >
                      {activeMetric.breakdowns.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                )}
              </>
            )}
            <div className="mt-5">
              <p className={styles.menuLabel}>Visual</p>
              <div className="grid grid-cols-3 gap-1.5">
                {visualOptions.map((v) => (
                  <button
                    key={v.id}
                    aria-label={`${v.label} visual`}
                    aria-pressed={active.visual === v.id}
                    className={`${styles.visualPick} ${active.visual === v.id ? styles.visualOn : ""}`}
                    onClick={() => patch(active.id, { visual: v.id })}
                  >
                    <MiniVisual type={v.id} />
                    <span>{v.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Field label="Width">
                <select
                  aria-label="Widget width"
                  value={widgetSpan(active)}
                  onChange={(e) =>
                    patch(active.id, {
                      span: Number(e.target.value) as 4 | 6 | 8 | 12,
                    })
                  }
                >
                  {[
                    [4, "One third"],
                    [6, "Half"],
                    [8, "Two thirds"],
                    [12, "Full"],
                  ].map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Height">
                <select
                  aria-label="Widget height"
                  value={active.height ?? "standard"}
                  onChange={(e) =>
                    patch(active.id, {
                      height: e.target.value as StudioWidget["height"],
                    })
                  }
                >
                  <option value="compact">Compact</option>
                  <option value="standard">Standard</option>
                  <option value="tall">Tall</option>
                </select>
              </Field>
            </div>
            <Field label="Sort">
              <select
                aria-label="Widget sort"
                value={active.sort ?? "source"}
                onChange={(e) =>
                  patch(active.id, {
                    sort: e.target.value as StudioWidget["sort"],
                  })
                }
              >
                <option value="source">Source order</option>
                <option value="descending">Highest first</option>
                <option value="ascending">Lowest first</option>
                <option value="label">Label A–Z</option>
              </select>
            </Field>
            <Field label="Display groups">
              <input
                aria-label="Display groups"
                type="number"
                min={1}
                max={50}
                value={active.maxCategories ?? 8}
                onChange={(e) =>
                  patch(active.id, {
                    maxCategories: Math.max(
                      1,
                      Math.min(50, Number(e.target.value)),
                    ),
                  })
                }
              />
            </Field>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {(
                [
                  ["minimum", "Minimum value"],
                  ["maximum", "Maximum value"],
                ] as const
              ).map(([key, label]) => (
                <Field key={key} label={label}>
                  <input
                    aria-label={label}
                    type="number"
                    value={
                      active[key] === undefined
                        ? ""
                        : active[key]! /
                          (activeMetric?.unit === "money" ? 100 : 1)
                    }
                    onChange={(e) =>
                      patch(active.id, {
                        [key]:
                          e.target.value === ""
                            ? undefined
                            : Number(e.target.value) *
                              (activeMetric?.unit === "money" ? 100 : 1),
                      })
                    }
                  />
                </Field>
              ))}
            </div>
            <Field label="Focus category">
              <select
                aria-label="Focus category"
                value={active.category ?? ""}
                onChange={(e) => patch(active.id, { category: e.target.value })}
              >
                <option value="">All groups</option>
                {activeMetric?.points.map((p) => (
                  <option key={p.label}>{p.label}</option>
                ))}
              </select>
            </Field>
            <div className="mt-4">
              <p className={styles.menuLabel}>Colour</p>
              <div className="flex gap-2">
                {colours.map((c) => (
                  <button
                    key={c}
                    aria-label={`${c} colour`}
                    aria-pressed={(active.color ?? "blue") === c}
                    onClick={() => patch(active.id, { color: c })}
                    className="size-7 rounded-full border-2 border-white outline-offset-2 aria-pressed:outline"
                    style={{ background: palettes[c][0] }}
                  />
                ))}
              </div>
            </div>
            <Field label="Card style">
              <select
                aria-label="Card style"
                value={active.tone ?? "neutral"}
                onChange={(e) =>
                  patch(active.id, {
                    tone: e.target.value as StudioWidget["tone"],
                  })
                }
              >
                <option value="neutral">White</option>
                <option value="blue">Soft blue</option>
                <option value="ink">Midnight</option>
              </select>
            </Field>
            <label className="mt-3 flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={active.borderless ?? false}
                onChange={(e) =>
                  patch(active.id, { borderless: e.target.checked })
                }
              />
              Borderless
            </label>
            <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
              <Button
                aria-label="Move widget earlier"
                onClick={() => move(active.id, -1)}
                disabled={board.widgets[0]?.id === active.id}
              >
                <ArrowUp size={15} />
              </Button>
              <Button
                aria-label="Move widget later"
                onClick={() => move(active.id, 1)}
                disabled={board.widgets.at(-1)?.id === active.id}
              >
                <ArrowDown size={15} />
              </Button>
              <Button
                disabled={board.widgets.length >= 24}
                onClick={() => duplicate(active.id)}
              >
                <Copy size={14} />
                Duplicate
              </Button>
              <button
                className="p-2 text-rose-600"
                aria-label="Remove widget"
                onClick={() => {
                  change({
                    ...board,
                    widgets: board.widgets.filter((w) => w.id !== active.id),
                  });
                  setFocused(null);
                }}
              >
                <Trash2 size={15} />
              </button>
            </div>
            <p className="mt-4 text-[11px] leading-5 text-slate-400">
              {activeMetric?.definition || inspectorDataset?.description}{" "}
              {active.data
                ? "Calculations use all matching records, up to 10,000. Narrow filters for larger sets."
                : ""}
            </p>
          </aside>
        )}
      </div>
    </fieldset>
  );
}
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      {children}
    </label>
  );
}
function useLiveMetrics(
  initial: AnalyticsResult[],
  period: string,
  seconds: number,
  sample: boolean,
  tick: number,
) {
  const [metrics, setMetrics] = useState(initial),
    [updated, setUpdated] = useState(0),
    [refreshError, setRefreshError] = useState(""),
    [refreshing, setRefreshing] = useState(false);
  const first = useRef(true);
  useEffect(() => {
    if (sample) return;
    let stopped = false,
      inFlight = false;
    async function load() {
      if (document.hidden || inFlight) return;
      inFlight = true;
      setRefreshing(true);
      try {
        const result = await loadLiveMetrics(period);
        if (!stopped) {
          setMetrics(result);
          setUpdated(Date.now());
          setRefreshError("");
        }
      } catch {
        if (!stopped)
          setRefreshError(
            "Refresh paused. The last available figures are still showing.",
          );
      } finally {
        inFlight = false;
        if (!stopped) setRefreshing(false);
      }
    }
    if (first.current) first.current = false;
    else void load();
    const timer =
      seconds > 0 ? window.setInterval(load, seconds * 1000) : undefined;
    return () => {
      stopped = true;
      if (timer) window.clearInterval(timer);
    };
  }, [period, seconds, sample, tick]);
  return { metrics, updated, refreshError, refreshing };
}
