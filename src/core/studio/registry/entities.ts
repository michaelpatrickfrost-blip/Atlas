import { z } from "zod";

const logicalId = z.string().regex(/^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)+$/);
const fieldId = z.string().regex(/^[a-z][a-z0-9_]*$/).max(100);
const classification = z.enum(["public_internal", "confidential", "restricted"]);
const queryReference = z.strictObject({ id: logicalId, version: z.number().int().positive() });

/** Only native read projections are exposed; extension storage is owned by Studio. */
export const entityDetailsSchema = z.strictObject({
  key: z.enum(["uuid", "string"]),
  fields: z.array(z.strictObject({
    id: fieldId, label: z.string().min(1).max(200).optional(),
    type: z.enum(["string", "integer", "decimal", "money", "boolean", "date", "datetime", "enum", "reference"]),
    nullable: z.boolean(), classification, capability: logicalId.optional(),
    filterable: z.boolean(), sortable: z.boolean(), decision: z.boolean(), template: z.boolean(),
  })).max(200),
  extensionPolicy: z.strictObject({ customFields: z.boolean(), recordTypes: z.boolean(), pageVariants: z.boolean() }),
  record: z.strictObject({
    writeCapability: logicalId,
    detailRoute: z.string().regex(/^\/[a-z0-9/_-]+\/\{recordId\}$/),
    labelField: fieldId, listQuery: queryReference, getQuery: queryReference,
    nativeFields: z.literal("read_only"), revision: z.literal("owner_positive_integer"),
  }).optional(),
}).superRefine((value, ctx) => {
  if (new Set(value.fields.map(f => f.id)).size !== value.fields.length) ctx.addIssue({ code: "custom", message: "Duplicate native field ID." });
  if (Object.values(value.extensionPolicy).some(Boolean) && !value.record) ctx.addIssue({ code: "custom", message: "Extensible entities need an owner record policy." });
  if (value.record && !value.fields.some(f => f.id === value.record!.labelField)) ctx.addIssue({ code: "custom", message: "Record label must reference an approved native field." });
});

export const recordRequestSchema = z.strictObject({
  recordId: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/),
  intent: z.enum(["read", "extend"]), expectedRevision: z.number().int().positive().max(Number.MAX_SAFE_INTEGER).optional(),
}).superRefine((value, ctx) => {
  if (value.intent === "extend" && value.expectedRevision === undefined) ctx.addIssue({ code: "custom", message: "Extension writes require an expected owner revision." });
});
export const recordAnchorSchema = z.strictObject({
  recordId: z.string().min(1).max(100), organisationId: z.string().min(1),
  revision: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
});
