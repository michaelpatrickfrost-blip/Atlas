import { z } from "zod";
import { checksum } from "../registry/contracts";
import { entityDetailsSchema } from "../registry/entities";
import type { ContractReference } from "../registry/types";
import { readVersionedFieldContextInTransaction, readVersionedFieldPlanInTransaction, readVersionedFieldValueInTransaction,
  readInitialFieldContextInTransaction, readInitialFieldPlanInTransaction, readInitialFieldValueInTransaction, readNativeFieldContextInTransaction, readNativeFieldPlanInTransaction, readNativeFieldValueInTransaction, preflightNativeWrittenFieldInTransaction } from "./runtime-read";
import type { FieldRuntimeAuthority } from "./runtime-authority";
import type { ConditionalFieldPlan } from "./conditional-compiler";
import { evaluateRequiredCondition } from "./required-evaluator";
import { fieldKeySchema } from "./schema";

import type { NativeFieldValidationAccess } from "./native-validation-access";

const recordId = z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/);
export const nativeRequiredResultSchema = z.strictObject({ recordId, organisationId: z.string().min(1), revision: z.number().int().positive(), fields: z.record(fieldKeySchema, z.unknown()) });
type NativeResult = z.infer<typeof nativeRequiredResultSchema>;
type FieldContext = Awaited<ReturnType<typeof readVersionedFieldContextInTransaction>>;
export type RequirementRecordContext = { extension: Pick<NonNullable<FieldContext["extension"]>, "id" | "revision"> | null; entity: ContractReference };
function invalid(): never { throw new Error("FIELD_REQUIREMENT_INVALID: approved record facts changed or are unavailable."); }

type NativeSlot = NonNullable<Awaited<ReturnType<typeof nativeSlotMetadata>>>;
async function nativeSlotMetadata(authority: FieldRuntimeAuthority, field: FieldContext) {
  return field.extension ? authority.transaction.studioFieldSlot.findFirst({ where: { organisationId: authority.session.organisationId, extensionId: field.extension.id,
    definitionId: field.definition.id, generationId: field.payload.storageGeneration }, select: { id: true, organisationId: true, extensionId: true, definitionId: true, generationId: true,
      revision: true, activeValueId: true, activeValue: { select: { id: true, organisationId: true, definitionId: true, generationId: true, slotId: true, versionId: true, revision: true, valueType: true, schemaVersion: true } } } }) : null;
}
function nativeSlotSnapshot(slot: NativeSlot): NativeSlot {
  const { id, organisationId, extensionId, definitionId, generationId, revision, activeValueId } = slot;
  const activeValue = slot.activeValue && (({ id, organisationId, definitionId, generationId, slotId, versionId, revision, valueType, schemaVersion }) =>
    ({ id, organisationId, definitionId, generationId, slotId, versionId, revision, valueType, schemaVersion }))(slot.activeValue);
  return { id, organisationId, extensionId, definitionId, generationId, revision, activeValueId, activeValue };
}
/** Select only pointer/revision/written-schema metadata before any fact or value
 * projection. Native proof never substitutes written field or reference rights. */
export async function preflightNativeResultingFieldValue(authority: FieldRuntimeAuthority, field: FieldContext, access: NativeFieldValidationAccess) {
  const slot = await nativeSlotMetadata(authority, field);
  if (!slot) return null;
  if (slot.organisationId !== authority.session.organisationId || slot.extensionId !== field.extension?.id || slot.definitionId !== field.definition.id
    || slot.generationId !== field.payload.storageGeneration || !Number.isSafeInteger(slot.revision) || slot.revision < 0
    || ((slot.activeValueId === null) !== (slot.activeValue === null))) invalid();
  if (slot.activeValue) {
    if (slot.activeValueId !== slot.activeValue.id || slot.revision !== slot.activeValue.revision) invalid();
    await preflightNativeWrittenFieldInTransaction(authority, field.payload, field.definition.id, field.payload.storageGeneration, slot.id, slot.activeValue, access);
  }
  return nativeSlotSnapshot(slot);
}

