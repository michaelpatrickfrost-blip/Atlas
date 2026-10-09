import { describe, expect, it } from "vitest";
import { customFieldSchema, safeFieldPattern } from "@/core/studio/fields/schema";
import { assertFieldAccess, validateFieldConstraints, validateFieldValue } from "@/core/studio/fields/validation";
import type { Session } from "@/core/auth/session";
const field = (storage: object, extra: object = {}) => ({ key: "extra", label: "Extra information", classification: "confidential", storage, ...extra });
const ref = { id: "tickets.ticket", version: 1, schemaHash: "a".repeat(64), contractHash: "b".repeat(64) };
describe("Studio typed additional values", () => {
  it("validates required/optional values independently of visibility and retains a valid false", () => {
    expect(validateFieldValue(field({ type: "boolean" }, { required: true }), false)).toEqual({ type: "boolean", value: false });
    expect(validateFieldValue(field({ type: "integer" }), null)).toBeNull();
    expect(() => validateFieldValue(field({ type: "string" }, { required: true }), "")).toThrow("required");
    expect(() => customFieldSchema.parse({ ...field({ type: "string" }), visible: false })).toThrow();
    expect(() => validateFieldValue(field({ type: "boolean" }), "false")).toThrow();
    expect(() => validateFieldValue(field({ type: "integer" }), "42")).toThrow();
  });
  it("enforces numeric bounds, safe integers, exact decimal scale and explicit money currency", () => {
    expect(validateFieldValue(field({ type: "decimal", precision: 8, scale: 2 }), "1234.50")).toEqual({ type: "decimal", value: "1234.5" });
    expect(validateFieldValue(field({ type: "decimal", precision: 20, scale: 2 }), "9007199254740993.01")).toEqual({ type: "decimal", value: "9007199254740993.01" });
    for (const value of [12.5, Number.MAX_SAFE_INTEGER + 1, Infinity, NaN]) expect(() => validateFieldValue(field({ type: "integer" }), value)).toThrow();
    for (const value of [12.345, "12.345", "1234567.00", "1e4"]) expect(() => validateFieldValue(field({ type: "decimal", precision: 8, scale: 2 }), value)).toThrow();
    expect(() => validateFieldValue(field({ type: "integer", min: 1, max: 5 }), 6)).toThrow();
    expect(validateFieldValue(field({ type: "money", precision: 8, scale: 2, currencies: ["GBP"] }), { amount: "10.50", currency: "GBP" })).toEqual({ type: "money", value: { amount: "10.5", currency: "GBP" } });
    for (const value of ["10.50", { amount: "10.50" }, { amount: "10.50", currency: "USD" }, { amount: 10.5, currency: "GBP" }]) expect(() => validateFieldValue(field({ type: "money", currencies: ["GBP"] }), value)).toThrow();
  });
  it("rejects invalid definition bounds and unsafe regular expressions", () => {
    for (const storage of [{ type: "string", minLength: 10, maxLength: 2 }, { type: "integer", min: 5, max: 1 }, { type: "decimal", min: "5", max: "1" }, { type: "decimal", precision: 2, scale: 3 }, { type: "decimal", precision: 4, scale: 2, min: "100" }]) expect(() => validateFieldConstraints(field(storage))).toThrow();
    for (const source of ["^(a+)+$", "^(a|aa)+$", "(?=a).*", "^[A-Z]{1,9999}$", "^[A-Z]{5,1}$"]) expect(() => safeFieldPattern(source)).toThrow();
    expect(validateFieldValue(field({ type: "string", pattern: "^[A-Z]{1,5}$" }), "ABC")).toEqual({ type: "string", value: "ABC" });
    expect(() => validateFieldValue(field({ type: "string", pattern: "^[A-Z]{1,5}$" }), "abc")).toThrow("allowed characters");
    expect(() => validateFieldValue(field({ type: "string" }), "first\nsecond")).toThrow("single line");
  });
  it("uses stable enum IDs, excludes retired choices, bounds multi-enums and preserves deterministic ordering", () => {
    const options = [{ id: "red", label: "Red" }, { id: "blue", label: "Blue" }, { id: "old", label: "Historical", retired: true }];
    expect(validateFieldValue(field({ type: "enum", valueSetVersion: 1, options }), "red")).toEqual({ type: "enum", value: "red" });
    expect(() => validateFieldValue(field({ type: "enum", valueSetVersion: 1, options }), "Red")).toThrow("current allowed");
    expect(() => validateFieldValue(field({ type: "enum", valueSetVersion: 1, options }), "old")).toThrow("current allowed");
    expect(validateFieldValue(field({ type: "multi_enum", valueSetVersion: 1, options }), ["red", "blue"])).toEqual({ type: "multi_enum", value: ["blue", "red"] });
    expect(() => validateFieldValue(field({ type: "multi_enum", valueSetVersion: 1, options }), ["red", "red"])).toThrow("Duplicate selected");
    expect(() => validateFieldValue(field({ type: "multi_enum", valueSetVersion: 1, options }, { required: true }), [])).toThrow("required");
    expect(() => validateFieldValue(field({ type: "multi_enum", valueSetVersion: 1, options, maxSelections: 1 }), ["red", "blue"])).toThrow();
    expect(() => validateFieldConstraints(field({ type: "enum", valueSetVersion: 1, options: [options[0], options[0]] }))).toThrow("Duplicate enum");
  });
  it("keeps calendar dates, UTC instants and explicit duration units distinct", () => {
    expect(validateFieldValue(field({ type: "date" }), "2024-02-29")).toEqual({ type: "date", value: "2024-02-29" });
    expect(() => validateFieldValue(field({ type: "date" }), "2026-02-29")).toThrow();
    expect(() => validateFieldValue(field({ type: "date" }), "2026-02-30")).toThrow();
    expect(validateFieldValue(field({ type: "datetime", timezone: "UTC" }), "2026-10-09T12:00:00Z")).toEqual({ type: "datetime", value: "2026-10-09T12:00:00.000Z" });
    expect(() => validateFieldValue(field({ type: "datetime", timezone: "UTC" }), "2026-10-09T12:00:00")).toThrow();
    expect(() => validateFieldValue(field({ type: "datetime", timezone: "UTC" }), "2026-10-09T12:00:00+01:00")).toThrow();
    expect(validateFieldValue(field({ type: "duration", unit: "seconds" }), 60)).toEqual({ type: "duration", value: 60 });
    expect(() => validateFieldValue(field({ type: "duration", unit: "seconds" }), -1)).toThrow();
  });
  it("validates web/contact/reference/address values without untrusted scope or executable content", () => {
    expect(validateFieldValue(field({ type: "email" }), "Actor@Example.test")).toEqual({ type: "email", value: "actor@example.test" });
    expect(validateFieldValue(field({ type: "url" }), "https://example.test")).toEqual({ type: "url", value: "https://example.test/" });
    for (const value of ["javascript:alert(1)", "http://example.test", "https://secret:password@example.test"]) expect(() => validateFieldValue(field({ type: "url" }), value)).toThrow();
    expect(validateFieldValue(field({ type: "phone", format: "E164" }), "+441234567890")).toEqual({ type: "phone", value: "+441234567890" });
    expect(() => validateFieldValue(field({ type: "phone", format: "E164" }), "01234 567890")).toThrow();
    expect(validateFieldValue(field({ type: "reference", entity: ref }), "native-ticket")).toEqual({ type: "reference", value: "native-ticket" });
    expect(() => validateFieldValue(field({ type: "reference", entity: ref }), { recordId: "native-ticket", organisationId: "other" })).toThrow();
    expect(validateFieldValue(field({ type: "address", countries: ["GB"] }), { line1: "1 Test Street", city: "London", country: "GB" })).toEqual({ type: "address", value: { line1: "1 Test Street", line2: "", city: "London", region: "", postalCode: "", country: "GB" } });
    expect(() => validateFieldValue(field({ type: "address", countries: ["GB"] }), { line1: "Test", city: "London", country: "US" })).toThrow("allowed country");
  });
  it("applies extra field rights independently of configuration and rejects unrestricted restricted fields", () => {
    const restricted = validateFieldConstraints(field({ type: "string" }, { classification: "restricted", readCapability: "tickets.private.read", writeCapability: "tickets.private.update" }));
    const session = { capabilities: new Set(["studio.definition.edit", "tickets.ticket.manage"]) } as Session;
    expect(() => assertFieldAccess(session, restricted, "read")).toThrow("tickets.private.read");
    session.capabilities.add("tickets.private.read");
    expect(() => assertFieldAccess(session, restricted, "write")).toThrow("tickets.private.update");
    session.capabilities.add("tickets.private.update"); expect(() => assertFieldAccess(session, restricted, "write")).not.toThrow();
    expect(() => validateFieldConstraints(field({ type: "string" }, { classification: "restricted" }))).toThrow("additional read capability");
    expect(() => validateFieldConstraints(field({ type: "address", countries: ["GB"] }, { unique: true }))).toThrow("scalar indexing");
  });
});
