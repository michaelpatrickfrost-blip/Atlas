import type { Session } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { STUDIO_CAPABILITIES } from "../permissions";
import { resolveAdditionalFieldMigrationContext, preflightAdditionalFieldMigration, authoriseAdditionalFieldMigrationWrittenMetadata } from "./field-migration-preview";
import { authoriseAdditionalFieldMigrationMetadata, authoriseAdditionalFieldMigrationHistoricalMetadata, authoriseAdditionalFieldMigrationCurrentMetadata, retainAdditionalFieldMigrationCreator } from "./field-migration-lifecycle";
import * as contract from "./field-migration-control-contract";
import { withFieldMigrationAuthority, type FieldMigrationAuthority } from "../fields/migrations/authority";
import { readStoredFieldMigrationIntent, readStoredFieldMigrationReview } from "../fields/migrations/stored-protocol";
import { FieldMigrationReviewError, fieldMigrationIntentFromReview } from "../fields/migrations/contracts";
import { publishReviewedFieldMigration } from "../fields/migrations/publication";
import { startFieldMigrationExecution } from "../fields/migrations/execution-start";
import { executeFieldMigrationBatch } from "../fields/migrations/execution-batch";
import { cutoverReviewedFieldMigration } from "../fields/migrations/cutover";
import { cancelFieldMigrationPublication } from "../fields/migrations/cancellation";
import { rollbackReviewedFieldMigration, finalizeReviewedFieldMigration } from "../fields/migrations/settlement";
import { inspectFieldMigrationExecution, inspectRequiredFieldMigrationExecution } from "../fields/migrations/execution-inspection";
import { inspectFieldMigrationSettlementIdentity, inspectRequiredFieldMigrationSettlementIdentity } from "../fields/migrations/settlement-inspection";
import { validateFieldMigrationSettlementCoverage, validateRequiredFieldMigrationSettlementCoverage } from "../fields/migrations/settlement-coverage";
import { studioRegistry } from "../registry/runtime";
import { checksum } from "../registry/contracts";
import { lockBoundFieldEntityInTransaction } from "../fields/entity-lock";
import { inspectSealedFieldVersion } from "../fields/sealed-field";
import { versionedFieldPayloadSchema } from "../fields/required-contract";
import { requiredFieldMigrationIntentFromReview } from "../fields/migrations/required-contracts";
import { resolveFieldMigrationPrincipal } from "../fields/principal";
import { assertFieldMigrationPolicies, assertVersionedFieldMigrationPolicies } from "../fields/migrations/access";

