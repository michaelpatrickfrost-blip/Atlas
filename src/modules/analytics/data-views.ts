import type { Session } from "@/core/auth/session";
import type { AnalyticsResult } from "@/core/analytics/types";
import { reportDatasets, publicSpec } from "@/core/reports/catalogue";
import { dateValue, reportWhere, ReportError } from "@/core/reports/filters";
import { getAnalyticsMetrics } from "@/core/analytics/catalogue";
import type {
  ReportDataset,
  ReportInput,
  ReportRow,
} from "@/core/reports/types";
import type { BoardFilters, DataView, StudioWidget } from "./definition";

class ChartError extends Error {}

export function dataViewInput(
  dataset: ReportDataset,
  data: DataView,
  filters: BoardFilters,
): ReportInput {
  validateBoardFilters(filters);
  if (dataset.summary)
    throw new ChartError("Choose a record dataset for a data view.");
  const group = dataset.columns.find((c) => c.key === data.group);
  if (data.group && !group)
    throw new ChartError("Choose an available grouping field.");
  const measure = dataset.columns.find((c) => c.key === data.measure);
  if (data.aggregation !== "count" && !measure)
    throw new ChartError("Choose an available measure field.");
  if (
    !["count", "distinct"].includes(data.aggregation) &&
    !["number", "money"].includes(measure?.type || "")
  )
    throw new ChartError("This calculation needs a numeric field.");
  if (
    data.aggregation !== "count" &&
    measure?.type === "money" &&
    !data.currency
  )
    throw new ChartError("Choose one currency for this monetary calculation.");
  if (
    measure?.type === "money" &&
    data.aggregation !== "count" &&
    !/^[A-Z]{3}$/.test(data.currency)
  )
    throw new ChartError("Use a three-letter currency code, such as GBP.");
  if (
    measure?.type === "money" &&
    data.aggregation !== "count" &&
    (!measure.currencyKey ||
      !dataset.columns.some((c) => c.key === measure.currencyKey && c.path))
  )
    throw new ChartError("This amount does not expose a filterable currency.");
  const input: ReportInput = {
    dataset: dataset.id,
    search:
      data.search ||
      (dataset.columns.some((c) => c.searchable) ? filters.search : ""),
    from: data.from || (dataset.dateField ? filters.from : ""),
    to: data.to || (dataset.dateField ? filters.to : ""),
    period: "all",
    filters: [...data.filters],
    columns: [],
    page: 1,
  };
  if (
    measure?.type === "money" &&
    data.aggregation !== "count" &&
    measure.currencyKey
  )
    input.filters.push({
      field: measure.currencyKey,
      operator: "equals",
      value: data.currency,
    });
  // Reuse the source's allowlisted field, type, operator and calendar validation.
  validateBoardFilters(input);
  reportWhere(dataset, input);
  return input;
}

