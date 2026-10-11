import { z } from "zod";
import { referenceSchema } from "../compiler/reference";
import { entityProfileReferenceSchema, recordTypeReferenceSchema } from "./schema";

const uuid = z.uuid().transform(value => value.toLowerCase());
const revision = z.number().int().nonnegative().max(2147483647);
const recordId = z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/);
const seal = z.string().regex(/^[a-f0-9]{64}$/);
export const recordTypeAssignmentRequestSchema = z.strictObject({
  operationId: uuid, entity: referenceSchema, recordId, recordRevision: revision.min(1),
  extensionRevision: revision.nullable(), recordType: recordTypeReferenceSchema.nullable(),
});
export type RecordTypeAssignmentRequest = z.infer<typeof recordTypeAssignmentRequestSchema>;

/** Immutable metadata provenance, never business values or security grants. */
export const recordTypeAssignmentProvenanceSchema = z.strictObject({
  schemaVersion: z.literal(1), operationId: uuid, organisationId: z.string().min(1),
  entity: referenceSchema, recordId, nativeRevision: revision.min(1),
  extensionId: uuid, extensionRevision: revision.min(1), previousExtensionRevision: revision.nullable(), previousAssignmentId: uuid.nullable(),
  recordType: recordTypeReferenceSchema.nullable(), baseProfile: entityProfileReferenceSchema.nullable(),
  resolvedProfileChecksum: seal.nullable(), requestChecksum: seal, createdBy: z.string().min(1),
}).refine(value => value.recordType === null || value.baseProfile !== null, "A record type requires its exact base profile.")
  .refine(value => (value.baseProfile === null) === (value.resolvedProfileChecksum === null), "Profile provenance must be complete.");
export type RecordTypeAssignmentProvenance = z.infer<typeof recordTypeAssignmentProvenanceSchema>;
export const RECORD_TYPE_ASSIGNMENT_ACTION = "studio.record_type.assigned";
export const RECORD_TYPE_ASSIGNMENT_ENTITY = "StudioRecordTypeAssignment";
