import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReportDataset } from "@/core/reports/types";
import type { Session } from "@/core/auth/session";
import { dataViewSchema } from "@/modules/analytics/definition";
const mock = vi.hoisted(() => ({
  datasets: vi.fn(),
  metrics: vi.fn(),
  read: vi.fn(),
}));
vi.mock("@/core/reports/catalogue", () => ({
  reportDatasets: mock.datasets,
  publicSpec: (d: unknown) => d,
}));
vi.mock("@/core/analytics/catalogue", () => ({
  getAnalyticsMetrics: mock.metrics,
}));
import {
  aggregateRows,
  dataViewInput,
  loadDataWidgets,
  loadBoardWidgets,
} from "@/modules/analytics/data-views";
const dataset: ReportDataset = {
  id: "orders",
  name: "Orders",
  source: "Sales",
  description: "Orders",
  anyOf: ["sales.order.read"],
  dateField: "createdAt",
  columns: [
    { key: "name", label: "Name", path: "name", searchable: true },
    {
      key: "status",
      label: "Status",
      path: "status",
      values: ["OPEN", "CLOSED"],
    },
    { key: "amount", label: "Amount", type: "money", currencyKey: "currency" },
    { key: "currency", label: "Currency", path: "currency" },
    { key: "createdAt", label: "Created", path: "createdAt", type: "date" },
    { key: "quantity", label: "Quantity", path: "quantity", type: "number" },
  ],
  read: mock.read,
};
const filters = { from: "", to: "", search: "" },
  session = { organisationId: "tenant", userId: "reader" } as Session;
const view = (patch: Record<string, unknown> = {}) =>
  dataViewSchema.parse({ dataset: "orders", ...patch });