export function validateBoardFilters(filters: BoardFilters) {
  if (filters.from) dateValue(filters.from);
  if (filters.to) dateValue(filters.to);
  if (filters.from && filters.to && filters.from > filters.to)
    throw new ChartError("The end date must follow the start date.");
}
export function aggregateRows(
  dataset: ReportDataset,
  rows: ReportRow[],
  data: DataView,
): AnalyticsResult["points"] {
  const groupColumn = dataset.columns.find((c) => c.key === data.group),
    measure = dataset.columns.find((c) => c.key === data.measure);
  const groups = new Map<
    string,
    {
      count: number;
      sum: number;
      min: number;
      max: number;
      distinct: Set<string>;
    }
  >();
  for (const row of rows) {
    if (
      measure?.type === "money" &&
      data.aggregation !== "count" &&
      row[measure.currencyKey!] !== data.currency
    )
      throw new ChartError(
        "This result includes another currency. Narrow your filters.",
      );
    const raw = data.group ? row[data.group] : null;
    const label = !data.group
      ? "All records"
      : raw == null
        ? "Not set"
        : groupColumn?.type === "date"
          ? (raw instanceof Date ? raw.toISOString() : String(raw)).slice(
              0,
              data.bucket === "year" ? 4 : data.bucket === "month" ? 7 : 10,
            )
          : String(raw);
    const g = groups.get(label) ?? {
      count: 0,
      sum: 0,
      min: Infinity,
      max: -Infinity,
      distinct: new Set<string>(),
    };
    groups.set(label, g);
    if (data.aggregation === "count") {
      g.count++;
      continue;
    }
    const value = row[data.measure];
    if (value == null) continue;
    if (data.aggregation === "distinct") {
      g.distinct.add(
        value instanceof Date ? value.toISOString() : String(value),
      );
      continue;
    }
    // Reports retains high precision numbers as text. Never silently round these into charts.
    if (
      typeof value !== "number" ||
      !Number.isFinite(value) ||
      Math.abs(value) > Number.MAX_SAFE_INTEGER / 100
    )
      throw new ChartError(
        "This field exceeds safe chart precision. Use Reports for exact Excel values.",
      );
    const n = measure?.type === "money" ? Math.round(value * 100) : value;
    g.count++;
    g.sum += n;
    g.min = Math.min(g.min, n);
    g.max = Math.max(g.max, n);
    if (!Number.isFinite(g.sum) || Math.abs(g.sum) > Number.MAX_SAFE_INTEGER)
      throw new ChartError(
        "This total exceeds safe chart precision. Narrow your filters.",
      );
  }
  if (!groups.size && !data.group)
    groups.set("All records", {
      count: 0,
      sum: 0,
      min: 0,
      max: 0,
      distinct: new Set(),
    });
  return [...groups]
    .filter(
      ([, g]) =>
        !["average", "min", "max"].includes(data.aggregation) || g.count > 0,
    )
    .sort(([a], [b]) => (groupColumn?.type === "date" ? a.localeCompare(b) : 0))
    .map(([label, g]) => ({
      label,
      ...(data.aggregation === "average" ? { sampleSize: g.count } : {}),
      value:
        data.aggregation === "count"
          ? g.count
          : data.aggregation === "distinct"
            ? g.distinct.size
            : !g.count
              ? 0
              : data.aggregation === "sum"
                ? g.sum
                : data.aggregation === "average"
                  ? g.sum / g.count
                  : data.aggregation === "min"
                    ? g.min
                    : g.max,
    }));
}
export async function loadDataWidgets(
  session: Session,
  widgets: StudioWidget[],
  filters: BoardFilters,
): Promise<Record<string, AnalyticsResult>> {
  const sources = (await reportDatasets(session)).filter((d) => !d.summary),
    result: Record<string, AnalyticsResult> = {};
  const jobs = widgets.filter((w) => w.data);
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(4, jobs.length) }, async () => {
      while (cursor < jobs.length) {
        const widget = jobs[cursor++],
          data = widget.data!;
        const dataset = sources.find((d) => d.id === data.dataset);
        if (!dataset) {
          result[widget.id] = {
            id: widget.id,
            name: "Unavailable data",
            subject: "Atlas",
            definition: "",
            grain: "",
            href: "/reports",
            snapshot: true,
            points: [],
            error: "This dataset is no longer available to your account.",
          };
          continue;
        }
        const spec = publicSpec(dataset),
          measure = spec.columns.find((c) => c.key === data.measure);
        const base: AnalyticsResult = {
          id: widget.id,
          name: spec.name,
          subject: spec.source,
          definition: `${data.aggregation} · ${spec.description}`,
          grain: "Matching authorised records",
          href: "/reports",
          snapshot: !spec.dateField,
          unit:
            measure?.type === "money" &&
            !["count", "distinct"].includes(data.aggregation)
              ? "money"
              : "count",
          currency: data.currency || undefined,
          calculation: data.aggregation,
          shape:
            spec.columns.find((c) => c.key === data.group)?.type === "date"
              ? "trend"
              : "breakdown",
          points: [],
        };
        try {
          const input = dataViewInput(dataset, data, filters);
          const loaded = await dataset.read(session, input, true);
          if (loaded.rows.length !== loaded.total)
            throw new ChartError(
              "Narrow the filters to calculate all matching records.",
            );
          result[widget.id] = {
            ...base,
            points: aggregateRows(dataset, loaded.rows, data),
            overallValue:
              aggregateRows(dataset, loaded.rows, { ...data, group: "" })[0]
                ?.value,
            definition: `${base.definition} · ${loaded.total.toLocaleString("en-GB")} records`,
          };
        } catch (error) {
          result[widget.id] = {
            ...base,
            error:
              error instanceof ChartError || error instanceof ReportError
                ? error.message
                : "This data view could not load.",
          };
        }
      }
    }),
  );
  return result;
}

/** Monitor and persisted boards resolve each widget independently, including its breakdown. */
export async function loadBoardWidgets(
  session: Session,
  widgets: StudioWidget[],
  filters: BoardFilters,
  period: string,
) {
  const result = await loadDataWidgets(session, widgets, filters),
    metrics = await getAnalyticsMetrics(session);
  const since =
    period === "all"
      ? undefined
      : new Date(Date.now() - Number(period) * 86400000);
  await Promise.all(
    widgets
      .filter((w) => !w.data)
      .map(async (w) => {
        const metric = metrics.find((m) => m.id === w.metricId);
        if (!metric) return;
        const { query, goalQuery, capability, ...meta } = metric;
        void goalQuery;
        void capability;
        try {
          if (
            w.breakdown &&
            !metric.breakdowns?.some((b) => b.id === w.breakdown)
          )
            throw new ChartError("This view is unavailable.");
          result[w.id] = {
            ...meta,
            shape:
              metric.breakdowns?.find((b) => b.id === w.breakdown)?.shape ??
              metric.shape,
            points: await query(session, since, w.breakdown),
          };
        } catch {
          result[w.id] = {
            ...meta,
            points: [],
            error: "This measure could not load. Refresh to try again.",
          };
        }
      }),
  );
  return result;
}
