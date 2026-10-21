import { expect, it } from "vitest";
import { customFieldPayloadSchema, type FieldValue } from "@/core/studio/fields/schema";
import { validateFieldConstraints } from "@/core/studio/fields/validation";
import { encodeFieldValue, decodeStoredFieldValue } from "@/core/studio/fields/codec";
import { checksum } from "@/core/studio/registry/contracts";
import { analyseFieldEvolution, analyseRequiredFieldEvolution } from "@/core/studio/fields/evolution";
import { ticketDefaultFieldEntries, ticketFieldDefaultOperationId } from "@/core/service-work/field-defaults";
import type { TicketFieldFormManifest } from "@/core/service-work/field-form-contract";
import { fieldFormPacketSchema } from "@/core/studio/fields/form-packet";
import type { FieldFormPacket } from "@/core/studio/fields/form-packet";
const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const entity = { id: "tickets.ticket", version: 9, schemaHash: "a".repeat(64), contractHash: "b".repeat(64) };
function payload(storage: unknown = { type: "integer" }, defaultValue?: unknown) {
  return customFieldPayloadSchema.parse({ schemaVersion: 1, entity, storageGeneration: uuid(2), field: { key: "extra", label: "Extra", classification: "confidential", storage,
    ...(defaultValue === undefined ? {} : { defaultValue }) } });
}
it("retains exact no-default schema shape and rejects inferred/executable/unknown literals", () => {
  const legacy = payload(); expect(legacy.field).not.toHaveProperty("defaultValue");
  expect(checksum(validateFieldConstraints(legacy.field))).toBe(checksum(legacy.field));
  for (const defaultValue of [null, 1, "1", { type: "integer", value: "1" }, { type: "integer", value: 0, formula: "now()" }, { type: "string", value: "wrong" }])
    expect(() => payload(undefined, defaultValue)).toThrow();
});
it.each([
  [{ type: "string" }, { type: "string", value: "Ready" }], [{ type: "integer" }, { type: "integer", value: 0 }],
  [{ type: "decimal" }, { type: "decimal", value: "1.2000" }], [{ type: "money", currencies: ["GBP"] }, { type: "money", value: { amount: "0.00", currency: "GBP" } }],
  [{ type: "boolean" }, { type: "boolean", value: false }], [{ type: "date" }, { type: "date", value: "2024-02-29" }],
  [{ type: "datetime", timezone: "UTC" }, { type: "datetime", value: "2026-10-11T12:30:00Z" }],
  [{ type: "duration", unit: "seconds" }, { type: "duration", value: 0 }], [{ type: "email" }, { type: "email", value: "Owner@example.invalid" }],
  [{ type: "url" }, { type: "url", value: "https://example.invalid" }], [{ type: "phone", format: "E164" }, { type: "phone", value: "+441234567890" }],
  [{ type: "enum", valueSetVersion: 1, options: [{ id: "one", label: "One" }] }, { type: "enum", value: "one" }],
  [{ type: "multi_enum", valueSetVersion: 1, options: [{ id: "one", label: "One" }] }, { type: "multi_enum", value: ["one"] }],
  [{ type: "reference", entity }, { type: "reference", value: "approved-record" }],
  [{ type: "address", countries: ["GB"] }, { type: "address", value: { line1: "1 Main Street", line2: "", city: "London", region: "", postalCode: "", country: "GB" } }],
])("uses the existing precise %s validator and codec without default writes", (storage, value) => {
  const field = validateFieldConstraints(payload(storage, value).field), encoded = encodeFieldValue(field, field.defaultValue!.value);
  expect(decodeStoredFieldValue(field, encoded)).toEqual(field.defaultValue);
  expect(encoded.fingerprint).toBe(checksum(field.defaultValue));
});
it.each([
  [{ type: "integer", min: 1 }, { type: "integer", value: 0 }], [{ type: "string", maxLength: 2 }, { type: "string", value: "long" }],
  [{ type: "decimal", precision: 3, scale: 1 }, { type: "decimal", value: "1.23" }],
  [{ type: "money", currencies: ["GBP"] }, { type: "money", value: { amount: "1", currency: "EUR" } }],
  [{ type: "enum", valueSetVersion: 1, options: [{ id: "old", label: "Old", retired: true }] }, { type: "enum", value: "old" }],
  [{ type: "address", countries: ["GB"] }, { type: "address", value: { line1: "1 Street", line2: "", city: "Paris", region: "", postalCode: "", country: "FR" } }],
  [{ type: "url", protocols: ["https"] }, { type: "url", value: "http://example.invalid" }], [{ type: "string" }, { type: "string", value: "" }],
])("rejects a default violating actual %s field constraints", (storage, value) => {
  expect(() => validateFieldConstraints(payload(storage, value).field)).toThrow();
});
it("default changes and removals use reviewed structural evolution for schema1 and schema2", () => {
  const source = payload(), defaulted = payload(undefined, { type: "integer", value: 0 });
  expect(() => analyseFieldEvolution(source, defaulted)).toThrow("new storage generation");
  defaulted.storageGeneration = uuid(3);
  expect(analyseFieldEvolution(source, defaulted).kind).toBe("migration");
  const removed = { ...source, storageGeneration: uuid(4) }; expect(analyseFieldEvolution(defaulted, removed).kind).toBe("migration");
  const condition = { match: "all" as const, predicates: [{ source: { kind: "native" as const, fieldId: "status" }, operator: "present" as const }] };
  expect(analyseRequiredFieldEvolution({ ...source, schemaVersion: 2, requiredIf: condition }, { ...defaulted, schemaVersion: 2, requiredIf: condition }).kind).toBe("migration");
});
function form(defaultValue: FieldValue): { manifest: TicketFieldFormManifest; packet: FieldFormPacket } {
  const manifest: TicketFieldFormManifest = { schemaVersion: 1, operation: "create", operationId: uuid(1), manifestChecksum: "a".repeat(64), recordRevision: null, extensionRevision: null,
    fields: [{ operationId: uuid(7), definitionId: uuid(2), versionId: uuid(3), generationId: uuid(4), definitionRevision: 2, slotRevision: null, valueRevision: null,
      label: "Extra", help: "", storage: { type: "integer" }, required: false, conditionalRequired: false, value: null, defaultValue }] };
  return { manifest, packet: { schemaVersion: 1, operationId: uuid(1), manifestChecksum: manifest.manifestChecksum, extensionRevision: null, fields: [] } };
}
it("omission supplies zero with a stable server operation, explicit null/zero do not, and edits never fill defaults", () => {
  const { manifest, packet } = form({ type: "integer", value: 0 }), before = checksum(packet);
  const first = ticketDefaultFieldEntries(manifest, packet); expect(first[0].value).toEqual({ type: "integer", value: 0 });
  expect(first[0].operationId).toBe(ticketFieldDefaultOperationId(packet.operationId, uuid(2), uuid(3)));
  expect(ticketDefaultFieldEntries(manifest, packet)).toEqual(first); expect(checksum(packet)).toBe(before);
  for (const value of [null, { type: "integer" as const, value: 0 }]) expect(ticketDefaultFieldEntries(manifest, { ...packet, fields: [{ ...first[0], operationId: uuid(8), value }] })).toEqual([]);
  expect(ticketDefaultFieldEntries({ ...manifest, operation: "update", recordRevision: 1 }, packet)).toEqual([]);
  expect(ticketFieldDefaultOperationId(uuid(1), uuid(2), uuid(9))).not.toBe(first[0].operationId);
});
it("rejects existing observations/type mismatch and duplicate server/client operation identities before staging", () => {
  const { manifest, packet } = form({ type: "integer", value: 0 });
  expect(() => ticketDefaultFieldEntries({ ...manifest, extensionRevision: 0 }, packet)).toThrow();
  manifest.fields[0].slotRevision = 0; expect(() => ticketDefaultFieldEntries(manifest, packet)).toThrow(); manifest.fields[0].slotRevision = null;
  manifest.fields[0].defaultValue = { type: "boolean", value: false }; expect(() => ticketDefaultFieldEntries(manifest, packet)).toThrow();
});

it("client transport cannot declare a default or a defaulted receipt origin", () => {
  const { manifest, packet } = form({ type: "integer", value: 0 }), field = ticketDefaultFieldEntries(manifest, packet)[0];
  expect(() => fieldFormPacketSchema.parse({ ...packet, defaultValue: field.value })).toThrow();
  expect(() => fieldFormPacketSchema.parse({ ...packet, fields: [{ ...field, defaulted: true }] })).toThrow();
});
