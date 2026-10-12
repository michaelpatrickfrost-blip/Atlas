import { z } from "zod";
import { assertCapability } from "@/core/permissions/check";
import { getAnalyticsMetrics } from "@/core/analytics/catalogue";
import type { AnalyticsMetric, AnalyticsResult } from "@/core/analytics/types";
import { fieldRuntimeAuthorityInTransaction, type FieldRuntimeAuthority } from "@/core/studio/fields/runtime-authority";
import { createViewDraftInTransaction, readViewDraftInTransaction, saveViewDraftInTransaction, reviewViewDraftInTransaction,
  publishViewDraftInTransaction, restoreViewVersionInTransaction } from "@/core/studio/authoring/views";
import { readPublishedViewInTransaction, readPublishedViewMetadataInTransaction, readSealedViewInTransaction } from "@/core/studio/views/runtime";
import { registeredMetricSourceSchema } from "@/core/studio/registry/analytics-source-contracts";
import { businessViewCreateSchema, businessViewSaveSchema, businessViewReviewSchema, businessViewPublishSchema, businessViewRestoreSchema, businessViewCountData,
  type BusinessViewContent, type BusinessViewDraft, type PublishedBusinessView } from "./business-view-contract";

const owner = "analytics.dashboard.view", sources = ["sales.orders", "sales.quotes", "products.catalogue"] as const;
const periodSchema = z.enum(["30", "90", "365", "all"]);
const pointsSchema = z.array(z.strictObject({ label: z.string().min(1).max(200), value: z.number().int().nonnegative().safe() })).max(50);
function envelope(authority: FieldRuntimeAuthority, content: BusinessViewContent) {
  const metadata = authority.registry.describe(owner, 1);
  return { schemaVersion: 1 as const, sourceView: { id: metadata.id, version: metadata.version, schemaHash: metadata.schemaHash, contractHash: metadata.contractHash }, content };
}
async function current(authority: FieldRuntimeAuthority) {
  const fresh = await fieldRuntimeAuthorityInTransaction(authority.session, authority.transaction);
  assertCapability(fresh.session, "analytics.dashboard.read");
  const metadata = fresh.registry.describe(owner, 1);
  await fresh.registry.resolve(fresh.session, metadata);
  return fresh;
}
function nativeResult(metric: AnalyticsMetric, input: unknown): AnalyticsResult {
  const { query, goalQuery, capability, ...display } = metric;
  void query; void goalQuery; void capability;
  return { ...display, shape: "breakdown", unit: "count", ...businessViewCountData(input) };
}
async function catalogue(authority: FieldRuntimeAuthority) {
  return (await getAnalyticsMetrics(authority.session, authority.transaction)).filter(metric => sources.some(id => id === metric.id));
}
export async function createBusinessViewDraftInTransaction(authority: FieldRuntimeAuthority, input: unknown) {
  authority = await current(authority); const content = businessViewCreateSchema.parse(input);
  return createViewDraftInTransaction(authority, { name: content.name, payload: envelope(authority, content) });
}
export async function readBusinessViewDraftInTransaction(authority: FieldRuntimeAuthority, input: unknown): Promise<BusinessViewDraft> {
  authority = await current(authority); const draft = await readViewDraftInTransaction(authority, input);
  if (draft.payload.sourceView.id !== owner) throw new Error("This business dashboard is unavailable.");
  const content = businessViewCreateSchema.parse(draft.payload.content);
  return { definitionId: draft.definitionId, name: content.name, updatedAt: draft.updatedAt, revision: draft.revision, definitionRevision: draft.definitionRevision,
    activeVersionId: draft.activeVersionId, content, warnings: draft.warnings, versions: draft.versions };
}
export async function saveBusinessViewDraftInTransaction(authority: FieldRuntimeAuthority, input: unknown) {
  authority = await current(authority); const { definitionId, revision, ...raw } = businessViewSaveSchema.parse(input);
  const content = businessViewCreateSchema.parse(raw);
  return saveViewDraftInTransaction(authority, { definitionId, revision, name: content.name, payload: envelope(authority, content) });
}
export async function reviewBusinessViewDraftInTransaction(authority: FieldRuntimeAuthority, input: unknown) {
  authority = await current(authority);
  const value = businessViewReviewSchema.parse(input);
  await readBusinessViewDraftInTransaction(authority, value.definitionId);
  const reviewed = await reviewViewDraftInTransaction(authority, value);
  return { content: businessViewCreateSchema.parse(reviewed.payload.content), checksum: reviewed.checksum, warnings: reviewed.warnings };
}
export async function publishBusinessViewDraftInTransaction(authority: FieldRuntimeAuthority, input: unknown) {
  authority = await current(authority);
  const value = businessViewPublishSchema.parse(input);
  await readBusinessViewDraftInTransaction(authority, value.definitionId);
  return publishViewDraftInTransaction(authority, value);
}
export async function restoreBusinessViewVersionInTransaction(authority: FieldRuntimeAuthority, input: unknown) {
  authority = await current(authority);
  const value = businessViewRestoreSchema.parse(input);
  await readBusinessViewDraftInTransaction(authority, value.definitionId);
  return restoreViewVersionInTransaction(authority, value);
}
/** Only currently permitted native metadata and the three explicit registered
 * source adapters. Unavailable unused sources are omitted before names/results;
 * no record datasets, native-query fallback, Goals or arbitrary provider IDs. */
