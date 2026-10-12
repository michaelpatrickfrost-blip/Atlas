// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import {
  TileChart,
  headline,
  pointsFor,
} from "@/modules/analytics/components/charts";
const metric = {
  id: "orders",
  name: "Orders",
  subject: "Sales",
  definition: "Orders",
  grain: "Order",
  href: "/sales",
  snapshot: true,
  points: Array.from({ length: 12 }, (_, i) => ({
    label: String(i),
    value: i + 1,
  })),
};
const widget = {
  id: "w",
  metricId: "orders",
  visual: "kpi" as const,
  wide: true,
};
afterEach(cleanup);
describe("Honest configurable dashboard visuals", () => {
  it("keeps all KPI groups in a headline instead of reporting a top-eight partial total", () => {
    expect(pointsFor(metric, widget)).toHaveLength(12);
    expect(headline(metric, pointsFor(metric, widget))).toBe("78");
    expect(
      pointsFor(metric, {
        ...widget,
        visual: "bar",
        maxCategories: 3,
        sort: "ascending",
      }).map((p) => p.value),
    ).toEqual([1, 2, 3]);
  });
  it("uses weighted overall averages and one explicit currency for a data KPI", () => {
    expect(headline({ ...metric, overallValue: 3 }, metric.points)).toBe("3");
    expect(
      headline(
        { ...metric, unit: "money", currency: "GBP", overallValue: 1575 },
        metric.points,
      ),
    ).toBe("£15.75");
  });
  it("guards misleading currency distributions and negative donut values", () => {
    const { unmount } = render(
      <TileChart
        metric={{ ...metric, unit: "money" }}
        widget={{ ...widget, visual: "donut" }}
      />,
    );
    expect(screen.getByText(/different currencies/)).toBeTruthy();
    unmount();
    render(
      <TileChart
        metric={{ ...metric, points: [{ label: "Credit", value: -10 }] }}
        widget={{ ...widget, visual: "donut" }}
      />,
    );
    expect(screen.getByText(/non-negative/)).toBeTruthy();
  });
  it("shows signed bars instead of drawing negative values as small positive bars", () => {
    render(
      <TileChart
        metric={{ ...metric, points: [{ label: "Credit", value: -10 }] }}
        widget={{ ...widget, visual: "bar" }}
      />,
    );
    expect(screen.getByText("Negative ← 0 → Positive")).toBeTruthy();
    expect(screen.getByText("-10")).toBeTruthy();
  });
});

describe("Calculated KPI group filters", () => {
  it("keeps weighted averages and extrema when only some groups are displayed", () => {
    const points = [
      { label: "A", value: 10, sampleSize: 3 },
      { label: "B", value: 2, sampleSize: 1 },
    ];
    expect(headline({ ...metric, calculation: "average" }, points)).toBe("8");
    expect(headline({ ...metric, calculation: "min" }, points)).toBe("2");
    expect(headline({ ...metric, calculation: "max" }, points)).toBe("10");
  });
});

describe("Selected groups and personal gauge references", () => {
  it("filters by exact selected labels and does not use an unrelated overall reading", () => {
    const scoped = { ...widget, categories: ["1", "3"] };
    expect(pointsFor(metric, scoped).map((p) => p.value)).toEqual([4, 2]);
    render(
      <TileChart metric={{ ...metric, overallValue: 78 }} widget={scoped} />,
    );
    expect(screen.getByText("6")).toBeTruthy();
    expect(screen.queryByText("78")).toBeNull();
  });
  it("never sums overlapping distinct groups into a filtered headline or gauge", () => {
    const { unmount } = render(
      <TileChart
        metric={{ ...metric, calculation: "distinct", overallValue: 8 }}
        widget={{ ...widget, categories: ["1", "3"] }}
      />,
    );
    expect(screen.getByText(/Group totals may overlap/)).toBeTruthy();
    unmount();
    render(
      <TileChart
        metric={{ ...metric, calculation: "distinct" }}
        widget={{ ...widget, visual: "gauge", target: 10 }}
      />,
    );
    expect(screen.getByText(/Group totals may overlap/)).toBeTruthy();
  });
  it("reports progress above target honestly while clamping the drawn arc", () => {
    render(
      <TileChart
        metric={{ ...metric, points: [{ label: "Completed", value: 120 }] }}
        widget={{ ...widget, visual: "gauge", target: 100 }}
      />,
    );
    expect(screen.getByText("120%")).toBeTruthy();
    expect(screen.getByText("120 / 100 target")).toBeTruthy();
  });
});

describe("Gauge target completeness", () => {
  it("uses every matching group despite a small chart display limit", () => {
    expect(
      pointsFor(metric, {
        ...widget,
        visual: "gauge",
        target: 100,
        maxCategories: 1,
      }),
    ).toHaveLength(12);
  });
});

describe("Gauge calculation semantics", () => {
  it("uses an exact distinct total for an unfiltered target", () => {
    render(
      <TileChart
        metric={{ ...metric, calculation: "distinct", overallValue: 8 }}
        widget={{ ...widget, visual: "gauge", target: 10 }}
      />,
    );
    expect(screen.getByText("80%")).toBeTruthy();
  });
  it("uses weighted averages of selected groups instead of adding group averages", () => {
    render(
      <TileChart
        metric={{
          ...metric,
          calculation: "average",
          overallValue: 99,
          points: [
            { label: "A", value: 10, sampleSize: 3 },
            { label: "B", value: 2, sampleSize: 1 },
          ],
        }}
        widget={{
          ...widget,
          visual: "gauge",
          target: 10,
          categories: ["A", "B"],
        }}
      />,
    );
    expect(screen.getByText("80%")).toBeTruthy();
  });
});

it("shows an explicit complete empty KPI reading while keeping filtered or unreported emptiness clear", () => {
  const { rerender } = render(<TileChart metric={{ ...metric, unit: "count", points: [], overallValue: 0 }} widget={widget}/>);
  expect(screen.getByText("0", { exact: true })).toBeTruthy();
  rerender(<TileChart metric={{ ...metric, points: [], overallValue: 8 }} widget={{ ...widget, categories: ["missing"] }}/>);
  expect(screen.getByText("Nothing in this period yet.")).toBeTruthy(); expect(screen.queryByText("8", { exact: true })).toBeNull();
  rerender(<TileChart metric={{ ...metric, points: [] }} widget={widget}/>);
  expect(screen.getByText("Nothing in this period yet.")).toBeTruthy();
});
