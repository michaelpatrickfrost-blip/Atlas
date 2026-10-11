import { createHash } from "node:crypto";
import { z } from "zod";
import { canonicalJson, checksum } from "../../registry/contracts";
import { referenceSchema } from "../../compiler/kernel";
import { customFieldPayloadSchema } from "../schema";
import { analyseFieldEvolution, createFieldConverter, fieldConversionSchema } from "../evolution";
import { fieldMigrationPrincipalSchema } from "../principal-contract";

const digest = z.string().regex(/^[a-f0-9]{64}$/);
const revision = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const positiveRevision = revision.min(1);
const recordId = z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/);
const valueObservation = z.strictObject({ id: z.uuid(), revision: positiveRevision,
  versionId: z.uuid(), fingerprint: digest });

/** Canonical references and revisions only; never a copy of business values. */
export const fieldMigrationObservationSchema = z.strictObject({
  recordId, nativeRevision: positiveRevision,
  extension: z.strictObject({ id: z.uuid(), revision,
    slot: z.strictObject({ id: z.uuid(), revision, value: valueObservation.nullable() }).nullable(),
  }).nullable(),
  result: z.discriminatedUnion("kind", [
    z.strictObject({ kind: z.literal("valid"), targetFingerprint: digest, isNull: z.boolean(), lossy: z.boolean() }),
    z.strictObject({ kind: z.literal("invalid"), code: z.enum([
      "INVALID_SOURCE", "INVALID_TARGET", "UNMAPPED_VALUE", "LOSS_REQUIRES_REVIEW", "FIELD_STORAGE_INVALID",
    ]) }),
  ]),
}).superRefine((row, ctx) => {
  const slot = row.extension?.slot;
  if (slot && (slot.value ? slot.revision !== slot.value.revision : slot.revision !== 0))
    ctx.addIssue({ code: "custom", message: "The observed slot must match its current immutable value revision." });
});
export type FieldMigrationObservation = z.infer<typeof fieldMigrationObservationSchema>;

const intentShape = {
  schemaVersion: z.literal(1), id: z.uuid(), organisationId: z.string().min(1).max(100),
  definitionId: z.uuid(), definitionRevision: revision,
  principal: fieldMigrationPrincipalSchema,
  source: z.strictObject({ versionId: z.uuid(), versionChecksum: digest, payload: customFieldPayloadSchema }),
  target: z.strictObject({ draftId: z.uuid(), draftRevision: revision, compiledChecksum: digest, payload: customFieldPayloadSchema }),
  conversion: fieldConversionSchema,
  ownerQuery: referenceSchema,
};
export const fieldMigrationIntentSchema = z.strictObject(intentShape);
export type FieldMigrationIntent = z.infer<typeof fieldMigrationIntentSchema>;
export type SealedFieldMigrationIntent = { intent: FieldMigrationIntent; checksum: string };
const reviewSchema = z.strictObject({
  ...intentShape,
  cohort: z.strictObject({ recordCount: revision, observationDigest: digest }),
  summary: z.strictObject({ validCount: revision, invalidCount: revision, lossyCount: revision }),
}).superRefine((review, ctx) => {
  if (review.principal.organisationId !== review.organisationId)
    ctx.addIssue({ code: "custom", message: "Review and principal must belong to the same company." });
  if (review.summary.validCount + review.summary.invalidCount !== review.cohort.recordCount
    || review.summary.lossyCount > review.summary.validCount)
    ctx.addIssue({ code: "custom", message: "Review summary must cover its exact observed cohort." });
});
export type FieldMigrationReview = z.infer<typeof reviewSchema>;
export type SealedFieldMigrationReview = { review: FieldMigrationReview; checksum: string };

export class FieldMigrationReviewError extends Error {
  constructor(public readonly code: "REVIEW_INVALID" | "REVIEW_CHANGED" | "OBSERVATION_INVALID") {
    super({ REVIEW_INVALID: "The field migration review is invalid.", REVIEW_CHANGED: "The reviewed field change is stale or has changed; review it again.",
      OBSERVATION_INVALID: "The field migration observation is invalid." }[code]);
    this.name = "FieldMigrationReviewError";
  }
}

