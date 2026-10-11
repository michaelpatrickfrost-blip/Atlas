import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import type { RecordContext } from "../../registry/types";
import type { CapabilityRegistry } from "../../registry/registry";
import { entityDetailsSchema } from "../../registry/entities";
import { sealFieldMigrationReview, FieldMigrationReviewError, type FieldMigrationIntent } from "./contracts";
import { validateFieldMigrationSourceCoverage, type FieldMigrationCoverageStage } from "./coverage";
import { digestFieldMigrationArchive } from "./archive-digest";
import type { assertFieldMigrationPolicies } from "./access";
import { validateRequiredFieldMigrationSourceCoverage, validatePublishedRequiredFieldMigrationSourceCoverage, validateExecutingRequiredFieldMigrationSourceCoverage, validateCutoverRequiredFieldMigrationSourceCoverage, validateRollbackRequiredFieldMigrationSourceCoverage } from "./coverage";
import { digestRequiredFieldMigrationArchive } from "./archive-digest";
import { sealRequiredFieldMigrationIntent, sealRequiredFieldMigrationReview, requiredFieldMigrationObservationSchema,
  requiredFieldMigrationObservationDigest, type RequiredFieldMigrationIntent } from "./required-contracts";
import { observeRequiredFieldMigrationRecord, observePublishedRequiredFieldMigrationRecord, observeExecutingRequiredFieldMigrationRecord, observeCutoverRequiredFieldMigrationRecord, observeRollbackRequiredFieldMigrationRecord } from "./observation";
import { fieldRuntimeAuthorityInTransaction } from "../runtime-authority";
import { checksum } from "../../registry/contracts";
import type { FieldMigrationAuthority } from "./authority";
import type { FieldMigrationPrincipal } from "../principal-contract";
import { resolveFieldMigrationPrincipal } from "../principal";

/** One exact internal review inspection for sealing, publication and execution/replay.
 * Caller owns the fresh authority/transaction. Stage is derived from a locked
 * server operation, never client input. No state/value writes or grant from a hash.
 */
export async function inspectFieldMigrationReview(context: RecordContext & { transaction: Prisma.TransactionClient }, registry: CapabilityRegistry,
  company: Parameters<typeof assertFieldMigrationPolicies>[1], intent: FieldMigrationIntent, stage: FieldMigrationCoverageStage = "preparation") {
  await validateFieldMigrationSourceCoverage(context, registry, company, intent, stage);
  await validateReferenceCoverage(context, registry, intent);
  const aggregate = await digestFieldMigrationArchive(context.transaction, intent);
  if (intent.target.payload.field.unique && aggregate.duplicateTarget)
    throw new Error("MIGRATION_UNIQUENESS_CONFLICT: target values need a new review after duplicates are resolved.");
  return sealFieldMigrationReview({ ...intent, cohort: { recordCount: aggregate.recordCount, observationDigest: aggregate.observationDigest }, summary: aggregate.summary });
}

/** Explicit conditional preparation inspection. Re-evaluate actual authorised
 * rows in bounded pages; a matching archive digest never substitutes for current
 * conditions or exact native/global envelopes. No target writes or later stages. */
export async function inspectRequiredFieldMigrationReview(context: RecordContext & { transaction: Prisma.TransactionClient }, serverIntent: RequiredFieldMigrationIntent) {
  return inspectRequiredReview(context, serverIntent, "preparation");
}

/** Reinspect an actual source-active publication through a separate server entry.
 * This does not enable execution or accept a caller-selected stage. */
export async function inspectPublishedRequiredFieldMigrationReview(context: RecordContext & { transaction: Prisma.TransactionClient }, serverIntent: RequiredFieldMigrationIntent) {
  return inspectRequiredReview(context, serverIntent, "publication");
}

/** Reinspect source-active execution through the retained execution lineage.
 * The row reader must prove any own target/outcome increment before returning
 * the original review envelope. No client-selected stage or publication fallback. */
export async function inspectExecutingRequiredFieldMigrationReview(context: RecordContext & { transaction: Prisma.TransactionClient }, serverIntent: RequiredFieldMigrationIntent) {
  return inspectRequiredReview(context, serverIntent, "execution");
}

/** Exact actual target-active review under retained cutover lineage. No caller
 * stage, activation, settlement or fallback to source-active execution. */
export async function inspectCutoverRequiredFieldMigrationReview(context: RecordContext & { transaction: Prisma.TransactionClient }, serverIntent: RequiredFieldMigrationIntent) {
  return inspectRequiredReview(context, serverIntent, "cutover");
}

/** Current settler rollback proof without rewriting original sealed intent. Even
 * an empty cohort must prove genuine current authority and actual cutover state. */
export async function inspectRollbackRequiredFieldMigrationReview(authority: FieldMigrationAuthority, serverIntent: RequiredFieldMigrationIntent) {
  return inspectRequiredReview({ session: authority.session, transaction: authority.transaction }, serverIntent, "rollback", authority.principal);
}

