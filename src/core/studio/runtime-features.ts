import { readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";

export const STUDIO_LITERAL_DEFAULT_FEATURE = "literalFieldDefaults.v1" as const;
export const STUDIO_PAGE_FEATURE = "structuredPages.v1" as const;
export const STUDIO_PROFILE_FEATURE = "recordProfiles.v1" as const;
export const STUDIO_RECORD_TYPE_FORM_FEATURE = "recordTypeForms.v1" as const;
export const STUDIO_TICKET_PANEL_FEATURE = "ticketRecordPanels.v1" as const;
export const STUDIO_SALES_PAGE_METRIC_FEATURE = "salesPageMetrics.v1" as const;
export const STUDIO_ANALYTICS_VIEW_FEATURE = "analyticsBusinessViews.v1" as const;
export const STUDIO_PAGE_EMBEDDED_VIEW_FEATURE = "pageEmbeddedAnalytics.v1" as const;
export const studioRuntimeFeatureSchema = z.enum([STUDIO_LITERAL_DEFAULT_FEATURE, STUDIO_PAGE_FEATURE, STUDIO_PROFILE_FEATURE, STUDIO_RECORD_TYPE_FORM_FEATURE, STUDIO_ANALYTICS_VIEW_FEATURE, STUDIO_TICKET_PANEL_FEATURE, STUDIO_SALES_PAGE_METRIC_FEATURE, STUDIO_PAGE_EMBEDDED_VIEW_FEATURE]);
export type StudioRuntimeFeature = z.infer<typeof studioRuntimeFeatureSchema>;
export const studioRuntimeFeatureEvidenceSchema = z.strictObject({ schemaVersion: z.literal(1),
  releaseRevision: z.string().regex(/^[a-f0-9]{40}$/), rollbackRevision: z.string().regex(/^[a-f0-9]{40}$/),
  features: z.array(studioRuntimeFeatureSchema).max(20).refine(values => new Set(values).size === values.length, "Duplicate runtime feature.") });
export type StudioRuntimeFeatureEvidence = z.infer<typeof studioRuntimeFeatureEvidenceSchema>;
export const STUDIO_RUNTIME_FEATURE_FILE = ".studio-runtime-features.json";

/** Server-only immutable release evidence. Missing evidence closes authoring;
 * runtime readers remain able to read compatible metadata after rollback. The
 * optional root/revision arguments are for trusted release/checker callers only.
 * There is no client or environment boolean that enables a feature. */
export function readStudioRuntimeFeatureEvidence(root = process.cwd(), revision = process.env.ATLAS_RELEASE_REVISION): StudioRuntimeFeatureEvidence | null {
  let raw: string;
  try { raw = readFileSync(join(root, STUDIO_RUNTIME_FEATURE_FILE), "utf8"); }
  catch (error) { if (error instanceof Error && "code" in error && error.code === "ENOENT") return null; throw error; }
  const evidence = studioRuntimeFeatureEvidenceSchema.parse(JSON.parse(raw));
  if (evidence.releaseRevision !== revision || readFileSync(join(root, ".atlas-ready"), "utf8").trim() !== evidence.releaseRevision)
    throw new Error("STUDIO_RUNTIME_FEATURE_INVALID: release evidence does not match the sealed runtime.");
  return evidence;
}
export function isStudioRuntimeFeatureEnabled(feature: StudioRuntimeFeature): boolean {
  return readStudioRuntimeFeatureEvidence()?.features.includes(studioRuntimeFeatureSchema.parse(feature)) ?? false;
}
export function assertStudioRuntimeFeatureEnabled(feature: StudioRuntimeFeature): void {
  if (!isStudioRuntimeFeatureEnabled(feature)) throw new Error("STUDIO_RUNTIME_FEATURE_UNAVAILABLE: this configuration requires an accepted compatible current and rollback runtime.");
}

/** Identify metadata requiring new readers without changing the original JSON
 * or historical checksums. A caller still parses/inspects the complete payload. */
export function studioRuntimeFeaturesForPayload(kind: string, payload: unknown): StudioRuntimeFeature[] {
  if (kind === "view") return [STUDIO_ANALYTICS_VIEW_FEATURE];
  if (kind === "page") return [STUDIO_PAGE_FEATURE];
  if (kind === "entityProfile" || kind === "recordType") return [STUDIO_PROFILE_FEATURE];
  if (kind !== "customField" || payload === null || typeof payload !== "object") return [];
  const field = "field" in payload ? payload.field : undefined;
  return field !== null && typeof field === "object" && Object.hasOwn(field, "defaultValue") ? [STUDIO_LITERAL_DEFAULT_FEATURE] : [];
}

const pageSourceEvidenceSchema = z.object({ kind: z.literal("page"), schemaVersion: z.literal(1),
  approvals: z.object({ sourcePage: z.object({ id: z.string().regex(/^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)+$/),
    version: z.number().int().positive(), schemaHash: z.string().regex(/^[a-f0-9]{64}$/), contractHash: z.string().regex(/^[a-f0-9]{64}$/),
    ownerModuleId: z.string().regex(/^[a-z][a-z0-9_]*$/), kind: z.literal("surface") }) }) });
/** Source-family feature evidence comes ONLY from the actual sealed/compiled
 * plan. Page payload alone cannot distinguish retained owner @1 and @2. */
export function studioRuntimeFeaturesForCompiledDefinition(kind: string, payload: unknown, compiledPlan: unknown): StudioRuntimeFeature[] {
  const features = studioRuntimeFeaturesForPayload(kind, payload);
  if (kind !== "page") return features;
  const source = pageSourceEvidenceSchema.parse(compiledPlan).approvals.sourcePage;
  if (source.id === "tickets.ticket.page" && (source.version === 2 || source.version === 3)) {
    if (source.ownerModuleId !== "tickets") throw new Error("STUDIO_RUNTIME_FEATURE_INVALID: Ticket Page owner evidence is invalid.");
    features.push(STUDIO_TICKET_PANEL_FEATURE);
  }
  if (source.id === "sales.order.page" && (source.version === 2 || source.version === 3)) {
    if (source.ownerModuleId !== "sales") throw new Error("STUDIO_RUNTIME_FEATURE_INVALID: Sales Page owner evidence is invalid.");
    features.push(STUDIO_SALES_PAGE_METRIC_FEATURE);
  }
  if ((source.id === "tickets.ticket.page" || source.id === "sales.order.page") && source.version === 3)
    features.push(STUDIO_PAGE_EMBEDDED_VIEW_FEATURE);
  return features;
}
