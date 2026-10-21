import { CommercialOrderStatus, OrderType, QuoteStatus } from "@/generated/prisma/enums";
import { registeredMetricContributions, registeredReportContributions, type RegisteredReportColumn } from "@/core/studio/registry/analytics-sources";
import type { StudioModuleContract } from "@/core/studio/registry/types";
import { salesAnalytics } from "./analytics";
import { reports } from "./reports";

const common = { schemaVersion: 1 as const, classification: "confidential" as const, costClass: "high" as const,
  complete: true as const, requiredModules: ["sales"] };
const labels = (codes: Record<string, string>) => Object.values(codes).map(value => value.replaceAll("_", " "));
function metric(id: string) { const value = salesAnalytics.find(source => source.id === id); if (!value) throw new Error("Missing approved Sales metric."); return value; }
function report(id: string) { const value = reports.find(source => source.id === id); if (!value) throw new Error("Missing approved Sales report."); return value; }
const column = (id: string, type: RegisteredReportColumn["type"], extra: Partial<RegisteredReportColumn> = {}): RegisteredReportColumn =>
  ({ id, type, nullable: false, classification: "confidential", searchable: false, ...extra });
const base = (quote: boolean) => [column("reference", "text", { filterPath: "reference", searchable: true }),
  column("customer", "text", { filterPath: "party.name", searchable: true }),
  column("status", "enum", { filterPath: quote ? "status" : "commercialStatus", codes: Object.values(quote ? QuoteStatus : CommercialOrderStatus) }),
  column("currency", "text", { filterPath: quote ? "totalCurrency" : "currency", searchable: true }),
  ...["net", "tax", "total"].map(id => column(id, "money", { currencyKey: "currency" }))];
/** Additive owner approvals. Existing native providers/IDs and old Studio
 * contracts remain intact; complete finite counts only, no truncated/private
 * Sales dimensions or Finance/revenue permission is inferred. */
export const salesAnalyticsStudioContract: StudioModuleContract = { contributions: [
  ...registeredMetricContributions("sales", metric("sales.orders"), { ...common, kind: "metric", providerId: "sales.orders",
    query: { id: "sales.orders.metric.read", version: 1 }, requiredCapabilities: ["sales.order.read"], unit: "count", snapshot: false, maxCardinality: 7,
    dimensions: [{ id: "status", labels: labels(CommercialOrderStatus) }, { id: "type", labels: labels(OrderType) }] }),
  ...registeredMetricContributions("sales", metric("sales.quotes"), { ...common, kind: "metric", providerId: "sales.quotes",
    query: { id: "sales.quotes.metric.read", version: 1 }, requiredCapabilities: ["sales.quote.read"], unit: "count", snapshot: false, maxCardinality: 4,
    dimensions: [{ id: "default", labels: Object.values(QuoteStatus) }] }),
  ...registeredReportContributions("sales", report("sales.orders"), { ...common, kind: "report", providerId: "sales.orders",
    query: { id: "sales.orders.report.read", version: 1 }, requiredCapabilities: ["sales.order.read"], pagination: "page", pageSize: 100, maxCardinality: 100,
    dateField: "orderDate", moneyRepresentation: "major_decimal_number_or_exact_text", columns: [...base(false),
      column("orderDate", "date", { filterPath: "orderDate" }), column("requestedDeliveryDate", "date", { filterPath: "requestedDeliveryDate", nullable: true }),
      column("createdAt", "date", { filterPath: "createdAt" })] }),
  ...registeredReportContributions("sales", report("sales.quotes"), { ...common, kind: "report", providerId: "sales.quotes",
    query: { id: "sales.quotes.report.read", version: 1 }, requiredCapabilities: ["sales.quote.read"], pagination: "page", pageSize: 100, maxCardinality: 100,
    dateField: "createdAt", moneyRepresentation: "major_decimal_number_or_exact_text", columns: [...base(true),
      column("expiryDate", "date", { filterPath: "expiryDate", nullable: true }), column("createdAt", "date", { filterPath: "createdAt" })] }),
] };