export async function readResultingFieldValue(authority: FieldRuntimeAuthority, field: FieldContext, recordId: string, proof?: object, native?: NativeFieldValidationAccess) {
  const { session, transaction } = authority;
  const preflight = native ? await preflightNativeResultingFieldValue(authority, field, native) : undefined;
  if (native && !preflight) return null;
  const slot = field.extension && await transaction.studioFieldSlot.findFirst({ where: { organisationId: session.organisationId, extensionId: field.extension.id,
    definitionId: field.definition.id, generationId: field.payload.storageGeneration }, include: { activeValue: { include: { schemaVersion: true } } } });
  if (slot && ((slot.activeValueId === null) !== (slot.activeValue === null))) invalid();
  if (slot?.activeValue && (slot.activeValueId !== slot.activeValue.id || slot.revision !== slot.activeValue.revision)) invalid();
  if (native && (!slot || checksum(nativeSlotSnapshot(slot)) !== checksum(preflight))) invalid();
  if (!slot?.activeValue) return null;
  return native ? readNativeFieldValueInTransaction(authority, field.payload, field.definition.id, field.payload.storageGeneration, slot.id, recordId, slot.activeValue, native) : proof ? readInitialFieldValueInTransaction(authority, field.payload, field.definition.id, field.payload.storageGeneration, slot.id, recordId, slot.activeValue, proof)
    : readVersionedFieldValueInTransaction(authority, field.payload, field.definition.id, field.payload.storageGeneration, slot.id, recordId, slot.activeValue);
}

/** Internal fact reader after full metadata compilation/inspection. The caller
 * owns a refreshed genuine authority, native anchor and locked extension envelope.
 * Ordinary and reviewed migration validation share the same current/pinned/written
 * field and independent reference rights. No supplied business facts, new grants,
 * mutation or durable approval. Creation facts require the actual owner-issued
 * proof through its existing registry gateway. All rule inputs are read before
 * aggregation; condition evidence deliberately excludes the revision envelope. */
