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
  Palette,
  SlidersHorizontal,
  Maximize2,
  Table2,
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
import { ChartExplorer, DashboardIllustration } from "./explorer";
import {
  applyDashboardLook,
  arrangeDashboard,
  dashboardLooks,
} from "../appearance";
/** Complete server-action bundle for a genuinely selected-business adapter.
 * Each callback must independently refresh its target authority. Supplying an
 * adapter never falls back to native data/actions in another login workspace. */
export type AnalyticsStudioActions = {
  saveAction: typeof saveAnalyticsDashboard;
  deleteAction: typeof deleteAnalyticsDashboard;
  loadMetricsAction: typeof loadLiveMetrics;
  loadDataAction: typeof loadDashboardData;
  loadSliceAction: typeof loadMetricSlice;
  loadGoalsAction: () => Promise<GoalMarker[]>;
};
const nativeStudioActions = { saveAction: saveAnalyticsDashboard, deleteAction: deleteAnalyticsDashboard,
  loadMetricsAction: loadLiveMetrics, loadDataAction: loadDashboardData, loadSliceAction: loadMetricSlice };
function internalPageHref(value: string) {
  if (!/^\/(?!\/)[a-zA-Z0-9/_-]*$/.test(value)) throw new Error("Choose an internal dashboard workspace.");
  return value;
}
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
  period: string;
  widgets: StudioWidget[];
  refreshSeconds: number;
  filters: BoardFilters;
};
export type BusinessDraftControls = {
  definitionId: string;
  revision: number;
  business?: string;
  maxWidgets: number;
  saveDraft(input: BoardState & { revision: number }): Promise<{
    definitionId: string;
    revision: number;
  }>;
  onDirtyChange?(dirty: boolean): void;
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
  serverActions,
  workspaceHref = "/analytics",
  monitorHref = "/board",
  businessDraft,
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
  serverActions?: AnalyticsStudioActions;
  workspaceHref?: string;
  monitorHref?: string;
  businessDraft?: BusinessDraftControls;
}) {
  if (serverActions && [serverActions.saveAction, serverActions.deleteAction, serverActions.loadMetricsAction,
    serverActions.loadDataAction, serverActions.loadSliceAction, serverActions.loadGoalsAction].some(action => typeof action !== "function"))
    throw new Error("This selected-business dashboard adapter is incomplete.");
  if (businessDraft && (!serverActions || sample || createNew || datasets.length || goals.length || dashboards.length !== 1 || selectedId !== businessDraft.definitionId
    || !Number.isInteger(businessDraft.maxWidgets) || businessDraft.maxWidgets < 1 || businessDraft.maxWidgets > 24))
    throw new Error("This business dashboard editor needs its complete saved-draft adapter.");
  const maxWidgets = businessDraft?.maxWidgets ?? 24;
  const actions = serverActions ?? nativeStudioActions;
  const workspace = internalPageHref(workspaceHref), monitorPage = internalPageHref(monitorHref);
  const router = useRouter(),
    selected = dashboards.find((b) => b.id === selectedId),
    template = boardTemplates.find((t) => t.id === templateId);
  const initial: BoardState = {
    name: selected?.name ?? template?.name ?? "Untitled dashboard",
    period: initialPeriod,
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
    [inspectorTab, setInspectorTab] = useState<"data" | "design" | "focus">(
      "data",
    ),
    [filterOpen, setFilterOpen] = useState(false),
    [exploring, setExploring] = useState<string | null>(null),
    [exploration, setExploration] = useState<
      Record<string, { key: string; category: string; table: boolean }>
    >({}),
    [search, setSearch] = useState(""),
    [subject, setSubject] = useState("All apps"),
    [message, setMessage] = useState(""),
    [dirty, setDirty] = useState(false),
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
  const onDirtyChange = businessDraft?.onDirtyChange;
  useEffect(() => { onDirtyChange?.(dirty); }, [dirty, onDirtyChange]);
  const period = board.period;
  const { metrics, updated, refreshError, refreshing } = useLiveMetrics(
    initialMetrics,
    period,
    board.refreshSeconds,
    sample,
    tick,
    actions.loadMetricsAction,
  );
  const liveGoals = useLiveGoals(
      goals,
      board.refreshSeconds,
      sample || board.refreshSeconds <= 0,
      serverActions?.loadGoalsAction,
    ),
    active = board.widgets.find((w) => w.id === focused),
    base = sample ? "/analytics-preview" : workspace;
  const queryKey = JSON.stringify({
    widgets: board.widgets.map((w) => ({
      id: w.id,
      metricId: w.metricId,
      data: w.data,
      breakdown: w.breakdown,
    })),
    filters: board.filters,
  });
  const activeMetric = active ? resolve(active) : undefined;
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
        const result = await actions.loadDataAction({
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
            await actions.loadSliceAction({ ...job, period }),
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
  }, [queryKey, period, updated, sample, opened, tick, actions.loadDataAction, actions.loadSliceAction]);
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
    if (active?.data)
      patch(active.id, {
        data: { ...active.data, ...p },
        ...(p.group !== undefined ? { category: "", categories: [] } : {}),
        ...(p.measure !== undefined || p.aggregation !== undefined
          ? { target: undefined }
          : {}),
      });
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
    router.push(businessDraft ? `${workspace}${businessDraft.business ? `?business=${encodeURIComponent(businessDraft.business)}` : ""}` : query ? `${base}?${query}` : base);
  }
  function add(metric?: AnalyticsResult, dataset?: ReportSpec) {
    if (board.widgets.length >= maxWidgets) return;
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
    setInspectorTab("data");
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
    if (!source || board.widgets.length >= maxWidgets) return;
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
    if (businessDraft) { setMessage("Use the published business dashboard link after it goes live."); return; }
    if (dirty || !selected) {
      setMessage("Save your dashboard before opening its monitor view.");
      return;
    }
    if (
      !window.open(
        `${monitorPage}?dashboard=${encodeURIComponent(selected.id)}&period=${period}`,
        `atlas-board-${selected.id}`,
        "popup,width=1680,height=980",
      )
    )
      setMessage("Allow pop-up windows to open this dashboard on a monitor.");
  }
  function save(asCopy = false) {
    startTransition(async () => {
      try {
        if (businessDraft) {
          if (asCopy) throw new Error("Create another business dashboard from its design library.");
          const saved = await businessDraft.saveDraft({ ...board, revision: businessDraft.revision });
          if (saved.definitionId !== businessDraft.definitionId || saved.revision !== businessDraft.revision + 1)
            throw new Error("This saved draft changed. Your entries are still here; reopen it to compare.");
          setDirty(false);
          setMessage("Draft saved. Review it before making it live for your business.");
          router.refresh();
          return;
        }
        const id = await actions.saveAction({
          ...board,
          period,
          name: asCopy ? `${board.name.slice(0, 60)} copy` : board.name,
          id: asCopy ? undefined : selected?.id,
          expectedUpdatedAt: asCopy ? undefined : selected?.updatedAt,
        });
        setDirty(false);
        router.push(`${workspace}?dashboard=${encodeURIComponent(id)}&period=${period}`);
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
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>A FRESH PERSPECTIVE · {company}</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-.04em] sm:text-5xl">
              Your business.
              <br />
              Your perspective.
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-6 text-slate-500">
              See the signals. Find the story. Bring your live business data
              into a space that feels unmistakably yours.
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
          <DashboardIllustration />
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
                {canManage && !businessDraft && (
                  <button
                    aria-label={`Delete ${b.name}`}
                    className="ml-auto rounded-lg p-2 text-slate-400 hover:text-rose-600"
                    onClick={() => {
                      if (window.confirm(`Delete ${b.name}?`))
                        startTransition(async () => {
                          try {
                            await actions.deleteAction(b.id);
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
              {boardTemplates.map((t, templateIndex) => (
                <button
                  key={t.id}
                  className={styles.template}
                  style={
                    {
                      "--preview-accent":
                        palettes[colours[templateIndex % colours.length]][0],
                    } as CSSProperties
                  }
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
                  <div className={styles.templatePreview}>
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
            ← {businessDraft ? "Business dashboards" : "Your dashboards"}
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
          {!businessDraft && <Button onClick={monitor}>
            <Monitor size={15} />
            <span className="hidden sm:inline">Monitor</span>
          </Button>}
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
              {pending ? "Saving…" : businessDraft ? "Save draft" : "Save"}
            </Button>
          )}
        </div>
      </header>
      <div className={styles.controlShelf}>
        <div className={styles.perspectiveLabel}>
          <ChartNoAxesCombined size={17} />
          <span>
            {editing ? "Design your perspective" : "Explore your perspective"}
          </span>
        </div>
        <label className={styles.periodControl}>
          Measure period
          <select
            aria-label="Measure period"
            value={period}
            onChange={(e) => {
              change({ ...board, period: e.target.value });
            }}
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
        {!businessDraft && <button
          className={styles.filterToggle}
          aria-expanded={filterOpen}
          onClick={() => setFilterOpen(!filterOpen)}
        >
          <SlidersHorizontal size={15} /> Record filters
          {Object.values(board.filters).filter(Boolean).length > 0 && (
            <span>{Object.values(board.filters).filter(Boolean).length}</span>
          )}
        </button>}
        <span className={styles.refreshLabel}>
          {board.refreshSeconds
            ? `Refreshes every ${board.refreshSeconds}s`
            : "Refresh when you choose"}
        </span>
      </div>
      {filterOpen && (
        <div className={styles.filters}>
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
      )}
      {(message || refreshError) && (
        <p role="status" className={styles.notice}>
          {message || refreshError}
        </p>
      )}
      {editing && canManage && (
        <div className={styles.editBar}>
          <Button
            variant="primary"
            disabled={board.widgets.length >= maxWidgets}
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
          {selected && !sample && !businessDraft && (
            <Button disabled={pending} onClick={() => save(true)}>
              <Copy size={14} />
              Save a copy
            </Button>
          )}
          <span className="text-xs text-slate-400">
            {board.widgets.length}/{maxWidgets} widgets
          </span>
        </div>
      )}
      {editing && canManage && board.widgets.length > 0 && (
        <details className={styles.canvasOptions}>
          <summary>
            <Palette size={16} /> Style your canvas{" "}
            <span>Themes & layouts</span>
          </summary>
          <div className={styles.lookGrid}>
            {dashboardLooks.map((look) => (
              <button
                key={look.id}
                onClick={() =>
                  change({
                    ...board,
                    widgets: applyDashboardLook(board.widgets, look.id),
                  })
                }
                className={`${styles.look} ${look.tone === "ink" ? styles.lookNight : ""}`}
                aria-label={`Apply ${look.name} theme`}
              >
                <div>
                  {look.colors.map((color) => (
                    <i key={color} style={{ background: palettes[color][0] }} />
                  ))}
                </div>
                <b>{look.name}</b>
                <small>{look.description}</small>
              </button>
            ))}
          </div>
          <div className={styles.layoutChoices}>
            <span>Arrange in one click</span>
            {(["balanced", "spotlight", "compact"] as const).map((layout) => (
              <button
                key={layout}
                className={styles.pill}
                onClick={() =>
                  change({
                    ...board,
                    widgets: arrangeDashboard(board.widgets, layout),
                  })
                }
              >
                {layout === "balanced"
                  ? "Balanced pairs"
                  : layout === "spotlight"
                    ? "Hero + supporting"
                    : "Compact grid"}
              </button>
            ))}
            <small>You can undo any theme or layout.</small>
          </div>
        </details>
      )}
      {editing && library && (
        <section className={styles.library} aria-label="Widget library">
          <div className="flex items-center justify-between">
            <div>
              <p className={styles.eyebrow}>01 · CHOOSE YOUR DATA</p>
              <h2 className="mt-1 text-lg font-semibold">
                What would you like to show?
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Start with a ready-made business measure, or choose fields from
                your records.
              </p>
            </div>
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
              {!businessDraft && <button
                className={styles.pill}
                aria-pressed={libraryKind === "records"}
                onClick={() => setLibraryKind("records")}
              >
                Build from records
              </button>}
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
          {!(
            libraryKind === "measures"
              ? metrics.map((m) => ({
                  name: m.name,
                  source: m.subject,
                  description: m.definition,
                }))
              : datasets
          ).some((item) => match(item.name, item.source, item.description)) && (
            <p className={styles.libraryEmpty}>
              No matching data. Try another search or choose All apps.
            </p>
          )}
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
            const interaction =
              exploration[w.id]?.key === `${queryKey}:${period}`
                ? exploration[w.id]
                : undefined;
            const shown = {
              ...w,
              category: interaction?.category || w.category,
              visual: interaction?.table ? ("table" as const) : w.visual,
            };
            const explore = (
              category = interaction?.category ?? "",
              table = interaction?.table ?? false,
            ) =>
              setExploration((current) => ({
                ...current,
                [w.id]: { key: `${queryKey}:${period}`, category, table },
              }));
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
                    {(interaction?.category ||
                      w.category ||
                      w.categories?.length) && (
                      <button
                        className={styles.focusChip}
                        onClick={() =>
                          interaction?.category
                            ? explore("")
                            : editing && canManage
                              ? patch(w.id, { category: "", categories: [] })
                              : setMessage(
                                  "This focus is part of the saved chart. Edit its settings to change it.",
                                )
                        }
                      >
                        Focus:{" "}
                        {interaction?.category ||
                          w.category ||
                          `${w.categories?.length} groups`}{" "}
                        ×
                      </button>
                    )}
                  </div>
                  <button
                    className={styles.iconButton}
                    title="Switch between chart and values"
                    aria-label={`Show values for widget ${index + 1}`}
                    aria-pressed={!!interaction?.table}
                    onClick={() => explore(undefined, !interaction?.table)}
                  >
                    <Table2 size={15} />
                  </button>
                  {m && (
                    <button
                      className={styles.iconButton}
                      title="Explore this chart"
                      aria-label={`Expand widget ${index + 1}`}
                      onClick={() => setExploring(w.id)}
                    >
                      <Maximize2 size={15} />
                    </button>
                  )}
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
                        className={styles.iconButton}
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
                      widget={shown}
                      onPick={(label) =>
                        explore(interaction?.category === label ? "" : label)
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
                  {m && !businessDraft && (
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
              Choose the data. Make it yours.
            </p>
            <div
              className={styles.inspectorTabs}
              role="group"
              aria-label="Widget settings sections"
            >
              {(["data", "design", "focus"] as const).map((tab) => (
                <button
                  key={tab}
                  aria-pressed={inspectorTab === tab}
                  onClick={() => setInspectorTab(tab)}
                >
                  {tab === "data"
                    ? "Data"
                    : tab === "design"
                      ? "Design"
                      : "Focus"}
                </button>
              ))}
            </div>
            <Field label="Chart title">
              <input
                aria-label="Chart title"
                maxLength={100}
                value={active.title ?? ""}
                placeholder={activeMetric?.name}
                onChange={(e) => patch(active.id, { title: e.target.value })}
              />
            </Field>
            {inspectorTab === "data" && (
              <div className={styles.inspectorSection}>
                {active.data && inspectorDataset ? (
                  <>
                    <Field label="Dataset">
                      <select
                        aria-label="Widget dataset"
                        value={active.data.dataset}
                        onChange={(e) =>
                          patch(active.id, {
                            data: dataViewSchema.parse({
                              dataset: e.target.value,
                            }),
                            category: "",
                            categories: [],
                            target: undefined,
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
                              bucket: e.target.value as
                                "day" | "month" | "year",
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
                            measure:
                              e.target.value === "count"
                                ? ""
                                : (inspectorDataset.columns.find(
                                    (column) =>
                                      e.target.value === "distinct" ||
                                      ["number", "money"].includes(
                                        column.type || "",
                                      ),
                                  )?.key ?? ""),
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
                          onChange={(e) =>
                            patchData({ measure: e.target.value })
                          }
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
                              patchData({
                                currency: e.target.value.toUpperCase(),
                              })
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
                          onChange={(e) =>
                            patchData({ search: e.target.value })
                          }
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
                              onChange={(e) =>
                                patchData({ from: e.target.value })
                              }
                            />
                          </Field>
                          <Field label="To">
                            <input
                              type="date"
                              aria-label="Widget to"
                              value={active.data.to}
                              onChange={(e) =>
                                patchData({ to: e.target.value })
                              }
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
                                onChange={(e) =>
                                  update({ value: e.target.value })
                                }
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
                                onChange={(e) =>
                                  update({ value: e.target.value })
                                }
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
                                field: inspectorDataset.columns.find(
                                  (c) => c.path,
                                )!.key,
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
                          const m = metrics.find(
                            (m) => m.id === e.target.value,
                          );
                          patch(active.id, {
                            metricId: e.target.value,
                            breakdown: m?.breakdowns?.[0]?.id,
                            category: "",
                            categories: [],
                            target: undefined,
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
                          value={
                            active.breakdown || activeMetric.breakdowns[0]?.id
                          }
                          onChange={(e) =>
                            patch(active.id, {
                              breakdown: e.target.value,
                              category: "",
                              categories: [],
                              target: undefined,
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
              </div>
            )}
            {inspectorTab === "design" && (
              <div className={styles.inspectorSection}>
                <div className="mt-5">
                  <p className={styles.menuLabel}>02 · SHAPE YOUR VIEW</p>
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
              </div>
            )}
            {inspectorTab === "focus" && (
              <div className={styles.inspectorSection}>
                <Field label="Sort">
                  <select
                    aria-label="Widget sort"
                    value={
                      active.sort ??
                      (activeMetric?.shape === "trend"
                        ? "source"
                        : "descending")
                    }
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
                    value={
                      active.maxCategories ??
                      (activeMetric?.shape === "trend" ? 50 : 8)
                    }
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
                    onChange={(e) =>
                      patch(active.id, {
                        category: e.target.value,
                        categories: [],
                      })
                    }
                  >
                    <option value="">All groups</option>
                    {activeMetric?.points.map((p) => (
                      <option key={p.label}>{p.label}</option>
                    ))}
                  </select>
                </Field>
                {activeMetric?.points.length ? (
                  <div className={styles.categoryPicker}>
                    <p className={styles.menuLabel}>Select several groups</p>
                    <p className="text-[11px] text-slate-500">
                      No selection shows every group.
                    </p>
                    <div>
                      {activeMetric.points.slice(0, 50).map((point) => (
                        <label key={point.label}>
                          <input
                            type="checkbox"
                            aria-label={`Include ${point.label}`}
                            checked={!!active.categories?.includes(point.label)}
                            onChange={(event) =>
                              patch(active.id, {
                                category: "",
                                categories: event.target.checked
                                  ? [...(active.categories ?? []), point.label]
                                  : active.categories?.filter(
                                      (label) => label !== point.label,
                                    ),
                              })
                            }
                          />
                          <span>{point.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ) : null}
                <Field label="Gauge target (optional)">
                  <input
                    aria-label="Gauge target"
                    type="number"
                    min="0"
                    value={
                      active.target === undefined
                        ? ""
                        : active.target /
                          (activeMetric?.unit === "money" ? 100 : 1)
                    }
                    placeholder="Choose your reference value"
                    onChange={(event) =>
                      patch(active.id, {
                        target:
                          event.target.value && Number(event.target.value) > 0
                            ? Number(event.target.value) *
                              (activeMetric?.unit === "money" ? 100 : 1)
                            : undefined,
                      })
                    }
                  />
                </Field>
                <p className="mt-2 text-[11px] leading-5 text-slate-500">
                  A personal visual reference for gauge charts. It does not
                  change company goals.
                </p>
              </div>
            )}
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
                disabled={board.widgets.length >= maxWidgets}
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
      {exploring &&
        (() => {
          const widget = board.widgets.find((w) => w.id === exploring);
          const metric = widget && resolve(widget);
          return widget && metric ? (
            <ChartExplorer
              key={widget.id}
              widget={widget}
              metric={metric}
              onClose={() => setExploring(null)}
            />
          ) : null;
        })()}
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
  loadMetricsAction: AnalyticsStudioActions["loadMetricsAction"] = loadLiveMetrics,
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
        const result = await loadMetricsAction(period);
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
  }, [period, seconds, sample, tick, loadMetricsAction]);
  return { metrics, updated, refreshError, refreshing };
}
