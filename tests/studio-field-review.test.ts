import { expect, it } from "vitest";
import { customFieldPayloadSchema } from "@/core/studio/fields/schema";
import { assertFieldMigrationReviewUnchanged, fieldMigrationObservationDigest, readSealedFieldMigrationReview,
  sealFieldMigrationReview, sealFieldMigrationIntent, fieldMigrationIntentFromReview,
  type FieldMigrationObservation, type FieldMigrationReview } from "@/core/studio/fields/migrations/contracts";

const uuid = (n: number) => `00000000-0000-4000-8000-${n.toString().padStart(12, "0")}`;
const hash = (letter: string) => letter.repeat(64);
const entity = { id: "tickets.ticket", version: 2, schemaHash: hash("a"), contractHash: hash("b") };
const source = customFieldPayloadSchema.parse({ schemaVersion: 1, entity, storageGeneration: uuid(1),
  field: { key: "customer_detail", label: "Customer detail", classification: "confidential", storage: { type: "integer" } } });
const target = customFieldPayloadSchema.parse({ ...source, storageGeneration: uuid(2),
  field: { ...source.field, storage: { type: "decimal", precision: 28, scale: 10 } } });
function observation(recordId = "native_a"): FieldMigrationObservation {
  return { recordId, nativeRevision: 2, extension: null,
    result: { kind: "valid", targetFingerprint: hash("c"), isNull: true, lossy: false } };
}
function observed(rows: FieldMigrationObservation[] = [observation()]) {
  const stream = fieldMigrationObservationDigest(); rows.forEach(row => stream.append(row)); return stream.finish();
}
function review(): FieldMigrationReview {
  const cohort = observed();
  return { schemaVersion: 1, id: uuid(3), organisationId: "company", definitionId: uuid(4), definitionRevision: 5,
    principal: { authority: "customer", organisationId: "company", userId: "user", membershipId: "member", authVersion: 2, sessionVersion: 3 },
    source: { versionId: uuid(5), versionChecksum: hash("d"), payload: structuredClone(source) },
    target: { draftId: uuid(6), draftRevision: 6, compiledChecksum: hash("e"), payload: structuredClone(target) },
    conversion: { kind: "integer_to_decimal" },
    ownerQuery: { ...entity, id: "tickets.ticket.migration_cohort", version: 1 },
    cohort: { recordCount: cohort.recordCount, observationDigest: cohort.observationDigest },
    summary: cohort.summary };
}

it("preparation intent pins the same source/target/principal without accepting client summaries", () => {
  const input = review(), intent = fieldMigrationIntentFromReview(input);
  expect(sealFieldMigrationIntent(intent).intent).toEqual(intent);
  expect(intent).not.toHaveProperty("cohort"); expect(intent).not.toHaveProperty("summary");
  expect(() => sealFieldMigrationIntent(input)).toThrow("review is invalid");
  expect(() => sealFieldMigrationIntent({ ...intent, principal: { ...intent.principal, organisationId: "other" } })).toThrow("review is invalid");
  expect(() => sealFieldMigrationIntent({ ...intent, conversion: { kind: "same_type" } })).toThrow("review is invalid");
});

it("round trips complete server metadata without sharing mutable caller objects or storing business values", () => {
  const input = review(), saved = sealFieldMigrationReview(input), before = structuredClone(saved);
  expect(readSealedFieldMigrationReview(saved)).toEqual(saved);
  input.target.payload.field.label = "Changed";
  expect(saved).toEqual(before);
  expect(assertFieldMigrationReviewUnchanged(saved, before.review)).toEqual(before.review);
  expect(JSON.stringify(saved)).not.toContain("capabilities");
});

it("rejects integrity tampering and every material stale source, target, actor and cohort observation", () => {
  const saved = sealFieldMigrationReview(review());
  const changes: Array<(value: FieldMigrationReview) => void> = [
    v => { v.organisationId = "other"; v.principal.organisationId = "other"; },
    v => { v.definitionRevision++; }, v => { v.target.draftRevision++; },
    v => { v.target.draftId = uuid(20); }, v => { v.source.versionId = uuid(21); },
    v => { v.source.versionChecksum = hash("f"); }, v => { v.target.compiledChecksum = hash("f"); },
    v => { v.target.payload.field.label = "Another label"; },
    v => { v.principal.sessionVersion++; }, v => { v.principal.membershipId = "replacement"; },
    v => { v.cohort.observationDigest = hash("f"); }, v => { v.ownerQuery.contractHash = hash("f"); },
  ];
  for (const change of changes) {
    const fresh = structuredClone(saved.review); change(fresh);
    expect(() => readSealedFieldMigrationReview({ ...saved, review: fresh })).toThrow("stale or has changed");
    expect(() => assertFieldMigrationReviewUnchanged(saved, fresh)).toThrow("stale or has changed");
  }
});

it("rejects incomplete/defaulted metadata, foreign principals, false summary and executable conversion", () => {
  const base = review();
  const missingDefault = structuredClone(base) as unknown as { target: { payload: { field: { help?: string } } } };
  delete missingDefault.target.payload.field.help;
  for (const input of [missingDefault, { ...base, reviewed: true }, { ...base, summary: { ...base.summary, invalidCount: 1 } },
    { ...base, summary: { ...base.summary, lossyCount: 2 } },
    { ...base, principal: { ...base.principal, organisationId: "other" } },
    { ...base, principal: { ...base.principal, capabilities: ["studio.definition.publish"] } },
    { ...base, conversion: { kind: "integer_to_decimal", script: "arbitrary code" } }])
    expect(() => sealFieldMigrationReview(input)).toThrow("review is invalid");
});

