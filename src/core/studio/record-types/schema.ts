import { z } from "zod";
import { referenceSchema } from "../compiler/reference";

const checksum = z.string().regex(/^[a-f0-9]{64}$/);
const uuid = z.uuid().transform(value => value.toLowerCase());
const version = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
const pin = { definitionId: uuid, versionId: uuid, schemaVersion: version, checksum };

/** Published Studio identity, distinct from a module's registry contract identity.
 * Parsing a pin proves its shape only. The server must load its tenant-owned,
 * immutable version and verify kind, schema, checksum and owner compatibility. */
export const entityProfileReferenceSchema = z.strictObject({ ...pin, kind: z.literal("entityProfile"), schemaVersion: z.literal(1) });
export const recordTypeReferenceSchema = z.strictObject({ ...pin, kind: z.literal("recordType"), schemaVersion: z.literal(1) });
export const pageReferenceSchema = z.strictObject({ ...pin, kind: z.literal("page") });
export const customFieldReferenceSchema = z.strictObject({ ...pin, kind: z.literal("customField"), schemaVersion: z.union([z.literal(1), z.literal(2)]) });
export const processReferenceSchema = z.strictObject({ ...pin, kind: z.literal("process") });
export const decisionReferenceSchema = z.strictObject({ ...pin, kind: z.literal("decision") });
export const configurationReferenceSchema = z.discriminatedUnion("kind", [
  entityProfileReferenceSchema, recordTypeReferenceSchema, pageReferenceSchema,
  customFieldReferenceSchema, processReferenceSchema, decisionReferenceSchema,
]);
export type ConfigurationReference = z.infer<typeof configurationReferenceSchema>;
export type EntityProfileReference = z.infer<typeof entityProfileReferenceSchema>;

const decisionSelectionSchema = z.strictObject({
  key: z.string().regex(/^[a-z][a-z0-9_]{0,39}$/),
  decision: decisionReferenceSchema,
});
const requiredFields = z.array(customFieldReferenceSchema).max(100);
const allowedProcesses = z.array(processReferenceSchema).max(50);
const defaultDecisions = z.array(decisionSelectionSchema).max(50);

/** Eligibility metadata is not authority. Process/Decision selections are reserved
 * shapes; publication must reject them until their owning compilers are available. */
export const entityProfileSchema = z.strictObject({
  page: pageReferenceSchema.nullable().default(null),
  requiredFields: requiredFields.default([]),
  allowedProcesses: allowedProcesses.default([]),
  defaultDecisions: defaultDecisions.default([]),
});
export type EntityProfile = z.infer<typeof entityProfileSchema>;

/** An absent property inherits. A present page (including null), process list or
 * decision list replaces that property. Required fields always add to the base;
 * no profile can waive a field's global validation or owning domain invariant. */
export const recordTypeOverlaySchema = z.strictObject({
  page: pageReferenceSchema.nullable().optional(),
  requiredFields: requiredFields.optional(),
  allowedProcesses: allowedProcesses.optional(),
  defaultDecisions: defaultDecisions.optional(),
});

export const entityProfilePayloadSchema = z.strictObject({
  schemaVersion: z.literal(1), entity: referenceSchema, profile: entityProfileSchema,
});
export const recordTypePayloadSchema = z.strictObject({
  schemaVersion: z.literal(1), entity: referenceSchema,
  baseProfile: entityProfileReferenceSchema,
  label: z.string().trim().min(1).max(100), help: z.string().max(500).default(""),
  overlay: recordTypeOverlaySchema,
});
export type EntityProfilePayload = z.infer<typeof entityProfilePayloadSchema>;
export type RecordTypePayload = z.infer<typeof recordTypePayloadSchema>;

export const entityProfileVersionSchema = z.strictObject({
  reference: entityProfileReferenceSchema, payload: entityProfilePayloadSchema,
});
export const recordTypeVersionSchema = z.strictObject({
  reference: recordTypeReferenceSchema, payload: recordTypePayloadSchema,
});
