import type { Prisma, StudioFieldMigrationObservation, StudioFieldMigrationOutcome } from "@/generated/prisma/client";
import { assertCapability } from "@/core/permissions/check";
import type { RecordAnchor, RecordContext } from "../../registry/types";
import type { CapabilityRegistry } from "../../registry/registry";
import { canonicalJson, checksum } from "../../registry/contracts";
import { entityDetailsSchema, recordAnchorSchema, supportsFieldMigrationIntent, supportsFieldMigrationQueryIntent } from "../../registry/entities";
import { readObservedMigrationSource } from "./observation-source";
import type { FieldValue } from "../schema";
import { createFieldConverter, createRequiredFieldConverter, FieldConversionError, FieldRequirementConversionError } from "../evolution";
import { assertFieldMigrationPolicies, assertVersionedFieldMigrationPolicies, authoriseFieldMigrationReference } from "./access";
import { sealFieldMigrationIntent, fieldMigrationObservationSchema, FieldMigrationReviewError,
  type FieldMigrationIntent, type FieldMigrationObservation } from "./contracts";
import { sealRequiredFieldMigrationIntent, requiredFieldMigrationObservationSchema,
  type RequiredFieldMigrationIntent, type RequiredFieldMigrationObservation } from "./required-contracts";
import { compileFieldMigrationMetadata } from "./metadata";
import { fieldRuntimeAuthorityInTransaction } from "../runtime-authority";
import { evaluateConditionalInputsInTransaction } from "../required-inputs";
import { conditionalFieldPlanSchema } from "../conditional-compiler";
import { resolveFieldMigrationPrincipal } from "../principal";
import { assertFieldBinding, fieldDefinitionKey } from "../binding";
import { readStoredFieldMigrationReview } from "./stored-protocol";
import { reviewedRequiredFieldPublicationPin } from "./publication-contract";
import { createRequiredFieldMigrationExecutionPin, createRequiredFieldMigrationOutcomePin, readFieldMigrationExecutionProgress, type FieldMigrationExecutionPin } from "./execution-contract";
import type { RequiredFieldMigrationReview } from "./required-contracts";

function changed(): never { throw new FieldMigrationReviewError("REVIEW_CHANGED"); }

/** One server-only row. Caller refreshes/locks principal and source/draft for the
 * batch; this rechecks native anchor and both field policies before decoding.
 * Converted values are internal to the shared transaction; the archive wrapper
 * below returns only references and fingerprints, never execution authority.
 */
export async function inspectFieldMigrationRecord(context: RecordContext & { transaction: Prisma.TransactionClient }, registry: CapabilityRegistry,
  company: Parameters<typeof assertFieldMigrationPolicies>[1], serverIntent: FieldMigrationIntent, serverAnchor: RecordAnchor): Promise<{ observation: FieldMigrationObservation; convertedValue: FieldValue | null }> {
  const intent = sealFieldMigrationIntent(serverIntent).intent, anchor = recordAnchorSchema.parse(serverAnchor), session = context.session, tx = context.transaction;
  if (!tx || intent.organisationId !== session.organisationId || anchor.organisationId !== session.organisationId
    || intent.principal.userId !== session.userId || intent.principal.membershipId !== session.membershipId) changed();
  const current = intent.source.payload, target = intent.target.payload;
  assertFieldMigrationPolicies(session, company, current); assertFieldMigrationPolicies(session, company, target);
  const native = await registry.resolve(session, current.entity), record = entityDetailsSchema.parse(native.details).record;
  if (!record?.fieldPolicy) changed(); assertCapability(session, record.writeCapability);
  const targetNative = await registry.resolve(session, target.entity), targetRecord = entityDetailsSchema.parse(targetNative.details).record;
  const policy = targetRecord?.migrationSnapshot;
  if (!targetRecord || !policy || !supportsFieldMigrationIntent(policy, intent.schemaVersion) || !policy.sourceVersions.includes(current.entity.version)
    || policy.query.id !== intent.ownerQuery.id || policy.query.version !== intent.ownerQuery.version) changed();
  assertCapability(session, targetRecord.writeCapability);
  const query = await registry.resolve(session, intent.ownerQuery);
  if (query.kind !== "query" || query.details.transaction !== "required" || query.ownerModuleId !== targetNative.ownerModuleId) changed();
  const actual = await registry.authoriseRecord(context, current.entity, { recordId: anchor.recordId, intent: "read" });
  if (actual.revision !== anchor.revision) changed();
  const convert = createFieldConverter(current, target, intent.conversion);
  const source = await readObservedMigrationSource(context, registry, company, intent.definitionId, current, anchor, 1);
  const { observation, decoded } = source;
  if (!source.storageValid) return { observation: fieldMigrationObservationSchema.parse(observation), convertedValue: null };
  let converted: ReturnType<typeof convert>;
  try { converted = convert(decoded?.value ?? null); }
  catch (error) {
    if (!(error instanceof FieldConversionError)) throw error;
    observation.result = { kind: "invalid", code: error.code };
    return { observation: fieldMigrationObservationSchema.parse(observation), convertedValue: null };
  }
  await authoriseFieldMigrationReference(context, registry, target, converted.value);
  observation.result = { kind: "valid", targetFingerprint: checksum(converted.value), isNull: converted.value === null, lossy: converted.lossy };
  return { observation: fieldMigrationObservationSchema.parse(observation), convertedValue: converted.value };
}

