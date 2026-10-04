import type { Aggregation, Direction, MetricUnit } from "./catalogue";

export type PlanCell = {
  metricKey: string;
  periodKey: string;
  dimensionKey: string;
  kind: "plan" | "forecast";
  value: number;
};

export type ModelLink = { fromKey: string; toKey: string; passthrough: number };

const GLUE_PERIOD = /^\d{4}-\d{2}-\d{2}$/;

export function parsePlanningNumber(text: string, unit: MetricUnit): number | null {
  const cleaned = text.trim().toLowerCase().replace(/[£$,\s]/g, "");
  if (!cleaned) return null;
  const match = cleaned.match(/^(-?\d+(?:\.\d+)?)([kmb])?%?$/);
  if (!match) return null;
  let value = Number(match[1]);
  if (!Number.isFinite(value)) return null;
  if (match[2] === "k") value *= 1_000;
  if (match[2] === "m") value *= 1_000_000;
  if (match[2] === "b") value *= 1_000_000_000;
  if (unit === "money") return Math.round(value * 100);
  return value;
}

export function gap(plan: number | null, other: number | null): number | null {
  if (plan == null || other == null) return null;
  return other - plan;
}

export function offTrack(plan: number | null, other: number | null, direction: Direction): boolean {
  const delta = gap(plan, other);
  if (delta == null || delta === 0) return false;
  return direction === "higher" ? delta < 0 : delta > 0;
}

export function scale(base: number, percent: number): number {
  return base * (1 + percent / 100);
}

export function explainDriver(inputs: Array<{ label: string; value: number }>): { total: number; steps: string[] } | { error: string } {
  if (inputs.length < 2) return { error: "Add at least two drivers." };
  if (inputs.some((input) => !Number.isFinite(input.value))) return { error: "Every driver needs a number." };
  const total = inputs.reduce((product, input) => product * input.value, 1);
  const steps = inputs.map((input) => `${input.label} ${input.value}`);
  return { total, steps };
}

export function cyclePath(links: ModelLink[]): string[] | null {
  const next = new Map<string, string[]>();
  for (const link of links) next.set(link.fromKey, [...(next.get(link.fromKey) ?? []), link.toKey]);
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const stack: string[] = [];
  const walk = (node: string): string[] | null => {
    if (visiting.has(node)) return [...stack.slice(stack.indexOf(node)), node];
    if (visited.has(node)) return null;
    visiting.add(node);
    stack.push(node);
    for (const child of next.get(node) ?? []) {
      const found = walk(child);
      if (found) return found;
    }
    stack.pop();
    visiting.delete(node);
    visited.add(node);
    return null;
  };
  for (const node of next.keys()) {
    const found = walk(node);
    if (found) return found;
  }
  return null;
}

/** Percentage changes travel only along links you saved. A loop is refused. Two different results for one measure are a conflict, not an average. */
export function propagatePercents(links: ModelLink[], seeds: Record<string, number>): { percents: Record<string, number>; conflicts: string[]; cycle: string[] | null } {
  const cycle = cyclePath(links);
  if (cycle) return { percents: { ...seeds }, conflicts: [], cycle };
  const percents: Record<string, number> = { ...seeds };
  const conflicts: string[] = [];
  const outgoing = new Map<string, ModelLink[]>();
  for (const link of links) outgoing.set(link.fromKey, [...(outgoing.get(link.fromKey) ?? []), link]);
  const queue = Object.keys(seeds);
  const used = new Set<string>();
  while (queue.length) {
    const from = queue.shift()!;
    for (const link of outgoing.get(from) ?? []) {
      const edge = `${link.fromKey}>${link.toKey}`;
      if (used.has(edge) || !Number.isFinite(link.passthrough)) continue;
      used.add(edge);
      if (link.toKey in seeds) continue;
      const nextPercent = percents[from] * link.passthrough;
      const existing = percents[link.toKey];
      if (existing != null && Math.abs(existing - nextPercent) > 0.000_001) {
        conflicts.push(link.toKey);
        continue;
      }
      if (existing == null) {
        percents[link.toKey] = nextPercent;
        queue.push(link.toKey);
      }
    }
  }
  return { percents, conflicts, cycle: null };
}

export function applyScenario(base: PlanCell[], links: ModelLink[], change: { metricKey: string; percent: number }): { cells: PlanCell[]; conflicts: string[]; skipped: string[]; cycle: string[] | null } {
  const { percents, conflicts, cycle } = propagatePercents(links, { [change.metricKey]: change.percent });
  if (cycle) return { cells: base.map((cell) => ({ ...cell })), conflicts, skipped: [], cycle };
  const cells = base.map((cell) => {
    if (cell.kind !== "forecast") return { ...cell };
    const percent = percents[cell.metricKey];
    if (percent == null) return { ...cell };
    return { ...cell, value: scale(cell.value, percent) };
  });
  const skipped = Object.keys(percents).filter((key) => !base.some((cell) => cell.metricKey === key && cell.kind === "forecast"));
  return { cells, conflicts, skipped, cycle: null };
}

