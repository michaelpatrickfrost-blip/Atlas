import { z } from "zod";
import { sessionAuthorityStamp, sessionForUser, type Session } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { getEnabledModuleIds } from "@/core/modules/runtime";
import type { AnalyticsMetric } from "@/core/analytics/types";
import type { ReportDataset, ReportValue } from "@/core/reports/types";
import { REPORT_PAGE_SIZE } from "@/core/reports/types";
import { reportWhere, selectedReportColumns } from "@/core/reports/filters";
import { checksum, declarative, query } from "./contracts";
import type { Context, Contribution } from "./types";

import { registeredMetricSourceSchema, registeredReportSourceSchema, registeredMetricInputSchema,
  type RegisteredMetricSource, type RegisteredReportSource, type RegisteredReportColumn } from "./analytics-source-contracts";
export { registeredMetricSourceSchema, registeredReportSourceSchema, registeredReportColumnSchema, registeredMetricInputSchema } from "./analytics-source-contracts";
export type { RegisteredMetricSource, RegisteredReportSource, RegisteredReportColumn } from "./analytics-source-contracts";
const currentIdentityKeys = ["userId", "organisationId", "membershipId", "authVersion", "sessionVersion"] as const;
function freezePolicy<T>(value: T): T {
  if (value && typeof value === "object") { Object.values(value).forEach(freezePolicy); Object.freeze(value); }
  return value;
}
function unavailable(): never { throw new Error("DEPENDENCY_BROKEN: this registered Analytics source is unavailable or changed."); }
function denied(): never { throw new Error("FORBIDDEN: current authenticated source access is required."); }

/** Read-only genuine identity refresh, never a fabricated selected Session. The
 * original source reader owns its business queries; no transactional snapshot,
 * native write authority, cache, or new broad permission is inferred here. */
async function sourceSession(ctx: Context, policy: Pick<RegisteredMetricSource, "requiredCapabilities" | "requiredModules">): Promise<Session> {
  const original = sessionAuthorityStamp(ctx.session);
  if (!original || ctx.session.userId !== original.userId || ctx.session.organisationId !== original.organisationId
    || ctx.session.membershipId !== original.membershipId) denied();
  const current = await sessionForUser(original.organisationId, original.userId, ctx.transaction);
  const stamp = current && sessionAuthorityStamp(current);
  if (!current || !stamp || currentIdentityKeys.some(key => original[key] !== stamp[key])
    || current.userId !== stamp.userId || current.organisationId !== stamp.organisationId || current.membershipId !== stamp.membershipId) denied();
  for (const capability of policy.requiredCapabilities) assertCapability(current, capability);
  const enabled = await getEnabledModuleIds(current.organisationId, ctx.transaction);
  if (policy.requiredModules.some(id => !enabled.has(id))) unavailable();
  return current;
}
function checkOwnership(owner: string, providerId: string, capability: string, policy: { query: { id: string; version: number }; requiredCapabilities: string[]; requiredModules: string[] }) {
  if (!providerId.startsWith(`${owner}.`) || !policy.query.id.startsWith(`${providerId}.`) || policy.query.version !== 1 || policy.requiredCapabilities[0] !== capability
    || !policy.requiredModules.includes(owner) || new Set(policy.requiredCapabilities).size !== policy.requiredCapabilities.length
    || new Set(policy.requiredModules).size !== policy.requiredModules.length) unavailable();
}
const metricMeaning = (metric: AnalyticsMetric) => ({ id: metric.id, capability: metric.capability, snapshot: metric.snapshot,
  unit: metric.unit ?? "count", requiredCapabilities: metric.requiredCapabilities ?? [], requiredModules: metric.requiredModules ?? [],
  breakdowns: (metric.breakdowns ?? []).map(item => ({ id: item.id, shape: item.shape ?? "breakdown" })), shape: metric.shape ?? "breakdown" });

