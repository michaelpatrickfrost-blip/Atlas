import { z } from "zod";

export const visuals = ["kpi", "bar", "stacked", "column", "line", "area", "donut", "pie", "gauge", "funnel", "table"] as const;
export const widgetSchema = z.object({
  id: z.string().min(1).max(80),
  metricId: z.string().min(1).max(80),
  visual: z.enum(visuals),
  wide: z.boolean(),
  span: z.union([z.literal(4), z.literal(6), z.literal(8), z.literal(12)]).optional(),
  title: z.string().trim().max(100).optional(),
  category: z.string().max(200).optional(),
  maxCategories: z.number().int().min(1).max(50).optional(),
  borderless: z.boolean().optional(),
  tone: z.enum(["neutral", "blue", "ink"]).optional(),
  color: z.enum(["blue", "teal", "violet", "amber", "rose", "slate"]).optional(),
  breakdown: z.string().trim().max(40).optional(),
});
export const refreshChoices = [0, 15, 30, 60, 120] as const;
export const dashboardSchema = z.object({
  name: z.string().trim().min(1).max(70),
  refreshSeconds: z.union([z.literal(0), z.literal(15), z.literal(30), z.literal(60), z.literal(120)]).default(30),
  widgets: z.array(widgetSchema).min(1).max(24),
}).refine((dashboard) => new Set(dashboard.widgets.map((widget) => widget.id)).size === dashboard.widgets.length, "Widget IDs must be unique");
export const boardMetaSchema = z.object({ kind: z.literal("atlas-board"), refreshSeconds: z.union([z.literal(0), z.literal(15), z.literal(30), z.literal(60), z.literal(120)]) });
export type StudioWidget = z.infer<typeof widgetSchema>;
export const DASHBOARD_PREFIX = "Analytics · ";
export function widgetSpan(widget: StudioWidget) { return widget.span ?? (widget.wide ? 6 : 4); }
export function readWidgets(values: string[]): StudioWidget[] {
  return values.flatMap((value) => {
    try {
      const parsed = widgetSchema.safeParse(JSON.parse(value));
      return parsed.success ? [parsed.data] : [];
    } catch { return []; }
  });
}
export function readBoardSettings(values: string[]) {
  for (const value of values) {
    try {
      const parsed = boardMetaSchema.safeParse(JSON.parse(value));
      if (parsed.success) return { refreshSeconds: parsed.data.refreshSeconds };
    } catch { /* older boards have no settings entry */ }
  }
  return { refreshSeconds: 30 as const };
}
