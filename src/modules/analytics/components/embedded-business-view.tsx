"use client";

import { z } from "zod";
import React from "react";
import type { AnalyticsResult } from "@/core/analytics/types";
import type { EmbeddedViewOutput } from "@/core/studio/pages/embedded-views";
import { analyticsBusinessViewContentSchema, type PublishedBusinessView } from "../services/business-view-contract";
import { BusinessViewCharts } from "./business-view-charts";

const pointsSchema = z.array(z.strictObject({ label: z.string().min(1).max(200), value: z.number().int().nonnegative().safe() })).max(50);
const measures = {
  "sales.orders": { name: "Orders received", subject: "Sales", href: "/sales/orders", snapshot: false },
  "sales.quotes": { name: "Quotations", subject: "Sales", href: "/sales/quotes", snapshot: false },
  "products.catalogue": { name: "Active catalogue", subject: "Products", href: "/products", snapshot: true },
} as const;
/** Display boundary only. Core already resolved the exact immutable pin and
 * independently authorised every used native source before obtaining results.
 * Reuse the original charts with bounded count data; no loaders or callbacks. */
export function embeddedBusinessViewDisplay(output: EmbeddedViewOutput): Pick<PublishedBusinessView, "content" | "dataByWidget"> {
  if (output.sourceView.id !== "analytics.dashboard.view" || output.sourceView.version !== 1)
    throw new Error("This saved dashboard display is unavailable.");
  const content = analyticsBusinessViewContentSchema.parse(output.content), dataByWidget: Record<string, AnalyticsResult> = {};
  const expected = new Set(content.widgets.map(widget => widget.id));
  if (Object.keys(output.dataByWidget).length !== expected.size || Object.keys(output.dataByWidget).some(id => !expected.has(id)))
    throw new Error("This saved dashboard display changed.");
  for (const widget of content.widgets) {
    if (!Object.hasOwn(measures, widget.metricId)) throw new Error("This measure has no approved chart display.");
    const measure = measures[widget.metricId as keyof typeof measures];
    dataByWidget[widget.id] = { ...measure, id: widget.metricId, definition: "Approved complete count for the saved period and breakdown.",
      grain: "Record", shape: "breakdown", unit: "count", points: pointsSchema.parse(output.dataByWidget[widget.id]) };
  }
  return { content, dataByWidget };
}
export function EmbeddedBusinessView({ output }: { output: EmbeddedViewOutput | null }) {
  if (!output) return <p className="text-sm text-slate-500">Saved dashboard preview. Load an actual record to see current figures.</p>;
  let view: ReturnType<typeof embeddedBusinessViewDisplay> | null = null;
  try { view = embeddedBusinessViewDisplay(output); }
  catch { /* Reject malformed display data without another provider or cache. */ }
  return view ? <BusinessViewCharts view={view}/>
    : <p role="status" className="text-sm text-amber-800">This saved dashboard cannot be displayed. Refresh and check your current access.</p>;
}
