import { z } from "zod";
import type { RecordContext } from "../registry/types";
import { formFactorSchema, pageNodeIdSchema, surfaceFamilySchema } from "./schema";

const logicalId = z.string().regex(/^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)+$/);
const reference = z.strictObject({ id: logicalId, version: z.number().int().positive() });
const classification = z.enum(["public_internal", "confidential", "restricted"]);
const scalarType = z.enum(["string", "number", "boolean"]);
const forms = z.array(formFactorSchema).min(1).max(3).refine(values => new Set(values).size === values.length, "Duplicate form factor.");
export const pageReadRequestSchema = z.discriminatedUnion("kind", [
  z.strictObject({ kind: z.literal("list") }),
  z.strictObject({ kind: z.literal("record"), recordId: z.string().min(1).max(200) }),
]);
export const pageReadAnchorSchema = z.discriminatedUnion("kind", [
  z.strictObject({ kind: z.literal("list"), organisationId: z.string().min(1).max(200) }),
  z.strictObject({ kind: z.literal("record"), organisationId: z.string().min(1).max(200), recordId: z.string().min(1).max(200),
    /** Owner revision may include native timestamp and domain revision. */
    revision: z.string().min(1).max(300), nativeRevision: z.number().int().positive().optional() }),
]);
export const pageMoneyFormatSchema = z.strictObject({ kind: z.literal("money_minor"), currencyColumnId: pageNodeIdSchema });
const column = z.strictObject({ id: pageNodeIdSchema, label: z.string().trim().min(1).max(200).optional(), valueType: scalarType,
  nullable: z.boolean(), classification, capability: logicalId.optional(), format: pageMoneyFormatSchema.optional() });
export const pageSourcePolicySchema = z.strictObject({
  schemaVersion: z.literal(1), entity: reference, accessMode: z.literal("ordinary_read"), variants: z.boolean(),
  /** Exact existing owner versions, not a numeric range or permission grant. */
  fieldSourceVersions: z.array(z.number().int().positive()).max(100).default([])
    .refine(values => new Set(values).size === values.length, "Duplicate field source version."),
  nativeFields: z.array(z.strictObject({ id: pageNodeIdSchema, query: reference, columnId: pageNodeIdSchema })).max(100),
  queries: z.array(z.strictObject({ query: reference, scope: z.enum(["list", "record"]),
    purpose: z.enum(["list", "fact", "metric", "surface", "preview"]), columns: z.array(column).max(50) })).max(100),
  facts: z.array(z.strictObject({ id: pageNodeIdSchema, contract: reference, query: reference, columnId: pageNodeIdSchema,
    valueType: scalarType, nullable: z.boolean(), classification, capability: logicalId.optional(),
    provenance: z.enum(["owner_native", "owner_projection"]) })).max(50),
  commands: z.array(z.strictObject({ command: reference, confirmation: z.enum(["required", "optional"]),
    previewQuery: reference.nullable(), formFactors: forms })).max(50),
  metrics: z.array(z.strictObject({ metric: reference, query: reference, formFactors: forms })).max(50),
  surfaces: z.array(z.strictObject({ surface: reference, family: surfaceFamilySchema,
    queries: z.array(reference).max(4), formFactors: forms })).max(50),
  maxQueryCost: z.number().int().min(1).max(64).default(24),
}).superRefine((policy, context) => {
  for (const [name, keys] of [
    ["native field", policy.nativeFields.map(value => value.id)], ["fact", policy.facts.map(value => value.id)],
    ["query", policy.queries.map(value => `${value.query.id}@${value.query.version}`)],
    ["command", policy.commands.map(value => `${value.command.id}@${value.command.version}`)],
    ["metric", policy.metrics.map(value => `${value.metric.id}@${value.metric.version}`)],
    ["surface", policy.surfaces.map(value => `${value.surface.id}@${value.surface.version}`)],
  ] as const) if (new Set(keys).size !== keys.length) context.addIssue({ code: "custom", message: `Duplicate page source ${name}.` });
  for (const query of policy.queries)
    if (new Set(query.columns.map(value => value.id)).size !== query.columns.length) context.addIssue({ code: "custom", message: "Duplicate page query column." });
});
// Only opaque bounded JSON cursors reach an owning input binder. No caller query
// parameters, record/tenant overrides or arbitrary projection paths are accepted.
const cursorScalar = z.union([z.string().max(500), z.number().finite(), z.boolean(), z.null()]);
const cursor = z.record(z.string().regex(/^[a-zA-Z][a-zA-Z0-9_]{0,39}$/), cursorScalar)
  .refine(value => Object.keys(value).length <= 8, "Cursor exceeds its bound.");
export const pageQueryRequestSchema = z.strictObject({ query: reference, pageSize: z.number().int().min(1).max(50).default(50), cursor: cursor.nullable().default(null) });
export const pageQueryOutputSchema = z.strictObject({ rows: z.array(z.strictObject({ id: z.string().min(1).max(200),
  values: z.record(pageNodeIdSchema, z.union([z.string().max(10000), z.number().finite(), z.boolean(), z.null()])) })).max(200), nextCursor: cursor.nullable() });
/** Opted-in owning queries use a complete closed output projection. Registration
 * checks this exact schema, so an adapter cannot hide undeclared raw columns by
 * trimming them after protected data has already been queried. */
export function pageProjectionSchema(columns: readonly z.infer<typeof column>[], maxCardinality: number) {
  const bound = z.number().int().min(1).max(200).parse(maxCardinality);
  const parsed = z.array(column).max(50).parse(columns);
  if (new Set(parsed.map(value => value.id)).size !== parsed.length) throw new Error("Duplicate page query column.");
  const shape: Record<string, z.ZodType<string | number | boolean | null>> = {};
  for (const value of parsed) {
    const scalar = value.valueType === "string" ? z.string().max(10000) : value.valueType === "number"
      ? value.format ? z.number().int().safe() : z.number().finite() : z.boolean();
    shape[value.id] = value.nullable ? scalar.nullable() : scalar;
  }
  return z.strictObject({ rows: z.array(z.strictObject({ id: z.string().min(1).max(200), values: z.strictObject(shape) })).max(bound), nextCursor: cursor.nullable() });
}
export type PageSourcePolicy = z.infer<typeof pageSourcePolicySchema>;
export type PageReadRequest = z.infer<typeof pageReadRequestSchema>;
export type PageReadAnchor = z.infer<typeof pageReadAnchorSchema>;
export type PageQueryRequest = z.infer<typeof pageQueryRequestSchema>;
export type PageQueryOutput = z.infer<typeof pageQueryOutputSchema>;
/** Owning server callbacks are never stored in metadata or supplied by clients. */
export type PageSourceCallbacks = {
  authoriseRead(context: RecordContext, request: PageReadRequest): Promise<PageReadAnchor>;
  bindQueryInput(context: RecordContext, anchor: PageReadAnchor, request: PageQueryRequest): Promise<unknown>;
  projectQueryOutput(context: RecordContext, anchor: PageReadAnchor, request: PageQueryRequest, output: unknown): Promise<PageQueryOutput>;
};
