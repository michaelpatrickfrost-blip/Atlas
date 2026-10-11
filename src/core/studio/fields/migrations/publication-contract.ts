import { z } from "zod";
import { canonicalJson, checksum } from "../../registry/contracts";
import { customFieldPayloadSchema } from "../schema";
import { readSealedFieldMigrationReview, FieldMigrationReviewError, type FieldMigrationReview } from "./contracts";
import { versionedFieldPayloadSchema } from "../required-contract";
import { readSealedRequiredFieldMigrationReview, type RequiredFieldMigrationReview } from "./required-contracts";

const digest = z.string().regex(/^[a-f0-9]{64}$/);
const targetVersionSchema = z.strictObject({ id: z.uuid(), organisationId: z.string().min(1).max(100), definitionId: z.uuid(),
  version: z.number().int().positive().max(2147483647), checksum: digest, payload: customFieldPayloadSchema, compiledPlan: z.unknown() });
const requiredTargetVersionSchema = targetVersionSchema.extend({ payload: versionedFieldPayloadSchema });

/** Pure readiness only, applied to a freshly validated server review. */
export function assertFieldMigrationPublicationReady(review: Pick<FieldMigrationReview, "summary">, acknowledgedLoss: boolean) {
  if (review.summary.invalidCount !== 0)
    throw new Error("MIGRATION_INVALID_VALUES: resolve invalid source values and collect a new review before publication.");
  if (typeof acknowledgedLoss !== "boolean" || (review.summary.lossyCount > 0 && !acknowledgedLoss))
    throw new Error("MIGRATION_LOSS_ACKNOWLEDGEMENT_REQUIRED: acknowledge the reviewed conversion loss before publication.");
}

/** Pure integrity pin only. Callers must reload the review and actual immutable
 * target version on the server, under refreshed source/cohort/actor authority.
 * Nothing returned here permits activation, target writes or a domain operation.
 */
export function reviewedFieldPublicationPin(storedReview: unknown, serverVersion: unknown, publisherUserId: string, acknowledgedLoss: boolean) {
  const sealed = readSealedFieldMigrationReview(storedReview);
  const target = targetVersionSchema.parse(serverVersion);
  return publicationPin(sealed, target, serverVersion, publisherUserId, acknowledgedLoss);
}

/** Pure conditional integrity only, deliberately separate from the closed v1
 * reader. The unchanged receipt shape pins the whole format2 review checksum,
 * including rules/semantic evidence, and the exact target plan checksum. This
 * does not enable conditional publication, activation or execution services. */
export function reviewedRequiredFieldPublicationPin(storedReview: unknown, serverVersion: unknown, publisherUserId: string, acknowledgedLoss: boolean) {
  const sealed = readSealedRequiredFieldMigrationReview(storedReview);
  const target = requiredTargetVersionSchema.parse(serverVersion);
  return publicationPin(sealed, target, serverVersion, publisherUserId, acknowledgedLoss);
}

function publicationPin(sealed: { review: FieldMigrationReview | RequiredFieldMigrationReview; checksum: string },
  target: z.infer<typeof requiredTargetVersionSchema>, serverVersion: unknown, publisherUserId: string, acknowledgedLoss: boolean) {
  const review = sealed.review;
  if (canonicalJson(target) !== canonicalJson(serverVersion) || target.organisationId !== review.organisationId || target.definitionId !== review.definitionId
    || target.id === review.source.versionId || target.checksum !== review.target.compiledChecksum || checksum(target.compiledPlan) !== target.checksum
    || canonicalJson(target.payload) !== canonicalJson(review.target.payload) || publisherUserId !== review.principal.userId)
    throw new FieldMigrationReviewError("REVIEW_CHANGED");
  assertFieldMigrationPublicationReady(review, acknowledgedLoss);
  return { preparationId: review.id, organisationId: review.organisationId, definitionId: review.definitionId, reviewChecksum: sealed.checksum,
    sourceGenerationId: review.source.payload.storageGeneration, targetGenerationId: target.payload.storageGeneration,
    targetVersionId: target.id, targetVersionNumber: target.version, targetChecksum: target.checksum, publisherUserId, acknowledgedLoss };
}
export type FieldMigrationPublicationPin = ReturnType<typeof reviewedFieldPublicationPin>;