export async function evaluateConditionalInputsInTransaction(authority: FieldRuntimeAuthority, record: RequirementRecordContext,
  plan: ConditionalFieldPlan, request: { definitionId: string; recordId: string; expectedRevision: number }, proof?: object, nativeAccess?: NativeFieldValidationAccess) {
  const { session, registry, transaction } = authority;
  if (plan.requiredIf.plan.definitionId !== request.definitionId || checksum(record.entity) !== checksum(plan.payload.entity)
    || checksum(plan.requiredIf.plan.entity) !== checksum(record.entity)
    || checksum(plan.requiredIf.plan.condition) !== checksum(plan.payload.requiredIf)) invalid();
  const prepared = nativeAccess ? await preflightNativeConditionalInputsInTransaction(authority, record, plan, request, nativeAccess) : undefined;
  let native: NativeResult | undefined;
  if (proof) {
    native = nativeRequiredResultSchema.parse(await registry.invokeInitialRecordFacts({ session, transaction }, record.entity, proof));
    if (native.organisationId !== session.organisationId || native.recordId !== request.recordId || native.revision !== request.expectedRevision) invalid();
  }
  return evaluateRequiredCondition(plan.requiredIf, async (source, metadata) => {
    if (source.kind === "native") {
      if (metadata.kind !== "native") invalid();
      if (!native && nativeAccess) {
        native = nativeRequiredResultSchema.parse(await registry.invokeNativeValidationFacts({ session, transaction }, record.entity, nativeAccess.request, nativeAccess.operation, nativeAccess.proof));
        if (native.organisationId !== session.organisationId || native.recordId !== request.recordId || native.revision !== request.expectedRevision) invalid();
      }
      if (!native) {
        const owner = registry.describe(record.entity.id, record.entity.version), policy = entityDetailsSchema.parse(owner.details).record?.requiredFacts;
        if (!policy) invalid();
        const query = registry.describe(policy.query.id, policy.query.version), reference = { id: query.id, version: query.version, schemaHash: query.schemaHash, contractHash: query.contractHash };
        native = nativeRequiredResultSchema.parse(await registry.invokeQueryInTransaction({ session, transaction }, reference, { recordId: request.recordId, expectedRevision: request.expectedRevision }));
        if (native.organisationId !== session.organisationId || native.recordId !== request.recordId || native.revision !== request.expectedRevision) invalid();
      }
      if (!Object.hasOwn(native.fields, source.fieldId) || native.fields[source.fieldId] === undefined) invalid();
      const value = native.fields[source.fieldId];
      return value === null ? null : { type: metadata.storage.type, value };
    }
    if (metadata.kind !== "field") invalid();
    const sourceRequest = { definitionId: source.definitionId, recordId: request.recordId, expectedRevision: request.expectedRevision };
    const field = nativeAccess ? prepared!.get(source.definitionId)! : proof ? await readInitialFieldContextInTransaction(authority, sourceRequest, proof) : await readVersionedFieldContextInTransaction(authority, sourceRequest);
    if (field.payload.entity.id !== record.entity.id || field.payload.storageGeneration !== metadata.generationId
      || (field.extension?.id ?? null) !== (record.extension?.id ?? null) || (field.extension?.revision ?? null) !== (record.extension?.revision ?? null)) invalid();
    const version = await transaction.studioDefinitionVersion.findFirst({ where: { id: source.versionId, definitionId: source.definitionId, organisationId: session.organisationId } });
    if (!version || version.checksum !== source.checksum) invalid();
    const pinned = nativeAccess ? await readNativeFieldPlanInTransaction(authority, version, source.definitionId, nativeAccess) : proof ? await readInitialFieldPlanInTransaction(authority, version, source.definitionId) : await readVersionedFieldPlanInTransaction(authority, version, source.definitionId);
    const anchor = nativeAccess ? (await registry.resolveNativeValidationFieldPolicy({ session, transaction }, pinned.entity, nativeAccess.request, nativeAccess.operation, nativeAccess.proof)).anchor : proof ? await registry.authoriseCurrentFieldInitialisation({ session, transaction }, pinned.entity, proof)
      : await registry.authoriseRecord({ session, transaction }, pinned.entity, { recordId: request.recordId, intent: "read" });
    if (anchor.recordId !== request.recordId || anchor.revision !== request.expectedRevision) invalid();
    const value = await readResultingFieldValue(authority, field, request.recordId, proof, nativeAccess);
    if (value?.type === "reference" && pinned.field.storage.type === "reference") await registry.authoriseRecord({ session, transaction }, pinned.field.storage.entity, { recordId: value.value, intent: "read" });
    return value;
  });
}

/** Preflight every input, including written versions, before the first native
 * fact/value. All-active native validation calls this for the complete field set. */
export async function preflightNativeConditionalInputsInTransaction(authority: FieldRuntimeAuthority, record: RequirementRecordContext, plan: ConditionalFieldPlan,
  request: { definitionId: string; recordId: string; expectedRevision: number }, access: NativeFieldValidationAccess) {
  const result = new Map<string, FieldContext>();
  for (const metadata of plan.requiredIf.plan.facts) {
    if (metadata.kind !== "field") continue;
    const field = await readNativeFieldContextInTransaction(authority, { definitionId: metadata.definitionId, recordId: request.recordId, expectedRevision: request.expectedRevision }, access);
    if (field.payload.entity.id !== record.entity.id || field.payload.storageGeneration !== metadata.generationId
      || (field.extension?.id ?? null) !== (record.extension?.id ?? null) || (field.extension?.revision ?? null) !== (record.extension?.revision ?? null)) invalid();
    const version = await authority.transaction.studioDefinitionVersion.findFirst({ where: { id: metadata.versionId, definitionId: metadata.definitionId, organisationId: authority.session.organisationId } });
    if (!version || version.checksum !== metadata.checksum) invalid();
    await readNativeFieldPlanInTransaction(authority, version, metadata.definitionId, access);
    await preflightNativeResultingFieldValue(authority, field, access);
    result.set(metadata.definitionId, field);
  }
  return result;
}
