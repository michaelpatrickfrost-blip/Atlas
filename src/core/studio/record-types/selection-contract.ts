import { z } from "zod";

const revision = z.number().int().min(0).max(2147483647);
const recordId = z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/);
export const recordTypeSelectionRequestSchema = z.strictObject({
  recordId, recordRevision: revision.min(1),
});
export const recordTypeReassignmentSchema = recordTypeSelectionRequestSchema.extend({
  operationId: z.uuid(), extensionRevision: revision.nullable(),
  definitionId: z.uuid().nullable(),
});
/** Presentation only. Immutable pins, tenant and field policy stay on the server. */
export type RecordTypeSelection = {
  operationId: string; recordId: string; recordRevision: number;
  extensionRevision: number | null; currentDefinitionId: string | null;
  choices: { definitionId: string; label: string; help: string }[];
};
