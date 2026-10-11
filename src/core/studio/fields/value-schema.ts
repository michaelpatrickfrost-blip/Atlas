import { z } from "zod";
import { addressValueSchema, fieldKeySchema, type FieldValue } from "./value-contract";

const integer = z.number().int().min(-Number.MAX_SAFE_INTEGER).max(Number.MAX_SAFE_INTEGER);
const decimal = z.string().regex(/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/).max(40);
// PostgreSQL text cannot store NUL or an unpaired UTF-16 surrogate. The Unicode
// regexp treats a valid astral pair as its single code point, preserving emoji.
const validText = (value: string) => !/[\u0000\uD800-\uDFFF]/u.test(value);
const text = (max: number) => z.string().max(max).refine(validText, "Use valid Unicode text without null characters.");
const address = addressValueSchema.extend({ line2: text(200), region: text(100), postalCode: text(40) })
  .superRefine((value, context) => {
    for (const [key, entry] of Object.entries(value)) if (!validText(entry))
      context.addIssue({ code: "custom", path: [key], message: "Use valid Unicode text without null characters." });
  });
const url = z.url().max(2000).refine(value => {
  try { const parsed = new URL(value); return ["http:", "https:"].includes(parsed.protocol) && !parsed.username && !parsed.password && validText(value); }
  catch { return false; }
}, "Use a web address without credentials.");

/** Absolute transport bounds mirror existing scalar contracts. Actual field
 * precision, options, constraints, required-if, references and current/written
 * policy remain the owning writer's responsibility. No coercion or inferred defaults.
 */
export const fieldFormValueSchema: z.ZodType<FieldValue> = z.discriminatedUnion("type", [
  z.strictObject({ type: z.literal("string"), value: text(4000) }),
  z.strictObject({ type: z.literal("integer"), value: integer }),
  z.strictObject({ type: z.literal("decimal"), value: decimal }),
  z.strictObject({ type: z.literal("money"), value: z.strictObject({ amount: decimal, currency: z.string().regex(/^[A-Z]{3}$/) }) }),
  z.strictObject({ type: z.literal("boolean"), value: z.boolean() }),
  z.strictObject({ type: z.literal("date"), value: z.iso.date() }),
  z.strictObject({ type: z.literal("datetime"), value: z.iso.datetime().max(40) }),
  z.strictObject({ type: z.literal("duration"), value: integer.nonnegative() }),
  z.strictObject({ type: z.literal("email"), value: z.email().max(320) }),
  z.strictObject({ type: z.literal("url"), value: url }),
  z.strictObject({ type: z.literal("phone"), value: z.string().regex(/^\+[1-9]\d{6,14}$/) }),
  z.strictObject({ type: z.literal("enum"), value: fieldKeySchema }),
  z.strictObject({ type: z.literal("multi_enum"), value: z.array(fieldKeySchema).max(200)
    .refine(values => new Set(values).size === values.length, "Duplicate selected value.") }),
  z.strictObject({ type: z.literal("reference"), value: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/) }),
  z.strictObject({ type: z.literal("address"), value: address }),
]);
