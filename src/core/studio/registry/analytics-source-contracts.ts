import { z } from "zod";

const logicalId = z.string().regex(/^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)+$/);
const memberId = z.string().regex(/^[a-zA-Z][a-zA-Z0-9_]*$/);
const reference = z.strictObject({ id: logicalId, version: z.number().int().positive() });
const classification = z.enum(["public_internal", "confidential", "restricted"]);
const modules = z.array(z.string().regex(/^[a-z][a-z0-9_]*$/)).min(1).max(8);
const capabilities = z.array(logicalId).min(1).max(8);
const policyCommon = { schemaVersion: z.literal(1), providerId: logicalId, query: reference,
  classification, requiredCapabilities: capabilities, requiredModules: modules,
  costClass: z.literal("high"), complete: z.literal(true) };
/** Explicit metadata only; ordinary provider catalogues do not opt in implicitly. */
export const registeredMetricSourceSchema = z.strictObject({ ...policyCommon, kind: z.literal("metric"),
  unit: z.literal("count"), snapshot: z.boolean(), maxCardinality: z.number().int().min(1).max(50),
  dimensions: z.array(z.strictObject({ id: memberId, labels: z.array(z.string().min(1).max(200)).min(1).max(50) })).min(1).max(8) });
export const registeredReportColumnSchema = z.strictObject({ id: memberId, type: z.enum(["text", "enum", "date", "boolean", "money"]),
  nullable: z.boolean(), classification, currencyKey: memberId.optional(), codes: z.array(z.string().min(1).max(100)).max(50).optional(),
  filterPath: z.string().regex(/^[a-zA-Z][a-zA-Z0-9_]*(?:\.[a-zA-Z][a-zA-Z0-9_]*)*$/).optional(), searchable: z.boolean() });
export const registeredReportSourceSchema = z.strictObject({ ...policyCommon, kind: z.literal("report"),
  pagination: z.literal("page"), pageSize: z.literal(100), maxCardinality: z.literal(100),
  dateField: memberId.nullable(), moneyRepresentation: z.literal("major_decimal_number_or_exact_text"),
  columns: z.array(registeredReportColumnSchema).min(1).max(50) });
export type RegisteredMetricSource = z.infer<typeof registeredMetricSourceSchema>;
export type RegisteredReportSource = z.infer<typeof registeredReportSourceSchema>;
export type RegisteredReportColumn = z.infer<typeof registeredReportColumnSchema>;

/** Shared exact metadata input contract; no query or permission is executed. */
export function registeredMetricInputSchema(policy: RegisteredMetricSource) {
  return z.strictObject({ period: policy.snapshot ? z.literal("all") : z.enum(["all", "30", "90", "365"]),
    dimension: z.enum(policy.dimensions.map(item => item.id) as [string, ...string[]]).default(policy.dimensions[0].id) });
}
