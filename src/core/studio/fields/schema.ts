import { z } from "zod";
import { referenceSchema } from "../compiler/kernel";

export const fieldKeySchema = z.string().regex(/^[a-z][a-z0-9_]{0,39}$/);
const capability = z.string().regex(/^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)+$/);
const integer = z.number().int().min(-Number.MAX_SAFE_INTEGER).max(Number.MAX_SAFE_INTEGER);
const decimal = z.string().regex(/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/).max(40);
const options = z.array(z.strictObject({ id: fieldKeySchema, label: z.string().min(1).max(100), retired: z.boolean().default(false) })).min(1).max(200)
  .refine(values => new Set(values.map(v => v.id)).size === values.length, "Duplicate enum value ID.");
const valueSet = { valueSetVersion: z.number().int().positive(), options };
const numeric = { min: integer.optional(), max: integer.optional() };
const decimalOptions = { precision: z.number().int().min(1).max(28).default(28), scale: z.number().int().min(0).max(10).default(10), min: decimal.optional(), max: decimal.optional() };

/** Deliberately linear regex grammar: one approved class and one bounded repeat. */
export function safeFieldPattern(source: string): RegExp {
  const match = /^\^\[(A-Z|a-z|0-9|A-Za-z|A-Za-z0-9|A-Za-z0-9 _-)\](?:\{(\d{1,4}),(\d{1,4})\})?\$$/.exec(source);
  if (!match || (match[2] && (Number(match[2]) > Number(match[3]) || Number(match[3]) > 4000))) throw new Error("Use an approved character pattern with a bounded length.");
  return new RegExp(source);
}
const pattern = z.string().max(80).refine(value => { try { safeFieldPattern(value); return true; } catch { return false; } }, "Use an approved character pattern with a bounded length.");

export const fieldStorageSchema = z.discriminatedUnion("type", [
  z.strictObject({ type: z.literal("string"), minLength: z.number().int().min(0).max(4000).default(0), maxLength: z.number().int().min(1).max(4000).default(200), multiline: z.boolean().default(false), pattern: pattern.optional() }),
  z.strictObject({ type: z.literal("integer"), ...numeric }),
  z.strictObject({ type: z.literal("decimal"), ...decimalOptions }),
  z.strictObject({ type: z.literal("money"), ...decimalOptions, currencies: z.array(z.string().regex(/^[A-Z]{3}$/)).min(1).max(30).refine(v => new Set(v).size === v.length, "Duplicate currency.") }),
  z.strictObject({ type: z.literal("boolean") }),
  z.strictObject({ type: z.literal("date") }),
  z.strictObject({ type: z.literal("datetime"), timezone: z.literal("UTC") }),
  z.strictObject({ type: z.literal("duration"), unit: z.literal("seconds"), min: integer.nonnegative().optional(), max: integer.nonnegative().optional() }),
  z.strictObject({ type: z.literal("email") }),
  z.strictObject({ type: z.literal("url"), protocols: z.array(z.enum(["https", "http"])).min(1).max(2).default(["https"]) }),
  z.strictObject({ type: z.literal("phone"), format: z.literal("E164") }),
  z.strictObject({ type: z.literal("enum"), ...valueSet }),
  z.strictObject({ type: z.literal("multi_enum"), ...valueSet, maxSelections: z.number().int().min(1).max(200).default(30) }),
  z.strictObject({ type: z.literal("reference"), entity: referenceSchema }),
  z.strictObject({ type: z.literal("address"), countries: z.array(z.string().regex(/^[A-Z]{2}$/)).min(1).max(250).refine(v => new Set(v).size === v.length, "Duplicate country.") }),
]).superRefine((value, ctx) => {
  if (value.type === "string" && value.minLength > value.maxLength) ctx.addIssue({ code: "custom", message: "Minimum length exceeds maximum length." });
  if ((value.type === "integer" || value.type === "duration") && value.min !== undefined && value.max !== undefined && value.min > value.max) ctx.addIssue({ code: "custom", message: "Minimum exceeds maximum." });
  if ((value.type === "decimal" || value.type === "money") && value.scale > value.precision) ctx.addIssue({ code: "custom", message: "Scale exceeds precision." });
});

export const customFieldSchema = z.strictObject({
  key: fieldKeySchema, label: z.string().min(1).max(100), help: z.string().max(500).default(""),
  classification: z.enum(["public_internal", "confidential", "restricted"]),
  required: z.boolean().default(false), indexed: z.boolean().default(false), unique: z.boolean().default(false),
  readCapability: capability.optional(), writeCapability: capability.optional(), storage: fieldStorageSchema,
}).superRefine((value, ctx) => {
  if (value.classification === "restricted" && !value.readCapability) ctx.addIssue({ code: "custom", message: "Restricted fields require an additional read capability." });
  if ((value.indexed || value.unique) && ["multi_enum", "address"].includes(value.storage.type)) ctx.addIssue({ code: "custom", message: "This structured type does not support scalar indexing or uniqueness." });
});

export const customFieldPayloadSchema = z.strictObject({ schemaVersion: z.literal(1), entity: referenceSchema, field: customFieldSchema });
export type CustomField = z.infer<typeof customFieldSchema>;
export type FieldStorage = z.infer<typeof fieldStorageSchema>;
export type CustomFieldPayload = z.infer<typeof customFieldPayloadSchema>;

export const addressValueSchema = z.strictObject({
  line1: z.string().min(1).max(200), line2: z.string().max(200).default(""), city: z.string().min(1).max(100),
  region: z.string().max(100).default(""), postalCode: z.string().max(40).default(""), country: z.string().regex(/^[A-Z]{2}$/),
});
export type FieldValue =
  | { type: "string" | "email" | "url" | "phone" | "date" | "datetime" | "enum" | "reference"; value: string }
  | { type: "integer" | "duration"; value: number }
  | { type: "decimal"; value: string }
  | { type: "money"; value: { amount: string; currency: string } }
  | { type: "boolean"; value: boolean }
  | { type: "multi_enum"; value: string[] }
  | { type: "address"; value: z.infer<typeof addressValueSchema> };
