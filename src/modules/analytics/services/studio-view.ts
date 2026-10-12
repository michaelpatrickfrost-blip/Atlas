import { viewSource } from "@/core/studio/registry/view-contracts";
import type { StudioModuleContract } from "@/core/studio/registry/types";
import type { ViewJson } from "@/core/studio/views/schema";
import { analyticsBusinessViewContentSchema } from "./business-view-contract";
export { analyticsBusinessViewContentSchema } from "./business-view-contract";

const sources = ["sales.orders", "sales.quotes", "products.catalogue"] as const;
const sourceFor = (providerId: string) => {
  if (!sources.some(id => id === providerId)) throw new Error("This measure does not have an approved complete business view contract yet.");
  return { id: `${providerId}.metric`, version: 1 };
};
function json(value: unknown): ViewJson { return JSON.parse(JSON.stringify(value)) as ViewJson; }

/** Explicit owner adapter, no renderer/query/database/service/publisher. The
 * registry preflights current Analytics Manage and all independent source grants
 * and exact metadata before the second pure callback receives its approvals. */
export const analyticsBusinessViewContract: StudioModuleContract = { contributions: [viewSource({
  id: "analytics.dashboard.view", version: 1, label: "Business dashboard", capability: "analytics.dashboard.read",
  lifecycle: "active", classification: "confidential", contentSchema: analyticsBusinessViewContentSchema,
  policy: { schemaVersion: 1, family: "analytics_dashboard", authoringCapability: "analytics.dashboard.manage",
    requiredModules: ["analytics"], maxQueries: 8, maxQueryCost: 24, sources: sources.map(sourceFor) },
  callbacks: {
    prepare(raw) {
      if (raw && typeof raw === "object" && !Array.isArray(raw) && Array.isArray(raw.widgets)
        && raw.widgets.some(widget => widget && typeof widget === "object" && !Array.isArray(widget) && "data" in widget))
        throw new Error("Report aggregations are not available in this registered business view yet. Use the existing Reports app.");
      const content = analyticsBusinessViewContentSchema.parse(raw);
      const selected = new Map(content.widgets.map(widget => { const source = sourceFor(widget.metricId); return [source.id, source]; }));
      return { content: json(content), sources: [...selected.values()].sort((a, b) => a.id.localeCompare(b.id)) };
    },
    compile(raw, approvals) {
      const content = analyticsBusinessViewContentSchema.parse(raw);
      const requests = content.widgets.map(widget => {
        const source = sourceFor(widget.metricId), approval = approvals.find(value => value.source.id === source.id && value.source.version === source.version);
        if (!approval || approval.policy.providerId !== widget.metricId || approval.policy.unit !== "count" || !approval.policy.complete)
          throw new Error("The registered measure changed; review the dashboard again.");
        const dimension = widget.breakdown || approval.policy.dimensions[0].id;
        const approved = approval.policy.dimensions.find(value => value.id === dimension);
        if (!approved) throw new Error("Choose an approved complete measure breakdown.");
        if ((widget.category !== undefined && widget.category !== "" && !approved.labels.includes(widget.category))
          || widget.categories?.some(label => !approved.labels.includes(label))
          || (widget.categories && new Set(widget.categories).size !== widget.categories.length))
          throw new Error("Choose categories from the approved measure breakdown.");
        return { widgetId: widget.id, query: approval.query,
          input: { period: approval.policy.snapshot ? "all" : content.period, dimension } };
      });
      return { content: json(content), requests };
    },
  },
})] };
