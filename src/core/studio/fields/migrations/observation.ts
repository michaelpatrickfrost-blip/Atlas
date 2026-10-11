import type { Prisma } from "@/generated/prisma/client";
import { assertCapability } from "@/core/permissions/check";
import type { RecordAnchor, RecordContext } from "../../registry/types";
import type { CapabilityRegistry } from "../../registry/registry";
import { checksum } from "../../registry/contracts";
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
  const current = intent.source.payload, target = intent.target.payload, freshContext = { session, transaction: tx };
  assertVersionedFieldMigrationPolicies(session, company, current); assertVersionedFieldMigrationPolicies(session, company, target);
  await tx.$queryRaw`SELECT d.id FROM studio_definitions d JOIN studio_drafts draft ON draft."definitionId"=d.id AND draft."organisationId"=d."organisationId"
    WHERE d.id=${intent.definitionId}::uuid AND d."organisationId"=${session.organisationId} FOR SHARE OF d,draft`;
  const definition = await tx.studioDefinition.findFirst({ where: { id: intent.definitionId, organisationId: session.organisationId,
    kind: "customField", retiredAt: null, revision: intent.definitionRevision }, include: { activeVersion: true, draft: true } });
  const version = definition?.activeVersion, draft = definition?.draft;
  if (!definition || !version || !draft || definition.activeVersionId !== intent.source.versionId || version.id !== intent.source.versionId
    || version.definitionId !== intent.definitionId || version.organisationId !== session.organisationId || version.schemaVersion !== current.schemaVersion
    || version.checksum !== intent.source.versionChecksum || checksum(version.compiledPlan) !== version.checksum
    || checksum(version.payload) !== checksum(current) || definition.key !== fieldDefinitionKey(current)
    || draft.id !== intent.target.draftId || draft.definitionId !== intent.definitionId || draft.organisationId !== session.organisationId
    || draft.revision !== intent.target.draftRevision) changed();
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
  function finish(result: RequiredFieldMigrationObservation["result"], convertedValue: FieldValue | null, presence: "absent" | "present" | "invalid") {
    const targetEvaluationChecksum = checksum({ metadataChecksum: compiledTarget.checksum, ...targetRule, presence });
    return { observation: requiredFieldMigrationObservationSchema.parse({ ...source.observation,
      requirement: { sourceEvaluationChecksum, targetEvaluationChecksum, targetRequired: targetRule.required }, result }), convertedValue };
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
