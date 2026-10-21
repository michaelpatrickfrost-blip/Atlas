import { describe, expect, it } from "vitest";
import {
  configurationReferenceSchema, entityProfilePayloadSchema, recordTypePayloadSchema,
  normaliseConfigurationReferences, resolveEntityProfile, resolvePinnedEntityProfile,
  resolveRecordTypeProfile, type ConfigurationReference,
} from "@/core/studio/record-types";

// Pure contract/resolution tests. Fixtures are metadata pins, not proof of a real
// tenant, published checksum, owner access, SQL association or required coverage.
const uuid = (n: number) => `10000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const hash = "a".repeat(64);
const entity = { id: "tickets.ticket", version: 9, schemaHash: hash, contractHash: "b".repeat(64) };
const pin = (kind: ConfigurationReference["kind"], n: number) => ({ kind, definitionId: uuid(n), versionId: uuid(n + 1000), schemaVersion: 1, checksum: hash });
const basePin = pin("entityProfile", 1), typePin = pin("recordType", 2);
const page = pin("page", 3), fieldA = pin("customField", 4), fieldB = pin("customField", 5);
const process = pin("process", 6), decision = pin("decision", 7);
const base = (profile: object = {}) => ({ schemaVersion: 1, entity, profile });
const overlay = (patch: object = {}) => ({ schemaVersion: 1, entity, baseProfile: basePin, label: "Complaint", help: "Track customer complaints", overlay: patch });
const baseVersion = (profile: object = {}) => ({ reference: basePin, payload: base(profile) });
const typeVersion = (patch: object = {}) => ({ reference: typePin, payload: overlay(patch) });

describe("one record-type profile overlay", () => {
  it("preserves canonical behavior without metadata and materializes an empty base without inventing fields", () => {
    expect(resolveEntityProfile(null)).toBeNull();
    expect(resolvePinnedEntityProfile(null)).toBeNull();
    const result = resolveEntityProfile(base());
    expect(result).toEqual({ entity, profile: { page: null, requiredFields: [], allowedProcesses: [], defaultDecisions: [] }, configurationDependencies: [], registryDependencies: [entity] });
    expect(() => resolveEntityProfile(null, [overlay()])).toThrow(/base/);
  });

  it("inherits absent properties and explicitly replaces page/process/decision choices while adding required fields", () => {
    const originalPage = pin("page", 10), replacement = pin("page", 11);
    const original = baseVersion({ page: originalPage, requiredFields: [fieldA], allowedProcesses: [process], defaultDecisions: [{ key: "routing", decision }] });
    const result = resolvePinnedEntityProfile(original, [typeVersion({ page: replacement, requiredFields: [fieldB, fieldA], allowedProcesses: [], defaultDecisions: [] })]);
    expect(result?.profile).toEqual({ page: replacement, requiredFields: [fieldA, fieldB], allowedProcesses: [], defaultDecisions: [] });
    expect(result?.configurationDependencies).toEqual([basePin, fieldA, fieldB, replacement]);
    expect(result?.configurationDependencies).not.toContainEqual(typePin);
    expect(resolvePinnedEntityProfile(original, [typeVersion()])?.profile).toEqual(original.payload.profile);
    expect(resolvePinnedEntityProfile(original, [typeVersion({ page: null, requiredFields: [] })])?.profile.requiredFields).toEqual([fieldA]);
    expect(resolvePinnedEntityProfile(original, [typeVersion({ page: null })])?.profile.page).toBeNull();
  });

  it("is invariant to unordered selections, clones inputs and emits deterministic exact dependency order", () => {
    const secondProcess = pin("process", 12), secondDecision = pin("decision", 13);
    const defaultDecisions = [{ key: "zebra", decision: secondDecision }, { key: "alpha", decision }];
    const input = base({ requiredFields: [fieldB, fieldA], allowedProcesses: [secondProcess, process], defaultDecisions });
    const saved = structuredClone(input), result = resolveEntityProfile(input);
    const reordered = base({ requiredFields: [fieldA, fieldB], allowedProcesses: [process, secondProcess], defaultDecisions: [...defaultDecisions].reverse() });
    expect(resolveEntityProfile(reordered)).toEqual(result);
    expect(input).toEqual(saved);
    expect(result?.profile.defaultDecisions.map(selection => selection.key)).toEqual(["alpha", "zebra"]);
    if (result) result.profile.requiredFields[0].checksum = "c".repeat(64);
    expect(input).toEqual(saved);
  });

  it("requires exactly one overlay with the exact base entity registry version/schema/contract", () => {
    expect(() => resolveEntityProfile(base(), [overlay(), overlay()])).toThrow(/one/);
    for (const change of [{ id: "sales.order" }, { version: 8 }, { schemaHash: "c".repeat(64) }, { contractHash: "c".repeat(64) }]) {
      expect(() => resolveEntityProfile(base(), [{ ...overlay(), entity: { ...entity, ...change } }])).toThrow(/exact base entity/);
    }
  });

  it("rejects stale/repointed/coerced base pins and validates uppercase UUIDs canonically", () => {
    for (const change of [{ definitionId: uuid(20) }, { versionId: uuid(20) }, { checksum: "c".repeat(64) }, { schemaVersion: 2 }, { kind: "recordType" }]) {
      expect(() => resolveRecordTypeProfile(baseVersion(), { ...overlay(), baseProfile: { ...basePin, ...change } }, typePin.definitionId)).toThrow();
    }
    expect(configurationReferenceSchema.parse({ ...page, definitionId: "ABCDEF00-0000-4000-8000-000000000001" }).definitionId).toBe("abcdef00-0000-4000-8000-000000000001");
    expect(() => configurationReferenceSchema.parse({ ...page, schemaVersion: "1" })).toThrow();
    expect(() => configurationReferenceSchema.parse({ ...page, checksum: hash.toUpperCase() })).toThrow();
  });

  it("rejects duplicate assignments/decision keys and conflicts between inherited and additional requirements", () => {
    expect(() => resolveEntityProfile(base({ requiredFields: [fieldA, fieldA] }))).toThrow(/Duplicate/);
    expect(() => resolveEntityProfile(base(), [overlay({ requiredFields: [fieldB, fieldB] })])).toThrow(/Duplicate/);
    expect(() => resolveEntityProfile(base({ allowedProcesses: [process, process] }))).toThrow(/Duplicate/);
    expect(() => resolveEntityProfile(base({ defaultDecisions: [{ key: "routing", decision }, { key: "routing", decision }] }))).toThrow(/Duplicate/);
    expect(() => resolveEntityProfile(base({ requiredFields: [fieldA] }), [overlay({ requiredFields: [{ ...fieldA, versionId: uuid(30) }] })])).toThrow(/Conflicting/);
    expect(() => resolveEntityProfile(base({ requiredFields: [fieldA] }), [overlay({ requiredFields: [{ ...fieldA, checksum: "c".repeat(64) }] })])).toThrow(/Conflicting/);
  });

  it("rejects conflicting cross-property identities and reused version UUIDs instead of silent order-dependent merges", () => {
    expect(() => resolveEntityProfile(base({ page: { ...page, definitionId: fieldA.definitionId }, requiredFields: [fieldA] }))).toThrow(/Conflicting/);
    expect(() => normaliseConfigurationReferences([page, { ...fieldA, versionId: page.versionId }])).toThrow(/Conflicting/);
    expect(() => normaliseConfigurationReferences([page, { ...page, schemaVersion: 2 }])).toThrow(/Conflicting/);
    expect(() => normaliseConfigurationReferences([page, { ...page, checksum: "c".repeat(64) }])).toThrow(/Conflicting/);
    expect(normaliseConfigurationReferences([decision, decision])).toEqual([decision]);
  });

  it("rejects direct self/cross cycles and deeper inheritance structurally", () => {
    expect(() => resolvePinnedEntityProfile(baseVersion({ page: { ...page, definitionId: basePin.definitionId } }))).toThrow(/cycle/);
    expect(() => resolvePinnedEntityProfile(baseVersion(), [{ ...typeVersion(), reference: { ...typePin, definitionId: basePin.definitionId } }])).toThrow(/cycle/);
    expect(() => resolvePinnedEntityProfile(baseVersion(), [typeVersion({ page: { ...page, definitionId: typePin.definitionId } })])).toThrow(/cycle/);
    expect(() => entityProfilePayloadSchema.parse({ ...base(), extends: basePin })).toThrow();
    expect(() => recordTypePayloadSchema.parse({ ...overlay(), parentRecordType: typePin })).toThrow();
    expect(() => resolvePinnedEntityProfile({ ...baseVersion(), payload: { ...base(), parent: typePin } }, [typeVersion()])).toThrow();
    expect(() => resolveRecordTypeProfile(baseVersion(), overlay(), "not-a-uuid")).toThrow();
  });

  it("enforces combined field bounds after additive union, not just bounds of each separately", () => {
    const fields = Array.from({ length: 100 }, (_, i) => pin("customField", i + 100));
    expect(resolveEntityProfile(base({ requiredFields: fields }), [overlay({ requiredFields: [fields[0]] })])?.profile.requiredFields).toHaveLength(100);
    expect(() => resolveEntityProfile(base({ requiredFields: fields }), [overlay({ requiredFields: [fieldA] })])).toThrow();
    expect(() => entityProfilePayloadSchema.parse(base({ allowedProcesses: Array.from({ length: 51 }, (_, i) => pin("process", i + 300)) }))).toThrow();
    expect(() => normaliseConfigurationReferences(Array(203).fill(page))).toThrow(/many/);
  });

  it("has closed metadata shapes with human labels/help and no tenant/security/script/personalization authority", () => {
    expect(recordTypePayloadSchema.parse({ ...overlay(), label: "  Complaint  " }).label).toBe("Complaint");
    for (const label of [" ", "x".repeat(101)]) expect(() => recordTypePayloadSchema.parse({ ...overlay(), label })).toThrow();
    expect(() => recordTypePayloadSchema.parse({ ...overlay(), help: "x".repeat(501) })).toThrow();
    for (const property of ["organisationId", "capabilities", "script", "sql", "userId", "department", "site"]) {
      expect(() => entityProfilePayloadSchema.parse({ ...base(), [property]: "untrusted" })).toThrow();
      expect(() => recordTypePayloadSchema.parse(overlay({ [property]: "untrusted" }))).toThrow();
    }
    expect(() => recordTypePayloadSchema.parse(overlay({ requiredFields: [{ ...fieldA, kind: "page" }] }))).toThrow();
    expect(() => recordTypePayloadSchema.parse(overlay({ requiredFields: [{ ...fieldA, schemaVersion: 3 }] }))).toThrow();
  });

  it("retains later-phase pins as metadata without invoking providers or representing executable plans", () => {
    const result = resolveEntityProfile(base({ allowedProcesses: [process], defaultDecisions: [{ key: "routing", decision }, { key: "priority", decision }] }));
    expect(result?.configurationDependencies).toEqual([process, decision]);
    expect(result).not.toHaveProperty("execute");
    expect(result).not.toHaveProperty("organisationId");
    expect(result?.registryDependencies).toEqual([entity]);
    expect(() => configurationReferenceSchema.parse({ ...page, kind: "flow" })).toThrow();
    expect(() => configurationReferenceSchema.parse({ ...page, kind: "capabilitySet" })).toThrow();
  });
});
