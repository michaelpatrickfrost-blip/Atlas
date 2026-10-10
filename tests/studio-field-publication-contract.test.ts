import { expect, it } from "vitest";
import { checksum } from "@/core/studio/registry/contracts";
import { customFieldPayloadSchema } from "@/core/studio/fields/schema";
import { sealFieldMigrationReview } from "@/core/studio/fields/migrations/contracts";
import { reviewedFieldPublicationPin } from "@/core/studio/fields/migrations/publication-contract";
const uuid = (value: number) => `00000000-0000-4000-8000-${value.toString().padStart(12, "0")}`;
const entity = { id: "tickets.ticket", version: 2, schemaHash: "a".repeat(64), contractHash: "b".repeat(64) };
const source = customFieldPayloadSchema.parse({ schemaVersion: 1, entity, storageGeneration: uuid(1),
  field: { key: "extra", label: "Extra", classification: "confidential", storage: { type: "integer" } } });
const payload = customFieldPayloadSchema.parse({ ...source, storageGeneration: uuid(2), field: { ...source.field, storage: { type: "decimal" } } });
const plan = { kind: "customField", schemaVersion: 1, payload, dependencies: [] };
const target = { id: uuid(8), organisationId: "company", definitionId: uuid(4), version: 2, payload, compiledPlan: plan, checksum: checksum(plan) };
const review = () => sealFieldMigrationReview({ schemaVersion: 1, id: uuid(3), organisationId: "company", definitionId: uuid(4), definitionRevision: 7,
  principal: { organisationId: "company", userId: "actor", membershipId: "member", sessionVersion: 2, authVersion: 3, authority: "customer" },
  source: { versionId: uuid(5), versionChecksum: "c".repeat(64), payload: source },
  target: { draftId: uuid(6), draftRevision: 9, compiledChecksum: target.checksum, payload }, conversion: { kind: "integer_to_decimal" },
  ownerQuery: { id: "tickets.ticket.field_migration", version: 1, schemaHash: "d".repeat(64), contractHash: "e".repeat(64) },
  cohort: { recordCount: 2, observationDigest: "f".repeat(64) }, summary: { validCount: 2, invalidCount: 0, lossyCount: 0 } });

it("pins exact immutable reviewed target identity without granting activation or execution", () => {
  const sealed = review(), pin = reviewedFieldPublicationPin(sealed, target, "actor", false);
  expect(pin).toEqual({ preparationId: uuid(3), organisationId: "company", definitionId: uuid(4), reviewChecksum: sealed.checksum,
    sourceGenerationId: uuid(1), targetGenerationId: uuid(2), targetVersionId: uuid(8), targetVersionNumber: 2, targetChecksum: target.checksum,
    publisherUserId: "actor", acknowledgedLoss: false });
  expect(JSON.stringify(pin)).not.toContain("capabilities"); expect(pin).not.toHaveProperty("active");
});

it("rejects foreign identity, source reuse, changed payload/generation/plan, extra and defaulted metadata", () => {
  const withoutHelp = structuredClone(target) as unknown as { payload: { field: { help?: string } } };
  delete withoutHelp.payload.field.help;
  for (const value of [{ ...target, organisationId: "other" }, { ...target, definitionId: uuid(20) }, { ...target, id: uuid(5) },
    { ...target, checksum: "0".repeat(64) }, { ...target, compiledPlan: { ...plan, unexpected: true } },
    { ...target, payload: { ...payload, storageGeneration: uuid(20) } }, { ...target, payload: { ...payload, field: { ...payload.field, label: "Changed" } } },
    { ...target, active: true }, { ...target, version: 0 }, withoutHelp])
    expect(() => reviewedFieldPublicationPin(review(), value, "actor", false)).toThrow();
  expect(() => reviewedFieldPublicationPin(review(), target, "other", false)).toThrow("stale or has changed");
});

it("invalid review rows require resolution and another review, and losses require explicit acknowledgement", () => {
  const base = review();
  const invalid = sealFieldMigrationReview({ ...base.review, summary: { validCount: 1, invalidCount: 1, lossyCount: 0 } });
  expect(() => reviewedFieldPublicationPin(invalid, target, "actor", true)).toThrow("MIGRATION_INVALID_VALUES");
  const lossy = sealFieldMigrationReview({ ...base.review, summary: { validCount: 2, invalidCount: 0, lossyCount: 1 } });
  expect(() => reviewedFieldPublicationPin(lossy, target, "actor", false)).toThrow("MIGRATION_LOSS_ACKNOWLEDGEMENT_REQUIRED");
  expect(reviewedFieldPublicationPin(lossy, target, "actor", true).acknowledgedLoss).toBe(true);
  expect(() => reviewedFieldPublicationPin({ ...base, checksum: "0".repeat(64) }, target, "actor", false)).toThrow("stale or has changed");
});
