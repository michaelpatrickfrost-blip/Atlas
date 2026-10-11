import { beforeEach, expect, it } from "vitest";
import type { Prisma } from "@/generated/prisma/client";
import { retainedCutoverFixture } from "./fixtures/studio-field-cutover";
import { checksum } from "@/core/studio/registry/contracts";
import { readStoredFieldMigrationIntent, readStoredFieldMigrationReview } from "@/core/studio/fields/migrations/stored-protocol";
import { sealRequiredFieldMigrationIntent, sealRequiredFieldMigrationReview } from "@/core/studio/fields/migrations/required-contracts";
import { conditionalFieldPayloadSchema } from "@/core/studio/fields/required-contract";
let f: Awaited<ReturnType<typeof retainedCutoverFixture>>;
beforeEach(async () => { f = await retainedCutoverFixture(); });
function required() {
  const base = f.intent;
  const payload = conditionalFieldPayloadSchema.parse({ ...base.target.payload, schemaVersion: 2,
    requiredIf: { match: "all", predicates: [{ source: { kind: "native", fieldId: "status" }, operator: "present" }] } });
  return sealRequiredFieldMigrationIntent({ ...base, schemaVersion: 2, target: { ...base.target, payload } });
}
function savedIntent(sealed = { intent: f.intent, checksum: checksum(f.intent) }) {
  return { id: sealed.intent.id, organisationId: "company", intent: sealed.intent as unknown as Prisma.JsonValue, intentChecksum: sealed.checksum };
}
function savedReview() {
  return { id: f.stored.review.id, organisationId: "company", definitionId: f.intent.definitionId,
    review: f.stored.review as unknown as Prisma.JsonValue, checksum: f.stored.checksum };
}
it("selects only the stored closed format, retaining exact legacy intent and review hashes", () => {
  expect(readStoredFieldMigrationIntent(savedIntent(), "company")).toEqual({ intent: f.intent, checksum: checksum(f.intent) });
  expect(readStoredFieldMigrationReview(savedReview(), "company")).toEqual(f.stored);
  const modern = required(), saved = { id: modern.intent.id, organisationId: "company", intent: modern.intent as unknown as Prisma.JsonValue, intentChecksum: modern.checksum, schemaVersion: 1 };
  expect(readStoredFieldMigrationIntent(saved, "company")).toEqual(modern);
});
it("reads version2 review integrity without changing retained version1 history or granting an owner protocol", () => {
  const modern = required(), review = sealRequiredFieldMigrationReview({ ...modern.intent, cohort: f.stored.review.cohort, summary: f.stored.review.summary });
  expect(readStoredFieldMigrationReview({ id: review.review.id, organisationId: "company", definitionId: modern.intent.definitionId,
    review: review.review as unknown as Prisma.JsonValue, checksum: review.checksum }, "company")).toEqual(review);
  expect(readStoredFieldMigrationReview(savedReview(), "company")).toEqual(f.stored);
});
it("rejects missing, unknown and coerced stored format headers with no legacy fallback", () => {
  for (const schemaVersion of [undefined, 0, 3, "1", "2", null]) {
    const intent = schemaVersion === undefined ? Object.fromEntries(Object.entries(f.intent).filter(([key]) => key !== "schemaVersion")) : { ...f.intent, schemaVersion };
    const review = schemaVersion === undefined ? Object.fromEntries(Object.entries(f.stored.review).filter(([key]) => key !== "schemaVersion")) : { ...f.stored.review, schemaVersion };
    expect(() => readStoredFieldMigrationIntent({ ...savedIntent(), intent: intent as unknown as Prisma.JsonValue, intentChecksum: checksum(intent) }, "company")).toThrow("review is invalid");
    expect(() => readStoredFieldMigrationReview({ ...savedReview(), review: review as unknown as Prisma.JsonValue, checksum: checksum(review) }, "company")).toThrow("review is invalid");
  }
});
it("requires the server row, packet and authenticated tenant to agree on exact identity and integrity", () => {
  const saved = savedIntent();
  for (const row of [{ ...saved, organisationId: "foreign" }, { ...saved, id: f.intent.definitionId }, { ...saved, intentChecksum: "f".repeat(64) }])
    expect(() => readStoredFieldMigrationIntent(row, "company")).toThrow("stale or has changed");
  expect(() => readStoredFieldMigrationIntent(saved, "foreign")).toThrow("stale or has changed");
  const review = savedReview();
  for (const row of [{ ...review, organisationId: "foreign" }, { ...review, id: f.intent.definitionId }, { ...review, definitionId: f.intent.id }, { ...review, checksum: "f".repeat(64) }])
    expect(() => readStoredFieldMigrationReview(row, "company")).toThrow("stale or has changed");
});
it("retains full canonical/default/extra-field checks inside the selected parser", () => {
  const missing = structuredClone(f.intent) as unknown as { source: { payload: { field: { help?: string } } } };
  delete missing.source.payload.field.help;
  for (const intent of [missing, { ...f.intent, suppliedFacts: { status: "RESOLVED" } }, { ...required().intent, executionApproved: true },
    { ...required().intent, source: f.intent.source, target: f.intent.target }]) {
    expect(() => readStoredFieldMigrationIntent({ ...savedIntent(), intent: intent as unknown as Prisma.JsonValue, intentChecksum: checksum(intent) }, "company")).toThrow("review is invalid");
  }
});
it("returns parsed copies so subsequent caller mutation cannot alter selected immutable evidence", () => {
  const modern = required(), row = { id: modern.intent.id, organisationId: "company", intent: modern.intent as unknown as Prisma.JsonValue, intentChecksum: modern.checksum };
  const result = readStoredFieldMigrationIntent(row, "company"), before = structuredClone(result);
  modern.intent.target.payload.field.label = "Changed after inspection";
  expect(result).toEqual(before);
});