/** Archive callers receive only references/fingerprints, preserving the existing
 * observation contract. Values stay inside the server-owned conversion transaction. */
export async function observeFieldMigrationRecord(...args: Parameters<typeof inspectFieldMigrationRecord>): Promise<FieldMigrationObservation> {
  return (await inspectFieldMigrationRecord(...args)).observation;
}

/** Internal preparation-row review only, not dispatch, persistence or execution.
 * Refresh genuine authority before any data access; reload the current source
 * and proposed draft under locks, then inspect full metadata before facts/values.
 * No caller registry, fact payload or creation proof supplies migration authority.
 * Semantic requirement evidence is separate from exact native/global revisions.
 * Later execution/settlement must independently prove their retained lineage. */
export async function inspectRequiredFieldMigrationRecord(context: RecordContext & { transaction: Prisma.TransactionClient },
  serverIntent: RequiredFieldMigrationIntent, serverAnchor: RecordAnchor): Promise<{ observation: RequiredFieldMigrationObservation; convertedValue: FieldValue | null }> {
  return inspectRequiredRecord(context, serverIntent, serverAnchor, "preparation");
}

/** Explicit source-active publication replay. A caller cannot turn preparation
 * into this stage with request metadata. Actual immutable publication/review/
 * target lineage and native/private access remain mandatory before values. */
export async function inspectPublishedRequiredFieldMigrationRecord(context: RecordContext & { transaction: Prisma.TransactionClient },
  serverIntent: RequiredFieldMigrationIntent, serverAnchor: RecordAnchor): Promise<{ observation: RequiredFieldMigrationObservation; convertedValue: FieldValue | null }> {
  return inspectRequiredRecord(context, serverIntent, serverAnchor, "publication");
}

/** Separate execution-only entry. Actual retained outcomes explain only this
 * migration's own envelope increment; current conditions/typed target access
 * must pass before any archive normalization. No caller-selected stage. */
export async function inspectExecutingRequiredFieldMigrationRecord(context: RecordContext & { transaction: Prisma.TransactionClient },
  serverIntent: RequiredFieldMigrationIntent, serverAnchor: RecordAnchor): Promise<{ observation: RequiredFieldMigrationObservation; convertedValue: FieldValue | null }> {
  return inspectRequiredRecord(context, serverIntent, serverAnchor, "execution");
}