/** Explicit complete finite enum counts only. Truncated trends, private/free-text
 * dimensions, monetary measures and goal denominators need separate approvals. */
export function registeredMetricContributions(owner: string, metric: AnalyticsMetric, input: RegisteredMetricSource): Contribution[] {
  const policy = freezePolicy(registeredMetricSourceSchema.parse(input)), meaning = metricMeaning(metric);
  checkOwnership(owner, metric.id, metric.capability, policy);
  if (policy.providerId !== metric.id || policy.snapshot !== metric.snapshot || meaning.unit !== "count" || meaning.shape !== "breakdown"
    || policy.dimensions.some(dimension => dimension.labels.length > policy.maxCardinality || new Set(dimension.labels).size !== dimension.labels.length)
    || new Set(policy.dimensions.map(dimension => dimension.id)).size !== policy.dimensions.length
    || (metric.requiredCapabilities ?? []).some(cap => !policy.requiredCapabilities.includes(cap))
    || (metric.requiredModules ?? []).some(module => !policy.requiredModules.includes(module))
    || (metric.breakdowns?.length ? policy.dimensions.some(dimension => !metric.breakdowns!.some(item => item.id === dimension.id && item.shape !== "trend"))
      : policy.dimensions.length !== 1 || policy.dimensions[0].id !== "default")) unavailable();
  const expectedMeaning = checksum(meaning), execute = metric.query;
  const schema = registeredMetricInputSchema(policy);
  const point = z.strictObject({ label: z.enum(policy.dimensions.flatMap(item => item.labels) as [string, ...string[]]), value: z.number().int().nonnegative().safe() });
  const output = z.array(point).max(policy.maxCardinality);
  const identity = { version: 1, capability: metric.capability, lifecycle: "active" as const, classification: policy.classification };
  const declaration = declarative({ ...identity, kind: "metric", id: `${metric.id}.metric`, label: metric.name, schema: output, references: [policy.query.id] });
  declaration.metadata.details = { ...declaration.metadata.details, analyticsSource: policy };
  return [declaration, query({ ...identity, kind: "query", id: policy.query.id, label: `Read ${metric.name}`,
    input: schema, output, pagination: "none", maxCardinality: policy.maxCardinality, costClass: policy.costClass,
    async execute(ctx, request) {
      const session = await sourceSession(ctx, policy);
      if (checksum(metricMeaning(metric)) !== expectedMeaning || metric.query !== execute) unavailable();
      const since = request.period === "all" ? undefined : new Date(Date.now() - Number(request.period) * 86_400_000);
      const points = await execute(session, since, metric.breakdowns?.length ? request.dimension : undefined);
      const approved = policy.dimensions.find(item => item.id === request.dimension)!;
      if (points.length > policy.maxCardinality || new Set(points.map(item => item.label)).size !== points.length
        || points.some(item => !approved.labels.includes(item.label))) unavailable();
      return points;
    } })];
}
function reportMeaning(dataset: ReportDataset) {
  return { id: dataset.id, anyOf: dataset.anyOf, dateField: dataset.dateField ?? null, summary: dataset.summary ?? false,
    snapshot: dataset.snapshot ?? false, columns: dataset.columns.map(column => ({ id: column.key, type: column.values ? "enum" : column.type ?? "text",
      ...(column.currencyKey ? { currencyKey: column.currencyKey } : {}), ...(column.values ? { codes: column.values } : {}),
      ...(column.path ? { filterPath: column.path } : {}), searchable: column.searchable ?? false })) };
}
function reportScalar(column: RegisteredReportColumn) {
  const value = column.type === "date" ? z.iso.datetime() : column.type === "boolean" ? z.boolean()
    : column.type === "enum" ? z.enum(column.codes as [string, ...string[]])
      : column.type === "money" ? z.union([z.number().finite(), z.string().regex(/^-?[0-9]+\.[0-9]{2}$/)]) : z.string().max(10000);
  return column.nullable ? value.nullable() : value;
}
function wireValue(value: ReportValue | undefined, column: RegisteredReportColumn) {
  if (value instanceof Date) return value.toISOString();
  if (value === undefined) unavailable();
  return reportScalar(column).parse(value);
}
/** Original recordDataset page reader, never export=true or new SQL/data cache.
 * Amounts keep the original exact number/text representation and currency field;
 * aggregations and cross-currency arithmetic are deliberately absent. */
