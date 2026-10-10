import { createHash } from "node:crypto";
import { z } from "zod";
import { canonicalJson, checksum } from "../../registry/contracts";
import { versionedFieldPayloadSchema } from "../required-contract";
import { analyseRequiredFieldEvolution, createFieldConverter } from "../evolution";
import { fieldMigrationIntentSchema, fieldMigrationObservationSchema, FieldMigrationReviewError } from "./contracts";

const digest = z.string().regex(/^[a-f0-9]{64}$/);
const count = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const intentShape = {
  ...fieldMigrationIntentSchema.shape,
  schemaVersion: z.literal(2),
  source: fieldMigrationIntentSchema.shape.source.extend({ payload: versionedFieldPayloadSchema }),
  target: fieldMigrationIntentSchema.shape.target.extend({ payload: versionedFieldPayloadSchema }),
};

/** Upcoming explicit protocol version, never passed to the old v1 service or
 * SQL guards. Pure integrity is not business-value or execution authority. */
export const requiredFieldMigrationIntentSchema = z.strictObject(intentShape);
export type RequiredFieldMigrationIntent = z.infer<typeof requiredFieldMigrationIntentSchema>;

function invalid(): never { throw new FieldMigrationReviewError("REVIEW_INVALID"); }
function checkedIntent(input: unknown): RequiredFieldMigrationIntent {
  try {
    const intent = requiredFieldMigrationIntentSchema.parse(input);
    if (canonicalJson(intent) !== canonicalJson(input) || intent.organisationId !== intent.principal.organisationId
      || (intent.source.payload.schemaVersion !== 2 && intent.target.payload.schemaVersion !== 2)) invalid();
    const impact = analyseRequiredFieldEvolution(intent.source.payload, intent.target.payload);
    if (impact.kind !== "migration") invalid();
    // Check only declared conversion TYPE/MAPPING compatibility using the same
    // existing validator. Never execute the returned converter here. Projection
    // cannot validate conditional requirements: v2 observations below must bind
    // real source/target evaluations before representation execution is allowed.
    const base = (payload: typeof intent.source.payload) => ({ schemaVersion: 1 as const,
      entity: payload.entity, storageGeneration: payload.storageGeneration, field: payload.field });
    createFieldConverter(base(intent.source.payload), base(intent.target.payload), intent.conversion);
    return intent;
  } catch { return invalid(); }
}

export function sealRequiredFieldMigrationIntent(input: unknown) {
  const intent = checkedIntent(input);
  return { intent, checksum: checksum(intent) };
}

/** References and fingerprints only. The server must obtain both evaluation
 * checksums from real authorised transaction state; client packets grant none. */
export const requiredFieldMigrationObservationSchema = z.strictObject({
  ...fieldMigrationObservationSchema.shape,
  requirement: z.strictObject({ sourceEvaluationChecksum: digest, targetEvaluationChecksum: digest, targetRequired: z.boolean() }),
  result: z.discriminatedUnion("kind", [
    fieldMigrationObservationSchema.shape.result.options[0],
    z.strictObject({ kind: z.literal("invalid"), code: z.enum([
      "INVALID_SOURCE", "INVALID_TARGET", "UNMAPPED_VALUE", "LOSS_REQUIRES_REVIEW", "FIELD_STORAGE_INVALID", "FIELD_REQUIRED",
    ]) }),
  ]),
}).superRefine((row, ctx) => {
  const slot = row.extension?.slot;
  if (slot && (slot.value ? slot.revision !== slot.value.revision : slot.revision !== 0))
    ctx.addIssue({ code: "custom", message: "The observed slot must match its current immutable value revision." });
  if ((row.result.kind === "valid" && row.result.isNull && row.requirement.targetRequired)
    || (row.result.kind === "invalid" && row.result.code === "FIELD_REQUIRED" && !row.requirement.targetRequired))
    ctx.addIssue({ code: "custom", message: "The conversion result must preserve its evaluated target requirement." });
});
export type RequiredFieldMigrationObservation = z.infer<typeof requiredFieldMigrationObservationSchema>;

const reviewSchema = z.strictObject({ ...intentShape,
  cohort: z.strictObject({ recordCount: count, observationDigest: digest }),
  summary: z.strictObject({ validCount: count, invalidCount: count, lossyCount: count }),
}).superRefine((review, ctx) => {
  if (review.summary.validCount + review.summary.invalidCount !== review.cohort.recordCount
    || review.summary.lossyCount > review.summary.validCount)
    ctx.addIssue({ code: "custom", message: "Review summary must cover its exact observed cohort." });
});
export type RequiredFieldMigrationReview = z.infer<typeof reviewSchema>;

export function requiredFieldMigrationIntentFromReview(review: RequiredFieldMigrationReview) {
  return checkedIntent(Object.fromEntries(Object.keys(intentShape).map(key => [key, review[key as keyof RequiredFieldMigrationReview]])));
}

export function sealRequiredFieldMigrationReview(input: unknown) {
  try {
    const review = reviewSchema.parse(input);
    if (canonicalJson(input) !== canonicalJson(review)) invalid();
    requiredFieldMigrationIntentFromReview(review);
    return { review, checksum: checksum(review) };
  } catch { return invalid(); }
}

export function readSealedRequiredFieldMigrationReview(input: unknown) {
  const packet = z.strictObject({ review: z.unknown(), checksum: digest }).safeParse(input);
  if (!packet.success) invalid();
  const sealed = sealRequiredFieldMigrationReview(packet.data.review);
  if (sealed.checksum !== packet.data.checksum) throw new FieldMigrationReviewError("REVIEW_CHANGED");
  return sealed;
}

/** Exact deterministic v2 archive digest. Distinct version frame preserves the
 * old v1 digest/receipts. Bounded memory; counts/digests still grant no coverage. */
export function requiredFieldMigrationObservationDigest() {
  const hash = createHash("sha256").update("atlas.studio.field-observations@2\n");
  let lastId: string | null = null, recordCount = 0, validCount = 0, invalidCount = 0, lossyCount = 0, finished = false;
  return {
    append(input: unknown) {
      if (finished) throw new FieldMigrationReviewError("OBSERVATION_INVALID");
      const parsed = requiredFieldMigrationObservationSchema.safeParse(input);
      if (!parsed.success || canonicalJson(input) !== canonicalJson(parsed.data)) throw new FieldMigrationReviewError("OBSERVATION_INVALID");
      const row = parsed.data;
      if ((lastId !== null && row.recordId <= lastId) || recordCount === Number.MAX_SAFE_INTEGER)
        throw new FieldMigrationReviewError("OBSERVATION_INVALID");
      hash.update(canonicalJson(row)).update("\n"); lastId = row.recordId; recordCount++;
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