type Scope = { definitionId: string; preparationId: string };
type Context = Awaited<ReturnType<typeof resolveAdditionalFieldMigrationContext>>;
function changed(): never { throw new FieldMigrationReviewError("REVIEW_CHANGED"); }
async function storedOperation(authority: FieldMigrationAuthority, request: Scope, sparse = false) {
  const { session, transaction: tx } = authority;
  await lockBoundFieldEntityInTransaction(tx, session.organisationId, request.definitionId);
  await tx.$queryRaw`SELECT id FROM studio_field_migration_preparations WHERE id=${request.preparationId}::uuid
    AND "definitionId"=${request.definitionId}::uuid AND "organisationId"=${session.organisationId} FOR SHARE`;
  const row = await tx.studioFieldMigrationPreparation.findFirst({ where: { id: request.preparationId, definitionId: request.definitionId,
    organisationId: session.organisationId }, include: { review: true } });
  if (!row || row.id !== request.preparationId || row.definitionId !== request.definitionId || row.organisationId !== session.organisationId) changed();
  const stored = readStoredFieldMigrationIntent(row, session.organisationId), intent = stored.intent;
  if (sparse && intent.schemaVersion !== 1) throw new Error("Conditional field changes are not supported by this visual workflow yet. Use their existing reviewed workflow.");
  if (intent.definitionId !== request.definitionId || row.entityId !== intent.source.payload.entity.id || row.sourceVersionId !== intent.source.versionId
    || row.sourceGenerationId !== intent.source.payload.storageGeneration || row.targetGenerationId !== intent.target.payload.storageGeneration || row.draftId !== intent.target.draftId) changed();
  return { row, stored, intent };
}
async function authoriseOperation(context: Context, request: Scope, creator: boolean, metadata = true, expectedExecution?: "RUNNING" | "FAILED", requestRevision?: number) {
  await withFieldMigrationAuthority(context.session, context.principal, async authority => {
    const { row, intent } = await storedOperation(authority, request, !metadata);
    if (creator) retainAdditionalFieldMigrationCreator(authority.principal, intent.principal);
    if (metadata) await (creator ? authoriseAdditionalFieldMigrationMetadata : authoriseAdditionalFieldMigrationHistoricalMetadata)(authority, request.definitionId, intent.source.payload, intent.target.payload);
    if (row.state !== "REVIEWED") changed();
    if (expectedExecution) {
      const progress = await authority.transaction.studioFieldMigrationExecution.findFirst({ where: { preparationId: intent.id,
        definitionId: request.definitionId, organisationId: authority.session.organisationId }, select: { state: true, revision: true } });
      if (!progress || requestRevision === undefined || requestRevision > progress.revision) changed();
      // A lost-response retry may have advanced or reached READY. Exact current
      // revision is an explicit RUNNING/FAILED operation; original service rechecks.
      if (requestRevision === progress.revision && progress.state !== expectedExecution && progress.state !== "READY") changed();
    }
  });
}
export async function publishAdditionalFieldMigration(actor: Session, target: string | undefined, input: unknown) {
  const request = contract.publishAdditionalFieldMigrationSchema.parse(input), context = await resolveAdditionalFieldMigrationContext(actor, target);
  await authoriseOperation(context, request, true);
  const { definitionId, ...original } = request; void definitionId;
  const result = await publishReviewedFieldMigration(context.session, original);
  return contract.additionalFieldMigrationPublishedSchema.parse({ preparationId: result.id, state: result.state,
    preparationRevision: result.preparationRevision, publicationRevision: result.publicationRevision, reviewChecksum: result.reviewChecksum, replayed: result.replayed });
}
export async function startAdditionalFieldMigrationExecution(actor: Session, target: string | undefined, input: unknown) {
  const request = contract.startAdditionalFieldMigrationExecutionSchema.parse(input), context = await resolveAdditionalFieldMigrationContext(actor, target);
  await authoriseOperation(context, request, true);
  const { definitionId, ...original } = request; void definitionId;
  const result = await startFieldMigrationExecution(context.session, original);
  return contract.additionalFieldMigrationExecutedSchema.parse({ preparationId: result.id, state: result.state, revision: result.revision,
    processedCount: result.processedCount, failureCode: result.failureCode, replayed: result.replayed, appended: 0 });
}
export async function executeAdditionalFieldMigrationBatch(actor: Session, target: string | undefined, input: unknown) {
  const request = contract.executeAdditionalFieldMigrationBatchSchema.parse(input), context = await resolveAdditionalFieldMigrationContext(actor, target);
  await authoriseOperation(context, request, true, true, request.expectedState, request.revision);
  const result = await executeFieldMigrationBatch(context.session, { preparationId: request.preparationId, revision: request.revision, limit: request.limit });
  // Original failures propagate unchanged, including failureRecorded. Never
  // fabricate durable FAILED status or advance another batch automatically.
  return contract.additionalFieldMigrationExecutedSchema.parse({ preparationId: result.id, state: result.state, revision: result.revision,
    processedCount: result.processedCount, failureCode: result.failureCode, replayed: result.replayed, appended: result.appended });
}
export async function cutoverAdditionalFieldMigration(actor: Session, target: string | undefined, input: unknown) {
  const request = contract.cutoverAdditionalFieldMigrationSchema.parse(input), context = await resolveAdditionalFieldMigrationContext(actor, target);
  await authoriseOperation(context, request, true);
  const { definitionId, ...original } = request; void definitionId;
  const result = await cutoverReviewedFieldMigration(context.session, original);
  return contract.additionalFieldMigrationCutoverSchema.parse({ preparationId: result.id, state: result.state, definitionRevision: result.definitionRevision,
    publicationRevision: result.publicationRevision, executionRevision: result.executionRevision, reviewChecksum: result.reviewChecksum, replayed: result.replayed });
}
export async function cancelAdditionalFieldMigration(actor: Session, target: string | undefined, input: unknown) {
  const request = contract.cancelAdditionalFieldMigrationSchema.parse(input), context = await resolveAdditionalFieldMigrationContext(actor, target);
  // Sparse metadata recovery deliberately does not demand revoked native data
  // grants. It returns no field labels, counts, values or execution progress.
  await authoriseOperation(context, request, false, false);
  const result = await cancelFieldMigrationPublication(context.session, context.principal, { preparationId: request.preparationId, revision: request.revision });
  return contract.additionalFieldMigrationCancelledSchema.parse({ preparationId: result.id, revision: result.revision, state: result.state, replayed: result.replayed });
}
async function settle(actor: Session, target: string | undefined, input: unknown, operation: typeof rollbackReviewedFieldMigration) {
  const request = contract.settleAdditionalFieldMigrationSchema.parse(input), context = await resolveAdditionalFieldMigrationContext(actor, target);
  await authoriseOperation(context, request, false);
  const { definitionId, ...original } = request; void definitionId;
  const result = await operation(context.session, context.principal, original);
  return contract.additionalFieldMigrationSettledSchema.parse({ preparationId: result.id, state: result.state, settlementChecksum: result.settlementChecksum, replayed: result.replayed });
}
export const rollbackAdditionalFieldMigration = (actor: Session, target: string | undefined, input: unknown) => settle(actor, target, input, rollbackReviewedFieldMigration);
export const finalizeAdditionalFieldMigration = (actor: Session, target: string | undefined, input: unknown) => settle(actor, target, input, finalizeReviewedFieldMigration);