export function promoteForecast(baselinePlan: PlanCell[], workingForecast: PlanCell[], scenarioForecast: PlanCell[]): { baselinePlan: PlanCell[]; workingForecast: PlanCell[] } {
  const next = workingForecast.map((cell) => ({ ...cell }));
  for (const scenario of scenarioForecast.filter((cell) => cell.kind === "forecast")) {
    const index = next.findIndex((cell) => cell.metricKey === scenario.metricKey && cell.periodKey === scenario.periodKey && cell.dimensionKey === scenario.dimensionKey);
    if (index >= 0) next[index] = { ...next[index], value: scenario.value };
    else next.push({ ...scenario });
  }
  return { baselinePlan, workingForecast: next };
}

export function compareCells(base: PlanCell[], scenario: PlanCell[]): Array<{ metricKey: string; periodKey: string; dimensionKey: string; base: number; scenario: number; delta: number }> {
  const rows = [];
  for (const cell of scenario) {
    const other = base.find((item) => item.metricKey === cell.metricKey && item.periodKey === cell.periodKey && item.dimensionKey === cell.dimensionKey && item.kind === cell.kind);
    if (!other || other.value === cell.value) continue;
    rows.push({ metricKey: cell.metricKey, periodKey: cell.periodKey, dimensionKey: cell.dimensionKey, base: other.value, scenario: cell.value, delta: cell.value - other.value });
  }
  return rows;
}

export function rollup(values: number[], method: Aggregation, weights?: number[]): number | null {
  if (!values.length) return null;
  if (method === "none") return null;
  if (method === "sum") return values.reduce((total, value) => total + value, 0);
  if (method === "average") return values.reduce((total, value) => total + value, 0) / values.length;
  if (!weights || weights.length !== values.length || weights.some((weight) => !Number.isFinite(weight) || weight < 0)) return null;
  const weight = weights.reduce((total, value) => total + value, 0);
  if (weight === 0) return null;
  return values.reduce((total, value, index) => total + value * weights[index], 0) / weight;
}

export function distribute(total: number, buckets: Array<{ key: string; weight?: number }>, method: "equal" | "share" | "capacity" | "driver"): { rows: Array<{ key: string; value: number }>; method: string } | { error: string } {
  if (!buckets.length || !Number.isFinite(total)) return { error: "Choose the rows that should receive a target." };
  if (method === "equal") return { method: "Equal split", rows: buckets.map((bucket) => ({ key: bucket.key, value: total / buckets.length })) };
  if (buckets.some((bucket) => bucket.weight == null || !Number.isFinite(bucket.weight))) return { error: "Each row needs a weight. Plan will not guess the split." };
  const weights = buckets.map((bucket) => bucket.weight ?? 0);
  const share = weights.reduce((sum, weight) => sum + weight, 0);
  if (share === 0) return { error: "The weights add up to zero, so there is nothing to split." };
  const label = method === "capacity" ? "Split by capacity" : method === "driver" ? "Split by driver" : "Split by share";
  return { method: label, rows: buckets.map((bucket, index) => ({ key: bucket.key, value: total * (weights[index] / share) })) };
}

/** Prefer an entered total when a period has no split. When a period is split, total it by the measure's rule and do not also add the entered total. */
export function combinePeriods(cells: Array<{ periodKey: string; dimensionKey: string; value: number }>, method: Aggregation): { value: number | null; mixed: boolean } {
  const periods = [...new Set(cells.map((cell) => cell.periodKey))];
  const values: number[] = [];
  let mixed = false;
  for (const period of periods) {
    const rows = cells.filter((cell) => cell.periodKey === period);
    const blank = rows.find((cell) => cell.dimensionKey === "");
    const parts = rows.filter((cell) => cell.dimensionKey !== "");
    if (blank && parts.length) mixed = true;
    const periodValue = parts.length ? rollup(parts.map((part) => part.value), method === "none" ? "sum" : method) : (blank?.value ?? null);
    if (periodValue != null) values.push(periodValue);
  }
  if (!values.length) return { value: null, mixed };
  if (method === "none") return { value: values.length === 1 ? values[0] : null, mixed };
  return { value: rollup(values, method === "weighted" ? "average" : method), mixed };
}

export function capacityGap(demand: number | null, capacity: number | null): number | null {
  if (demand == null || capacity == null) return null;
  return capacity - demand;
}