const widget = {
  id: "widget",
  metricId: "data.orders",
  visual: "column" as const,
  wide: true,
  data: view(),
};
beforeEach(() => {
  vi.clearAllMocks();
  mock.datasets.mockResolvedValue([dataset]);
  mock.metrics.mockResolvedValue([]);
  mock.read.mockResolvedValue({
    rows: [
      { status: "OPEN", name: "A", amount: 12.5, currency: "GBP", quantity: 2 },
      {
        status: "CLOSED",
        name: "A",
        amount: 3.25,
        currency: "GBP",
        quantity: 4,
      },
    ],
    total: 2,
  });
});
describe("Authorised personal dashboard data views", () => {
  it("rejects nonexistent fields, unsupported filters and missing monetary currency before reading", () => {
    for (const data of [
      view({ group: "secret" }),
      view({ measure: "name", aggregation: "sum" }),
      view({ measure: "amount", aggregation: "sum" }),
      view({ filters: [{ field: "secret", operator: "equals", value: "x" }] }),
      view({
        filters: [{ field: "status", operator: "equals", value: "FORGED" }],
      }),
    ])
      expect(() => dataViewInput(dataset, data, filters)).toThrow();
    expect(mock.read).not.toHaveBeenCalled();
  });
  it("binds a monetary calculation to one currency and reuses inclusive source calendar filters", () => {
    const input = dataViewInput(
      dataset,
      view({ measure: "amount", aggregation: "sum", currency: "GBP" }),
      { from: "2026-01-01", to: "2026-01-31", search: "Customer" },
    );
    expect(input.filters).toContainEqual({
      field: "currency",
      operator: "equals",
      value: "GBP",
    });
    expect(input.to).toBe("2026-01-31");
    expect(input.search).toBe("Customer");
  });
  it("rejects impossible or reversed dates and nonnumeric operators", () => {
    expect(() =>
      dataViewInput(dataset, view(), { ...filters, from: "2026-02-31" }),
    ).toThrow();
    expect(() =>
      dataViewInput(dataset, view(), {
        ...filters,
        from: "2026-03-01",
        to: "2026-02-01",
      }),
    ).toThrow();
    expect(() =>
      dataViewInput(
        dataset,
        view({
          filters: [{ field: "quantity", operator: "contains", value: "2" }],
        }),
        filters,
      ),
    ).toThrow();
  });
  it("keeps snapshot sources unbound to unsupported board date/search filters", () => {
    const d = {
      ...dataset,
      dateField: undefined,
      columns: [
        { key: "quantity", type: "number" as const, label: "Quantity" },
      ],
    };
    expect(
      dataViewInput(d, view(), {
        from: "2026-01-01",
        to: "2026-01-31",
        search: "Private",
      }),
    ).toMatchObject({ from: "", to: "", search: "" });
  });
  it("does not query an unavailable or newly revoked source", async () => {
    mock.datasets.mockResolvedValue([]);
    const result = await loadDataWidgets(session, [widget], filters);
    expect(result.widget.error).toContain("no longer available");
    expect(mock.read).not.toHaveBeenCalled();
  });
  it("returns only aggregate points, binds the server session and reads all matching rows", async () => {
    const result = await loadDataWidgets(
      session,
      [{ ...widget, data: view({ group: "status" }) }],
      filters,
    );
    expect(mock.read).toHaveBeenCalledWith(
      session,
      expect.objectContaining({ dataset: "orders" }),
      true,
    );
    expect(result.widget.points).toEqual([
      { label: "OPEN", value: 1 },
      { label: "CLOSED", value: 1 },
    ]);
    expect(result.widget).not.toHaveProperty("rows");
  });
  it("calculates averages and distinct counts across records, not sums of group results", async () => {
    const result = await loadDataWidgets(
      session,
      [
        {
          ...widget,
          data: view({
            group: "status",
            measure: "quantity",
            aggregation: "average",
          }),
        },
        {
          ...widget,
          id: "distinct",
          data: view({
            group: "status",
            measure: "name",
            aggregation: "distinct",
          }),
        },
      ],
      filters,
    );
    expect(result.widget.overallValue).toBe(3);
    expect(result.distinct.overallValue).toBe(1);
  });
  it("never rounds exact financial text or silently totals a truncated result", async () => {
    mock.read.mockResolvedValue({
      rows: [{ amount: "1234567890123456.78", currency: "GBP" }],
      total: 1,
    });
    expect(
      (
        await loadDataWidgets(
          session,
          [
            {
              ...widget,
              data: view({
                measure: "amount",
                aggregation: "sum",
                currency: "GBP",
              }),
            },
          ],
          filters,
        )
      ).widget.error,
    ).toContain("precision");
    mock.read.mockResolvedValue({ rows: [{ quantity: 1 }], total: 10001 });
    expect(
      (await loadDataWidgets(session, [widget], filters)).widget.error,
    ).toContain("all matching");
  });
  it("aggregates monetary minor units, ignores null measures and orders time buckets", () => {
    expect(
      aggregateRows(
        dataset,
        [
          { amount: 12.5, currency: "GBP" },
          { amount: 3.25, currency: "GBP" },
          { amount: null, currency: "GBP" },
        ],
        view({ measure: "amount", aggregation: "sum", currency: "GBP" }),
      ),
    ).toEqual([{ label: "All records", value: 1575 }]);
    expect(
      aggregateRows(
        dataset,
        [
          { createdAt: new Date("2026-02-01"), quantity: 2 },
          { createdAt: new Date("2026-01-01"), quantity: 3 },
        ],
        view({ group: "createdAt", measure: "quantity", aggregation: "max" }),
      ),
    ).toEqual([
      { label: "2026-01", value: 3 },
      { label: "2026-02", value: 2 },
    ]);
  });
  it("resolves multiple monitor breakdowns independently and isolates an invalid view", async () => {
    const query = vi
      .fn()
      .mockImplementation(async (_s, _d, b) => [{ label: b, value: 1 }]);
    mock.metrics.mockResolvedValue([
      {
        id: "sales",
        name: "Orders",
        subject: "Sales",
        definition: "Count",
        grain: "Order",
        href: "/sales",
        snapshot: false,
        capability: "read",
        breakdowns: [{ id: "status" }, { id: "product" }],
        query,
      },
    ]);
    const widgets = ["status", "product", "secret"].map((b) => ({
      id: b,
      metricId: "sales",
      visual: "bar" as const,
      wide: true,
      breakdown: b,
    }));
    const result = await loadBoardWidgets(session, widgets, filters, "90");
    expect(result.status.points[0].label).toBe("status");
    expect(result.product.points[0].label).toBe("product");
    expect(result.secret.error).toBeTruthy();
    expect(query).toHaveBeenCalledTimes(2);
  });
});

describe("Monetary chart consistency", () => {
  it("rejects mixed source currencies even when a source unexpectedly returns them", () => {
    expect(() =>
      aggregateRows(
        dataset,
        [{ amount: 10, currency: "EUR" }],
        view({ measure: "amount", aggregation: "sum", currency: "GBP" }),
      ),
    ).toThrow("another currency");
  });
  it("distinguishes an empty count from an unavailable query", () => {
    expect(aggregateRows(dataset, [], view())).toEqual([
      { label: "All records", value: 0 },
    ]);
  });
});

describe("Missing numeric readings", () => {
  it("does not invent zero averages or extrema for empty or null-only records", () => {
    for (const aggregation of ["average", "min", "max"]) {
      expect(
        aggregateRows(dataset, [], view({ aggregation, measure: "quantity" })),
      ).toEqual([]);
      expect(
        aggregateRows(
          dataset,
          [{ quantity: null }],
          view({ aggregation, measure: "quantity" }),
        ),
      ).toEqual([]);
    }
  });
});

describe('Unavailable average metadata',()=>{it('retains an absent reading through the server widget projection',async()=>{mock.read.mockResolvedValue({rows:[{quantity:null}],total:1});const result=await loadDataWidgets(session,[{...widget,data:view({aggregation:'average',measure:'quantity'})}],filters);expect(result.widget.points).toEqual([]);expect(result.widget.overallValue).toBeUndefined();});});
