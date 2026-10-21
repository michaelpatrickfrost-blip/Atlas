import { z } from "zod";
import { checksum } from "@/core/studio/registry/contracts";
import { fieldFormPacketSchema, type FieldFormPacket } from "@/core/studio/fields/form-packet";
import type { TicketFieldFormManifest } from "./field-form-contract";

/** Internal server operation identity. Version8 UUID uses a domain-separated
 * SHA256 of exact canonical whole-operation/definition/written-version IDs.
 * It gives no field, tenant, record, permission or creation authority. */
export function ticketFieldDefaultOperationId(operationId: string, definitionId: string, versionId: string) {
  const ids = [operationId, definitionId, versionId].map(id => z.uuid().parse(id).toLowerCase());
  const hash = checksum({ purpose: "atlas.ticket.literal-default.v1", ids });
  const variant = ((parseInt(hash[16], 16) & 3) | 8).toString(16);
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-8${hash.slice(13, 16)}-${variant}${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

/** Current authorised manifest only. Defaults supplement omissions on creation;
 * explicit null, false and zero are supplied entries and cannot be replaced.
 * Staging still uses the actual INSERT proof and the existing typed writer. */
export function ticketDefaultFieldEntries(manifest: TicketFieldFormManifest, packet: FieldFormPacket): FieldFormPacket["fields"] {
  if (manifest.operation !== "create") return [];
  if (manifest.recordRevision !== null || manifest.extensionRevision !== null || packet.extensionRevision !== null)
    throw new Error("CONFLICT: new request default observations changed.");
  const supplied = new Set(packet.fields.map(field => field.definitionId.toLowerCase()));
  const fields = manifest.fields.filter(field => field.defaultValue !== undefined && !supplied.has(field.definitionId.toLowerCase())).map(field => {
    if (field.slotRevision !== null || field.valueRevision !== null || field.defaultValue?.type !== field.storage.type)
      throw new Error("CONFLICT: new request default metadata changed.");
    return { operationId: ticketFieldDefaultOperationId(packet.operationId, field.definitionId, field.versionId),
      definitionId: field.definitionId, definitionRevision: field.definitionRevision, versionId: field.versionId, generationId: field.generationId,
      slotRevision: null, valueRevision: null, value: field.defaultValue! };
  });
  // Check combined identity/bounds including theoretical UUID collisions before
  // the first writer. Raw client packet stays unchanged for exact replay.
  fieldFormPacketSchema.parse({ ...packet, fields: [...packet.fields, ...fields] });
  return fields;
}
