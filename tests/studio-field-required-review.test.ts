import { expect, it } from "vitest";
import { customFieldPayloadSchema } from "@/core/studio/fields/schema";
import { conditionalFieldPayloadSchema } from "@/core/studio/fields/required-contract";
import { fieldMigrationObservationDigest, sealFieldMigrationIntent, readSealedFieldMigrationReview } from "@/core/studio/fields/migrations/contracts";
import { requiredFieldMigrationObservationSchema, requiredFieldMigrationObservationDigest,
  sealRequiredFieldMigrationIntent, sealRequiredFieldMigrationReview, readSealedRequiredFieldMigrationReview,
  requiredFieldMigrationIntentFromReview, type RequiredFieldMigrationIntent, type RequiredFieldMigrationObservation } from "@/core/studio/fields/migrations/required-contracts";

const uuid = (n: number) => `00000000-0000-4000-8000-${n.toString().padStart(12, "0")}`;
const hash = (letter: string) => letter.repeat(64);
const entity = { id: "tickets.ticket", version: 8, schemaHash: hash("a"), contractHash: hash("b") };
const source = customFieldPayloadSchema.parse({ schemaVersion: 1, entity, storageGeneration: uuid(1),
  field: { key: "resolution_detail", label: "Resolution detail", classification: "confidential", storage: { type: "boolean" } } });
const target = conditionalFieldPayloadSchema.parse({ ...source, schemaVersion: 2, storageGeneration: uuid(2),
  requiredIf: { match: "all", predicates: [{ operator: "equals", source: { kind: "native", fieldId: "status" }, value: { type: "enum", value: "RESOLVED" } }] } });
function intent(): RequiredFieldMigrationIntent {
  return { schemaVersion: 2, id: uuid(3), organisationId: "company", definitionId: uuid(4), definitionRevision: 1,
    principal: { authority: "customer", organisationId: "company", userId: "user", membershipId: "member", authVersion: 1, sessionVersion: 2 },
    source: { versionId: uuid(5), versionChecksum: hash("c"), payload: structuredClone(source) },
    target: { draftId: uuid(6), draftRevision: 1, compiledChecksum: hash("d"), payload: structuredClone(target) },
    conversion: { kind: "same_type" }, ownerQuery: { ...entity, id: "tickets.ticket.field_migration", version: 4 } };
}
function row(recordId = "native_a"): RequiredFieldMigrationObservation {
  return { recordId, nativeRevision: 2, extension: null,
    requirement: { sourceEvaluationChecksum: hash("e"), targetEvaluationChecksum: hash("f"), targetRequired: true },
    result: { kind: "valid", targetFingerprint: hash("c"), isNull: false, lossy: false } };
}
function review() {
  const stream = requiredFieldMigrationObservationDigest(); stream.append(row()); const aggregate = stream.finish();
  return { ...intent(), cohort: { recordCount: aggregate.recordCount, observationDigest: aggregate.observationDigest }, summary: aggregate.summary };
}

it("seals exact normalised v2 intent/review without retaining caller mutations or granting old protocol access", () => {
  const input = review(), packet = sealRequiredFieldMigrationReview(input), before = structuredClone(packet);
  expect(readSealedRequiredFieldMigrationReview(packet)).toEqual(packet);
  expect(sealRequiredFieldMigrationIntent(requiredFieldMigrationIntentFromReview(packet.review)).intent).toEqual(intent());
  input.target.payload.field.label = "Another label";
  expect(packet).toEqual(before);
  expect(() => readSealedFieldMigrationReview(packet)).toThrow("review is invalid");
  expect(() => sealFieldMigrationIntent(intent())).toThrow("review is invalid");
  expect(() => sealFieldMigrationIntent({ ...intent(), schemaVersion: 1 })).toThrow("review is invalid");
});

it("permits reviewed addition, change and removal while refusing same-generation or v1-only v2 packets", () => {
  expect(sealRequiredFieldMigrationIntent(intent()).intent.target.payload.schemaVersion).toBe(2);
  const base = intent();
  expect(sealRequiredFieldMigrationIntent({ ...base, source: { ...base.source, payload: { ...target, storageGeneration: uuid(1) } },
    target: { ...base.target, payload: { ...source, storageGeneration: uuid(2) } } }).intent.target.payload.schemaVersion).toBe(1);
  expect(() => sealRequiredFieldMigrationIntent({ ...base, target: { ...base.target, payload: { ...target, storageGeneration: source.storageGeneration } } })).toThrow("review is invalid");
  expect(() => sealRequiredFieldMigrationIntent({ ...base, target: { ...base.target, payload: { ...source, storageGeneration: uuid(2) } } })).toThrow("review is invalid");
  expect(() => sealRequiredFieldMigrationIntent({ ...base, conversion: { kind: "integer_to_decimal" } })).toThrow("review is invalid");
});