export function registeredReportContributions(owner: string, dataset: ReportDataset, input: RegisteredReportSource): Contribution[] {
  const policy = freezePolicy(registeredReportSourceSchema.parse(input)), native = reportMeaning(dataset);
  checkOwnership(owner, dataset.id, dataset.anyOf[0], policy);
  if (policy.providerId !== dataset.id || dataset.anyOf.length !== 1 || native.summary || policy.pageSize !== REPORT_PAGE_SIZE
    || policy.dateField !== native.dateField || new Set(policy.columns.map(column => column.id)).size !== policy.columns.length
    || checksum(policy.columns.map(({ nullable, classification: ignored, ...column }) => { void nullable; void ignored; return column; })) !== checksum(native.columns)
    || policy.columns.some(column => column.classification !== policy.classification || column.type === "enum" && !column.codes?.length
      || column.type === "money" && (!column.currencyKey || !policy.columns.some(other => other.id === column.currencyKey && other.type === "text" && !other.nullable)))) unavailable();
  const expectedMeaning = checksum(native), execute = dataset.read.bind(dataset), originalRead = dataset.read;
  const id = z.enum(policy.columns.map(column => column.id) as [string, ...string[]]);
  const filter = z.strictObject({ field: id, operator: z.enum(["contains", "equals", "gte", "lte"]), value: z.string().max(200) });
  const date = z.union([z.literal(""), z.iso.date()]);
  const schema = z.strictObject({ search: z.string().trim().max(200).default(""), from: date.default(""), to: date.default(""),
    filters: z.array(filter).max(12).default([]), columns: z.array(id).max(50).default([]), page: z.number().int().min(1).max(100000).default(1) })
    .refine(value => !value.from || !value.to || value.from <= value.to, "The end date must follow the start date.");
  const rowShape = Object.fromEntries(policy.columns.map(column => [column.id, reportScalar(column).optional()]));
  const output = z.strictObject({ rows: z.array(z.strictObject(rowShape)).max(100), total: z.number().int().nonnegative().safe(),
    columns: z.array(id).min(1).max(50), page: z.number().int().positive() });
  const identity = { version: 1, capability: dataset.anyOf[0], lifecycle: "active" as const, classification: policy.classification };
  const declaration = declarative({ ...identity, kind: "surface", id: `${dataset.id}.report`, label: dataset.name, schema: output, references: [policy.query.id] });
  declaration.metadata.details = { ...declaration.metadata.details, analyticsSource: policy };
  return [declaration, query({ ...identity, kind: "query", id: policy.query.id, label: `Read ${dataset.name}`,
    input: schema, output, pagination: "page", maxCardinality: 100, costClass: policy.costClass,
    async execute(ctx, request) {
      const session = await sourceSession(ctx, policy);
      if (checksum(reportMeaning(dataset)) !== expectedMeaning || dataset.read !== originalRead) unavailable();
      const owningInput = { ...request, dataset: dataset.id, period: "all" };
      reportWhere(dataset, owningInput);
      const columns = selectedReportColumns(dataset, owningInput).map(column => column.key);
      const loaded = await execute(session, owningInput, false);
      if (loaded.rows.length > 100 || !Number.isSafeInteger(loaded.total) || loaded.total < loaded.rows.length) unavailable();
      return { rows: loaded.rows.map(row => Object.fromEntries(columns.map(key => [key, wireValue(row[key], policy.columns.find(column => column.id === key)!)]))),
        total: loaded.total, columns, page: request.page };
    } })];
}
