import { z } from "zod";
import { canonicalJson, checksum } from "../../registry/contracts";
import { customFieldPayloadSchema } from "../schema";
import { readSealedFieldMigrationReview, FieldMigrationReviewError } from "./contracts";

const digest = z.string().regex(/^[a-f0-9]{64}$/);
const targetVersionSchema = z.strictObject({ id: z.uuid(), organisationId: z.string().min(1).max(100), definitionId: z.uuid(),
  version: z.number().int().positive().max(2147483647), checksum: digest, payload: customFieldPayloadSchema, compiledPlan: z.unknown() });

/** Pure integrity pin only. Callers must reload the review and actual immutable
 * target version on the server, under refreshed source/cohort/actor authority.
 * Nothing returned here permits activation, target writes or a domain operation.
 */
export function reviewedFieldPublicationPin(storedReview: unknown, serverVersion: unknown, publisherUserId: string, acknowledgedLoss: boolean) {
  const sealed = readSealedFieldMigrationReview(storedReview), review = sealed.review;
  const target = targetVersionSchema.parse(serverVersion);
  if (canonicalJson(target) !== canonicalJson(serverVersion) || target.organisationId !== review.organisationId || target.definitionId !== review.definitionId
    || target.id === review.source.versionId || target.checksum !== review.target.compiledChecksum || checksum(target.compiledPlan) !== target.checksum
    || canonicalJson(target.payload) !== canonicalJson(review.target.payload) || publisherUserId !== review.principal.userId)
    throw new FieldMigrationReviewError("REVIEW_CHANGED");
  if (review.summary.invalidCount !== 0)
    throw new Error("MIGRATION_INVALID_VALUES: resolve invalid source values and collect a new review before publication.");
  if (typeof acknowledgedLoss !== "boolean" || (review.summary.lossyCount > 0 && !acknowledgedLoss))
    throw new Error("MIGRATION_LOSS_ACKNOWLEDGEMENT_REQUIRED: acknowledge the reviewed conversion loss before publication.");
  return { preparationId: review.id, organisationId: review.organisationId, definitionId: review.definitionId, reviewChecksum: sealed.checksum,
    sourceGenerationId: review.source.payload.storageGeneration, targetGenerationId: target.payload.storageGeneration,
    targetVersionId: target.id, targetVersionNumber: target.version, targetChecksum: target.checksum, publisherUserId, acknowledgedLoss };
}
export type FieldMigrationPublicationPin = ReturnType<typeof reviewedFieldPublicationPin>;