export async function loadBusinessViewMetricsInTransaction(authority: FieldRuntimeAuthority, input: unknown): Promise<AnalyticsResult[]> {
  authority = await current(authority); const period = periodSchema.parse(input), available = await catalogue(authority);
  if (!available.length) return [];
  const content = businessViewCreateSchema.parse({ name: "Measure library", period,
    widgets: available.map(metric => ({ id: metric.id, metricId: metric.id, visual: "bar", wide: false })) });
  const payload = envelope(authority, content);
  const compiled = await authority.registry.authoriseViewReadInTransaction({ session: authority.session, transaction: authority.transaction }, payload.sourceView, payload.content);
  const results: AnalyticsResult[] = [];
  for (const request of compiled.requests) {
    const metric = available.find(value => value.id === request.widgetId)!;
    results.push(nativeResult(metric, await authority.registry.invoke(authority.session, request.query, request.input)));
  }
  return results;
}
export async function loadBusinessViewSliceInTransaction(authority: FieldRuntimeAuthority, input: unknown) {
  authority = await current(authority);
  const value = z.strictObject({ metricId: z.enum(sources), period: periodSchema, breakdown: z.string().trim().min(1).max(40) }).parse(input);
  const content = businessViewCreateSchema.parse({ name: "Measure preview", period: value.period,
    widgets: [{ id: "preview", metricId: value.metricId, breakdown: value.breakdown, visual: "bar", wide: false }] });
  const payload = envelope(authority, content);
  const compiled = await authority.registry.authoriseViewReadInTransaction({ session: authority.session, transaction: authority.transaction }, payload.sourceView, payload.content);
  const request = compiled.requests[0];
  return { points: pointsSchema.parse(await authority.registry.invoke(authority.session, request.query, request.input)), shape: "breakdown" as const };
}
export async function readPublishedAnalyticsViewInTransaction(authority: FieldRuntimeAuthority, input: unknown): Promise<PublishedBusinessView> {
  authority = await current(authority);
  const read = await readPublishedViewInTransaction(authority, input, owner);
  const displayed = await displayResults(authority, read.payload.content, read.dataByWidget);
  return { definitionId: read.definitionId, name: displayed.content.name, definitionRevision: read.definitionRevision, view: read.view, ...displayed };
}
async function displayResults(authority: FieldRuntimeAuthority, rawContent: unknown, data: Record<string, unknown>) {
  const content = businessViewCreateSchema.parse(rawContent), available = await catalogue(authority), dataByWidget: Record<string, AnalyticsResult> = {};
  for (const widget of content.widgets) {
    const metric = available.find(value => value.id === widget.metricId);
    if (!metric) throw new Error("FORBIDDEN: a published measure is no longer available.");
    const policy = registeredMetricSourceSchema.parse(authority.registry.describe(`${metric.id}.metric`, 1).details.analyticsSource);
    const dimension = policy.dimensions.find(value => value.id === (widget.breakdown || policy.dimensions[0].id))!;
    const result = nativeResult(metric, data[widget.id]);
    if (result.points.some(point => !dimension.labels.includes(point.label))) throw new Error("DEPENDENCY_BROKEN: a registered measure changed.");
    dataByWidget[widget.id] = result;
  }
  return { content, dataByWidget };
}

/** Bounded current customer discovery; no results or Studio authoring grants.
 * Actual active metadata selects the registered owner, then the shared sealed
 * read preflight runs before exposing each friendly name. Denied independent
 * source views are omitted; corrupt/unsupported metadata remains a hard error. */
export async function listPublishedBusinessViewsInTransaction(authority: FieldRuntimeAuthority) {
  authority = await current(authority);
  const candidates = await authority.transaction.studioDefinition.findMany({ where: { organisationId: authority.session.organisationId,
    kind: "view", retiredAt: null, activeVersionId: { not: null }, activeVersion: { payload: { path: ["sourceView", "id"], equals: owner } } },
    select: { id: true }, orderBy: { id: "asc" }, take: 101 });
  if (candidates.length > 100) throw new Error("This business dashboard catalogue exceeds its supported bound.");
  const result: Array<{ definitionId: string; name: string; definitionRevision: number; view: PublishedBusinessView["view"] }> = [];
  for (const candidate of candidates) {
    try {
      const read = await readPublishedViewMetadataInTransaction(authority, { definitionId: candidate.id }, owner);
      const content = businessViewCreateSchema.parse(read.payload.content);
      result.push({ definitionId: read.definitionId, name: content.name, definitionRevision: read.definitionRevision, view: read.view });
    } catch (error) {
      if (!(error instanceof Error) || !error.message.startsWith("FORBIDDEN:")) throw error;
    }
  }
  return result;
}

/** Module-owned native display adapter for an exact sealed embedded view. The
 * Core reader remains registered-owner neutral and never imports Analytics. */
export async function readSealedAnalyticsViewInTransaction(authority: FieldRuntimeAuthority, pin: unknown): Promise<Pick<PublishedBusinessView, "content" | "dataByWidget">> {
  authority = await current(authority);
  const read = await readSealedViewInTransaction(authority, pin, owner);
  return displayResults(authority, read.payload.content, read.dataByWidget);
}
