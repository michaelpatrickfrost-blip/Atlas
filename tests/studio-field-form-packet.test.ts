import { expect, it } from "vitest";
import { FIELD_FORM_PACKET_MAX_BYTES, fieldFormPacketSchema, parseFieldFormPacketJson, type FieldFormPacket } from "@/core/studio/fields/form-packet";
import { validateFieldValue } from "@/core/studio/fields/validation";
import type { FieldValue } from "@/core/studio/fields/schema";

// Pure transport tests only: no tenant principal, discovery, writer, database,
// mutation/replay/window/permission or final required-rule evidence is claimed.
const uuid = (value: number) => `00000000-0000-4000-8000-${value.toString(16).padStart(12, "0")}`;
const entry = (index = 0, value: FieldValue | null = null): FieldFormPacket["fields"][number] => ({ operationId: uuid(index + 200), definitionId: uuid(index + 400), definitionRevision: 0,
  versionId: uuid(index + 600), generationId: uuid(index + 800), slotRevision: null, valueRevision: null, value });
const packet = (fields: FieldFormPacket["fields"] = [entry()]): FieldFormPacket => ({ schemaVersion: 1, operationId: uuid(1), manifestChecksum: "a".repeat(64), extensionRevision: null, fields });
const parse = (input: unknown, maximum = 100) => parseFieldFormPacketJson(JSON.stringify(input), maximum);
const values = [
  { type: "string", value: "Hello 👋" }, { type: "integer", value: 0 }, { type: "decimal", value: "-0.00" },
  { type: "money", value: { amount: "1.2500", currency: "GBP" } }, { type: "boolean", value: false },
  { type: "date", value: "2024-02-29" }, { type: "datetime", value: "2026-10-11T12:30:00.123Z" },
  { type: "duration", value: 0 }, { type: "email", value: "User@example.invalid" },
  { type: "url", value: "https://example.invalid/path?q=1" }, { type: "phone", value: "+441234567890" },
  { type: "enum", value: "choice_one" }, { type: "multi_enum", value: ["second", "first"] },
  { type: "reference", value: "record-abc_123" }, { type: "address", value: { line1: "1 Main Street", line2: "", city: "London", region: "", postalCode: "SW1A 1AA", country: "GB" } },
] satisfies FieldValue[];
it.each(values.map(value => [value.type, value] as const))("preserves the existing %s value shape without coercion/defaults", (_type, value) => {
  expect(parse(packet([entry(0, value)]))).toEqual(packet([entry(0, value)]));
});
it("distinguishes omitted entries, explicit null, zero and false without implying requirement coverage", () => {
  expect(parse(packet([]), 1).fields).toEqual([]);
  const input = packet([entry(), entry(1, { type: "integer", value: 0 }), entry(2, { type: "boolean", value: false })]);
  expect(parse(input).fields.map(field => field.value)).toEqual([null, { type: "integer", value: 0 }, { type: "boolean", value: false }]);
  const absent = { ...entry() } as Record<string, unknown>; delete absent.value;
  expect(() => parse({ ...packet(), fields: [absent] })).toThrow();
  expect(() => fieldFormPacketSchema.parse({ ...packet(), fields: [{ ...entry(), value: undefined }] })).toThrow();
});
it("requires every transport observation and explicit nullable property", () => {
  for (const key of ["schemaVersion", "operationId", "manifestChecksum", "extensionRevision", "fields"]) {
    const input = { ...packet() } as Record<string, unknown>; delete input[key]; expect(() => parse(input)).toThrow();
  }
  for (const key of ["operationId", "definitionId", "definitionRevision", "versionId", "generationId", "slotRevision", "valueRevision", "value"]) {
    const input = { ...entry() } as Record<string, unknown>; delete input[key]; expect(() => parse({ ...packet(), fields: [input] })).toThrow();
  }
});
it("requires explicit address properties instead of filling schema defaults", () => {
  const address = values.find(value => value.type === "address")!;
  if (address.type !== "address") throw new Error("Missing address fixture");
  for (const key of ["line2", "region", "postalCode"]) {
    const incomplete = { ...address.value } as Record<string, unknown>; delete incomplete[key];
    expect(() => parse({ ...packet(), fields: [{ ...entry(), value: { type: "address", value: incomplete } }] })).toThrow();
  }
});
it("rejects tenant/entity/record/proof/permission/condition/schema claims and every unknown nested property", () => {
  for (const key of ["organisationId", "entity", "recordId", "proof", "permission", "condition", "required", "create", "maxFields", "compiledPlan", "schema"]) {
    expect(() => parse({ ...packet(), [key]: "untrusted" })).toThrow();
    expect(() => parse({ ...packet(), fields: [{ ...entry(), [key]: "untrusted" }] })).toThrow();
  }
  for (const value of [{ type: "integer", value: 1, extra: true }, { type: "money", value: { amount: "1", currency: "GBP", rate: "1" } },
    { type: "address", value: { ...(values.at(-1) as Extract<FieldValue, { type: "address" }>).value, countryId: "private" } }])
    expect(() => parse({ ...packet(), fields: [{ ...entry(), value }] })).toThrow();
  const raw = JSON.stringify(packet()).replace('{"schemaVersion"', '{"__proto__":{"permission":true},"schemaVersion"');
  expect(() => parseFieldFormPacketJson(raw, 100)).toThrow();
});
it("rejects duplicate definitions/per-field operation IDs including alternate UUID casing and whole-operation reuse", () => {
  const first = { ...entry(), definitionId: uuid(0xbeef) }, second = entry(1);
  for (const patch of [{ definitionId: first.definitionId }, { definitionId: first.definitionId.toUpperCase() },
    { operationId: first.operationId }, { operationId: first.operationId.toUpperCase() }, { operationId: packet().operationId }, { operationId: packet().operationId.toUpperCase() }])
    expect(() => parse(packet([first, { ...second, ...patch }]))).toThrow();
});
it("accepts 100 distinct fields and the server owner's smaller limit but rejects overflow", () => {
  const fields = Array.from({ length: 100 }, (_, index) => entry(index)); expect(parse(packet(fields)).fields).toHaveLength(100);
  expect(() => parse(packet([...fields, entry(100)]))).toThrow();
  expect(parse(packet(fields.slice(0, 3)), 3).fields).toHaveLength(3);
  expect(() => parse(packet(fields.slice(0, 3)), 2)).toThrow("owning entity's field limit");
  for (const maximum of [0, -1, 101, 1.5, NaN, Infinity]) expect(() => parse(packet(), maximum)).toThrow();
});
it("bounds revision observations exactly like the existing writer, including positive persisted value revisions", () => {
  const highest = 2147483646;
  expect(parse({ ...packet([ { ...entry(), definitionRevision: highest, slotRevision: 0, valueRevision: highest } ]), extensionRevision: highest }).extensionRevision).toBe(highest);
  for (const value of [-1, 1.5, 2147483647, Number.MAX_SAFE_INTEGER + 1, "1", undefined]) {
    expect(() => parse({ ...packet(), extensionRevision: value })).toThrow();
    for (const key of ["definitionRevision", "slotRevision", "valueRevision"]) expect(() => parse({ ...packet(), fields: [{ ...entry(), [key]: value }] })).toThrow();
  }
  expect(() => parse(packet([{ ...entry(), valueRevision: 0 }]))).toThrow();
  expect(parse(packet([{ ...entry(), slotRevision: 0, valueRevision: 1 }])).fields[0].valueRevision).toBe(1);
});
it("rejects malformed UUID/hash/schema version and wrong container shapes", () => {
  for (const patch of [{ schemaVersion: 2 }, { schemaVersion: "1" }, { operationId: "not-a-uuid" }, { manifestChecksum: "A".repeat(64) }, { manifestChecksum: "a".repeat(63) }, { fields: {} }])
    expect(() => parse({ ...packet(), ...patch })).toThrow();
  for (const key of ["operationId", "definitionId", "versionId", "generationId"]) expect(() => parse({ ...packet(), fields: [{ ...entry(), [key]: "invalid" }] })).toThrow();
  for (const input of [null, [], 1, true, "string"]) expect(() => parse(input)).toThrow();
});
it("rejects malformed, unsafe, overflow and coercible scalar values", () => {
  const invalid = [
    { type: "integer", value: "1" }, { type: "integer", value: 1.5 }, { type: "integer", value: Number.MAX_SAFE_INTEGER + 1 }, { type: "integer", value: Infinity },
    { type: "duration", value: -1 }, { type: "boolean", value: "false" }, { type: "boolean", value: 0 },
    { type: "decimal", value: 1 }, { type: "decimal", value: "1e3" }, { type: "decimal", value: "01.2" }, { type: "decimal", value: "1".repeat(41) },
    { type: "money", value: { amount: "1", currency: "gbp" } }, { type: "money", value: { amount: "1" } },
    { type: "date", value: "2023-02-29" }, { type: "datetime", value: "2026-10-11T12:30:00+01:00" },
    { type: "datetime", value: "2026-10-11T12:30:00." + "1".repeat(41) + "Z" },
    { type: "email", value: "invalid" }, { type: "phone", value: "0123456789" },
    { type: "url", value: "javascript:alert(1)" }, { type: "url", value: "https://user:pass@example.invalid" }, { type: "url", value: "invalid" },
    { type: "enum", value: "Display label" }, { type: "multi_enum", value: ["one", "one"] }, { type: "multi_enum", value: Array.from({ length: 201 }, (_, n) => `choice_${n}`) },
    { type: "reference", value: "../../private" }, { type: "address", value: { ...(values.at(-1) as Extract<FieldValue, { type: "address" }>).value, country: "gb" } },
    { type: "string", value: "x".repeat(4001) }, { type: "string", value: "null\u0000text" }, { type: "string", value: "bad\ud800" },
    { type: "arbitrary_json", value: {} }, { type: "string" },
  ];
  for (const value of invalid) expect(() => parse({ ...packet(), fields: [{ ...entry(), value }] })).toThrow();
  const rawOverflow = JSON.stringify(packet([entry(0, { type: "integer", value: 1 })])).replace('"value":1}', '"value":1e999}');
  expect(() => parseFieldFormPacketJson(rawOverflow, 100)).toThrow();
});
it("enforces the inclusive raw UTF-8 byte ceiling before JSON parsing, including whitespace and multibyte text", () => {
  const source = JSON.stringify(packet([])), exact = source.padEnd(FIELD_FORM_PACKET_MAX_BYTES, " ");
  expect(parseFieldFormPacketJson(exact, 1)).toEqual(packet([]));
  expect(() => parseFieldFormPacketJson(exact + " ", 1)).toThrow("exceeds 256 KiB");
  expect(() => parseFieldFormPacketJson(" ".repeat(FIELD_FORM_PACKET_MAX_BYTES + 1) + "malformed", 1)).toThrow("exceeds 256 KiB");
  const multilingual = JSON.stringify(packet(Array.from({ length: 40 }, (_, n) => entry(n, { type: "string", value: "界".repeat(2500) }))));
  expect(multilingual.length).toBeLessThan(FIELD_FORM_PACKET_MAX_BYTES); expect(new TextEncoder().encode(multilingual).byteLength).toBeGreaterThan(FIELD_FORM_PACKET_MAX_BYTES);
  expect(() => parseFieldFormPacketJson(multilingual, 100)).toThrow("exceeds 256 KiB");
});
it("requires raw JSON text and reports malformed JSON without exposing business text", () => {
  for (const input of [packet(), null, undefined, 42, new Uint8Array([1])]) expect(() => parseFieldFormPacketJson(input, 100)).toThrow();
  expect(() => parseFieldFormPacketJson('{"secret":"PRIVATE', 100)).toThrow("FIELD_FORM_PACKET_INVALID: malformed form packet JSON.");
});
it("leaves field-specific constraints and mutation authority to the owning writer", () => {
  const value: FieldValue = { type: "integer", value: 5 }; expect(parse(packet([entry(0, value)])).fields[0].value).toEqual(value);
  expect(() => validateFieldValue({ key: "extra", label: "Extra", classification: "confidential", storage: { type: "integer", max: 4 } }, value.value)).toThrow();
  expect(parse(packet([entry(0, { type: "reference", value: "not_an_authorised_record" })])).fields[0].value).toEqual({ type: "reference", value: "not_an_authorised_record" });
});
