import { z } from "zod";
import { checksum } from "@/core/studio/registry/contracts";
import { fieldFormPacketSchema, type FieldFormPacket } from "@/core/studio/fields/form-packet";

export const TICKET_FORM_RECEIPT_ACTION = "tickets.form.completed";
export const TICKET_FORM_RECEIPT_ENTITY = "TicketFormReceipt";
export const TICKET_FORM_RECEIPT_PREFIX = "studio-ticket-form:";
const hash = z.string().regex(/^[a-f0-9]{64}$/);
const uuid = z.uuid().refine(value => value === value.toLowerCase(), "Receipt UUIDs must be canonical.");
const recordId = z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/);
const revision = z.number().int().positive().max(2147483647);
const common = { nativeRequestChecksum: hash, packet: fieldFormPacketSchema };

/** Internal owning intent. The native hash and update identity/revision must
 * come from the server's parsed domain request, never client checksum fields. */
export const ticketFormRequestSchema = z.discriminatedUnion("operation", [
  z.strictObject({ ...common, operation: z.literal("create") }),
  z.strictObject({ ...common, operation: z.literal("update"), recordId, recordRevision: revision.max(2147483646) }),
]);
export type TicketFormRequest = z.infer<typeof ticketFormRequestSchema>;
export const ticketFormResultSchema = z.strictObject({ recordId, recordRevision: revision, fieldRecordRevision: revision });
export type TicketFormResult = z.infer<typeof ticketFormResultSchema>;

export const ticketFormFieldReceiptSchema = z.strictObject({ operationId: uuid, definitionId: uuid, definitionRevision: z.number().int().nonnegative().max(2147483646),
  versionId: uuid, generationId: uuid, fingerprint: hash, requestChecksum: hash, extensionId: uuid, extensionRevision: revision,
  slotId: uuid, slotRevision: revision, valueRevision: revision, defaulted: z.literal(true).optional() });
export const ticketFormReceiptSchema = z.strictObject({ schemaVersion: z.literal(1), organisationId: z.string().min(1), actorUserId: z.string().min(1),
  operationId: uuid, operation: z.enum(["create", "update"]), recordId, recordRevision: revision, requestRecordRevision: revision,
  fieldRecordRevision: revision, nativeRequestChecksum: hash, packetChecksum: hash, fields: z.array(ticketFormFieldReceiptSchema).max(100) })
  .superRefine((receipt, context) => {
    if (receipt.operation === "create" ? receipt.requestRecordRevision !== 1 || receipt.recordRevision !== 1 || receipt.fieldRecordRevision !== 1
      : receipt.recordRevision !== receipt.requestRecordRevision + 1 || ![receipt.requestRecordRevision, receipt.recordRevision].includes(receipt.fieldRecordRevision))
      context.addIssue({ code: "custom", message: "Invalid owning revision baseline." });
    const operations = new Set([receipt.operationId]);
    let previous = "";
    for (const [index, field] of receipt.fields.entries()) {
      if ((field.defaulted && receipt.operation !== "create") || field.definitionId <= previous || operations.has(field.operationId) || field.slotRevision !== field.valueRevision)
        context.addIssue({ code: "custom", path: ["fields", index], message: "Invalid receipt field order or identity." });
      previous = field.definitionId; operations.add(field.operationId);
    }
  });
export type TicketFormReceipt = z.infer<typeof ticketFormReceiptSchema>;
export function ticketFormReceiptKey(operationId: string) { return `${TICKET_FORM_RECEIPT_PREFIX}${z.uuid().parse(operationId).toLowerCase()}`; }
/** Exact parsed transport checksum retains supplied array order, casing, nulls
 * and omissions. It is separate from deterministic field staging order. */
export function ticketFormPacketChecksum(packet: FieldFormPacket) { return checksum(fieldFormPacketSchema.parse(packet)); }
export function ticketFormProcessingOrder(packet: FieldFormPacket) {
  return [...packet.fields].sort((a, b) => a.definitionId.toLowerCase() < b.definitionId.toLowerCase() ? -1 : 1);
}
