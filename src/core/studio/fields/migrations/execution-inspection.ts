import type { FieldMigrationAuthority } from "./authority";
import type { FieldMigrationIntent } from "./contracts";
import { FieldMigrationReviewError, sealFieldMigrationIntent, fieldMigrationIntentFromReview, readSealedFieldMigrationReview } from "./contracts";
import { checksum, canonicalJson } from "../../registry/contracts";
import { studioRegistry } from "../../registry/runtime";
import { entityDetailsSchema, supportsFieldMigrationIntent } from "../../registry/entities";
import { compileCustomField } from "../../compiler/fields";
import { inspectFieldMigrationReview } from "./inspection";
import { createFieldMigrationExecutionPin, readFieldMigrationExecutionProgress } from "./execution-contract";
import { createRequiredFieldMigrationExecutionPin } from "./execution-contract";
import { sealRequiredFieldMigrationIntent, type RequiredFieldMigrationIntent } from "./required-contracts";
import { readStoredFieldMigrationIntent, readStoredFieldMigrationReview } from "./stored-protocol";
import { fieldRuntimeAuthorityInTransaction } from "../runtime-authority";
import { resolveFieldMigrationPrincipal } from "../principal";
import { assertCapability } from "@/core/permissions/check";
import { STUDIO_CAPABILITIES } from "../../permissions";
import { compileFieldMigrationMetadata } from "./metadata";
import { inspectPublishedRequiredFieldMigrationReview, inspectExecutingRequiredFieldMigrationReview } from "./inspection";

function changed(): never { throw new FieldMigrationReviewError("REVIEW_CHANGED"); }
const targetSelect = { id: true, organisationId: true, definitionId: true, version: true, payload: true, compiledPlan: true, checksum: true } as const;

/** Shared server inspection for start and subsequent batches. No client stage,
 * progress or pin is accepted. Caller owns refreshed Serializable authority. */
export async function inspectFieldMigrationExecution(authority: FieldMigrationAuthority, serverIntent: FieldMigrationIntent) {
  const { session, transaction: tx, company } = authority, sealedIntent = sealFieldMigrationIntent(serverIntent), intent = sealedIntent.intent;
  if (intent.organisationId !== session.organisationId || intent.principal.userId !== session.userId || intent.principal.membershipId !== session.membershipId) changed();
  const scope = { preparationId: intent.id, organisationId: session.organisationId, definitionId: intent.definitionId };
  await tx.$queryRaw`SELECT id FROM studio_field_migration_preparations WHERE id=${intent.id}::uuid AND "organisationId"=${session.organisationId} FOR UPDATE`;
  const preparation = await tx.studioFieldMigrationPreparation.findFirst({ where: { id: intent.id, organisationId: session.organisationId, definitionId: intent.definitionId }, include: { review: true } });
  if (!preparation?.review || preparation.state !== "REVIEWED" || preparation.intentChecksum !== sealedIntent.checksum || checksum(preparation.intent) !== sealedIntent.checksum) changed();
  const stored = readSealedFieldMigrationReview({ review: preparation.review.review, checksum: preparation.review.checksum });
  if (checksum(fieldMigrationIntentFromReview(stored.review)) !== sealedIntent.checksum) changed();
  await tx.$queryRaw`SELECT "preparationId" FROM studio_field_migration_publications WHERE "preparationId"=${intent.id}::uuid AND "organisationId"=${session.organisationId} FOR UPDATE`;
  const publication = await tx.studioFieldMigrationPublication.findFirst({ where: scope });
  if (!publication || publication.state !== "PUBLISHED" || publication.publisherUserId !== session.userId || publication.reviewChecksum !== stored.checksum) changed();
  await tx.$queryRaw`SELECT "preparationId" FROM studio_field_migration_executions WHERE "preparationId"=${intent.id}::uuid AND "organisationId"=${session.organisationId} FOR UPDATE`;
  const existing = await tx.studioFieldMigrationExecution.findFirst({ where: scope });
  if (existing && !["RUNNING", "READY", "FAILED"].includes(existing.state)) changed();
  const registry = studioRegistry(), compiled = await compileCustomField(session, intent.target.payload, registry);
  if (compiled.checksum !== intent.target.compiledChecksum) changed();
  for (const moduleId of [...new Set(compiled.plan.dependencies.map(ref => ref.ownerModuleId))].sort()) {
    await tx.$queryRaw`SELECT id FROM module_states WHERE "organisationId"=${session.organisationId} AND "moduleId"=${moduleId} FOR SHARE`;
    if (!await tx.moduleState.findFirst({ where: { organisationId: session.organisationId, moduleId, enabled: true, entitled: true }, select: { id: true } }))
      throw new Error("DEPENDENCY_BROKEN: field source is unavailable.");
  }
  const inspected = await inspectFieldMigrationReview({ session, transaction: tx }, registry, company, intent, existing ? "execution" : "publication");
  if (inspected.checksum !== stored.checksum) changed();
  const target = await tx.studioDefinitionVersion.findFirst({ where: { id: publication.targetVersionId, organisationId: session.organisationId, definitionId: intent.definitionId }, select: targetSelect });
  if (!target || target.checksum !== compiled.checksum || checksum(target.compiledPlan) !== compiled.checksum) changed();
  const owner = await registry.resolve(session, intent.target.payload.entity), policy = entityDetailsSchema.parse(owner.details).record?.migrationRepresentation;
  if (!policy || !supportsFieldMigrationIntent(policy, intent.schemaVersion) || !policy.sourceVersions.includes(intent.source.payload.entity.version)) changed();
  const described = registry.describe(policy.query.id, policy.query.version);
  const approval = await registry.resolve(session, { id: described.id, version: described.version, schemaHash: described.schemaHash, contractHash: described.contractHash });
  const publicationPin = { preparationId: publication.preparationId, organisationId: publication.organisationId, definitionId: publication.definitionId,
    reviewChecksum: publication.reviewChecksum, sourceGenerationId: publication.sourceGenerationId, targetGenerationId: publication.targetGenerationId,
    targetVersionId: publication.targetVersionId, targetVersionNumber: publication.targetVersionNumber, targetChecksum: publication.targetChecksum,
    publisherUserId: publication.publisherUserId, acknowledgedLoss: publication.acknowledgedLoss };
  const pinned = createFieldMigrationExecutionPin(stored, target, publicationPin, owner, approval);
  if (existing && (existing.entityId !== intent.target.payload.entity.id || existing.pinChecksum !== pinned.checksum || canonicalJson(existing.pin) !== canonicalJson(pinned.pin))) changed();
  const progress = existing ? readFieldMigrationExecutionProgress(pinned.pin, { state: existing.state, revision: existing.revision, cursor: existing.cursor,
    processedCount: existing.processedCount, failureCode: existing.failureCode }) : null;
  return { intent, stored, publication, target, registry, pin: pinned.pin, pinChecksum: pinned.checksum, existing, progress };
}