it("requires a compatible new representation and binds exact support-audit identity", () => {
  const base = review();
  expect(() => sealFieldMigrationReview({ ...base, target: { ...base.target, payload: { ...target, storageGeneration: source.storageGeneration } } })).toThrow("review is invalid");
  expect(() => sealFieldMigrationReview({ ...base, target: { ...base.target, payload: structuredClone(source) }, conversion: { kind: "same_type" } })).toThrow("review is invalid");
  expect(() => sealFieldMigrationReview({ ...base, target: { ...base.target, payload: { ...target, field: { ...target.field, key: "different" } } } })).toThrow("review is invalid");
  expect(() => sealFieldMigrationReview({ ...base, conversion: { kind: "same_type" } })).toThrow("review is invalid");
  const principal = { ...base.principal, authority: "staff_support", auditId: "support-audit" };
  const saved = sealFieldMigrationReview({ ...base, principal });
  expect(() => assertFieldMigrationReviewUnchanged(saved, { ...saved.review, principal: { ...principal, auditId: "other-audit" } })).toThrow("stale or has changed");
  expect(() => sealFieldMigrationReview({ ...base, principal: { ...base.principal, authority: "staff_support" } })).toThrow("review is invalid");
});

it("digests absent anchors, empty slots and real immutable value observations without embedding values", () => {
  const absent = observation("a"), anchored: FieldMigrationObservation = { ...observation("b"),
    extension: { id: uuid(7), revision: 0, slot: null } },
  empty: FieldMigrationObservation = { ...observation("c"), extension: { id: uuid(8), revision: 0,
    slot: { id: uuid(9), revision: 0, value: null } } },
  stored: FieldMigrationObservation = { ...observation("d"), extension: { id: uuid(10), revision: 1,
    slot: { id: uuid(11), revision: 1, value: { id: uuid(12), versionId: uuid(5), revision: 1, fingerprint: hash("d") } } } };
  const rows = [absent, anchored, empty, stored];
  const result = observed(rows);
  expect(result).toMatchObject({ recordCount: 4, summary: { validCount: 4, invalidCount: 0, lossyCount: 0 } });
  expect(observed(structuredClone(rows))).toEqual(result);
  for (const change of [ { ...absent, nativeRevision: 3 }, { ...absent, recordId: "aa" },
    { ...absent, result: { ...absent.result, targetFingerprint: hash("f") } } as FieldMigrationObservation ])
    expect(observed([change, ...rows.slice(1)]).observationDigest).not.toBe(result.observationDigest);
  const changed = structuredClone(rows); changed[3].extension!.slot!.value!.fingerprint = hash("f");
  expect(observed(changed).observationDigest).not.toBe(result.observationDigest);
});

it("does not mistake equal counts for equal membership or ignore invalid/lossy records", () => {
  expect(observed([observation("a")]).observationDigest).not.toBe(observed([observation("b")]).observationDigest);
  const failed: FieldMigrationObservation = { ...observation("b"), result: { kind: "invalid", code: "INVALID_TARGET" } };
  const lossy: FieldMigrationObservation = { ...observation("c"), result: { kind: "valid", targetFingerprint: hash("f"), isNull: true, lossy: true } };
  expect(observed([observation("a"), failed, lossy])).toMatchObject({ recordCount: 3,
    summary: { validCount: 2, invalidCount: 1, lossyCount: 1 } });
  expect(observed([])).toMatchObject({ recordCount: 0, summary: { validCount: 0, invalidCount: 0, lossyCount: 0 } });
});

it("rejects duplicates, unordered traversal, extra values, mismatched revisions and reuse after finish", () => {
  const stream = fieldMigrationObservationDigest(); stream.append(observation("b"));
  for (const input of [observation("b"), observation("a"), { ...observation("c"), privateValue: "confidential" },
    { ...observation("c"), extension: { id: uuid(7), revision: 1, slot: { id: uuid(8), revision: 2, value: null } } },
    { ...observation("c"), extension: { id: uuid(7), revision: 1, slot: { id: uuid(8), revision: 2,
      value: { id: uuid(9), versionId: uuid(5), revision: 1, fingerprint: hash("a") } } } }])
    expect(() => stream.append(input)).toThrow("observation is invalid");
  expect(stream.finish().recordCount).toBe(1);
  expect(() => stream.append(observation("c"))).toThrow("observation is invalid");
  expect(() => stream.finish()).toThrow("observation is invalid");
});

it("redacts invalid and corrupt review errors without echoing record identities or source content", () => {
  for (const run of [() => sealFieldMigrationReview({ privateValue: "secret_customer_value" }),
    () => fieldMigrationObservationDigest().append({ recordId: "private_record", value: "secret_customer_value" }),
    () => readSealedFieldMigrationReview({ review: review(), checksum: "secret_customer_value" })]) {
    try { run(); throw new Error("Expected rejection"); }
    catch (error) {
      expect(String(error)).not.toContain("secret_customer_value"); expect(String(error)).not.toContain("private_record");
      expect(String(error)).toMatch(/review is invalid|observation is invalid/);
    }
  }
});