export function planWindow(input: { mode: "year" | "quarter" | "custom"; year?: number; quarter?: number; start?: string; end?: string }): { start: string; end: string; label: string } {
  if (input.mode === "year") {
    if (!input.year || input.year < 2000 || input.year > 2100) throw new Error("Choose a year.");
    return { start: `${input.year}-01-01`, end: `${input.year}-12-31`, label: String(input.year) };
  }
  if (input.mode === "quarter") {
    if (!input.year || !input.quarter || input.quarter < 1 || input.quarter > 4) throw new Error("Choose a quarter.");
    const month = (input.quarter - 1) * 3;
    const start = new Date(Date.UTC(input.year, month, 1));
    const end = new Date(Date.UTC(input.year, month + 3, 0));
    return { start: iso(start), end: iso(end), label: `Q${input.quarter} ${input.year}` };
  }
  if (!input.start || !input.end || !GLUE_PERIOD.test(input.start) || !GLUE_PERIOD.test(input.end) || input.start > input.end) throw new Error("Choose a start and end date.");
  return { start: input.start, end: input.end, label: `${input.start} to ${input.end}` };
}

export function periodKeys(start: string, end: string, grain: "month" | "quarter" | "year" = "month"): string[] {
  const window = planWindow({ mode: "custom", start, end });
  const from = new Date(`${window.start}T00:00:00Z`);
  const to = new Date(`${window.end}T00:00:00Z`);
  const keys: string[] = [];
  if (grain === "year") {
    for (let year = from.getUTCFullYear(); year <= to.getUTCFullYear(); year += 1) keys.push(String(year));
    return keys;
  }
  const cursor = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), 1));
  while (cursor <= to) {
    const key = grain === "quarter" ? `${cursor.getUTCFullYear()}-Q${Math.floor(cursor.getUTCMonth() / 3) + 1}` : `${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, "0")}`;
    if (!keys.includes(key)) keys.push(key);
    cursor.setUTCMonth(cursor.getUTCMonth() + (grain === "quarter" ? 3 : 1));
  }
  return keys;
}

export function quarterKey(monthKey: string): string | null {
  const match = monthKey.match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;
  return `${match[1]}-Q${Math.floor((Number(match[2]) - 1) / 3) + 1}`;
}

export function editAllowed(input: { planLocked: boolean; lockedPeriods: string[]; periodKey: string; versionKind: string; versionStatus: string }): string | null {
  if (input.versionKind === "baseline" || input.versionStatus === "approved" || input.versionStatus === "superseded" || input.versionStatus === "archived") return "This version is kept as it was approved.";
  if (input.planLocked) return "This plan is locked.";
  if (input.lockedPeriods.includes(input.periodKey)) return "This period is locked.";
  return null;
}

export type Insight = { tone: "good" | "watch" | "info"; title: string; detail: string };

export function buildInsights(input: {
  measures: Array<{ name: string; plan: number | null; forecast: number | null; actual: number | null; direction: Direction }>;
  capacity: Array<{ name: string; demand: number | null; capacity: number | null }>;
  overdueActions: number;
  approvals: number;
}): Insight[] {
  const insights: Insight[] = [];
  for (const measure of input.measures) {
    if (offTrack(measure.plan, measure.forecast, measure.direction)) insights.push({ tone: "watch", title: `${measure.name} forecast is off the plan`, detail: "The forecast and the plan are stored separately. The approved plan has not been changed." });
    else if (measure.plan != null && measure.forecast != null) insights.push({ tone: "good", title: `${measure.name} forecast is on the plan`, detail: "Compared with the figure on this plan." });
    if (offTrack(measure.plan, measure.actual, measure.direction)) insights.push({ tone: "watch", title: `${measure.name} actual is off the plan`, detail: "Actual comes from the current Atlas records for this period." });
  }
  for (const row of input.capacity) {
    const delta = capacityGap(row.demand, row.capacity);
    if (delta != null && delta < 0) insights.push({ tone: "watch", title: `${row.name} is short of capacity`, detail: "Demand is above the capacity figure on this plan. The plan is still saved." });
  }
  if (input.overdueActions > 0) insights.push({ tone: "watch", title: `${input.overdueActions} action${input.overdueActions === 1 ? "" : "s"} overdue`, detail: "Open actions with a due date before today." });
  if (input.approvals > 0) insights.push({ tone: "info", title: `${input.approvals} plan${input.approvals === 1 ? "" : "s"} waiting for approval`, detail: "Submitted plans stay drafts until someone approves them." });
  return insights;
}

export function forecastAccuracy(snapshotForecast: number | null, actual: number | null): number | null {
  if (snapshotForecast == null || actual == null) return null;
  return actual - snapshotForecast;
}

export const LENS_SECTIONS: Record<string, string[]> = {
  executive: ["summary", "chart", "table", "goals", "risks", "decisions", "actions", "updates"],
  analyst: ["summary", "chart", "table", "assumptions", "drivers", "models", "scenarios", "goals", "initiatives", "actions", "risks", "dependencies", "decisions", "comments", "production", "updates"],
  team: ["summary", "table", "goals", "initiatives", "actions"],
};

function iso(date: Date): string {
  return date.toISOString().slice(0, 10);
}
