import { z } from "zod";
import { checksum } from "@/core/studio/registry/contracts";

const uuid = z.uuid().refine(value => value === value.toLowerCase(), "Use a canonical identity.");
const hash = z.string().regex(/^[a-f0-9]{64}$/);
/** Creation transport only; the server selects the immutable pin. */
export const ticketCreationTypeSelectionSchema = z.strictObject({ schemaVersion: z.literal(1),
  manifestChecksum: hash, definitionId: uuid.nullable() });
export type TicketCreationTypeSelection = z.infer<typeof ticketCreationTypeSelectionSchema>;
export function parseTicketCreationTypeSelection(input: unknown) {
  const raw = z.string().max(512).parse(input);
  return ticketCreationTypeSelectionSchema.parse(JSON.parse(raw));
}
export type TicketCreationTypeManifest = { schemaVersion: 1; manifestChecksum: string;
  choices: { definitionId: string; label: string; help: string; requiredFields: { definitionId: string; label: string }[] }[] };
/** Server-only retained assignment anchor, never client transport. */
export const ticketCreationTypeReceiptSchema = z.strictObject({ operationId: uuid, extensionId: uuid,
  extensionRevision: z.number().int().min(1).max(2147483647), requestChecksum: hash, checksum: hash, selectionChecksum: hash });
export type TicketCreationTypeReceipt = z.infer<typeof ticketCreationTypeReceiptSchema>;
export function ticketCreationTypeSelectionChecksum(input: TicketCreationTypeSelection) {
  return checksum(ticketCreationTypeSelectionSchema.parse(input));
}
