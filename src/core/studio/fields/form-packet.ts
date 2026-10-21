import { z } from "zod";
import { fieldFormValueSchema } from "./value-schema";
export { fieldFormValueSchema } from "./value-schema";

/** Transport version only; it neither changes sealed field schema1/2 nor
 * approves a field, record, operation, value or permission. No runtime caller.
 */
export const FIELD_FORM_PACKET_MAX_BYTES = 256 * 1024;
const revision = z.number().int().nonnegative().max(2147483646);
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