/** Explicit conditional server inspection. Refresh genuine authority before
 * reading any migration metadata, including empty cohorts. Stored protocol and
 * actual execution select the inspector; a receipt or client stage grants no
 * writes. The legacy entry above stays closed1 and unchanged. */
export async function inspectRequiredFieldMigrationExecution(authority: FieldMigrationAuthority, serverIntent: RequiredFieldMigrationIntent) {
  const fresh = await fieldRuntimeAuthorityInTransaction(authority.session, authority.transaction);
  const { session, transaction: tx, registry, stamp } = fresh;
  const sealedIntent = sealRequiredFieldMigrationIntent(serverIntent), intent = sealedIntent.intent;
  if (intent.organisationId !== session.organisationId || intent.principal.userId !== session.userId
    || intent.principal.membershipId !== session.membershipId || intent.principal.authVersion !== stamp.authVersion
    || intent.principal.sessionVersion !== stamp.sessionVersion || canonicalJson(authority.principal) !== canonicalJson(intent.principal)) changed();
  // The complete support principal includes its purpose-bound retained Audit.
  // A genuine runtime session alone cannot manufacture that evidence.
  const principalSession = await resolveFieldMigrationPrincipal(intent.principal);
  if (principalSession.organisationId !== session.organisationId || principalSession.userId !== session.userId
    || principalSession.membershipId !== session.membershipId) changed();
  assertCapability(session, STUDIO_CAPABILITIES.publish);
  await tx.$queryRaw`SELECT id FROM module_states WHERE "organisationId"=${session.organisationId} AND "moduleId"='studio' FOR SHARE`;
  if (!await tx.moduleState.findFirst({ where: { organisationId: session.organisationId, moduleId: "studio", enabled: true, entitled: true }, select: { id: true } }))
    throw new Error("DEPENDENCY_BROKEN: Studio is unavailable.");
  const company = await tx.organisation.findFirst({ where: { id: session.organisationId }, select: { id: true, kind: true, status: true, archivedAt: true, isTest: true } });
  if (!company) changed();
  const scope = { preparationId: intent.id, organisationId: session.organisationId, definitionId: intent.definitionId };
  await tx.$queryRaw`SELECT id FROM studio_field_migration_preparations WHERE id=${intent.id}::uuid AND "organisationId"=${session.organisationId} FOR UPDATE`;
  const preparation = await tx.studioFieldMigrationPreparation.findFirst({ where: { id: intent.id, organisationId: session.organisationId, definitionId: intent.definitionId }, include: { review: true } });
  if (!preparation?.review || preparation.state !== "REVIEWED" || preparation.definitionId !== intent.definitionId) changed();
  const savedIntent = readStoredFieldMigrationIntent(preparation, session.organisationId);
  const savedReview = readStoredFieldMigrationReview(preparation.review, session.organisationId);
  if (savedIntent.intent.schemaVersion !== 2 || savedReview.review.schemaVersion !== 2 || savedIntent.checksum !== sealedIntent.checksum
    || savedReview.review.id !== intent.id || savedReview.review.definitionId !== intent.definitionId) changed();
  const { cohort, summary, ...reviewIntent } = savedReview.review; void cohort; void summary;
  if (checksum(reviewIntent) !== sealedIntent.checksum) changed();
  const stored = { review: savedReview.review, checksum: savedReview.checksum };
  await tx.$queryRaw`SELECT "preparationId" FROM studio_field_migration_publications WHERE "preparationId"=${intent.id}::uuid AND "organisationId"=${session.organisationId} FOR UPDATE`;
  const publication = await tx.studioFieldMigrationPublication.findFirst({ where: scope });
  if (!publication || publication.state !== "PUBLISHED" || publication.publisherUserId !== session.userId || publication.reviewChecksum !== stored.checksum) changed();
  await tx.$queryRaw`SELECT "preparationId" FROM studio_field_migration_executions WHERE "preparationId"=${intent.id}::uuid AND "organisationId"=${session.organisationId} FOR UPDATE`;
  const existing = await tx.studioFieldMigrationExecution.findFirst({ where: scope });
  if (existing && (existing.preparationId !== intent.id || existing.organisationId !== session.organisationId
    || existing.definitionId !== intent.definitionId || !["RUNNING", "READY", "FAILED"].includes(existing.state))) changed();
  const context = { session, transaction: tx };
  const compiled = await compileFieldMigrationMetadata(context, registry, company, intent.definitionId, intent.target.payload);
  if (compiled.checksum !== intent.target.compiledChecksum || checksum(compiled.payload) !== checksum(intent.target.payload)) changed();
  for (const moduleId of [...new Set(compiled.plan.dependencies.map(ref => ref.ownerModuleId))].sort()) {
    await tx.$queryRaw`SELECT id FROM module_states WHERE "organisationId"=${session.organisationId} AND "moduleId"=${moduleId} FOR SHARE`;
    if (!await tx.moduleState.findFirst({ where: { organisationId: session.organisationId, moduleId, enabled: true, entitled: true }, select: { id: true } }))
      throw new Error("DEPENDENCY_BROKEN: field source is unavailable.");
  }
  const inspected = existing ? await inspectExecutingRequiredFieldMigrationReview(context, intent)
    : await inspectPublishedRequiredFieldMigrationReview(context, intent);
  if (inspected.checksum !== stored.checksum) changed();
  const targetRow = await tx.studioDefinitionVersion.findFirst({ where: { id: publication.targetVersionId, organisationId: session.organisationId, definitionId: intent.definitionId },
    select: { ...targetSelect, schemaVersion: true, createdBy: true } });
  if (!targetRow || targetRow.schemaVersion !== intent.target.payload.schemaVersion || targetRow.createdBy !== session.userId
    || targetRow.checksum !== compiled.checksum || checksum(targetRow.compiledPlan) !== compiled.checksum) changed();
  // Strict pure parsers deliberately receive only their closed target projection.
  const { schemaVersion, createdBy, ...target } = targetRow; void schemaVersion; void createdBy;
  const owner = await registry.resolve(session, intent.target.payload.entity), policy = entityDetailsSchema.parse(owner.details).record?.migrationRepresentation;
  if (!policy || !supportsFieldMigrationIntent(policy, 2) || !policy.sourceVersions.includes(intent.source.payload.entity.version)) changed();
  const described = registry.describe(policy.query.id, policy.query.version);
  const approval = await registry.resolve(session, { id: described.id, version: described.version, schemaHash: described.schemaHash, contractHash: described.contractHash });
  const publicationPin = { preparationId: publication.preparationId, organisationId: publication.organisationId, definitionId: publication.definitionId,
    reviewChecksum: publication.reviewChecksum, sourceGenerationId: publication.sourceGenerationId, targetGenerationId: publication.targetGenerationId,
    targetVersionId: publication.targetVersionId, targetVersionNumber: publication.targetVersionNumber, targetChecksum: publication.targetChecksum,
    publisherUserId: publication.publisherUserId, acknowledgedLoss: publication.acknowledgedLoss };
  const pinned = createRequiredFieldMigrationExecutionPin(stored, target, publicationPin, owner, approval);
  if (existing && (existing.entityId !== intent.target.payload.entity.id || existing.pinChecksum !== pinned.checksum || canonicalJson(existing.pin) !== canonicalJson(pinned.pin))) changed();
  const progress = existing ? readFieldMigrationExecutionProgress(pinned.pin, { state: existing.state, revision: existing.revision, cursor: existing.cursor,
    processedCount: existing.processedCount, failureCode: existing.failureCode }) : null;
  return { intent, stored, publication, target, registry, pin: pinned.pin, pinChecksum: pinned.checksum, existing, progress };
}