/** Explicit resume/status action only; never open a support Audit from passive
 * GET. Counts use original inspections after full private/field preflight. */
export async function readAdditionalFieldMigrationStatus(actor: Session, target: string | undefined, input: unknown) {
  const request = contract.readAdditionalFieldMigrationStatusSchema.parse(input), context = await resolveAdditionalFieldMigrationContext(actor, target);
  return withFieldMigrationAuthority(context.session, context.principal, async authority => {
    const { session, transaction: tx } = authority, { row, stored, intent } = await storedOperation(authority, request);
    const scope = { preparationId: intent.id, definitionId: request.definitionId, organisationId: session.organisationId };
    await tx.$queryRaw`SELECT "preparationId" FROM studio_field_migration_publications WHERE "preparationId"=${intent.id}::uuid AND "organisationId"=${session.organisationId} FOR SHARE`;
    const publication = await tx.studioFieldMigrationPublication.findFirst({ where: scope });
    if (publication && (publication.definitionId !== request.definitionId || publication.organisationId !== session.organisationId || publication.preparationId !== intent.id)) changed();
    const empty = { ...request, preparationState: row.state, preparationRevision: row.revision, fieldLabel: null, review: null,
      publication: publication ? { state: publication.state, revision: publication.revision } : null, execution: null, cutover: null, currentHead: null };
    if (publication?.state === "CANCELLED") {
      if (intent.schemaVersion !== 1) throw new Error("Conditional field recovery is not supported by this sparse visual workflow yet.");
      if (!row.review) changed();
      const retained = readStoredFieldMigrationReview(row.review, session.organisationId);
      if (retained.review.schemaVersion !== 1 || checksum(fieldMigrationIntentFromReview(retained.review)) !== stored.checksum
        || publication.reviewChecksum !== retained.checksum || publication.sourceGenerationId !== intent.source.payload.storageGeneration
        || publication.targetGenerationId !== intent.target.payload.storageGeneration || publication.targetChecksum !== intent.target.compiledChecksum
        || publication.publisherUserId !== intent.principal.userId) changed();
      return contract.additionalFieldMigrationStatusSchema.parse(empty);
    }
    const historical = intent.schemaVersion === 2 && publication !== null && publication.state !== "PUBLISHED";
    const statusMetadata = intent.schemaVersion === 2 && !historical ? authoriseAdditionalFieldMigrationCurrentMetadata : authoriseAdditionalFieldMigrationHistoricalMetadata;
    const compiled = await statusMetadata(authority, request.definitionId, intent.source.payload, intent.target.payload), { registry } = compiled;
    if (!historical && (compiled.compiledSource.checksum !== intent.source.versionChecksum || compiled.compiledTarget.checksum !== intent.target.compiledChecksum)) changed();
    const sourceVersion = await tx.studioDefinitionVersion.findFirst({ where: { id: intent.source.versionId, definitionId: request.definitionId, organisationId: session.organisationId } });
    if (!sourceVersion || sourceVersion.id !== intent.source.versionId || sourceVersion.checksum !== intent.source.versionChecksum || checksum(sourceVersion.payload) !== checksum(intent.source.payload)) changed();
    inspectSealedFieldVersion(registry, sourceVersion, session.organisationId, request.definitionId);
    const definition = await tx.studioDefinition.findFirst({ where: { id: request.definitionId, organisationId: session.organisationId, kind: "customField" }, include: { activeVersion: true } });
    const active = definition?.activeVersion;
    if (!definition || !active || definition.activeVersionId !== active.id) changed();
    const current = versionedFieldPayloadSchema.parse(active.payload);
    if (current.entity.id !== intent.source.payload.entity.id || current.field.key !== intent.source.payload.field.key) changed();
    inspectSealedFieldVersion(registry, active, session.organisationId, request.definitionId);
    const policies = intent.schemaVersion === 1 ? assertFieldMigrationPolicies : assertVersionedFieldMigrationPolicies;
    policies(session, authority.company, current, intent.source.payload); policies(session, authority.company, current, intent.target.payload);
    const compiledCurrent = await statusMetadata(authority, request.definitionId, current, current);
    if (!historical && compiledCurrent.compiledSource.checksum !== active.checksum) changed();
    if (historical) {
      // Terminal history cannot recompile an obsolete graph. Verify the actual
      // immutable published target in full before the owning count preflight.
      const targetVersion = await tx.studioDefinitionVersion.findFirst({ where: { id: publication!.targetVersionId,
        definitionId: request.definitionId, organisationId: session.organisationId } });
      if (!targetVersion || targetVersion.id !== publication!.targetVersionId || targetVersion.schemaVersion !== intent.target.payload.schemaVersion
        || targetVersion.checksum !== intent.target.compiledChecksum || checksum(targetVersion.payload) !== checksum(intent.target.payload)) changed();
      inspectSealedFieldVersion(registry, targetVersion, session.organisationId, request.definitionId);
    }
    // Metadata approval and the complete private owner snapshot gate precede
    // any disclosure of retained review/progress totals or archive classifications.
    await preflightAdditionalFieldMigration(authority, registry, intent, historical ? "history" : "current");
    await authoriseAdditionalFieldMigrationWrittenMetadata(authority, registry, intent, current);
    let review = null;
    if (row.review) {
      const sealed = readStoredFieldMigrationReview(row.review, session.organisationId);
      if (sealed.review.schemaVersion !== intent.schemaVersion || checksum(sealed.review.schemaVersion === 1 ? fieldMigrationIntentFromReview(sealed.review) : requiredFieldMigrationIntentFromReview(sealed.review)) !== stored.checksum) changed();
      review = { checksum: sealed.checksum, affectedCount: sealed.review.cohort.recordCount,
        valid: sealed.review.summary.validCount, invalid: sealed.review.summary.invalidCount, lossy: sealed.review.summary.lossyCount };
    } else if (row.state === "REVIEWED" || publication) changed();
    const base = { ...empty, fieldLabel: current.field.label, review,
      currentHead: { definitionRevision: definition.revision, versionLabel: `Version ${active.version}` } };
    if (!publication) return contract.additionalFieldMigrationStatusSchema.parse(base);
    if (publication.state === "PUBLISHED") {
      retainAdditionalFieldMigrationCreator(authority.principal, intent.principal);
      // Retained purpose Audit remains genuine; resolving it refreshes TODAY's
      // stamp/rights and does not replace the current authority or borrow grants.
      const originalActor = await resolveFieldMigrationPrincipal(intent.principal);
      if (originalActor.organisationId !== session.organisationId || originalActor.userId !== session.userId || originalActor.membershipId !== session.membershipId) changed();
      const inspected = intent.schemaVersion === 1 ? await inspectFieldMigrationExecution(authority, intent)
        : await inspectRequiredFieldMigrationExecution({ ...authority, principal: intent.principal }, intent);
      const progress = inspected.progress;
      return contract.additionalFieldMigrationStatusSchema.parse({ ...base,
        publication: { state: inspected.publication.state, revision: inspected.publication.revision },
        execution: progress ? { state: progress.state, revision: progress.revision, processedCount: progress.processedCount,
          affectedCount: inspected.pin.cohort.recordCount, failureCode: progress.failureCode } : null });
    }
    const inspection = intent.schemaVersion === 1
      ? { protocol: 1 as const, value: await inspectFieldMigrationSettlementIdentity(tx, intent) }
      : { protocol: 2 as const, value: await inspectRequiredFieldMigrationSettlementIdentity(tx, intent) };
    if (inspection.protocol === 1) await validateFieldMigrationSettlementCoverage(authority, studioRegistry(), inspection.value, "history");
    else await validateRequiredFieldMigrationSettlementCoverage(authority, studioRegistry(), inspection.value, "history");
    const inspected = inspection.value;
    const pin = inspected.retained.pin;
    return contract.additionalFieldMigrationStatusSchema.parse({ ...base,
      publication: { state: inspected.publication.state, revision: inspected.publication.revision },
      execution: { state: inspected.execution.state, revision: inspected.execution.revision, processedCount: inspected.execution.processedCount,
        affectedCount: inspected.executionPin.cohort.recordCount, failureCode: inspected.execution.failureCode },
      cutover: { state: inspected.state, revision: inspected.receipt.revision, checksum: inspected.retained.checksum,
        confirmation: { cutoverRevision: 0, definitionRevision: pin.definitionRevision + 1, publicationRevision: pin.publication.revision + 1 },
        settlementChecksum: inspected.settlement?.checksum ?? null } });
  });
}