async function inspectRequiredRecord(context: RecordContext & { transaction: Prisma.TransactionClient },
  serverIntent: RequiredFieldMigrationIntent, serverAnchor: RecordAnchor, stage: "preparation" | "publication" | "execution") {
  const authority = await fieldRuntimeAuthorityInTransaction(context.session, context.transaction), { session, registry, transaction: tx } = authority;
  const intent = sealRequiredFieldMigrationIntent(serverIntent).intent, anchor = recordAnchorSchema.parse(serverAnchor), stamp = authority.stamp;
  if (intent.organisationId !== session.organisationId || anchor.organisationId !== session.organisationId
    || intent.principal.userId !== session.userId || intent.principal.membershipId !== session.membershipId
    || intent.principal.authVersion !== stamp.authVersion || intent.principal.sessionVersion !== stamp.sessionVersion) changed();
  // Resolve retained support Audit/current customer identity without opening a
  // nested transaction or granting the user any additional record permission.
  await resolveFieldMigrationPrincipal(intent.principal);
  const company = await tx.organisation.findFirst({ where: { id: session.organisationId },
    select: { id: true, kind: true, status: true, archivedAt: true, isTest: true } });
  if (!company) changed();
  const currentCompany = company;
  const current = intent.source.payload, target = intent.target.payload, freshContext = { session, transaction: tx };
  assertVersionedFieldMigrationPolicies(session, company, current); assertVersionedFieldMigrationPolicies(session, company, target);
  await tx.$queryRaw`SELECT d.id FROM studio_definitions d JOIN studio_drafts draft ON draft."definitionId"=d.id AND draft."organisationId"=d."organisationId"
    WHERE d.id=${intent.definitionId}::uuid AND d."organisationId"=${session.organisationId} FOR SHARE OF d,draft`;
  const definition = await tx.studioDefinition.findFirst({ where: { id: intent.definitionId, organisationId: session.organisationId,
    kind: "customField", retiredAt: null, revision: intent.definitionRevision + (stage !== "preparation" ? 1 : 0) }, include: { activeVersion: true, draft: true } });
  const version = definition?.activeVersion, draft = definition?.draft;
  if (!definition || !version || !draft || definition.activeVersionId !== intent.source.versionId || version.id !== intent.source.versionId
    || version.definitionId !== intent.definitionId || version.organisationId !== session.organisationId || version.schemaVersion !== current.schemaVersion
    || version.checksum !== intent.source.versionChecksum || checksum(version.compiledPlan) !== version.checksum
    || checksum(version.payload) !== checksum(current) || definition.key !== fieldDefinitionKey(current)
    || draft.id !== intent.target.draftId || draft.definitionId !== intent.definitionId || draft.organisationId !== session.organisationId
    || draft.revision !== intent.target.draftRevision + (stage !== "preparation" ? 1 : 0)) changed();
  const compiledSource = await compileFieldMigrationMetadata(freshContext, registry, company, intent.definitionId, current),
    compiledTarget = await compileFieldMigrationMetadata(freshContext, registry, company, intent.definitionId, draft.payload);
  if (compiledSource.checksum !== intent.source.versionChecksum || compiledTarget.checksum !== intent.target.compiledChecksum
    || checksum(compiledTarget.payload) !== checksum(target)) changed();
  await assertFieldBinding(tx, session, intent.definitionId, current);
  const native = await registry.resolve(session, current.entity), nativeRecord = entityDetailsSchema.parse(native.details).record,
    targetNative = await registry.resolve(session, target.entity), targetRecord = entityDetailsSchema.parse(targetNative.details).record, policy = targetRecord?.migrationSnapshot;
  if (!nativeRecord?.fieldPolicy || !targetRecord?.fieldPolicy || !policy || !supportsFieldMigrationIntent(policy, 2)
    || !policy.sourceVersions.includes(current.entity.version) || policy.query.id !== intent.ownerQuery.id || policy.query.version !== intent.ownerQuery.version) changed();
  assertCapability(session, nativeRecord.writeCapability); assertCapability(session, targetRecord.writeCapability);
  const query = await registry.resolve(session, intent.ownerQuery);
  if (query.ownerModuleId !== targetNative.ownerModuleId || query.capability !== targetRecord.writeCapability
    || !supportsFieldMigrationQueryIntent(query, targetNative.id, "snapshot", 2)) changed();
  let executionProof: { pin: FieldMigrationExecutionPin; storedReview: { review: RequiredFieldMigrationReview; checksum: string } } | undefined;
  if (stage !== "preparation") {
    // Complete owning private preflight before checking source-value freshness.
    await registry.invokeQueryInTransaction(freshContext, intent.ownerQuery, { mode: "preflight" });
    const publication = await tx.studioFieldMigrationPublication.findFirst({ where: { preparationId: intent.id, organisationId: session.organisationId,
      definitionId: intent.definitionId, state: "PUBLISHED" }, include: { review: true, targetVersion: true } });
    if (!publication) changed();
    const targetVersion = publication.targetVersion, stored = readStoredFieldMigrationReview(publication.review, session.organisationId);
    const { cohort, summary, ...reviewIntent } = stored.review; void cohort; void summary;
    if (stored.review.schemaVersion !== 2 || stored.review.id !== intent.id || checksum(reviewIntent) !== checksum(intent)
      || draft.baseVersionId !== targetVersion.id || definition.latestVersion !== targetVersion.version
      || targetVersion.schemaVersion !== target.schemaVersion || targetVersion.createdBy !== session.userId) changed();
    const pin = reviewedRequiredFieldPublicationPin({ review: stored.review, checksum: stored.checksum },
      { id: targetVersion.id, organisationId: targetVersion.organisationId, definitionId: targetVersion.definitionId,
        version: targetVersion.version, checksum: targetVersion.checksum, payload: targetVersion.payload, compiledPlan: targetVersion.compiledPlan },
      session.userId, publication.acknowledgedLoss);
    if (Object.entries(pin).some(([key, value]) => publication[key as keyof typeof pin] !== value)) changed();
    if (stage === "execution") {
      const representation = targetRecord.migrationRepresentation;
      if (!representation || !supportsFieldMigrationIntent(representation, 2)) changed();
      const describedApproval = registry.describe(representation.query.id, representation.query.version);
      const approval = await registry.resolve(session, { id: describedApproval.id, version: describedApproval.version,
        schemaHash: describedApproval.schemaHash, contractHash: describedApproval.contractHash });
      const sealed = { review: stored.review, checksum: stored.checksum };
      const expected = createRequiredFieldMigrationExecutionPin(sealed,
        { id: targetVersion.id, organisationId: targetVersion.organisationId, definitionId: targetVersion.definitionId,
          version: targetVersion.version, checksum: targetVersion.checksum, payload: targetVersion.payload, compiledPlan: targetVersion.compiledPlan },
        pin, targetNative, approval);
      const execution = await tx.studioFieldMigrationExecution.findFirst({ where: { preparationId: intent.id, organisationId: session.organisationId,
        definitionId: intent.definitionId, entityId: target.entity.id, state: { in: ["RUNNING", "READY", "FAILED"] } } });
      if (!execution || execution.pinChecksum !== expected.checksum || canonicalJson(execution.pin) !== canonicalJson(expected.pin)) changed();
      const progress = readFieldMigrationExecutionProgress(expected.pin, { state: execution.state, revision: execution.revision,
        cursor: execution.cursor, processedCount: execution.processedCount, failureCode: execution.failureCode });
      if (progress.state === "CANCELLED") changed();
      const fresh = await tx.$queryRaw<Array<{ fresh: boolean }>>`SELECT atlas_studio_execution_fresh(x) AS fresh
        FROM studio_field_migration_executions x JOIN studio_field_migration_preparations p ON p.id=x."preparationId"
          AND p."organisationId"=x."organisationId" AND p."definitionId"=x."definitionId"
        WHERE p.id=${intent.id}::uuid AND p."organisationId"=${session.organisationId} AND p."intentChecksum"=${checksum(intent)}
          AND p.state='REVIEWED' AND x.state IN ('RUNNING','READY','FAILED')`;
      if (fresh.length !== 1 || fresh[0].fresh !== true) changed();
      executionProof = { pin: expected.pin, storedReview: sealed };
    } else {
      const fresh = await tx.$queryRaw<Array<{ fresh: boolean }>>`SELECT atlas_studio_publication_fresh(pub) AS fresh
        FROM studio_field_migration_publications pub JOIN studio_field_migration_preparations p ON p.id=pub."preparationId"
          AND p."organisationId"=pub."organisationId" AND p."definitionId"=pub."definitionId"
        WHERE p.id=${intent.id}::uuid AND p."organisationId"=${session.organisationId} AND p."intentChecksum"=${checksum(intent)}
          AND p.state='REVIEWED' AND pub.state='PUBLISHED'`;
      if (fresh.length !== 1 || fresh[0].fresh !== true) changed();
    }
  }
  for (const entity of [current.entity, target.entity]) {
    const actual = await registry.authoriseRecord(freshContext, entity, { recordId: anchor.recordId, intent: "read" });
    if (actual.recordId !== anchor.recordId || actual.organisationId !== session.organisationId || actual.revision !== anchor.revision) changed();
  }
  await tx.$queryRaw`SELECT id FROM studio_extension_records WHERE "organisationId"=${session.organisationId}
    AND "entityId"=${current.entity.id} AND "recordId"=${anchor.recordId} FOR SHARE`;
  const extension = await tx.studioExtensionRecord.findFirst({ where: { organisationId: session.organisationId, entityId: current.entity.id, recordId: anchor.recordId }, select: { id: true, revision: true } });
  const request = { definitionId: intent.definitionId, recordId: anchor.recordId, expectedRevision: anchor.revision };
  async function evaluate(compiled: typeof compiledSource) {
    const conditional = compiled.plan.schemaVersion === 2 ? await evaluateConditionalInputsInTransaction(authority,
      { entity: compiled.payload.entity, extension }, conditionalFieldPlanSchema.parse(compiled.plan), request) : null;
    return { required: compiled.payload.field.required || Boolean(conditional?.required), conditionFingerprint: conditional?.fingerprint ?? null };
  }
  // Both graphs/rights and both actual conditions precede source decoding. A
  // denied fact cannot be laundered into an invalid/optional conversion row.
  const sourceRule = await evaluate(compiledSource), targetRule = await evaluate(compiledTarget);
  const source = await readObservedMigrationSource(freshContext, registry, company, intent.definitionId, current, anchor, 2);
  if ((source.observation.extension?.id ?? null) !== (extension?.id ?? null)
    || (source.observation.extension?.revision ?? null) !== (extension?.revision ?? null)) changed();
  const absent = (value: FieldValue | null) => value === null || (value.type === "multi_enum" && value.value.length === 0);
  const sourceEvaluationChecksum = checksum({ metadataChecksum: compiledSource.checksum, ...sourceRule,
    presence: source.storageValid ? absent(source.decoded) ? "absent" : "present" : "invalid" });
  async function finish(result: RequiredFieldMigrationObservation["result"], convertedValue: FieldValue | null, presence: "absent" | "present" | "invalid") {
    const targetEvaluationChecksum = checksum({ metadataChecksum: compiledTarget.checksum, ...targetRule, presence });
    const observation = requiredFieldMigrationObservationSchema.parse({ ...source.observation,
      requirement: { sourceEvaluationChecksum, targetEvaluationChecksum, targetRequired: targetRule.required }, result });
    if (!executionProof) return { observation, convertedValue };
    const row = await tx.studioFieldMigrationObservation.findFirst({ where: { preparationId: intent.id, organisationId: session.organisationId,
      definitionId: intent.definitionId, entityId: current.entity.id, sourceGenerationId: current.storageGeneration,
      recordId: anchor.recordId, nativeRevision: anchor.revision }, include: { outcome: true } });
    if (!row) changed();
    const retained = retainedRequiredObservation(row, intent, anchor);
    if (row.outcome) {
      const expected = createRequiredFieldMigrationOutcomePin(executionProof.pin, executionProof.storedReview,
        { id: row.id, preparationId: row.preparationId, organisationId: row.organisationId, definitionId: row.definitionId,
          entityId: row.entityId, sourceGenerationId: row.sourceGenerationId, recordId: row.recordId, nativeRevision: row.nativeRevision, observation: retained },
        { extensionId: row.outcome.extensionId, slotId: row.outcome.targetSlotId, valueId: row.outcome.targetValueId });
      assertRequiredOutcome(row.outcome, expected);
      if (observation.extension?.id !== expected.target.extensionId || observation.extension.revision !== expected.target.extensionRevision
        || checksum(observation.extension.slot) !== checksum(retained.extension?.slot ?? null)) changed();
      // SQL seals pointers/fingerprints, not decoded values or independent access.
      // Reuse the metadata-first decoder under current AND written target policies.
      const actualTarget = await readObservedMigrationSource(freshContext, registry, currentCompany, intent.definitionId, target, anchor, 2),
        targetExtension = actualTarget.observation.extension, targetSlot = targetExtension?.slot, targetValue = targetSlot?.value;
      if (!actualTarget.storageValid || targetExtension?.id !== expected.target.extensionId || targetExtension.revision !== expected.target.extensionRevision
        || targetSlot?.id !== expected.target.slotId || targetSlot.revision !== 1 || targetValue?.id !== expected.target.valueId
        || targetValue.revision !== 1 || targetValue.versionId !== expected.targetVersionId || targetValue.fingerprint !== expected.target.fingerprint
        || checksum(actualTarget.decoded) !== expected.target.fingerprint || (actualTarget.decoded === null) !== expected.target.isNull
        || result.kind !== "valid" || checksum(actualTarget.decoded) !== checksum(convertedValue)) changed();
      observation.extension = retained.extension;
    }
    if (canonicalJson(observation) !== canonicalJson(retained)) changed();
    return { observation, convertedValue };
  }
  if (!source.storageValid) return finish({ kind: "invalid", code: "FIELD_STORAGE_INVALID" }, null, "invalid");
  let converted: ReturnType<ReturnType<typeof createRequiredFieldConverter>>;
  try {
    converted = createRequiredFieldConverter(current, target, intent.conversion)(source.decoded?.value ?? null,
      { sourceRequired: sourceRule.required, targetRequired: targetRule.required });
  } catch (error) {
    if (error instanceof FieldRequirementConversionError) return finish({ kind: "invalid", code: error.code }, null, "absent");
    if (!(error instanceof FieldConversionError)) throw error;
    return finish({ kind: "invalid", code: error.code }, null, "invalid");
  }
  await authoriseFieldMigrationReference(freshContext, registry, target, converted.value);
  return finish({ kind: "valid", targetFingerprint: checksum(converted.value), isNull: converted.value === null, lossy: converted.lossy },
    converted.value, absent(converted.value) ? "absent" : "present");
}

