import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import type { RecordContext } from "../../registry/types";
import type { CapabilityRegistry } from "../../registry/registry";
import { entityDetailsSchema } from "../../registry/entities";
import { sealFieldMigrationReview, FieldMigrationReviewError, type FieldMigrationIntent } from "./contracts";
import { validateFieldMigrationSourceCoverage, type FieldMigrationCoverageStage } from "./coverage";
import { digestFieldMigrationArchive } from "./archive-digest";
import type { assertFieldMigrationPolicies } from "./access";

/** One exact internal review inspection for sealing, reviewed publication/replay.
 * Caller owns the fresh authority/transaction. Stage is derived from a locked
 * server operation, never client input. No state/value writes or grant from a hash.
 */
export async function inspectFieldMigrationReview(context: RecordContext & { transaction: Prisma.TransactionClient }, registry: CapabilityRegistry,
  company: Parameters<typeof assertFieldMigrationPolicies>[1], intent: FieldMigrationIntent, stage: FieldMigrationCoverageStage = "preparation") {
  await validateFieldMigrationSourceCoverage(context, registry, company, intent, stage);
  if (intent.source.payload.field.storage.type === "reference" || intent.target.payload.field.storage.type === "reference") {
    const owner = await registry.resolve(context.session, intent.target.payload.entity), policy = entityDetailsSchema.parse(owner.details).record?.migrationSnapshot;
    const versions = policy?.referenceVersions, refs = [intent.source.payload.field.storage, intent.target.payload.field.storage];
    if (!versions || refs.some(storage => storage.type !== "reference" || storage.entity.id !== owner.id || !versions.includes(storage.entity.version)))
      throw new Error("MIGRATION_REFERENCE_REVIEW_REQUIRED: reference review requires approved owner coverage.");
    const result = z.strictObject({ organisationId: z.string(), entityId: z.string(), mode: z.literal("reference_coverage"), nativeReferenceCoverageComplete: z.literal(true) })
      .parse(await registry.invokeQueryInTransaction(context, intent.ownerQuery, { mode: "reference_coverage", preparationId: intent.id }));
    if (result.organisationId !== context.session.organisationId || result.entityId !== owner.id) throw new FieldMigrationReviewError("REVIEW_CHANGED");
  }
  const aggregate = await digestFieldMigrationArchive(context.transaction, intent);
  if (intent.target.payload.field.unique && aggregate.duplicateTarget)
    throw new Error("MIGRATION_UNIQUENESS_CONFLICT: target values need a new review after duplicates are resolved.");
  return sealFieldMigrationReview({ ...intent, cohort: { recordCount: aggregate.recordCount, observationDigest: aggregate.observationDigest }, summary: aggregate.summary });
}
