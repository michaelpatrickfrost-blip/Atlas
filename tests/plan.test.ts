import { describe, expect, it } from "vitest";
import { audienceLabel, canEditPlan, planVisible } from "@/modules/plan/domain/access";
import { metricsFor, resolveMetricSearch, templateFor } from "@/modules/plan/domain/catalogue";
import { salesPicture } from "@/modules/plan/domain/commercial";
import { pointOnWindow, timelineLayout } from "@/modules/plan/domain/timeline";
import { applyScenario, buildInsights, capacityGap, combinePeriods, cyclePath, distribute, editAllowed, explainDriver, forecastAccuracy, gap, parsePlanningNumber, periodKeys, planWindow, promoteForecast, propagatePercents, rollup, scale } from "@/modules/plan/domain/engine";

const cell = (metricKey: string, kind: "plan" | "forecast", value: number, periodKey = "2027-11") => ({ metricKey, periodKey, dimensionKey: "", kind, value });

describe("Atlas Plan", () => {
  it("keeps plan, forecast and actual apart", () => {
    expect(gap(12_000_000_00, 11_400_000_00)).toBe(-600_000_00);
    expect(parsePlanningNumber("12m", "money")).toBe(1_200_000_000);
    expect(parsePlanningNumber("£420k", "money")).toBe(42_000_000);
    expect(parsePlanningNumber("3.5%", "percent")).toBe(3.5);
  });

  it("explains a driver as a product of the numbers entered", () => {
    const explained = explainDriver([{ label: "Salespeople", value: 12 }, { label: "Opportunities", value: 18 }, { label: "Win rate", value: 0.28 }, { label: "Average order", value: 12400 }]);
    expect(explained).toEqual({ total: 749952, steps: ["Salespeople 12", "Opportunities 18", "Win rate 0.28", "Average order 12400"] });
    expect(explainDriver([{ label: "Only one", value: 1 }])).toEqual({ error: "Add at least two drivers." });
  });

  it("scales a scenario only through connections that were kept", () => {
    const base = [cell("sales_volume", "forecast", 1000), cell("production_demand", "forecast", 800), cell("sales_volume", "plan", 1000)];
    const links = [{ fromKey: "sales_volume", toKey: "production_demand", passthrough: 0.8 }];
    const applied = applyScenario(base, links, { metricKey: "sales_volume", percent: 10 });
    expect(applied.cells.find((item) => item.metricKey === "sales_volume" && item.kind === "forecast")?.value).toBe(1100);
    expect(applied.cells.find((item) => item.metricKey === "production_demand")?.value).toBeCloseTo(scale(800, 8));
    expect(applied.cells.find((item) => item.kind === "plan")?.value).toBe(1000);
    expect(applyScenario(base, [], { metricKey: "sales_volume", percent: 10 }).cells.find((item) => item.metricKey === "production_demand")?.value).toBe(800);
  });

  it("refuses a loop and a conflicting path", () => {
    expect(cyclePath([{ fromKey: "a", toKey: "b", passthrough: 1 }, { fromKey: "b", toKey: "a", passthrough: 1 }])).toEqual(["a", "b", "a"]);
    const conflict = propagatePercents([{ fromKey: "a", toKey: "c", passthrough: 1 }, { fromKey: "b", toKey: "c", passthrough: 0.5 }], { a: 10, b: 10 });
    expect(conflict.conflicts).toContain("c");
  });

  it("promotes a scenario into the forecast and leaves the baseline untouched", () => {
    const baseline = [cell("revenue", "plan", 100)];
    const working = [cell("revenue", "forecast", 90)];
    const scenario = [cell("revenue", "forecast", 120)];
    const promoted = promoteForecast(baseline, working, scenario);
    expect(promoted.baselinePlan).toBe(baseline);
    expect(promoted.baselinePlan[0].value).toBe(100);
    expect(promoted.workingForecast[0].value).toBe(120);
  });

  it("does not sum a rate, and does not invent a split", () => {
    expect(rollup([1, 2, 3], "sum")).toBe(6);
    expect(rollup([10, 30], "weighted", [1, 3])).toBe(25);
    expect(rollup([10, 30], "weighted")).toBeNull();
    expect(rollup([1], "none")).toBeNull();
    expect(distribute(100, [{ key: "North" }, { key: "South" }], "share")).toEqual({ error: "Each row needs a weight. Plan will not guess the split." });
    const equal = distribute(100, [{ key: "North" }, { key: "South" }], "equal");
    expect("rows" in equal && equal.rows).toEqual([{ key: "North", value: 50 }, { key: "South", value: 50 }]);
  });

  it("shows a capacity gap without blocking the plan", () => {
    expect(capacityGap(24000, 20400)).toBe(-3600);
    const insights = buildInsights({ measures: [{ name: "Revenue", plan: 100, forecast: 80, actual: null, direction: "higher" }], capacity: [{ name: "November", demand: 24000, capacity: 20400 }], overdueActions: 0, approvals: 0 });
    expect(insights.some((item) => item.title.includes("capacity"))).toBe(true);
    expect(insights.some((item) => item.title.includes("Revenue"))).toBe(true);
  });

  it("locks an approved version and a chosen period", () => {
    expect(editAllowed({ planLocked: false, lockedPeriods: [], periodKey: "2027-11", versionKind: "baseline", versionStatus: "approved" })).toMatch(/approved/);
    expect(editAllowed({ planLocked: false, lockedPeriods: ["2027-11"], periodKey: "2027-11", versionKind: "forecast", versionStatus: "draft" })).toMatch(/period/);
    expect(editAllowed({ planLocked: false, lockedPeriods: [], periodKey: "2027-11", versionKind: "forecast", versionStatus: "draft" })).toBeNull();
  });

  it("builds a year of months and keeps a forecast accuracy pair", () => {
    const window = planWindow({ mode: "year", year: 2027 });
    expect(periodKeys(window.start, window.end)).toHaveLength(12);
    expect(planWindow({ mode: "quarter", year: 2027, quarter: 1 }).label).toBe("Q1 2027");
    expect(forecastAccuracy(1_020_000, 960_000)).toBe(-60_000);
    expect(forecastAccuracy(1, null)).toBeNull();
  });

  it("asks for a choice when a search could mean more than one measure", () => {
    const sales = resolveMetricSearch("sales");
    expect(sales.length).toBeGreaterThan(1);
    expect(resolveMetricSearch("revenue").map((metric) => metric.key)).toEqual(["revenue"]);
    expect(resolveMetricSearch("monthly complaints").map((metric) => metric.key)).toEqual(["complaints"]);
    expect(metricsFor(new Set(), false).some((metric) => metric.source === "marketing")).toBe(false);
    expect(metricsFor(new Set(["sales"]), false).some((metric) => metric.key === "labour_cost")).toBe(false);
  });

  it("hides a plan until it is shared", () => {
    expect(planVisible({ owner: false, company: false, shared: false, sensitive: false, canReadSensitive: true })).toBe(false);
    expect(planVisible({ owner: true, company: false, shared: false, sensitive: false, canReadSensitive: false })).toBe(true);
    expect(planVisible({ owner: false, company: false, shared: true, sensitive: false, canReadSensitive: false })).toBe(true);
    expect(planVisible({ owner: false, company: true, shared: false, sensitive: true, canReadSensitive: false })).toBe(false);
    expect(canEditPlan({ ownerUserId: "a", audience: "private", shares: [{ userId: "b", access: "view" }] }, "b")).toBe(false);
    expect(canEditPlan({ ownerUserId: "a", audience: "private", shares: [{ userId: "b", access: "edit" }] }, "b")).toBe(true);
    expect(audienceLabel("private", 0)).toBe("Only the owner");
  });

  it("draws dated work across the plan and keeps sales coverage explicit", () => {
    const layout = timelineLayout("2027-01-01", "2027-12-31", [
      { id: "1", title: "Launch", kind: "action", start: "2027-03-01", end: "2027-04-01", status: "open", detail: "" },
    ], new Date("2027-06-15T00:00:00Z"));
    expect(layout.months).toHaveLength(12);
    expect(layout.bars[0]?.left).toBeGreaterThan(10);
    expect(layout.bars[0]?.width).toBeGreaterThan(0);
    expect(layout.marker).toBeGreaterThan(40);
    expect(pointOnWindow("2027-01-01", "2027-12-31", 0)).toBe("2027-01-01");
    expect(templateFor("marketing").phases?.flatMap((phase) => phase.actions).length).toBeGreaterThan(4);
    expect(templateFor("sales").metricKeys).toEqual(expect.arrayContaining(["revenue", "pipeline", "quotes", "quote_value"]));
    const covered = salesPicture({ revenuePlan: 1_000_000, revenueActual: 400_000, ordersActual: 4, pipeline: 1_800_000 });
    expect(covered.remaining).toBe(600_000);
    expect(covered.coverage).toBe(3);
    expect(covered.average).toBe(100_000);
    expect(salesPicture({ revenuePlan: null, revenueActual: null, ordersActual: null, pipeline: null }).coverage).toBeNull();
  });

  it("does not add an entered total on top of a split", () => {
    const combined = combinePeriods([{ periodKey: "2027-01", dimensionKey: "", value: 100 }, { periodKey: "2027-01", dimensionKey: "north", value: 40 }, { periodKey: "2027-01", dimensionKey: "south", value: 60 }], "sum");
    expect(combined.mixed).toBe(true);
    expect(combined.value).toBe(100);
  });
});
