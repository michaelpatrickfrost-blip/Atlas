import { z } from "zod";
import { checksum } from "../registry/contracts";
const revision = z.number().int().nonnegative().max(2147483646);
/** Only observed revisions and raw typed input. No client tenant/schema/principal,
 * privileges, SQL, migration mode or native-column mutation. Explicit null clears. */
export const fieldWriteRequestSchema = z.strictObject({ operationId: z.uuid(), definitionId: z.uuid(), versionId: z.uuid(), generationId: z.uuid(),
  definitionRevision: revision, recordId: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/), recordRevision: revision.positive(),
  extensionRevision: revision.nullable(), slotRevision: revision.nullable(), valueRevision: revision.positive().nullable(),
  value: z.unknown().refine(value => value !== undefined, "Provide a value or explicit null.") });
export type FieldWriteRequest = z.infer<typeof fieldWriteRequestSchema>;
export function fieldWriteRequestChecksum(request: FieldWriteRequest, valueFingerprint: string) {
  // Replace raw business data with its validated canonical fingerprint.
  return checksum({ ...request, value: valueFingerprint });
}
export const fieldWriteAuditSchema = z.strictObject({ requestChecksum: z.string().regex(/^[a-f0-9]{64}$/), versionId: z.uuid(), generationId: z.uuid(),
  extensionId: z.uuid(), extensionRevision: z.number().int().positive(), slotId: z.uuid(), slotRevision: z.number().int().positive(),
  valueRevision: z.number().int().positive(), fingerprint: z.string().regex(/^[a-f0-9]{64}$/) });