it("rejects default insertion, foreign identities, executable fields and incomplete summaries", () => {
  const base = intent(), missing = structuredClone(base) as unknown as { target: { payload: { field: { help?: string } } } };
  delete missing.target.payload.field.help;
  for (const input of [missing, { ...base, schemaVersion: 3 }, { ...base, organisationId: "foreign" },
    { ...base, target: { ...base.target, payload: { ...target, field: { ...target.field, key: "replacement" } } } },
    { ...base, principal: { ...base.principal, capabilities: ["studio.definition.publish"] } },
    { ...base, conversion: { kind: "same_type", script: "return value" } }])
    expect(() => sealRequiredFieldMigrationIntent(input)).toThrow("review is invalid");
  expect(() => sealRequiredFieldMigrationReview({ ...review(), summary: { validCount: 1, invalidCount: 1, lossyCount: 0 } })).toThrow("review is invalid");
  expect(() => sealRequiredFieldMigrationReview({ ...review(), summary: { validCount: 1, invalidCount: 0, lossyCount: 2 } })).toThrow("review is invalid");
});

it("binds condition, immutable source/target versions, query, principal and cohort against tampering", () => {
  const saved = sealRequiredFieldMigrationReview(review());
  const changes: Array<(input: typeof saved.review) => void> = [
    input => { input.definitionRevision++; }, input => { input.source.versionChecksum = hash("d"); },
    input => { input.target.compiledChecksum = hash("e"); }, input => { input.principal.sessionVersion++; },
    input => { input.ownerQuery.contractHash = hash("c"); }, input => { input.cohort.observationDigest = hash("a"); },
    input => { if (input.target.payload.schemaVersion === 2) input.target.payload.requiredIf.match = "any"; },
  ];
  for (const change of changes) {
    const altered = structuredClone(saved.review); change(altered);
    expect(() => readSealedRequiredFieldMigrationReview({ ...saved, review: altered })).toThrow("stale or has changed");
  }
});

it("represents missing evaluated required targets as invalid, while optional absence is valid", () => {
  const valid = row(); expect(requiredFieldMigrationObservationSchema.parse(valid)).toEqual(valid);
  expect(() => requiredFieldMigrationObservationSchema.parse({ ...valid, result: { ...valid.result, kind: "valid", isNull: true } })).toThrow("evaluated target requirement");
  const failure = { ...valid, result: { kind: "invalid", code: "FIELD_REQUIRED" } };
  expect(requiredFieldMigrationObservationSchema.parse(failure).result).toEqual({ kind: "invalid", code: "FIELD_REQUIRED" });
  expect(() => requiredFieldMigrationObservationSchema.parse({ ...failure, requirement: { ...valid.requirement, targetRequired: false } })).toThrow("evaluated target requirement");
  expect(requiredFieldMigrationObservationSchema.parse({ ...valid, requirement: { ...valid.requirement, targetRequired: false },
    result: { kind: "valid", targetFingerprint: hash("c"), isNull: true, lossy: false } }).result.kind).toBe("valid");
});

it("keeps observations free of business facts/values and validates immutable slot references", () => {
  const valid = row();
  for (const changed of [{ ...valid, facts: { status: "RESOLVED" } },
    { ...valid, requirement: { ...valid.requirement, targetValue: false } },
    { ...valid, requirement: { ...valid.requirement, targetEvaluationChecksum: "invalid" } },
    { ...valid, extension: { id: uuid(7), revision: 2, slot: { id: uuid(8), revision: 2,
      value: { id: uuid(9), revision: 1, versionId: uuid(5), fingerprint: hash("a") } } } }])
    expect(() => requiredFieldMigrationObservationSchema.parse(changed)).toThrow();
});

it("digests the exact ordered cohort and requirement evidence with bounded memory and a distinct version frame", () => {
  const digestRows = (rows: RequiredFieldMigrationObservation[]) => {
    const stream = requiredFieldMigrationObservationDigest(); rows.forEach(value => stream.append(value)); return stream.finish();
  };
  const valid = row("a"), invalid: RequiredFieldMigrationObservation = { ...row("b"), result: { kind: "invalid", code: "FIELD_REQUIRED" } };
  expect(digestRows([valid, invalid])).toMatchObject({ recordCount: 2, summary: { validCount: 1, invalidCount: 1, lossyCount: 0 } });
  expect(digestRows([valid])).toEqual(digestRows([structuredClone(valid)]));
  for (const altered of [{ ...valid, requirement: { ...valid.requirement, targetEvaluationChecksum: hash("a") } },
    { ...valid, requirement: { ...valid.requirement, sourceEvaluationChecksum: hash("b") } }, { ...valid, nativeRevision: 3 }])
    expect(digestRows([altered]).observationDigest).not.toBe(digestRows([valid]).observationDigest);
  const old = fieldMigrationObservationDigest(); const { requirement, ...oldRow } = valid; void requirement; old.append(oldRow);
  expect(old.finish().observationDigest).not.toBe(digestRows([valid]).observationDigest);
  expect(() => digestRows([valid, valid])).toThrow("observation is invalid");
  expect(() => digestRows([invalid, valid])).toThrow("observation is invalid");
  const closed = requiredFieldMigrationObservationDigest(); closed.finish();
  expect(() => closed.append(valid)).toThrow("observation is invalid");
  expect(() => closed.finish()).toThrow("observation is invalid");
});
