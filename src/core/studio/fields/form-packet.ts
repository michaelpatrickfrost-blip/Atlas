import { z } from "zod";
import { addressValueSchema, fieldKeySchema, type FieldValue } from "./schema";

/** Transport version only; it neither changes sealed field schema1/2 nor
 * approves a field, record, operation, value or permission. No runtime caller.
 */
export const FIELD_FORM_PACKET_MAX_BYTES = 256 * 1024;
const revision = z.number().int().nonnegative().max(2147483646);
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
 * policy remain the owning writer's responsibility. No coercion or defaults.
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
const entrySchema = z.strictObject({ operationId: z.uuid(), definitionId: z.uuid(), definitionRevision: revision,
  versionId: z.uuid(), generationId: z.uuid(), slotRevision: revision.nullable(), valueRevision: revision.positive().nullable(),
  value: fieldFormValueSchema.nullable() });

/** Shape validation for typed state only. At an untrusted ingress use the raw
 * JSON helper below for the pre-parse byte limit and server-owned field limit.
 * Omission of an entry is distinct from its explicit null, never a rule waiver.
 */
export const fieldFormPacketSchema = z.strictObject({ schemaVersion: z.literal(1), operationId: z.uuid(),
  manifestChecksum: z.string().regex(/^[a-f0-9]{64}$/), extensionRevision: revision.nullable(), fields: z.array(entrySchema).max(100) })
  .superRefine((packet, context) => {
    const definitions = new Set<string>(), operations = new Set([packet.operationId.toLowerCase()]);
    for (const [index, field] of packet.fields.entries()) {
      const definition = field.definitionId.toLowerCase(), operation = field.operationId.toLowerCase();
      if (definitions.has(definition)) context.addIssue({ code: "custom", path: ["fields", index, "definitionId"], message: "Duplicate field definition." });
      if (operations.has(operation)) context.addIssue({ code: "custom", path: ["fields", index, "operationId"], message: "Field operation IDs must be unique and distinct from the form operation." });
      definitions.add(definition); operations.add(operation);
    }
  });
export type FieldFormPacket = z.infer<typeof fieldFormPacketSchema>;

/** Raw FormData JSON only. Enforce 256 KiB UTF-8 BEFORE JSON parsing; whitespace
 * counts too. ownerMaxFields comes from the genuine server-resolved owner policy,
 * never the packet. This parser is not authority, discovery or a mutation API.
 */
export function parseFieldFormPacketJson(input: unknown, ownerMaxFields: number): FieldFormPacket {
  const maximum = z.number().int().min(1).max(100).parse(ownerMaxFields), source = z.string().parse(input);
  if (source.length > FIELD_FORM_PACKET_MAX_BYTES || new TextEncoder().encode(source).byteLength > FIELD_FORM_PACKET_MAX_BYTES)
    throw new Error("FIELD_FORM_PACKET_INVALID: the form packet exceeds 256 KiB.");
  let value: unknown;
  try { value = JSON.parse(source); }
  catch { throw new Error("FIELD_FORM_PACKET_INVALID: malformed form packet JSON."); }
  const packet = fieldFormPacketSchema.parse(value);
  if (packet.fields.length > maximum) throw new Error("FIELD_FORM_PACKET_INVALID: the form packet exceeds the owning entity's field limit.");
  return packet;
}
