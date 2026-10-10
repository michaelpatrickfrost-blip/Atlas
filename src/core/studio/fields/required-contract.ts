import { z } from "zod";
import { fieldKeySchema, customFieldSchema } from "./schema";
import { referenceSchema } from "../compiler/kernel";

const digest = z.string().regex(/^[a-f0-9]{64}$/);
/** Identifiers only. A compiler must resolve these through current tenant-owned
 * metadata/owner declarations; this shape grants neither facts nor field access. */
export const requiredFactSourceSchema = z.discriminatedUnion("kind", [
  z.strictObject({ kind: z.literal("native"), fieldId: fieldKeySchema }),
  z.strictObject({ kind: z.literal("field"), definitionId: z.uuid(), versionId: z.uuid(), checksum: digest }),
]);
const decimal = z.string().regex(/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/).max(40);
const integer = z.number().int().min(-Number.MAX_SAFE_INTEGER).max(Number.MAX_SAFE_INTEGER);
/** Typed literals. References/addresses are presence-only; their identities and
 * raw structured data never become an arbitrary comparison expression. */
export const requiredFactLiteralSchema = z.discriminatedUnion("type", [
  z.strictObject({ type: z.literal("string"), value: z.string().max(4000) }),
  z.strictObject({ type: z.literal("integer"), value: integer }),
  z.strictObject({ type: z.literal("duration"), value: integer.nonnegative() }),
  z.strictObject({ type: z.literal("decimal"), value: decimal }),
  z.strictObject({ type: z.literal("money"), value: z.strictObject({ amount: decimal, currency: z.string().regex(/^[A-Z]{3}$/) }) }),
  z.strictObject({ type: z.literal("boolean"), value: z.boolean() }),
  z.strictObject({ type: z.literal("date"), value: z.iso.date() }),
  z.strictObject({ type: z.literal("datetime"), value: z.iso.datetime() }),
  z.strictObject({ type: z.literal("email"), value: z.email().max(320) }),
  z.strictObject({ type: z.literal("phone"), value: z.string().regex(/^\+[1-9]\d{6,14}$/) }),
  z.strictObject({ type: z.literal("url"), value: z.url().max(2000) }),
  // Native owners may use existing uppercase enum codes; custom options still
  // follow their published value set. The compiler checks the approved set.
  z.strictObject({ type: z.literal("enum"), value: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/) }),
]);
export const requiredPredicateSchema = z.discriminatedUnion("operator", [
  z.strictObject({ operator: z.literal("present"), source: requiredFactSourceSchema }),
  z.strictObject({ operator: z.literal("absent"), source: requiredFactSourceSchema }),
  z.strictObject({ operator: z.literal("equals"), source: requiredFactSourceSchema, value: requiredFactLiteralSchema }),
  z.strictObject({ operator: z.literal("not_equals"), source: requiredFactSourceSchema, value: requiredFactLiteralSchema }),
  z.strictObject({ operator: z.literal("contains"), source: requiredFactSourceSchema, optionId: fieldKeySchema }),
]);
/** One bounded Boolean group, no recursion, executable code, SQL or coercion. */
export const requiredConditionSchema = z.strictObject({ match: z.enum(["all", "any"]), predicates: z.array(requiredPredicateSchema).min(1).max(20) });
export type RequiredFactSource = z.infer<typeof requiredFactSourceSchema>;
export type RequiredFactLiteral = z.infer<typeof requiredFactLiteralSchema>;
export type RequiredPredicate = z.infer<typeof requiredPredicateSchema>;
export type RequiredCondition = z.infer<typeof requiredConditionSchema>;

/** Pure upcoming contract. Intentionally NOT added to definition actions,
 * dispatch, storage or migration schemas until canonical/native hooks enforce it.
 * Old schema v1 and its compiler/checksums remain unchanged. */
export const conditionalFieldPayloadSchema = z.strictObject({ schemaVersion: z.literal(2), entity: referenceSchema,
  storageGeneration: z.uuid(), field: customFieldSchema, requiredIf: requiredConditionSchema });
export type ConditionalFieldPayload = z.infer<typeof conditionalFieldPayloadSchema>;