/** Explicit metadata-only recovery, usable after native/private grants changed.
 * Current Publish/support authority is refreshed; retained seals grant no data
 * access. No owner snapshot, typed values, labels, counts or execution inspection.
 * Original cancellation performs its own fresh state/CAS check afterwards. */
export async function readAdditionalFieldMigrationRecoveryStatus(actor: Session, target: string | undefined, input: unknown) {
  const request = contract.readAdditionalFieldMigrationRecoveryStatusSchema.parse(input), context = await resolveAdditionalFieldMigrationContext(actor, target);
  return withFieldMigrationAuthority(context.session, context.principal, async authority => {
    assertCapability(authority.session, STUDIO_CAPABILITIES.publish);
    const { transaction: tx, session } = authority, { row, stored, intent } = await storedOperation(authority, request, true);
    let review = null;
    if (row.review) {
      const sealed = readStoredFieldMigrationReview(row.review, session.organisationId);
      if (sealed.review.schemaVersion !== 1 || sealed.review.id !== intent.id || sealed.review.definitionId !== request.definitionId
        || checksum(fieldMigrationIntentFromReview(sealed.review)) !== stored.checksum) changed();
      review = sealed;
    }
    if (row.state === "REVIEWED" && !review) changed();
    await tx.$queryRaw`SELECT "preparationId" FROM studio_field_migration_publications WHERE "preparationId"=${intent.id}::uuid
      AND "definitionId"=${request.definitionId}::uuid AND "organisationId"=${session.organisationId} FOR SHARE`;
    const publication = await tx.studioFieldMigrationPublication.findFirst({ where: {
      preparationId: intent.id, definitionId: request.definitionId, organisationId: session.organisationId } });
    if (publication && (!review || row.state !== "REVIEWED" || publication.preparationId !== intent.id
      || publication.definitionId !== request.definitionId || publication.organisationId !== session.organisationId
      || publication.reviewChecksum !== review.checksum || publication.sourceGenerationId !== intent.source.payload.storageGeneration
      || publication.targetGenerationId !== intent.target.payload.storageGeneration || publication.targetChecksum !== intent.target.compiledChecksum
      || publication.publisherUserId !== intent.principal.userId)) changed();
    return contract.additionalFieldMigrationRecoveryStatusSchema.parse({ ...request, preparationState: row.state,
      publicationState: publication?.state ?? null, publicationRevision: publication?.revision ?? null });
  });
}
