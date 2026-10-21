import { ProductKind } from "@/generated/prisma/enums";
import { registeredMetricContributions, registeredReportContributions, type RegisteredReportColumn } from "@/core/studio/registry/analytics-sources";
import type { StudioModuleContract } from "@/core/studio/registry/types";
import { productsAnalytics } from "./analytics";
import { reports } from "./reports";
const common = { schemaVersion: 1 as const, classification: "confidential" as const, costClass: "high" as const,
  complete: true as const, requiredModules: ["products"], requiredCapabilities: ["core.products.read"] };
const metric = productsAnalytics.find(source => source.id === "products.catalogue"), report = reports.find(source => source.id === "products.catalogue");
if (!metric || !report) throw new Error("Missing approved Products source.");
const column = (id: string, type: RegisteredReportColumn["type"], extra: Partial<RegisteredReportColumn> = {}): RegisteredReportColumn =>
  ({ id, type, nullable: false, classification: "confidential", filterPath: id, searchable: false, ...extra });
/** Existing shared catalogue and complete kind counts; no copied Product,
 * pricing/inventory/Finance facts, source result cache or new query engine. */
export const productsAnalyticsStudioContract: StudioModuleContract = { contributions: [
  ...registeredMetricContributions("products", metric, { ...common, kind: "metric", providerId: "products.catalogue",
    query: { id: "products.catalogue.metric.read", version: 1 }, unit: "count", snapshot: true, maxCardinality: 3,
    dimensions: [{ id: "default", labels: Object.values(ProductKind) }] }),
  ...registeredReportContributions("products", report, { ...common, kind: "report", providerId: "products.catalogue",
    query: { id: "products.catalogue.report.read", version: 1 }, pagination: "page", pageSize: 100, maxCardinality: 100,
    dateField: "createdAt", moneyRepresentation: "major_decimal_number_or_exact_text", columns: [
      column("code", "text", { searchable: true }), column("name", "text", { searchable: true }),
      column("categoryCode", "text", { nullable: true, searchable: true }), column("kind", "enum", { codes: Object.values(ProductKind) }),
      column("unitOfMeasure", "text", { searchable: true }), column("active", "boolean"), column("createdAt", "date"),
    ] }),
] };
