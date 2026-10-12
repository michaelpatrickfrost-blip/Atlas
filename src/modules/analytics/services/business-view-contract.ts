import { z } from "zod";
import type { AnalyticsResult } from "@/core/analytics/types";
import { boardFiltersSchema, dashboardSchema, widgetSchema } from "../definition";
const countPointsSchema = z.array(z.strictObject({ label: z.string().min(1).max(200), value: z.number().int().nonnegative().safe() })).max(50);
/** Display only for this complete registered count family. An empty grouped
 * response is a complete zero count, not an invented group or missing reading. */
export function businessViewCountData(input: unknown): Pick<AnalyticsResult, "points" | "overallValue"> {
  const points = countPointsSchema.parse(input);
  if (new Set(points.map(point => point.label)).size !== points.length) throw new Error("This count contains duplicate groups.");
  const overallValue = points.reduce((total, point) => total + point.value, 0);
  if (!Number.isSafeInteger(overallValue)) throw new Error("This complete count exceeds its safe display limit.");
  return { points, overallValue };
}
const { id: personalId, expectedUpdatedAt: personalCAS, ...boardShape } = dashboardSchema.shape;
void personalId; void personalCAS;
/** Native display controls reused with a closed business metadata boundary.
 * Original personal dashboards/data views remain unchanged. Export-based record
 * aggregation is deliberately unavailable in this first registered view family. */
export const analyticsBusinessViewContentSchema = z.strictObject({ ...boardShape,
  filters: z.strictObject(boardFiltersSchema.shape).default({ from: "", to: "", search: "" }),
  widgets: z.array(z.strictObject({ ...widgetSchema.shape, data: z.never().optional() })).min(1).max(8),
}).superRefine((value, context) => {
  if (new Set(value.widgets.map(widget => widget.id)).size !== value.widgets.length)
    context.addIssue({ code: "custom", message: "Widget IDs must be unique." });
  if (value.filters.from || value.filters.to || value.filters.search)
    context.addIssue({ code: "custom", message: "These registered count measures support a period and approved breakdown; record filters and report aggregations are not available in this business view yet." });
});

export const businessViewCreateSchema = analyticsBusinessViewContentSchema;
export const businessViewSaveSchema = z.strictObject({ definitionId: z.uuid(), revision: z.number().int().nonnegative(), ...analyticsBusinessViewContentSchema.shape });
export const businessViewReviewSchema = z.strictObject({ definitionId: z.uuid(), revision: z.number().int().nonnegative() });
export const businessViewPublishSchema = businessViewReviewSchema.extend({ acknowledgeWarnings: z.boolean() });
export const businessViewRestoreSchema = z.strictObject({ definitionId: z.uuid(), versionId: z.uuid(), definitionRevision: z.number().int().nonnegative() });
export type BusinessViewContent = z.infer<typeof analyticsBusinessViewContentSchema>;
export type BusinessViewDraft = { definitionId: string; name: string; updatedAt: string; revision: number; definitionRevision: number; activeVersionId: string | null;
  content: BusinessViewContent; warnings: string[]; versions: { id: string; version: number; publishedAt: string }[] };
export type PublishedBusinessView = { definitionId: string; name: string; definitionRevision: number;
  view: { versionId: string; version: number; checksum: string }; content: BusinessViewContent; dataByWidget: Record<string, AnalyticsResult> };