async function inspectRequiredReview(context: RecordContext & { transaction: Prisma.TransactionClient }, serverIntent: RequiredFieldMigrationIntent,
  stage: "preparation" | "publication" | "execution" | "cutover" | "rollback", currentPrincipal?: FieldMigrationPrincipal) {
  const authority = await fieldRuntimeAuthorityInTransaction(context.session, context.transaction), { session, registry, transaction: tx, stamp } = authority;
  const intent = sealRequiredFieldMigrationIntent(serverIntent).intent;
  const principal = stage === "rollback" ? currentPrincipal : intent.principal;
  if (!principal || intent.organisationId !== session.organisationId || principal.organisationId !== session.organisationId
    || principal.userId !== session.userId || principal.membershipId !== session.membershipId
    || principal.authVersion !== stamp.authVersion || principal.sessionVersion !== stamp.sessionVersion) throw new FieldMigrationReviewError("REVIEW_CHANGED");
  if (stage === "rollback") await resolveFieldMigrationPrincipal(principal);
  const company = await tx.organisation.findFirst({ where: { id: session.organisationId }, select: { id: true, kind: true, status: true, archivedAt: true, isTest: true } });
  if (!company) throw new FieldMigrationReviewError("REVIEW_CHANGED");
  const freshContext = { session, transaction: tx };
  const rollbackAuthority: FieldMigrationAuthority = { ...freshContext, principal, company };
  const coverage = stage === "cutover" ? validateCutoverRequiredFieldMigrationSourceCoverage : stage === "execution" ? validateExecutingRequiredFieldMigrationSourceCoverage
    : stage === "publication" ? validatePublishedRequiredFieldMigrationSourceCoverage : validateRequiredFieldMigrationSourceCoverage;
  const observe = stage === "cutover" ? observeCutoverRequiredFieldMigrationRecord : stage === "execution" ? observeExecutingRequiredFieldMigrationRecord
    : stage === "publication" ? observePublishedRequiredFieldMigrationRecord : observeRequiredFieldMigrationRecord;
  if (stage === "rollback") await validateRollbackRequiredFieldMigrationSourceCoverage(rollbackAuthority, intent);
  else await coverage(freshContext, registry, company, intent);
  await validateReferenceCoverage(freshContext, registry, intent);
  const stream = requiredFieldMigrationObservationDigest();
  let cursor: string | undefined;
  for (;;) {
    const rows = await tx.studioFieldMigrationObservation.findMany({ where: { preparationId: intent.id, organisationId: session.organisationId,
      definitionId: intent.definitionId, entityId: intent.source.payload.entity.id, sourceGenerationId: intent.source.payload.storageGeneration,
      ...(cursor ? { recordId: { gt: cursor } } : {}) }, orderBy: { recordId: "asc" }, take: 50,
      select: { recordId: true, nativeRevision: true, observation: true } });
    for (const row of rows) {
      const retained = requiredFieldMigrationObservationSchema.parse(row.observation);
      if (retained.recordId !== row.recordId || retained.nativeRevision !== row.nativeRevision) throw new FieldMigrationReviewError("REVIEW_CHANGED");
      const anchor = { organisationId: session.organisationId, recordId: row.recordId, revision: row.nativeRevision };
      const actual = stage === "rollback" ? await observeRollbackRequiredFieldMigrationRecord(rollbackAuthority, intent, anchor) : await observe(freshContext, intent, anchor);
      if (checksum(actual) !== checksum(retained)) throw new FieldMigrationReviewError("REVIEW_CHANGED");
      stream.append(actual); cursor = row.recordId;
    }
    if (rows.length < 50) break;
  }
  const actual = stream.finish(), aggregate = await digestRequiredFieldMigrationArchive(tx, intent);
  if (checksum(actual) !== checksum({ recordCount: aggregate.recordCount, observationDigest: aggregate.observationDigest, summary: aggregate.summary }))
    throw new FieldMigrationReviewError("REVIEW_CHANGED");
  if (intent.target.payload.field.unique && aggregate.duplicateTarget) throw new Error("MIGRATION_UNIQUENESS_CONFLICT: target values need a new review after duplicates are resolved.");
  return sealRequiredFieldMigrationReview({ ...intent, cohort: { recordCount: aggregate.recordCount, observationDigest: aggregate.observationDigest }, summary: aggregate.summary });
}

async function validateReferenceCoverage(context: RecordContext & { transaction: Prisma.TransactionClient }, registry: CapabilityRegistry,
  intent: FieldMigrationIntent | RequiredFieldMigrationIntent) {
  if (intent.source.payload.field.storage.type === "reference" || intent.target.payload.field.storage.type === "reference") {
    const owner = await registry.resolve(context.session, intent.target.payload.entity), policy = entityDetailsSchema.parse(owner.details).record?.migrationSnapshot;
    const versions = policy?.referenceVersions, refs = [intent.source.payload.field.storage, intent.target.payload.field.storage];
    if (!versions || refs.some(storage => storage.type !== "reference" || storage.entity.id !== owner.id || !versions.includes(storage.entity.version)))
      throw new Error("MIGRATION_REFERENCE_REVIEW_REQUIRED: reference review requires approved owner coverage.");
    const result = z.strictObject({ organisationId: z.string(), entityId: z.string(), mode: z.literal("reference_coverage"), nativeReferenceCoverageComplete: z.literal(true) })
      .parse(await registry.invokeQueryInTransaction(context, intent.ownerQuery, { mode: "reference_coverage", preparationId: intent.id }));
    if (result.organisationId !== context.session.organisationId || result.entityId !== owner.id) throw new FieldMigrationReviewError("REVIEW_CHANGED");
  }
}