function checkedIntent(input: unknown): FieldMigrationIntent {
  try {
    const intent = fieldMigrationIntentSchema.parse(input);
    // Persist only complete normalised metadata; default insertion must not make
    // a different historic payload appear to have the same integrity checksum.
    if (canonicalJson(input) !== canonicalJson(intent) || intent.organisationId !== intent.principal.organisationId)
      throw new Error("Noncanonical or foreign intent");
    const analysis = analyseFieldEvolution(intent.source.payload, intent.target.payload);
    if (analysis.kind !== "migration" || intent.source.payload.storageGeneration === intent.target.payload.storageGeneration)
      throw new Error("Use ordinary publication for presentation changes");
    createFieldConverter(intent.source.payload, intent.target.payload, intent.conversion);
    return intent;
  } catch { throw new FieldMigrationReviewError("REVIEW_INVALID"); }
}

/** Pure identity validation; no owner access, persistence or execution authority. */
export function sealFieldMigrationIntent(input: unknown): SealedFieldMigrationIntent {
  const intent = checkedIntent(input);
  return { intent, checksum: checksum(intent) };
}

export function fieldMigrationIntentFromReview(review: FieldMigrationReview): FieldMigrationIntent {
  return checkedIntent(Object.fromEntries(Object.keys(intentShape).map(key => [key, review[key as keyof FieldMigrationReview]])));
}

function checkedReview(input: unknown): FieldMigrationReview {
  try {
    const review = reviewSchema.parse(input);
    if (canonicalJson(input) !== canonicalJson(review)) throw new Error("Noncanonical review");
    fieldMigrationIntentFromReview(review);
    return review;
  } catch { throw new FieldMigrationReviewError("REVIEW_INVALID"); }
}

/** Called with server-collected evidence only. A checksum never grants authority. */
export function sealFieldMigrationReview(input: unknown): SealedFieldMigrationReview {
  const review = checkedReview(input);
  return { review, checksum: checksum(review) };
}

/** Integrity only: callers must reload tenant-owned review, source and authority. */
export function readSealedFieldMigrationReview(input: unknown): SealedFieldMigrationReview {
  const sealed = z.strictObject({ review: z.unknown(), checksum: digest }).safeParse(input);
  if (!sealed.success) throw new FieldMigrationReviewError("REVIEW_INVALID");
  const review = checkedReview(sealed.data.review);
  if (checksum(review) !== sealed.data.checksum) throw new FieldMigrationReviewError("REVIEW_CHANGED");
  return { review, checksum: sealed.data.checksum };
}

/** Bind a stored review to the freshly reloaded server snapshot, never client data. */
export function assertFieldMigrationReviewUnchanged(stored: unknown, current: unknown) {
  const sealed = readSealedFieldMigrationReview(stored), fresh = sealFieldMigrationReview(current);
  if (sealed.checksum !== fresh.checksum) throw new FieldMigrationReviewError("REVIEW_CHANGED");
  return sealed.review;
}

/** Bounded-memory digest over owner-approved rows ordered by canonical record ID.
 * Order/count alone are not owner coverage proof; cutover still checks exact sets.
 */
export function fieldMigrationObservationDigest() {
  const hash = createHash("sha256").update("atlas.studio.field-observations@1\n");
  let lastId: string | null = null, recordCount = 0, validCount = 0, invalidCount = 0, lossyCount = 0, finished = false;
  return {
    append(input: unknown) {
      if (finished) throw new FieldMigrationReviewError("OBSERVATION_INVALID");
      const result = fieldMigrationObservationSchema.safeParse(input);
      if (!result.success || canonicalJson(input) !== canonicalJson(result.data)) throw new FieldMigrationReviewError("OBSERVATION_INVALID");
      const row = result.data;
      if ((lastId !== null && row.recordId <= lastId) || recordCount === Number.MAX_SAFE_INTEGER)
        throw new FieldMigrationReviewError("OBSERVATION_INVALID");
      // Strict fields cannot contain newlines in IDs, and JSON frames each row.
      hash.update(canonicalJson(row)).update("\n");
      lastId = row.recordId; recordCount++;
      if (row.result.kind === "valid") { validCount++; if (row.result.lossy) lossyCount++; }
      else invalidCount++;
    },
    finish() {
      if (finished) throw new FieldMigrationReviewError("OBSERVATION_INVALID");
      finished = true;
      return { recordCount, observationDigest: hash.digest("hex"), summary: { validCount, invalidCount, lossyCount } };
    },
  };
}
