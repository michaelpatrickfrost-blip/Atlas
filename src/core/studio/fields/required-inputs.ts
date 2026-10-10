import { z } from "zod";
import { checksum } from "../registry/contracts";
import { entityDetailsSchema } from "../registry/entities";
import type { ContractReference } from "../registry/types";
import { readVersionedFieldContextInTransaction, readVersionedFieldPlanInTransaction, readVersionedFieldValueInTransaction,
  readInitialFieldContextInTransaction, readInitialFieldPlanInTransaction, readInitialFieldValueInTransaction } from "./runtime-read";
import type { FieldRuntimeAuthority } from "./runtime-authority";
import type { ConditionalFieldPlan } from "./conditional-compiler";
import { evaluateRequiredCondition } from "./required-evaluator";
import { fieldKeySchema } from "./schema";

const recordId = z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/);
export const nativeRequiredResultSchema = z.strictObject({ recordId, organisationId: z.string().min(1), revision: z.number().int().positive(), fields: z.record(fieldKeySchema, z.unknown()) });
type NativeResult = z.infer<typeof nativeRequiredResultSchema>;
type FieldContext = Awaited<ReturnType<typeof readVersionedFieldContextInTransaction>>;
export type RequirementRecordContext = { extension: Pick<NonNullable<FieldContext["extension"]>, "id" | "revision"> | null; entity: ContractReference };
function invalid(): never { throw new Error("FIELD_REQUIREMENT_INVALID: approved record facts changed or are unavailable."); }

export async function readResultingFieldValue(authority: FieldRuntimeAuthority, field: FieldContext, recordId: string, proof?: object) {
  const { session, transaction } = authority;
  const slot = field.extension && await transaction.studioFieldSlot.findFirst({ where: { organisationId: session.organisationId, extensionId: field.extension.id,
    definitionId: field.definition.id, generationId: field.payload.storageGeneration }, include: { activeValue: { include: { schemaVersion: true } } } });
  if (slot && ((slot.activeValueId === null) !== (slot.activeValue === null))) invalid();
  if (slot?.activeValue && (slot.activeValueId !== slot.activeValue.id || slot.revision !== slot.activeValue.revision)) invalid();
  if (!slot?.activeValue) return null;
  return proof ? readInitialFieldValueInTransaction(authority, field.payload, field.definition.id, field.payload.storageGeneration, slot.id, recordId, slot.activeValue, proof)
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
  plan: ConditionalFieldPlan, request: { definitionId: string; recordId: string; expectedRevision: number }, proof?: object) {
  const { session, registry, transaction } = authority;
  if (plan.requiredIf.plan.definitionId !== request.definitionId || checksum(record.entity) !== checksum(plan.payload.entity)
    || checksum(plan.requiredIf.plan.entity) !== checksum(record.entity)
    || checksum(plan.requiredIf.plan.condition) !== checksum(plan.payload.requiredIf)) invalid();
  let native: NativeResult | undefined;
  if (proof) {
    native = nativeRequiredResultSchema.parse(await registry.invokeInitialRecordFacts({ session, transaction }, record.entity, proof));
    if (native.organisationId !== session.organisationId || native.recordId !== request.recordId || native.revision !== request.expectedRevision) invalid();
  }
  return evaluateRequiredCondition(plan.requiredIf, async (source, metadata) => {
    if (source.kind === "native") {
      if (metadata.kind !== "native") invalid();
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
    const field = proof ? await readInitialFieldContextInTransaction(authority, sourceRequest, proof) : await readVersionedFieldContextInTransaction(authority, sourceRequest);
    if (field.payload.entity.id !== record.entity.id || field.payload.storageGeneration !== metadata.generationId
      || (field.extension?.id ?? null) !== (record.extension?.id ?? null) || (field.extension?.revision ?? null) !== (record.extension?.revision ?? null)) invalid();
    const version = await transaction.studioDefinitionVersion.findFirst({ where: { id: source.versionId, definitionId: source.definitionId, organisationId: session.organisationId } });
    if (!version || version.checksum !== source.checksum) invalid();
    const pinned = proof ? await readInitialFieldPlanInTransaction(authority, version, source.definitionId) : await readVersionedFieldPlanInTransaction(authority, version, source.definitionId);
    const anchor = proof ? await registry.authoriseCurrentFieldInitialisation({ session, transaction }, pinned.entity, proof)
      : await registry.authoriseRecord({ session, transaction }, pinned.entity, { recordId: request.recordId, intent: "read" });
    if (anchor.recordId !== request.recordId || anchor.revision !== request.expectedRevision) invalid();
    const value = await readResultingFieldValue(authority, field, request.recordId, proof);
    if (value?.type === "reference" && pinned.field.storage.type === "reference") await registry.authoriseRecord({ session, transaction }, pinned.field.storage.entity, { recordId: value.value, intent: "read" });
    return value;
  });
}
