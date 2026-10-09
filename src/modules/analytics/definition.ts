import { z } from "zod";

export const visuals = [
  "kpi",
  "bar",
  "stacked",
  "column",
  "line",
  "area",
  "donut",
  "pie",
  "gauge",
  "funnel",
  "table",
] as const;
export const dataViewSchema = z.object({
  dataset: z.string().min(1).max(100),
  group: z.string().max(80).default(""),
  measure: z.string().max(80).default(""),
  aggregation: z
    .enum(["count", "sum", "average", "min", "max", "distinct"])
    .default("count"),
  bucket: z.enum(["day", "month", "year"]).default("month"),
  currency: z.string().max(10).default(""),
  search: z.string().trim().max(200).default(""),
  from: z.string().max(10).default(""),
  to: z.string().max(10).default(""),
  filters: z
    .array(
      z.object({
        field: z.string().max(80),
        operator: z.enum(["contains", "equals", "gte", "lte"]),
        value: z.string().max(200),
      }),
    )
    .max(12)
    .default([]),
});
export const boardFiltersSchema = z.object({
  from: z.string().max(10).default(""),
  to: z.string().max(10).default(""),
  search: z.string().trim().max(200).default(""),
});
export const widgetSchema = z.object({
  id: z.string().min(1).max(80),
  metricId: z.string().min(1).max(80),
  visual: z.enum(visuals),
  wide: z.boolean(),
  span: z
    .union([z.literal(4), z.literal(6), z.literal(8), z.literal(12)])
    .optional(),
  title: z.string().trim().max(100).optional(),
  category: z.string().max(200).optional(),
  maxCategories: z.number().int().min(1).max(50).optional(),
  borderless: z.boolean().optional(),
  tone: z.enum(["neutral", "blue", "ink"]).optional(),
  color: z
    .enum(["blue", "teal", "violet", "amber", "rose", "slate"])
    .optional(),
  breakdown: z.string().trim().max(40).optional(),
  data: dataViewSchema.optional(),
  height: z.enum(["compact", "standard", "tall"]).optional(),
  sort: z.enum(["source", "ascending", "descending", "label"]).optional(),
  minimum: z.number().finite().optional(),
  maximum: z.number().finite().optional(),
});
export const refreshChoices = [0, 15, 30, 60, 120] as const;
export const periods = ["30", "90", "365", "all"] as const;
export const dashboardSchema = z
  .object({
    name: z.string().trim().min(1).max(70),
    period: z.enum(periods).default("90"),
    refreshSeconds: z
      .union([
        z.literal(0),
        z.literal(15),
        z.literal(30),
        z.literal(60),
        z.literal(120),
      ])
      .default(30),
    widgets: z.array(widgetSchema).min(1).max(24),
    id: z.string().min(1).max(40).optional(),
    expectedUpdatedAt: z.string().datetime().optional(),
    filters: boardFiltersSchema.default({ from: "", to: "", search: "" }),
  })
  .refine(
    (dashboard) =>
      new Set(dashboard.widgets.map((widget) => widget.id)).size ===
      dashboard.widgets.length,
    "Widget IDs must be unique",
  );
export const boardMetaSchema = z.object({
  kind: z.literal("atlas-board"),
  period: z.enum(periods).default("90"),
  refreshSeconds: z.union([
    z.literal(0),
    z.literal(15),
    z.literal(30),
    z.literal(60),
    z.literal(120),
  ]),
  filters: boardFiltersSchema.default({ from: "", to: "", search: "" }),
});
export type DataView = z.infer<typeof dataViewSchema>;
export type BoardFilters = z.infer<typeof boardFiltersSchema>;
export type StudioWidget = z.infer<typeof widgetSchema>;
export const DASHBOARD_PREFIX = "Analytics · ";
export function widgetSpan(widget: StudioWidget) {
  return widget.span ?? (widget.wide ? 6 : 4);
}
export function readWidgets(values: string[]): StudioWidget[] {
  return values.flatMap((value) => {
    try {
      const parsed = widgetSchema.safeParse(JSON.parse(value));
      return parsed.success ? [parsed.data] : [];
    } catch {
      return [];
    }
  });
}
export function readBoardSettings(values: string[]) {
  for (const value of values) {
    try {
      const parsed = boardMetaSchema.safeParse(JSON.parse(value));
      if (parsed.success)
        return {
          refreshSeconds: parsed.data.refreshSeconds,
          period: parsed.data.period,
          filters: parsed.data.filters,
        };
    } catch {
      /* older boards have no settings entry */
    }
  }
  return {
    refreshSeconds: 30 as const,
    period: "90" as const,
    filters: { from: "", to: "", search: "" },
  };
}