export async function observeRequiredFieldMigrationRecord(...args: Parameters<typeof inspectRequiredFieldMigrationRecord>): Promise<RequiredFieldMigrationObservation> {
  return (await inspectRequiredFieldMigrationRecord(...args)).observation;
}

export async function observePublishedRequiredFieldMigrationRecord(...args: Parameters<typeof inspectPublishedRequiredFieldMigrationRecord>): Promise<RequiredFieldMigrationObservation> {
  return (await inspectPublishedRequiredFieldMigrationRecord(...args)).observation;
}

export async function observeExecutingRequiredFieldMigrationRecord(...args: Parameters<typeof inspectExecutingRequiredFieldMigrationRecord>): Promise<RequiredFieldMigrationObservation> {
  return (await inspectExecutingRequiredFieldMigrationRecord(...args)).observation;
}

function retainedRequiredObservation(row: StudioFieldMigrationObservation, intent: RequiredFieldMigrationIntent, anchor: RecordAnchor) {
  const body = requiredFieldMigrationObservationSchema.parse(row.observation), extension = body.extension, slot = extension?.slot;
  if (canonicalJson(body) !== canonicalJson(row.observation) || row.preparationId !== intent.id || row.organisationId !== intent.organisationId
    || row.definitionId !== intent.definitionId || row.entityId !== intent.source.payload.entity.id || row.sourceGenerationId !== intent.source.payload.storageGeneration
    || row.recordId !== anchor.recordId || row.nativeRevision !== anchor.revision || body.recordId !== row.recordId || body.nativeRevision !== row.nativeRevision
    || row.extensionId !== (extension?.id ?? null) || row.extensionRevision !== (extension?.revision ?? null)
    || row.slotId !== (slot?.id ?? null) || row.slotRevision !== (slot?.revision ?? null) || row.valueId !== (slot?.value?.id ?? null)) changed();
  return body;
}

function assertRequiredOutcome(row: StudioFieldMigrationOutcome, expected: ReturnType<typeof createRequiredFieldMigrationOutcomePin>) {
  const mirrors = { observationId: expected.observationId, preparationId: expected.preparationId, organisationId: expected.organisationId,
    definitionId: expected.definitionId, entityId: expected.entityId, recordId: expected.recordId, nativeRevision: expected.nativeRevision,
    sourceGenerationId: expected.sourceGenerationId, targetGenerationId: expected.targetGenerationId, targetVersionId: expected.targetVersionId,
    executionChecksum: expected.executionChecksum, observationChecksum: expected.observationChecksum, extensionId: expected.target.extensionId,
    extensionRevision: expected.target.extensionRevision, targetSlotId: expected.target.slotId, targetValueId: expected.target.valueId,
    targetFingerprint: expected.target.fingerprint, targetIsNull: expected.target.isNull };
  if (canonicalJson(row.outcome) !== canonicalJson(expected) || Object.entries(mirrors).some(([key, value]) => row[key as keyof typeof mirrors] !== value)) changed();
}
